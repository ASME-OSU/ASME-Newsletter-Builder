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
    id: "calendar-event-1::2026-09-15T22:00:00.000Z",
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
  assert.equal(window.activeTheme, "light");
  assert.equal(window.document.querySelectorAll(".theme-chip").length, 2);
  assert.deepEqual(Array.from(window.document.querySelectorAll(".theme-chip"), (node) => node.textContent.trim()), ["Light", "Navy Dark"]);
  assert.equal(window.document.querySelector(".theme-chip.selected").textContent.trim(), "Light");
  assert.equal(window.document.querySelector(".pv-body").style.background, "rgb(247, 248, 250)");
  assert.equal(window.document.querySelector("#event-list .editor-card .preset-btn[aria-pressed='true']").textContent, "Workshop");
  assert.deepEqual(Array.from(window.document.querySelectorAll(".pv-event-type"), (node) => node.textContent.trim()), ["Workshop", "GBM"]);
  assert.equal(window.document.querySelector(".pv-event-day").textContent, "28");
  assert.equal(window.document.querySelectorAll(".pv-event-bar").length, 0);
  assert.match(window.document.querySelector("#calendar-status").textContent, /1 upcoming event/);
  assert.equal(window.document.querySelectorAll("#calendar-list .calendar-event").length, 1);
  assert.equal(window.document.getElementById("s-logo").value, "https://img.mailinblue.com/11115816/images/content_library/original/6a5740d5d5fa2e1f36b1638d.png");
  assert.equal(window.document.getElementById("s-logo-light").value, "https://img.mailinblue.com/11115816/images/content_library/original/6a574002fc35afde1ddd649a.png");
  assert.equal(window.document.getElementById("s-li-url").value, "https://www.linkedin.com/company/asme-osu/");
  assert.equal(window.document.getElementById("s-gm-url").value, "https://groupme.com/join_group/95825283/iaBgk5Ld");
  assert.match(window.generateHTML(), /https:\/\/groupme\.com\/join_group\/95825283\/iaBgk5Ld/);

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

  const infoButton = window.document.getElementById("info-btn");
  const infoModal = window.document.getElementById("info-modal");
  infoButton.click();
  assert.equal(infoModal.classList.contains("open"), true);
  assert.equal(infoModal.getAttribute("aria-modal"), "true");
  assert.match(infoModal.textContent, /Import upcoming items from Calendar/);
  assert.match(infoModal.textContent, /Export Draft \.json/);
  window.document.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  assert.equal(infoModal.classList.contains("open"), false);

  const fullscreenButton = window.document.getElementById("fullscreen-btn");
  assert.equal(fullscreenButton.textContent, "Full Preview");
  window.toggleFullscreen();
  assert.equal(fullscreenButton.textContent, "Exit Full Preview");
  assert.equal(window.document.getElementById("preview-panel").classList.contains("fullscreen"), true);
  window.toggleFullscreen();
  assert.equal(fullscreenButton.textContent, "Full Preview");
  assert.equal(window.document.getElementById("preview-panel").classList.contains("fullscreen"), false);

  window.applyState({
    events: [{ id: 100, title: "Restored event", date: "SEP 1", accent: "red" }],
    fields: {}
  });
  window.setEventType(100, "info");
  assert.equal(window.events[0].eventType, "info");
  assert.equal(window.events[0].accent, "gold");
  window.addEvent();
  assert.deepEqual(Array.from(window.events, (event) => event.id), [100, 101]);

  window.importCalendarEvent(0);
  assert.equal(window.events.length, 3);
  assert.equal(window.events[2].sourceEventId, "calendar-event-1::2026-09-15T22:00:00.000Z");
  assert.equal(window.events[2].title, "Imported GBM");
  assert.equal(window.events[2].eventType, "gbm");
  assert.equal(window.document.querySelector("#calendar-list button").disabled, true);

  window.calendarEvents[0] = window.NewsletterCore.sanitizeCalendarEvent({
    ...calendarFeed.events[0],
    id: "calendar-event-1::2026-09-15T23:00:00.000Z",
    title: "Updated Industry GBM",
    start: "2026-09-15T23:00:00.000Z",
    end: "2026-09-16T00:00:00.000Z",
    location: "Scott E100",
    updated: "2026-09-01T12:00:00.000Z"
  });
  window.renderCalendarList();
  window.renderEventList();
  assert.equal(window.document.querySelector("#calendar-list button").textContent, "Update Imported Event");
  assert.match(window.document.getElementById("event-list").textContent, /Calendar update available/);
  assert.equal(window.document.getElementById("sync-calendar-imports").hidden, false);
  window.events[2].showImg = true;
  window.events[2].imgUrl = "https://example.com/custom-event.png";
  window.events[2].imgAlt = "Newsletter-specific event artwork";
  window.syncImportedCalendarEvents();
  assert.equal(window.events.length, 3);
  assert.equal(window.events[2].sourceEventId, "calendar-event-1::2026-09-15T23:00:00.000Z");
  assert.equal(window.events[2].title, "Updated Industry GBM");
  assert.equal(window.events[2].location, "Scott E100");
  assert.equal(window.events[2].imgUrl, "https://example.com/custom-event.png");
  assert.equal(window.document.querySelector("#calendar-list button").textContent, "Synced");

  window.calendarEvents = [];
  window.renderEventList();
  assert.match(window.document.getElementById("event-list").textContent, /No longer on Calendar/);

  window.document.getElementById("feat-title").value = 'Engineering <Design> & "Build"';
  window.document.getElementById("feat-desc").value = "First line\nSecond line";
  window.document.getElementById("s-unsub").value = "javascript:alert(1)";
  const exported = window.generateHTML();
  assert.match(exported, /Engineering &lt;Design&gt; &amp; &quot;Build&quot;/);
  assert.match(exported, /First line<br>Second line/);
  assert.doesNotMatch(exported, /javascript:alert/);
  assert.match(exported, /width="360" alt="ASME at The Ohio State University"/);
  assert.match(exported, /font-size:45px/);
  assert.match(exported, />Info Session</);
  assert.doesNotMatch(exported, /<tr><td width="5" style="background:/);

  window.setTheme("light");
  window.document.getElementById("s-logo-light").value = "https://example.com/light-logo.png";
  window.render();
  assert.equal(window.document.querySelector(".pv-logo-wrap img").src, "https://example.com/light-logo.png");
  assert.match(window.generateHTML(), /src="https:\/\/example\.com\/light-logo\.png"/);

  window.setTheme("navy");
  assert.equal(window.activeTheme, "navy");
  assert.equal(window.document.querySelector(".theme-chip.selected").textContent.trim(), "Navy Dark");
  assert.equal(window.document.querySelector(".theme-chip.selected").getAttribute("aria-pressed"), "true");
  window.setTheme("slate");
  assert.equal(window.activeTheme, "navy");

  window.checklistThenCopy();
  assert.match(window.document.getElementById("checklist-items").textContent, /unsubscribe variable is incorrect/i);
  assert.equal(window.document.getElementById("checklist-modal").getAttribute("aria-modal"), "true");

  window.switchTabByName("calendar");
  assert.equal(window.document.querySelector('[aria-controls="tab-calendar"]').getAttribute("aria-selected"), "true");

  dom.window.close();
});

