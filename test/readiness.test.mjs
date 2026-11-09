import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const sandbox = vm.createContext({ URL });
vm.runInContext(fs.readFileSync(new URL('../newsletter-core.js', import.meta.url), 'utf8'), sandbox);
vm.runInContext(fs.readFileSync(new URL('../newsletter-readiness.js', import.meta.url), 'utf8'), sandbox);
const check = sandbox.NewsletterReadiness.check;
function issue() {
  return { events: [{ id: 101, title: 'Design Workshop', date: 'NOV 15', time: '6:00 PM', location: 'Scott Lab', description: 'Bring your laptop.' }], showFeatured: false, showAnnounce: false, showLinks: false, fields: { 's-subject': 'ASME November events', 's-preheader': 'Workshops and chapter news.', 's-unsub': '{{ unsubscribe }}', 'footer-addr': '123 Main Street, Columbus OH 43210' } };
}
const context = { activeLogo: 'https://example.com/logo.png' };
test('readiness is pure, DOM-free, and returns routes for failures', () => {
  const state = issue(), before = JSON.stringify(state);
  assert.equal(check(state, context).every(item => item.ok), true);
  state.fields['s-subject'] = '';
  const result = check(state, context).find(item => item.label === 'No email subject line');
  assert.equal(result.tab, 'settings');
  assert.equal(result.field, 's-subject');
  assert.equal(result.eventId, null);
  state.fields['s-subject'] = 'ASME November events';
  assert.equal(JSON.stringify(state), before);
  check(Object.freeze(state), context);
  assert.equal(JSON.stringify(state), before);
});
test('placeholder and image checks navigate to the affected event field', () => {
  const state = issue(), event = state.events[0];
  event.description = 'Brief description of the event.';
  event.showImg = true; event.imgUrl = 'https://example.com/image.png'; event.imgAlt = '';
  const failures = check(state, context).filter(item => !item.ok);
  assert.equal(failures.find(item => /placeholder/.test(item.label)).field, 'event-101-description');
  assert.equal(failures.find(item => /image needs/.test(item.label)).field, 'event-101-imgAlt');
  assert.equal(failures.every(item => item.eventId === 101), true);
  event.description = 'Circuit [analysis] workshop with design teams.';
  assert.equal(check(state, context).some(item => /placeholder/.test(item.label)), false, 'ordinary bracketed content is allowed');
  event.location = '[Location TBD]';
  assert.equal(check(state, context).find(item => /placeholder/.test(item.label)).field, 'event-101-location');
});
test('disabled sections do not warn; enabled featured and announcement content is checked', () => {
  const state = issue();
  assert.equal(check(state, context).every(item => item.ok), true);
  state.showFeatured = true; state.showAnnounce = true;
  let failures = check(state, context).filter(item => !item.ok);
  for (const id of ['feat-title', 'feat-date', 'feat-location', 'feat-desc', 'ann-title', 'ann-quote']) assert.ok(failures.some(item => item.field === id), id);
  Object.assign(state.fields, { 'feat-title': 'Workshop', 'feat-date': 'NOV 15', 'feat-location': 'Scott Lab', 'feat-desc': 'Bring a laptop.', 'ann-title': 'From the board', 'ann-quote': 'Welcome new members.' });
  assert.equal(check(state, context).every(item => item.ok), true);
});
test('practice provenance remains flagged even after visible practice wording is edited', () => {
  const state = issue();
  state.events[0].sourceEventId = 'fictional-fall-2027-2028';
  assert.equal(check(state, context).filter(item => /fictional practice/.test(item.label)).length, 1);
  delete state.events[0].sourceEventId; state.events[0].practice = true;
  assert.equal(check(state, context).filter(item => /fictional practice/.test(item.label)).length, 1);
  state.showFeatured = true; state.featuredPractice = true;
  assert.ok(check(state, context).some(item => item.label === 'Featured event is fictional practice content'));
  state.showFeatured = false;
  assert.equal(check(state, context).some(item => item.label === 'Featured event is fictional practice content'), false);
});
test('calendar and event warnings retain established labels and useful destinations', () => {
  const state = issue(); state.events[0].sourceEventId = 'real-event';
  let checks = check(state, { ...context, calendarSourceStatus: () => 'missing', eventWarnings: () => ({ duplicate: true, conflict: true }) });
  assert.ok(checks.some(item => /no longer on Calendar/.test(item.label) && item.eventId === 101));
  assert.ok(checks.some(item => /duplicate/.test(item.label) && item.field === 'event-101-title'));
  assert.ok(checks.some(item => /schedule conflict/.test(item.label) && item.field === 'event-101-time'));
  checks = check(state, { ...context, calendarSourceStatus: () => 'outside-coverage' });
  assert.ok(checks.some(item => /calendar source/.test(item.label) && item.tab === 'calendar'));
  assert.equal(checks.some(item => /no longer on Calendar/.test(item.label)), false);
});
