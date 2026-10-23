import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
const core = fs.readFileSync(new URL('../newsletter-core.js', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8').replace('<script src="newsletter-core.js"></script>', `<script>${core}</script>`);
const occurrence = (day, extra = {}) => ({ id: `series::2099-09-${day}T22:00:00.000Z`, start: `2099-09-${day}T22:00:00.000Z`, end: `2099-09-${day}T23:00:00.000Z`, title: 'Weekly meeting', description: 'Useful agenda', updated: '2026-01-01T00:00:00Z', recurring: true, ...extra });
const feed = events => ({ events, windowStart: '2099-08-01T00:00:00Z', windowEnd: '2100-08-01T00:00:00Z', timeZone: 'America/New_York' });
async function builder(t, events) {
  const dom = new JSDOM(html, { url: 'https://isolated.invalid/', runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(w) {
    w.matchMedia = query => ({ media: query, matches: false, addEventListener() {}, removeEventListener() {} });
    w.alert = () => {}; w.confirm = () => true; w.fetch = async () => ({ ok: true, json: async () => feed(events) }); w.console.warn = () => {};
  } });
  t.after(() => dom.window.close());
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  await new Promise(resolve => setTimeout(resolve, 10));
  dom.window.events = []; return dom.window;
}
test('weekly imports remain distinct and stable recurrence identity follows a reschedule', async t => {
  const first = occurrence('15'), second = occurrence('22'), w = await builder(t, [first, second]);
  w.importCalendarEvent(0); w.importCalendarEvent(1);
  assert.equal(w.events.length, 2);
  const moved = { ...first, start: '2099-09-19T22:00:00.000Z', title: 'Rescheduled meeting' };
  w.setCalendarFeed(feed([moved, second])); w.syncImportedCalendarEvents();
  assert.equal(w.events.length, 2);
  assert.equal(w.events.find(e => e.sourceEventId === first.id).title, moved.title);
  assert.equal(w.events.find(e => e.sourceEventId === second.id).sourceStart, second.start);
});
test('legacy series cannot overwrite extant weekly or daily occurrences and supports unambiguous reschedules', async t => {
  const first = occurrence('15', { recurring: false }), second = occurrence('22', { recurring: false }), w = await builder(t, [first, second]);
  w.importCalendarEvent(0); w.importCalendarEvent(1);
  assert.equal(w.events.length, 2, 'sole series candidate still must pass distance guard');
  const nearby = occurrence('16', { recurring: false });
  w.setCalendarFeed(feed([first, nearby, second])); w.importCalendarEvent(1);
  assert.equal(w.events.length, 3, 'existing original cannot match another occurrence');
  const replacement = { ...first, id: 'series::2099-09-15T23:00:00.000Z', start: '2099-09-15T23:00:00.000Z' };
  w.setCalendarFeed(feed([replacement, nearby, second]));
  assert.equal(w.findCalendarEventForImported(w.events.find(e => e.sourceEventId === first.id)).id, replacement.id);
});
test('content-only upstream changes are detected without mistaking local edits for source changes', async t => {
  const source = occurrence('15'), w = await builder(t, [source]); w.importCalendarEvent(0);
  w.events[0].description = 'Locally authored copy';
  assert.equal(w.calendarImportNeedsUpdate(w.events[0], w.calendarAllEvents[0]), false);
  w.setCalendarFeed(feed([{ ...source, description: 'Changed agenda, same timestamp' }]));
  assert.equal(w.calendarImportNeedsUpdate(w.events[0], w.calendarAllEvents[0]), true);
  w.syncImportedCalendarEvents(); assert.equal(w.events[0].description, 'Changed agenda, same timestamp');
  const restored = w.NewsletterCore.readDraftDocument(w.NewsletterCore.createDraftDocument(w.collectState()));
  assert.equal(restored.events[0].sourceFingerprint, w.events[0].sourceFingerprint);
});
test('readiness distinguishes confirmed removals, missing coverage and failed snapshots; keeping detaches source', async t => {
  const source = occurrence('15'), w = await builder(t, [source]); w.importCalendarEvent(0); const imported = w.events[0];
  w.setCalendarFeed(feed([])); assert.equal(w.calendarSourceStatus(imported), 'missing');
  assert.ok(w.getReadinessChecks().some(c => !c.ok && /no longer on Calendar/.test(c.label)));
  w.setCalendarFeed({ ...feed([]), windowStart: '2099-10-01T00:00:00Z' }); assert.equal(w.calendarSourceStatus(imported), 'outside-coverage');
  assert.equal(w.getReadinessChecks().some(c => /no longer on Calendar/.test(c.label)), false);
  w.setCalendarFeed({ events: [] }); assert.equal(w.calendarSourceStatus(imported), 'unavailable');
  w.setCalendarFeed(feed([])); w.calendarLoadNotice = 'Snapshot request failed; showing last loaded events.'; assert.equal(w.calendarSourceStatus(imported), 'unavailable');
  w.calendarLoadNotice = ''; w.keepCalendarEvent(imported.id);
  assert.equal(imported.title, source.title); assert.equal(imported.sourceEventId, '');
  assert.equal(w.getReadinessChecks().some(c => /calendar source|no longer on Calendar/.test(c.label)), false);
});