test("readiness, organization defaults, previews, event warnings, revisions, and link checks work together", async () => {
  const dom = new JSDOM(html, {
    url: "https://asme-osu.github.io/ASME-Newsletter-Builder/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = () => {};
      window.confirm = () => true;
      window.fetch = async (url, options = {}) => {
        if (options.method === "HEAD") {
          return { ok: true, status: 200, redirected: false, url: String(url) };
        }
        return { ok: true, json: async () => calendarFeed };
      };
      window.navigator.clipboard = { writeText: async () => {} };
    }
  });

  const { window } = dom;
  await new Promise((resolve) => window.addEventListener("load", resolve, { once: true }));
  await waitFor(() => window.calendarEvents.length === 1);

  assert.match(window.document.getElementById("readiness-score").textContent, /^\d+%$/);
  assert.equal(window.document.getElementById("preview-desktop-btn").getAttribute("aria-pressed"), "true");
  assert.equal(window.document.getElementById("s-gm-url").value, "https://groupme.com/join_group/95825283/iaBgk5Ld");

  window.document.getElementById("s-subject").value = "ASME September Events";
  window.document.getElementById("s-preheader").value = "Workshops, meetings, and member opportunities.";
  window.render();
  assert.equal(window.document.getElementById("inbox-subject").textContent, "ASME September Events");
  assert.match(window.document.getElementById("subject-count").textContent, /^21 \/ 65/);

  window.setPreviewMode("mobile");
  assert.equal(window.document.getElementById("preview-shell").classList.contains("preview-mobile"), true);
  window.toggleDarkSimulation();
  assert.equal(window.document.getElementById("preview-panel").classList.contains("simulate-client-dark"), true);
  assert.equal(window.document.querySelector(".pv-logo-wrap img").src, window.document.getElementById("s-logo").value);
  assert.match(window.generateHTML(), new RegExp(window.document.getElementById("s-logo-light").value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  window.events = [
    { id: 301, date: "OCT 2", time: "6:00 PM", title: "Design Workshop", location: "A", description: "A", eventType: "workshop", accent: "blue", showImg: false, imgUrl: "", imgAlt: "", showLink: false, linkUrl: "", linkText: "" },
    { id: 302, date: "SEP 1", time: "5:00 PM", title: "Early Event", location: "B", description: "B", eventType: "event", accent: "blue", showImg: false, imgUrl: "", imgAlt: "", showLink: false, linkUrl: "", linkText: "" },
    { id: 303, date: "OCT 2", time: "6:00 PM", title: "Design Workshop", location: "C", description: "C", eventType: "workshop", accent: "blue", showImg: false, imgUrl: "", imgAlt: "", showLink: false, linkUrl: "", linkText: "" },
    { id: 304, date: "OCT 2", time: "4:00 PM–5:00 PM", title: "Earlier Workshop", location: "D", description: "D", eventType: "workshop", accent: "blue", showImg: false, imgUrl: "", imgAlt: "", showLink: false, linkUrl: "", linkText: "" }
  ];
  window.renderEventList();
  assert.equal(window.document.querySelectorAll(".warning-badge").length, 4);
  assert.equal(window.getReadinessChecks().some((item) => /duplicate/i.test(item.label)), true);
  assert.equal(window.getReadinessChecks().some((item) => /schedule conflict/i.test(item.label)), true);
  window.sortEventsChronologically(false);
  assert.deepEqual(Array.from(window.events, (event) => event.title), ["Early Event", "Earlier Workshop", "Design Workshop", "Design Workshop"]);

  window.localStorage.removeItem("asme_nl_revisions");
  window.backupCurrentDraft("Test snapshot");
  assert.equal(window.getRevisions().length, 1);
  assert.match(window.document.getElementById("revision-list").textContent, /Test snapshot/);

  window.document.getElementById("s-gm-url").value = "https://groupme.com/join_group/custom";
  window.saveOrganizationDefaults();
  window.document.getElementById("s-gm-url").value = "";
  window.applyOrganizationDefaults(window.getOrganizationDefaults());
  assert.equal(window.document.getElementById("s-gm-url").value, "https://groupme.com/join_group/custom");
  window.restoreAsmeDefaults();
  assert.equal(window.document.getElementById("s-gm-url").value, "https://groupme.com/join_group/95825283/iaBgk5Ld");

  const checked = await window.checkAllLinks();
  assert.ok(checked.length >= 7);
  assert.equal(checked.every((result) => result.status === "ok"), true);

  dom.window.close();
});
