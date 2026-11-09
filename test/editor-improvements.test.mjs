import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { loadBuilderHTML } from './helpers/load-builder.mjs';

const source = {
  id: 'meeting::2099-09-15T22:00:00.000Z', title: 'Chapter meeting',
  start: '2099-09-15T22:00:00.000Z', end: '2099-09-15T23:00:00.000Z',
  location: 'Hitchcock 035', description: 'Original calendar description',
  url: 'https://example.com/meeting', updated: '2026-11-09T12:00:00.000Z'
};
const feed = () => ({ events: [{ ...source }], timeZone: 'America/New_York', windowStart: '2099-08-01T00:00:00Z', windowEnd: '2100-08-01T00:00:00Z' });
const tick = () => new Promise(resolve => setTimeout(resolve, 10));
async function fixture() {
  const dom = new JSDOM(loadBuilderHTML(), {
    url: 'https://isolated.invalid/', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.confirm = () => true;
      w.fetch = async (url, options = {}) => options.method === 'HEAD'
        ? { ok: true, status: 200, url: String(url), redirected: false }
        : { ok: true, json: async () => feed() };
    }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  await tick();
  return dom.window;
}

test('a duplicated calendar card stays independent when the original is synced', async () => {
  const w = await fixture();
  try {
    w.importCalendarEvent(0);
    const original = w.events.find(event => event.sourceEventId === source.id);
    w.duplicateEvent(original.id);
    const copy = w.events.find(event => event.title === source.title + ' (Copy)');
    assert.ok(copy);
    assert.ok(!copy.sourceEventId);
    w.updateEvent(copy.id, 'title', 'Separate newsletter event');
    w.updateEvent(copy.id, 'description', 'Officer-authored copy');
    w.calendarAllEvents[0].title = 'Changed calendar meeting';
    w.calendarAllEvents[0].updated = '2026-11-09T13:00:00.000Z';
    w.syncImportedCalendarEvents();
    assert.equal(w.events.find(event => event.id === original.id).title, 'Changed calendar meeting');
    assert.equal(w.events.find(event => event.id === copy.id).title, 'Separate newsletter event');
    assert.equal(w.events.find(event => event.id === copy.id).description, 'Officer-authored copy');
  } finally { w.close(); }
});

test('editing a URL clears previously successful network checks', async () => {
  const w = await fixture();
  try {
    await w.checkAllLinks();
    assert.match(w.document.getElementById('link-check-results').textContent, /Reachable/);
    const website = w.document.getElementById('s-website');
    website.value = 'https://changed.example/';
    website.dispatchEvent(new w.Event('input', { bubbles: true }));
    const results = w.document.getElementById('link-check-results').textContent;
    assert.match(results, /Links changed/);
    assert.doesNotMatch(results, /Reachable/);
  } finally { w.close(); }
});

test('preset fill can immediately restore the complete authored event with Undo', async () => {
  const w = await fixture();
  try {
    const event = w.events[0];
    w.updateEvent(event.id, 'title', 'Custom workshop');
    w.updateEvent(event.id, 'description', 'Instructions written by an officer');
    w.updateEvent(event.id, 'location', 'Custom room');
    const before = JSON.stringify(w.Core.sanitizeState(w.collectState()));
    w.applyPreset(event.id, 'gbm');
    assert.equal(w.events.find(item => item.id === event.id).title, 'General Body Meeting');
    assert.equal(w.document.getElementById('edit-feedback').hidden, false);
    w.undoDraftChange();
    assert.equal(JSON.stringify(w.Core.sanitizeState(w.collectState())), before);
    assert.equal(w.document.getElementById('edit-feedback').hidden, true);
  } finally { w.close(); }
});

test('preview redraws and dark simulation leave a saved draft clean', async () => {
  const w = await fixture();
  try {
    w.flushDraftSave();
    const saved = w.localStorage.getItem('asme_nl_draft');
    const state = JSON.stringify(w.collectState());
    w.renderPreview(); w.toggleDarkSimulation(); w.toggleDarkSimulation();
    assert.equal(JSON.stringify(w.collectState()), state);
    assert.equal(w.draftSavePending, false);
    assert.equal(w.localStorage.getItem('asme_nl_draft'), saved);
    assert.equal(w.document.getElementById('save-indicator').dataset.status, 'saved');
  } finally { w.close(); }
});

test('practice provenance survives independent copies, featured reuse and draft handoff', async () => {
  const w = await fixture();
  try {
    w.document.getElementById('calendar-preview-year').value = '2099';
    w.loadFictionalCalendar(); w.importCalendarEvent(0);
    const practice = w.events.find(event => /^fictional-/.test(event.sourceEventId));
    w.keepCalendarEvent(practice.id);
    assert.ok(!practice.sourceEventId);
    w.useEventAsFeatured(practice.id);
    const exported = w.Core.createDraftDocument(w.collectState());
    w.applyState(w.Core.readDraftDocument(JSON.stringify(exported)));
    assert.equal(w.events.find(event => event.id === practice.id).practice, true);
    assert.equal(w.collectState().featuredPractice, true);
    const warnings = w.getReadinessChecks().filter(item => !item.ok && /fictional practice/i.test(item.label));
    assert.equal(warnings.length, 2);
    assert.match(w.generateHTML(), /TEST ONLY/);
  } finally { w.close(); }
});

test('readiness Fix opens a collapsed event and focuses its invalid link field', async () => {
  const w = await fixture();
  try {
    const event = w.events[1];
    w.updateEvent(event.id, 'showLink', true);
    w.updateEvent(event.id, 'linkUrl', 'not a URL');
    w.eventExpansion[event.id] = false; w.renderEventList();
    w.openReadinessChecklist(); await tick();
    const index = w.getReadinessChecks().findIndex(item => !item.ok && item.field === `event-${event.id}-linkUrl`);
    assert.ok(index >= 0);
    w.fixReadiness(index);
    assert.equal(w.document.getElementById('checklist-modal').classList.contains('open'), false);
    assert.equal(w.document.getElementById('tab-events').classList.contains('active'), true);
    assert.equal(w.document.querySelector(`[data-event-id="${event.id}"]`).open, true);
    assert.equal(w.document.activeElement.id, `event-${event.id}-linkUrl`);
  } finally { w.close(); }
});
