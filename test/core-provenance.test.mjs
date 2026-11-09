import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const context = vm.createContext({ URL, Intl, Date });
vm.runInContext(fs.readFileSync(new URL('../newsletter-core.js', import.meta.url), 'utf8'), context);
const Core = context.NewsletterCore;

function calendarEvent(overrides = {}) {
  return { id: 'chapter-meeting', title: 'GBM', start: '2027-01-01T01:00:00.000Z', ...overrides };
}

test('schema v4 preserves practice provenance and canonical dates through export and legacy migration', () => {
  const legacy = Core.readDraftDocument({ kind: Core.DRAFT_KIND, version: 3, state: {
    events: [{ id: 100, title: 'Edited practice copy', sourceEventId: 'fictional-fall-2027-2028', practice: false }],
    fields: {}
  } });
  assert.equal(Core.SCHEMA_VERSION, 4);
  assert.equal(legacy.schemaVersion, 4);
  assert.equal(legacy.events[0].practice, true, 'a legacy source cannot clear practice provenance');
  assert.equal(legacy.featuredPractice, false);
  assert.equal(legacy.events[0].dateISO, '');

  legacy.events[0].dateISO = '2027-09-15';
  legacy.featuredPractice = true;
  const exported = Core.createDraftDocument(legacy);
  const restored = Core.readDraftDocument(JSON.stringify(exported));
  assert.equal(exported.version, 4);
  assert.equal(restored.events[0].dateISO, '2027-09-15');
  assert.equal(restored.events[0].practice, true);
  assert.equal(restored.featuredPractice, true);
  assert.throws(() => Core.readDraftDocument({ kind: Core.DRAFT_KIND, version: 5, state: {} }), /newer version/);
});

test('detaching and duplicating a practice event preserve provenance without modifying the original', () => {
  const original = Core.calendarEventToNewsletter(calendarEvent({ id: 'fictional-spring-2027-2028' }), 100, 'America/New_York');
  original.title = 'Edited title with no practice wording';
  const detached = Core.detachCalendarSource(original);
  for (const key of ['sourceEventId', 'sourceUpdated', 'sourceStart', 'sourceFingerprint']) {
    assert.equal(key in detached, false);
    assert.equal(key in original, true);
  }
  assert.equal(detached.practice, true);
  assert.equal(detached.dateISO, '2026-12-31');
  assert.equal(original.sourceEventId, 'fictional-spring-2027-2028');
  const duplicate = Core.normalizeEvent({ ...detached, id: 101 }, 101);
  assert.equal(duplicate.practice, true);
  assert.equal(duplicate.dateISO, detached.dateISO);
  assert.equal(duplicate.title, original.title);
  assert.equal(Core.detachCalendarSource({ sourceEventId: 'fictional-legacy', title: 'Legacy' }).practice, true);
  assert.equal(Core.detachCalendarSource({ sourceEventId: 'chapter-real' }).practice, false);
});

test('calendar imports keep the calendar-zone day and year including all-day and daylight saving boundaries', () => {
  assert.equal(Core.calendarEventToNewsletter(calendarEvent(), 100, 'America/New_York').dateISO, '2026-12-31');
  assert.equal(Core.calendarEventToNewsletter(calendarEvent({ allDay: true }), 100, 'America/New_York').dateISO, '2027-01-01');
  assert.equal(Core.calendarEventToNewsletter(calendarEvent({ start: '2027-08-01T03:30:00.000Z' }), 100, 'America/New_York').dateISO, '2027-07-31');
  assert.equal(Core.calendarEventToNewsletter(calendarEvent({ start: '2027-08-01T04:00:00.000Z' }), 100, 'America/New_York').dateISO, '2027-08-01');
  assert.equal(Core.calendarEventToNewsletter(calendarEvent({ practice: true }), 100).practice, true);
  assert.equal(Core.calendarEventToNewsletter(calendarEvent(), 100).practice, false);
  assert.equal(Core.sanitizeCalendarEvent(calendarEvent({ practice: true })).practice, true);
});

test('canonical dates reject overflow and malformed input instead of silently changing the day', () => {
  for (const value of ['2027-02-29', '2027-04-31', '2027-13-01', '2027-1-01', 'JAN 1', '2027-01-01T00:00:00Z', null]) {
    assert.equal(Core.normalizeDateISO(value), '');
    assert.equal(Core.normalizeEvent({ dateISO: value }, 100).dateISO, '');
  }
  assert.equal(Core.normalizeDateISO('2028-02-29'), '2028-02-29');
});

test('export filenames use issue subjects without unsafe path characters and keep sensible fallbacks', () => {
  assert.equal(Core.exportFilename('ASME November Events', 'html'), 'asme-newsletter-asme-november-events.html');
  assert.equal(Core.exportFilename('Café / Tours: Nov 9?', '.json'), 'asme-newsletter-cafe-tours-nov-9.json');
  assert.equal(Core.exportFilename('../../', '../../html'), 'asme-newsletter.json');
  assert.equal(Core.exportFilename('', 'draft.json'), 'asme-newsletter.draft.json');
  const long = Core.exportFilename('A'.repeat(200), 'html');
  assert.equal(long.length, 'asme-newsletter-'.length + 80 + '.html'.length);
});
