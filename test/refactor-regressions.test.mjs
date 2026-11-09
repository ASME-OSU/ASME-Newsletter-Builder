import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { loadBuilderHTML } from './helpers/load-builder.mjs';

const source = {
  id: 'regression-calendar-event', title: 'Chapter meeting',
  start: '2099-09-15T22:00:00.000Z', end: '2099-09-15T23:00:00.000Z',
  description: 'Chapter event description', location: 'Hitchcock 035',
  url: 'https://example.com/chapter-event', updated: '2026-11-09T12:00:00.000Z'
};

async function fixture() {
  const dom = new JSDOM(loadBuilderHTML(), {
    url: 'https://isolated.invalid/', runScripts: 'dangerously', pretendToBeVisual: true,
    beforeParse(w) {
      w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
      w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = () => {}; w.confirm = () => true;
      w.fetch = async () => ({ ok: true, json: async () => ({
        events: [{ ...source }], timeZone: 'America/New_York',
        windowStart: '2099-08-01T00:00:00.000Z', windowEnd: '2101-08-01T00:00:00.000Z'
      }) });
    }
  });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  await new Promise(resolve => setTimeout(resolve, 10));
  return dom.window;
}

function importedEvent(w) {
  return w.events.find(event => event.sourceEventId === source.id);
}

test('loading a real built-in template clears an inherited featured-practice warning', async () => {
  const w = await fixture();
  try {
    w.document.getElementById('calendar-preview-year').value = '2099';
    w.loadFictionalCalendar();
    w.importCalendarEvent(0);
    const practice = w.events.find(event => event.practice);
    w.useEventAsFeatured(practice.id);
    assert.equal(w.featuredPractice, true);
    assert.ok(w.getReadinessChecks().some(check => !check.ok && /Featured event is fictional practice/.test(check.label)));
    w.loadBuiltInTemplate('default');
    assert.equal(w.featuredPractice, false);
    assert.equal(w.collectState().featuredPractice, false);
    assert.ok(!w.getReadinessChecks().some(check => /fictional practice/.test(check.label)));
    assert.ok(!w.generateHTML().includes('TEST ONLY'));
  } finally { w.close(); }
});

test('reviewed sync offers year-only date changes and updates the canonical sorting date', async () => {
  const w = await fixture();
  try {
    w.importCalendarEvent(0);
    assert.equal(importedEvent(w).dateISO, '2099-09-15');
    w.calendarAllEvents[0].start = '2100-09-15T22:00:00.000Z';
    w.calendarAllEvents[0].end = '2100-09-15T23:00:00.000Z';
    w.calendarAllEvents[0].updated = '2026-11-09T13:00:00.000Z';
    w.reviewCalendarUpdates(0);
    const choice = w.document.querySelector('#calendar-update-review input[data-field="date"]');
    assert.ok(choice, 'same displayed month/day must still expose a changed year');
    assert.equal(choice.checked, true);
    assert.match(choice.closest('label').textContent, /2099-09-15/);
    assert.match(choice.closest('label').textContent, /2100-09-15/);
    w.applyReviewedCalendarUpdates();
    assert.equal(importedEvent(w).dateISO, '2100-09-15');
    assert.equal(importedEvent(w).sourceStart, '2100-09-15T22:00:00.000Z');
    assert.ok(w.eventDateValue(importedEvent(w)) > w.eventDateValue({ dateISO: '2099-12-31', time: '6:00 PM' }));
    w.undoDraftChange();
    assert.equal(importedEvent(w).dateISO, '2099-09-15');
  } finally { w.close(); }
});

test('renderEmailHTML uses its captured state independently of subsequent DOM and draft edits', async () => {
  const w = await fixture();
  try {
    w.document.getElementById('feat-title').value = 'Captured featured title';
    w.document.getElementById('email-width').value = '600';
    const captured = JSON.parse(JSON.stringify(w.collectState()));
    const originalState = JSON.stringify(captured);
    const expected = w.renderEmailHTML(captured);
    w.document.getElementById('feat-title').value = 'Later DOM featured title';
    w.document.getElementById('email-width').value = '760';
    w.updateEvent(w.events[0].id, 'title', 'Later draft event title');
    w.setTheme('navy');
    const liveState = JSON.stringify(w.collectState());
    assert.equal(w.renderEmailHTML(captured), expected);
    assert.equal(JSON.stringify(captured), originalState, 'renderer must not mutate its input');
    assert.equal(JSON.stringify(w.collectState()), liveState, 'renderer must not modify the live draft');
    assert.match(expected, /Captured featured title/);
    assert.doesNotMatch(expected, /Later DOM featured title|Later draft event title/);
    assert.match(w.generateHTML(), /Later DOM featured title/);
  } finally { w.close(); }
});

