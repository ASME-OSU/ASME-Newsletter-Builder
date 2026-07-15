import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../newsletter-core.js", import.meta.url), "utf8");
const context = vm.createContext({ URL, Intl, Date });
vm.runInContext(source, context);
const Core = context.NewsletterCore;

test("escapes newsletter text and preserves line breaks", () => {
  assert.equal(Core.escapeHtml('<Board & "Members">'), "&lt;Board &amp; &quot;Members&quot;&gt;");
  assert.equal(Core.escapeMultiline("First\nSecond"), "First<br>Second");
});

test("accepts safe public URLs and the exact Brevo unsubscribe placeholder", () => {
  assert.equal(Core.safeUrl("javascript:alert(1)"), "");
  assert.equal(Core.safeUrl("https://org.osu.edu/asme/").startsWith("https://"), true);
  assert.equal(Core.safeUrl("{{ unsubscribe }}", { allowBrevo: true }), "{{ unsubscribe }}");
  assert.equal(Core.safeUrl("{{ wrong }}", { allowBrevo: true }), "");
});

test("advances event IDs after a restored draft", () => {
  assert.equal(Core.nextEventId([{ id: 100 }, { id: 106 }, { id: "bad" }], 100), 107);
});

test("sanitizes imported state and whitelists themes and accents", () => {
  const state = Core.sanitizeState({
    activeTheme: "<script>",
    events: [{ id: "101", title: "GBM", accent: 'blue\" onclick=\"alert(1)' }],
    fields: { "s-subject": "Hello", "s-logo-light": "https://example.com/light-logo.png", unexpected: "ignored" }
  });
  assert.equal(state.activeTheme, "navy");
  assert.equal(state.events[0].id, 101);
  assert.equal(state.events[0].accent, "blue");
  assert.equal(state.fields["s-subject"], "Hello");
  assert.equal(state.fields["s-logo-light"], "https://example.com/light-logo.png");
  assert.equal("unexpected" in state.fields, false);
});

test("exports and imports a versioned editable draft", () => {
  const document = Core.createDraftDocument({ events: [{ id: 120, title: "Workshop" }], fields: {} });
  const restored = Core.readDraftDocument(JSON.stringify(document));
  assert.equal(document.kind, "asme-newsletter-draft");
  assert.equal(restored.events[0].title, "Workshop");
  assert.throws(() => Core.readDraftDocument({ kind: "other", state: {} }), /not an ASME/);
});

test("maps timed and all-day calendar events into editable newsletter events", () => {
  const timed = Core.calendarEventToNewsletter({
    id: "event-1", title: "Industry Night", start: "2026-09-10T22:00:00.000Z",
    end: "2026-09-11T00:00:00.000Z", allDay: false, location: "Hitchcock 131",
    description: "Bring a resume", url: "https://calendar.google.com/", updated: "2026-07-01T00:00:00.000Z"
  }, 125, "America/New_York");
  assert.equal(timed.id, 125);
  assert.equal(timed.date, "SEP 10");
  assert.match(timed.time, /6:00 PM/);
  assert.equal(timed.sourceEventId, "event-1");
  assert.equal(timed.showLink, true);

  const allDay = Core.calendarEventToNewsletter({
    id: "event-2", title: "Classes Begin", start: "2027-01-11T00:00:00.000Z",
    end: "2027-01-12T00:00:00.000Z", allDay: true
  }, 126, "America/New_York");
  assert.equal(allDay.date, "JAN 11");
  assert.equal(allDay.time, "All day");
});
