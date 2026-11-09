import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { loadBuilderHTML } from './helpers/load-builder.mjs';
const html = loadBuilderHTML();
function feed() {
  return { timeZone: 'America/New_York', sourceUrl: 'https://calendar.google.com/calendar/embed?src=fixture', generatedAt: '2099-09-01T12:00:00Z', checkedAt: '2099-09-01T12:00:00Z', windowStart: '2099-08-01T00:00:00Z', windowEnd: '2100-08-01T00:00:00Z', events: [1, 2, 3, 4].map((number) => ({ id: 'workflow-' + number, title: 'Workshop ' + number, start: '2099-09-' + (10 + number) + 'T22:00:00.000Z', end: '2099-09-' + (10 + number) + 'T23:00:00.000Z', location: 'Scott Lab ' + number, description: 'Calendar description ' + number, url: 'https://example.com/event/' + number, updated: '2099-09-01T12:00:00.000Z' })) };
}
async function setup() {
  const dom = new JSDOM(html, { url: 'https://isolated.invalid/', runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(window) {
    window.matchMedia = query => ({ media: query, matches: false, addEventListener() {}, removeEventListener() {} });
    window.HTMLElement.prototype.scrollIntoView = function () {};
    window.alert = () => {}; window.confirm = () => true;
    window.fetch = async () => ({ ok: true, json: async () => feed() });
  } });
  await new Promise(resolve => dom.window.addEventListener('load', resolve, { once: true }));
  await new Promise(resolve => setTimeout(resolve, 20));
  assert.equal(dom.window.calendarEvents.length, 4, 'fixture finished loading');
  dom.window.events = []; dom.window.renderEventList(); dom.window.render();
  return dom;
}

test('batch import uses the visible date range, skips existing imports, and undoes the entire batch once', async () => {
  const dom = await setup(), w = dom.window, d = w.document;
  try {
    w.importCalendarEvent(0);
    const original = JSON.stringify(w.collectState());
    w.switchTabByName('calendar');
    d.getElementById('calendar-select-all').click();
    assert.equal(d.querySelectorAll('#calendar-list input[type="checkbox"]').length, 3, 'already imported event has no import checkbox');
    assert.equal(d.getElementById('calendar-import-selected').textContent, 'Import selected (3)');
    d.getElementById('calendar-from').value = '2099-09-12';
    d.getElementById('calendar-to').value = '2099-09-13';
    w.applyCalendarPreview(false);
    assert.deepEqual(Array.from(w.calendarEvents, event => event.id), ['workflow-2', 'workflow-3']);
    assert.equal(d.getElementById('calendar-import-selected').textContent, 'Import selected (2)');
    d.getElementById('calendar-import-selected').click();
    assert.deepEqual(Array.from(w.events, event => event.sourceEventId), ['workflow-1', 'workflow-2', 'workflow-3']);
    assert.equal(w.events.filter(event => event.sourceEventId === 'workflow-1').length, 1);
    assert.equal(w.events.some(event => event.sourceEventId === 'workflow-4'), false, 'a hidden selected event is not imported');
    assert.equal(d.getElementById('edit-feedback-text').textContent, '2 events imported.');
    assert.equal(d.getElementById('calendar-import-selected').disabled, true);
    d.getElementById('undo-draft-btn').click();
    assert.equal(JSON.stringify(w.collectState()), original, 'one Undo restores the whole draft before the batch');
    assert.equal(d.getElementById('edit-feedback').hidden, true);
  } finally { w.close(); }
});

test('reviewed calendar sync preserves unchecked authored description, tracks the source, and can be undone', async () => {
  const dom = await setup(), w = dom.window, d = w.document;
  try {
    w.importCalendarEvent(0);
    const importedId = w.events[0].id;
    w.updateEvent(importedId, 'description', 'Officer-authored newsletter description.');
    w.events[0].showImg = true; w.events[0].imgUrl = 'https://example.com/custom.png'; w.events[0].imgAlt = 'Member workshop';
    const before = JSON.stringify(w.collectState());
    const changed = feed();
    Object.assign(changed.events[0], { title: 'Revised workshop title', location: 'Scott Lab E100', description: 'Revised calendar description.', start: '2099-09-12T22:30:00.000Z', updated: '2099-09-02T12:00:00.000Z' });
    w.setCalendarFeed(changed);
    w.switchTabByName('calendar');
    assert.equal(d.getElementById('sync-calendar-imports').hidden, false);
    w.reviewCalendarUpdates(0);
    const description = d.querySelector('#calendar-update-review input[data-field="description"]');
    assert.ok(description);
    description.checked = false;
    d.querySelector('#calendar-update-review button[onclick="applyReviewedCalendarUpdates()"]').click();
    const current = w.events.find(event => event.id === importedId), source = w.calendarAllEvents[0];
    assert.equal(current.description, 'Officer-authored newsletter description.');
    assert.equal(current.title, 'Revised workshop title');
    assert.equal(current.location, 'Scott Lab E100');
    assert.equal(current.dateISO, '2099-09-12');
    assert.equal(current.imgUrl, 'https://example.com/custom.png');
    assert.equal(current.imgAlt, 'Member workshop');
    assert.equal(current.showImg, true);
    assert.equal(current.sourceStart, source.start);
    assert.equal(current.sourceUpdated, source.updated);
    assert.equal(w.calendarImportNeedsUpdate(current, source), false, 'preserved local copy does not trigger the same upstream update again');
    assert.equal(d.getElementById('sync-calendar-imports').hidden, true);
    assert.equal(d.getElementById('calendar-update-review').hidden, true);
    w.undoDraftChange();
    assert.equal(JSON.stringify(w.collectState()), before);
    assert.equal(w.calendarImportNeedsUpdate(w.events[0], source), true, 'Undo also restores old source provenance');
  } finally { w.close(); }
});

test('opening a named issue preserves the current draft through Undo and does not mutate the saved issue', async () => {
  const dom = await setup(), w = dom.window, d = w.document;
  try {
    w.importCalendarEvent(0);
    d.getElementById('s-subject').value = 'Saved September issue'; w.render();
    d.getElementById('issue-library-name').value = 'September members';
    w.saveNamedIssue();
    assert.match(d.getElementById('issue-library-status').textContent, /Issue saved/);
    const saved = w.issueLibrary().list()[0], savedState = JSON.stringify(w.issueLibrary().load(saved.id));
    w.updateEvent(w.events[0].id, 'title', 'Current unsaved event edit');
    d.getElementById('s-subject').value = 'Next issue in progress'; w.render();
    const current = JSON.stringify(w.collectState());
    w.openNamedIssue(saved.id);
    assert.equal(d.getElementById('s-subject').value, 'Saved September issue');
    assert.equal(w.events[0].title, 'Workshop 1');
    assert.ok(w.getRevisions().some(revision => revision.reason === 'Before opening saved issue'));
    d.getElementById('undo-draft-btn').click();
    assert.equal(JSON.stringify(w.collectState()), current);
    assert.equal(JSON.stringify(w.issueLibrary().load(saved.id)), savedState, 'opening and undoing never alters the library entry');
  } finally { w.close(); }
});