test('a failed event image exposes a readiness action that focuses its URL field', async () => {
  const w = await fixture();
  try {
    const event = w.events[0];
    w.updateEvent(event.id, 'showImg', true);
    w.updateEvent(event.id, 'imgUrl', 'https://example.com/missing-event.png');
    w.updateEvent(event.id, 'imgAlt', 'Meeting photo');
    const image = w.document.querySelector('.pv-event-img');
    assert.ok(image);
    image.dispatchEvent(new w.Event('error'));
    const index = w.getReadinessChecks().findIndex(check => !check.ok && /could not load/.test(check.label) && check.eventId === event.id);
    assert.ok(index >= 0);
    const warning = w.getReadinessChecks()[index];
    assert.equal(warning.field, `event-${event.id}-imgUrl`);
    assert.equal(warning.tab, 'events');
    w.openReadinessChecklist();
    w.fixReadiness(index);
    assert.equal(w.document.activeElement.id, `event-${event.id}-imgUrl`);
    assert.equal(w.document.querySelector(`[data-event-id="${event.id}"]`).open, true);
    w.updateEvent(event.id, 'showImg', false);
    assert.ok(!w.getReadinessChecks().some(check => /could not load/.test(check.label) && check.eventId === event.id));
  } finally { w.close(); }
});

test('full calendar sync preserves explicit practice provenance after upstream content changes', async () => {
  const w = await fixture();
  try {
    w.importCalendarEvent(0);
    importedEvent(w).practice = true;
    w.calendarAllEvents[0].description = 'Updated upstream copy';
    w.calendarAllEvents[0].updated = '2026-11-09T13:00:00.000Z';
    w.syncImportedCalendarEvents();
    assert.equal(importedEvent(w).description, 'Updated upstream copy');
    assert.equal(importedEvent(w).practice, true);
    assert.ok(w.getReadinessChecks().some(check => !check.ok && /fictional practice/.test(check.label) && check.eventId === importedEvent(w).id));
    const restored = w.Core.readDraftDocument(JSON.stringify(w.Core.createDraftDocument(w.collectState())));
    assert.equal(restored.events.find(event => event.sourceEventId === source.id).practice, true);
  } finally { w.close(); }
});

test('latest navigation keeps preview icons and accessible readiness state in sync', async () => {
  const w = await fixture();
  try {
    const d = w.document, button = d.getElementById('preview-desktop-btn');
    const icon = button.querySelector('svg');
    assert.ok(icon);
    w.syncWorkspace(); w.setWorkspaceView('preview'); w.setWorkspaceView('edit');
    assert.equal(button.querySelector('svg'), icon, 'workspace labels must preserve the upstream device icon');
    const state = w.Core.sanitizeState(w.collectState());
    Object.assign(state, { showFeatured: false, showAnnounce: false, showLinks: false });
    state.events = [w.Core.normalizeEvent({id: 101, title: 'Chapter meeting', date: 'NOV 12', description: 'Meet the officers.'}, 101)];
    Object.assign(state.fields, {'s-subject': 'November events', 's-preheader': 'Meetings and workshops', 'footer-addr': '123 Main St, Columbus, OH 43210'});
    w.applyState(state);
    const track = d.querySelector('.readiness-track');
    assert.equal(track.getAttribute('aria-valuenow'), '100');
    assert.equal(d.querySelector('.readiness-card').dataset.state, 'ready');
    assert.equal(d.getElementById('mobile-readiness').dataset.state, 'ready');
    d.getElementById('s-subject').value = ''; w.documentChanged();
    assert.equal(d.querySelector('.readiness-card').dataset.state, 'review');
    assert.equal(d.getElementById('mobile-readiness').dataset.state, 'review');
    assert.match(track.getAttribute('aria-valuetext'), /items to review/);
  } finally { w.close(); }
});
