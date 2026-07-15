import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { JSDOM } from "jsdom";

const indexPath = new URL("../index.html", import.meta.url);
const corePath = new URL("../newsletter-core.js", import.meta.url);
const coreSource = fs.readFileSync(corePath, "utf8");
const html = fs.readFileSync(indexPath, "utf8")
  .replace('<script src="newsletter-core.js"></script>', `<script>${coreSource}</script>`);

const calendarFeed = {
  generatedAt: "2026-07-13T12:00:00.000Z",
  calendarName: "ASME Public",
  timeZone: "America/New_York",
  sourceUrl: "https://calendar.google.com/calendar/embed?src=public",
  events: [{
    id: "calendar-event-1",
    title: "Imported GBM",
    start: "2026-09-15T22:00:00.000Z",
    end: "2026-09-15T23:00:00.000Z",
    allDay: false,
    location: "Hitchcock 035",
    description: "Agenda and free food",
    url: "https://calendar.google.com/calendar/embed?src=public",
    updated: "2026-07-13T12:00:00.000Z"
  }]
};

function waitFor(predicate, timeout = 2000) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const poll = () => {
      if (predicate()) return resolve();
      if (Date.now() - started > timeout) return reject(new Error("Timed out waiting for application state"));
      setTimeout(poll, 10);
    };
    poll();
  });
}

test("builder loads, imports calendar events, avoids ID collisions, and escapes exported content", async () => {
  const dom = new JSDOM(html, {
    url: "https://asme-osu.github.io/ASME-Newsletter-Builder/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => {};
      window.confirm = () => true;
      window.fetch = async () => ({ ok: true, json: async () => calendarFeed });
      window.navigator.clipboard = { writeText: async () => {} };
    }
  });

  const { window } = dom;
  await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  await waitFor(() => window.calendarEvents.length === 1);

  assert.equal(window.document.querySelectorAll("#event-list .editor-card").length, 2);
  assert.match(window.document.querySelector("#calendar-status").textContent, /1 upcoming event/);
  assert.equal(window.document.querySelectorAll("#calendar-list .calendar-event").length, 1);
  assert.equal(window.document.getElementById("s-logo").value, "https://img.mailinblue.com/11115816/images/content_library/original/6a5740d5d5fa2e1f36b1638d.png");
  assert.equal(window.document.getElementById("s-logo-light").value, "https://img.mailinblue.com/11115816/images/content_library/original/6a574002fc35afde1ddd649a.png");

  const topLinks = window.document.querySelectorAll(".top-link-btn");
  assert.equal(topLinks.length, 2);
  assert.equal(topLinks[0].textContent.trim(), "Brevo ↗");
  assert.equal(topLinks[0].href, "https://app.brevo.com/campaigns/listing");
  assert.equal(topLinks[1].textContent.trim(), "Builder ↗");
  assert.equal(topLinks[1].href, "https://asme-osu.github.io/ASME-Newsletter-Builder/");
  for (const link of topLinks) {
    assert.equal(link.target, "_blank");
    assert.match(link.rel, /noopener/);
  }
  assert.equal(window.document.getElementById("builder-shortcut").hidden, true);
  assert.equal(window.shouldShowBuilderShortcut("asme-osu.github.io", "/ASME-Newsletter-Builder/", false), false);
  assert.equal(window.shouldShowBuilderShortcut("asme-osu.github.io", "/ASME-Newsletter-Builder/", true), true);
  assert.equal(window.shouldShowBuilderShortcut("localhost", "/", false), true);

  window.applyState({
    events: [{ id: 100, title: "Restored event", date: "SEP 1", accent: "red" }],
    fields: {}
  });
  window.addEvent();
  assert.deepEqual(Array.from(window.events, (event) => event.id), [100, 101]);

  window.importCalendarEvent(0);
  assert.equal(window.events.length, 3);
  assert.equal(window.events[2].sourceEventId, "calendar-event-1");
  assert.equal(window.events[2].title, "Imported GBM");
  assert.equal(window.document.querySelector("#calendar-list button").disabled, true);

  window.document.getElementById("feat-title").value = 'Engineering <Design> & "Build"';
  window.document.getElementById("feat-desc").value = "First line\nSecond line";
  window.document.getElementById("s-unsub").value = "javascript:alert(1)";
  const exported = window.generateHTML();
  assert.match(exported, /Engineering &lt;Design&gt; &amp; &quot;Build&quot;/);
  assert.match(exported, /First line<br>Second line/);
  assert.doesNotMatch(exported, /javascript:alert/);
  assert.match(exported, /width="360" alt="ASME at The Ohio State University"/);

  window.setTheme("light");
  window.document.getElementById("s-logo-light").value = "https://example.com/light-logo.png";
  window.render();
  assert.equal(window.document.querySelector(".pv-logo-wrap img").src, "https://example.com/light-logo.png");
  assert.match(window.generateHTML(), /src="https:\/\/example\.com\/light-logo\.png"/);

  window.checklistThenCopy();
  assert.match(window.document.getElementById("checklist-items").textContent, /unsubscribe variable is incorrect/i);
  assert.equal(window.document.getElementById("checklist-modal").getAttribute("aria-modal"), "true");

  window.switchTabByName("calendar");
  assert.equal(window.document.querySelector('[aria-controls="tab-calendar"]').getAttribute("aria-selected"), "true");

  dom.window.close();
});
