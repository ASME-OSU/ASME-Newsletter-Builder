import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import vm from 'node:vm';
const context = vm.createContext({ URL, Intl, Date });
vm.runInContext(fs.readFileSync(new URL('../newsletter-core.js', import.meta.url), 'utf8'), context);
const Core = context.NewsletterCore;

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8').replace('<script src="newsletter-core.js"></script>', `<script>${fs.readFileSync(new URL('../newsletter-core.js', import.meta.url), 'utf8')}</script>`);
const feed = Core.fictionalCalendarFeed('2027-2028');
feed.calendarName = 'Fixture for chapter snapshot';
feed.sourceUrl = 'https://calendar.google.com/calendar/embed?src=public';
feed.events.forEach(event => { event.title = event.title.replace('TEST ONLY —', 'Chapter fixture —').replace(' — DO NOT SEND', ''); });
const wait = async () => { await new Promise(resolve => setTimeout(resolve, 20)); };

test('academic year boundaries use Eastern date for timed events and UTC for all-day dates', () => {
  const events = [
    { id: 'jul31', start: '2027-08-01T03:30:00Z' },
    { id: 'aug1', start: '2027-08-01T04:00:00Z' },
    { id: 'all-day-aug1', start: '2027-08-01T00:00:00Z', allDay: true },
    { id: 'jul-end', start: '2028-08-01T03:30:00Z' },
    { id: 'next-aug', start: '2028-08-01T04:00:00Z' },
  ];
  assert.deepEqual(Core.eventsForAcademicYear(events, '2027-2028').map(event => event.id), ['aug1', 'all-day-aug1', 'jul-end']);
  assert.deepEqual(Core.eventsForAcademicYear(events, '2027').map(event => event.id), ['aug1', 'all-day-aug1', 'jul-end']);
  assert.equal(Core.normalizeAcademicYear('2027'), '2027-2028');
  assert.equal(Core.fictionalCalendarFeed('2027').events[0].id, 'fictional-fall-2027-2028');
  for (const invalid of ['27', '2027-2029', '2027-27', '9999']) assert.throws(() => Core.eventsForAcademicYear(events, invalid), /consecutive/);
});

test('full builder year preview and fictional Fall/Spring source preserve drafts/defaults/templates and refresh official JSON', async () => {
  let reads = 0;
  const dom = new JSDOM(html, { url: 'https://isolated.invalid/', runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(window) { window.alert = () => {}; window.confirm = () => true; window.fetch = async () => { reads++; return { ok: true, json: async () => feed }; }; } });
  const { window } = dom;
  try {
    await new Promise(resolve => window.addEventListener('load', resolve, { once: true })); await wait();
    const before = JSON.stringify(window.collectState());
    const defaults = window.localStorage.getItem('asme_nl_org_defaults'), templates = window.localStorage.getItem('asme_nl_templates');
    window.document.getElementById('calendar-preview-year').value = '2027';
    window.applyCalendarPreview();
    assert.equal(window.document.getElementById('calendar-preview-year').value, '2027-2028');
    assert.equal(window.calendarEvents.length, 2);
    assert.match(window.document.getElementById('calendar-status').textContent, /2027-2028.*Refresh rereads JSON/);
    const priorReads = reads;
    window.loadFictionalCalendar();
    assert.equal(reads, priorReads, 'fictional feed causes no network request');
    assert.equal(window.calendarIsFictional, true);
    assert.match(window.document.getElementById('calendar-status').textContent, /FICTIONAL REHEARSAL/);
    assert.equal(window.calendarDateParts(window.calendarEvents[0]).time, '6:00 PM–7:00 PM');
    assert.equal(window.calendarDateParts(window.calendarEvents[1]).time, '6:00 PM–7:00 PM');
    assert.equal(JSON.stringify(window.collectState()), before);
    assert.equal(window.localStorage.getItem('asme_nl_org_defaults'), defaults);
    assert.equal(window.localStorage.getItem('asme_nl_templates'), templates);
    window.importCalendarEvent(1);
    const imported = window.events.find(event => event.sourceEventId === "fictional-spring-2027-2028");
    assert.match(imported.title, /TEST ONLY.*Spring.*DO NOT SEND/);
    assert.equal(imported.linkUrl, '');
    const document = Core.createDraftDocument(window.collectState());
    const restored = Core.readDraftDocument(document);
    assert.equal(restored.events.find(event => event.sourceEventId === imported.sourceEventId).title, imported.title);
    assert.equal(restored.events.find(event => event.sourceEventId === imported.sourceEventId).sourceStart, '2028-01-15T23:00:00.000Z');
    assert.match(window.generateHTML(), /TEST ONLY.*Spring/);
    imported.description = 'Edited fictional Spring copy'; window.render();
    assert.match(window.generateHTML(), /Edited fictional Spring copy/);
    const removal = window.clearFictionalCalendar();
    assert.equal(window.calendarIsFictional, false);
    assert.match(window.document.getElementById('calendar-status').textContent, /Fictional events removed.*Reading/);
    await removal;
    assert.match(window.document.getElementById('calendar-status').textContent, /Fictional events removed.*Chapter generated snapshot/);
    assert.doesNotMatch(window.document.getElementById('calendar-list').textContent, /TEST ONLY/);
    assert.equal(window.events.find(event => event.sourceEventId === imported.sourceEventId).description, 'Edited fictional Spring copy');
    assert.equal(window.calendarIsFictional, false);
    assert.equal(window.calendarPreviewYear, '2027-2028');
    assert.equal(window.calendarEvents.length, 2);
    assert.equal(reads, priorReads + 1);
    window.document.getElementById('calendar-preview-year').value = '2028-2029'; window.applyCalendarPreview();
    assert.equal(window.calendarEvents.length, 0);
    window.document.getElementById('calendar-preview-year').value = '2027-2029'; window.applyCalendarPreview();
    assert.match(window.document.getElementById('calendar-status').textContent, /consecutive academic years/);
    assert.equal(window.calendarPreviewYear, '2028-2029', 'invalid input cannot poison the active year');
    await window.useChapterCalendar();
    assert.match(window.document.getElementById('calendar-status').textContent, /Chapter generated snapshot.*2028-2029/);
  } finally { window.close(); }
});

test('late snapshot response cannot overwrite a newly selected fictional source', async () => {
  let answer;
  const dom = new JSDOM(html, { url: 'https://isolated.invalid/', runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(window) { window.alert = () => {}; window.confirm = () => true; window.fetch = () => new Promise(resolve => { answer = resolve; }); } });
  const { window } = dom;
  try {
    await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    window.document.getElementById('calendar-preview-year').value = '2027-2028'; window.loadFictionalCalendar();
    answer({ ok: true, json: async () => ({ events: [] }) }); await wait();
    assert.equal(window.calendarIsFictional, true);
    assert.equal(window.calendarEvents.length, 2);
  } finally { window.close(); }
});


test('remove then Upcoming preserves loading, restores chapter source and handles failed refresh without fictional residue', async () => {
  let answer, fail = false;
  const dom = new JSDOM(html, { url: 'https://isolated.invalid/', runScripts: 'dangerously', pretendToBeVisual: true, beforeParse(window) {
    window.alert = () => {}; window.confirm = () => true;
    window.fetch = () => new Promise((resolve, reject) => { answer = fail ? reject : resolve; });
    window.console.warn = () => {};
  } });
  const { window } = dom;
  const status = () => window.document.getElementById('calendar-status').textContent;
  try {
    await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    const originalResponse = answer;
    window.document.getElementById('calendar-preview-year').value = '2027'; window.loadFictionalCalendar();
    assert.equal(window.calendarPreviewYear, '2027-2028');
    const removal = window.clearFictionalCalendar();
    const restorationResponse = answer;
    window.showUpcomingCalendar();
    assert.equal(window.calendarIsFictional, false);
    assert.equal(window.calendarEvents.length, 0, 'pending source cannot display fictional cards as chapter cards');
    assert.match(status(), /Fictional events removed.*Reading/);
    assert.equal(window.document.getElementById('calendar-list').getAttribute('aria-busy'), 'true');
    originalResponse({ ok: true, json: async () => ({ events: [{ ...feed.events[0], title: 'Stale response' }] }) }); await wait();
    assert.match(status(), /Reading/);
    restorationResponse({ ok: true, json: async () => feed }); await removal;
    assert.match(status(), /Fictional events removed.*Chapter generated snapshot.*upcoming dates/);
    assert.match(window.document.getElementById('calendar-list').textContent, /Chapter fixture/);
    assert.doesNotMatch(window.document.getElementById('calendar-list').textContent, /TEST ONLY|Stale response/);
    assert.equal(window.document.getElementById('clear-fictional-calendar').hidden, true);
    assert.equal(window.document.getElementById('calendar-list').getAttribute('aria-busy'), 'false');
    window.loadFictionalCalendar(); fail = true;
    const failedRemoval = window.clearFictionalCalendar(); window.showUpcomingCalendar();
    answer(new Error('Offline')); await failedRemoval;
    window.showUpcomingCalendar();
    assert.match(status(), /failed.*last loaded chapter events/);
    assert.doesNotMatch(status(), /FICTIONAL REHEARSAL/);
    assert.match(window.document.getElementById('calendar-list').textContent, /Chapter fixture/);
    fail = false;
    const retry = window.useChapterCalendar(); answer({ ok: true, json: async () => feed }); await retry;
    assert.doesNotMatch(status(), /failed|Reading|FICTIONAL REHEARSAL/);
  } finally { window.close(); }
});

test('failed removal without an earlier chapter response remains an honest normal unavailable view', async () => {
  const dom = new JSDOM(html, { url: 'https://isolated.invalid/', runScripts: 'dangerously', beforeParse(window) {
    window.alert = () => {}; window.confirm = () => true; window.console.warn = () => {};
    window.fetch = async () => { throw new Error('Offline'); };
  } });
  const { window } = dom;
  try {
    await new Promise(resolve => window.addEventListener('load', resolve, { once: true })); await wait();
    window.document.getElementById('calendar-preview-year').value = '2027'; window.loadFictionalCalendar();
    await window.clearFictionalCalendar(); window.showUpcomingCalendar();
    assert.equal(window.calendarIsFictional, false);
    assert.equal(window.calendarEvents.length, 0);
    assert.match(window.document.getElementById('calendar-status').textContent, /Fictional events removed.*unavailable.*retry Refresh/);
    assert.doesNotMatch(window.document.getElementById('calendar-status').textContent, /FICTIONAL REHEARSAL/);
  } finally { window.close(); }
});
