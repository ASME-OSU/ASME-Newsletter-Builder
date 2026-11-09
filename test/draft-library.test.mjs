import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const sandbox = vm.createContext({ URL });
for (const path of ['newsletter-core.js', 'newsletter-library.js']) vm.runInContext(fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8'), sandbox);
const { NewsletterLibrary: Library, NewsletterCore: Core } = sandbox;
function storage() {
  const values = new Map();
  return { getItem: key => values.has(key) ? values.get(key) : null, setItem(key, value) { values.set(key, value); } };
}
function state() { return { schemaVersion: Core.SCHEMA_VERSION, featuredPractice: true, fields: { 's-subject': 'Workshop night', unauthorized: 'discard' }, events: [{ id: 12, title: 'Workshop', date: 'NOV 15', practice: true }] }; }
test('named library round-trips sanitized drafts, metadata and provenance without aliasing', () => {
  const store = storage(), library = Library.create(store), input = state();
  const first = library.save(' November issue ', input);
  assert.equal(first.name, 'November issue');
  assert.ok(first.id);
  assert.ok(Number.isFinite(Date.parse(first.createdAt)));
  assert.equal(first.createdAt, first.updatedAt);
  assert.equal(library.list()[0].state, undefined, 'list provides metadata, not editable draft objects');
  const loaded = library.load(first.id);
  assert.equal(loaded.fields['s-subject'], 'Workshop night');
  assert.equal(loaded.fields.unauthorized, undefined);
  assert.equal(loaded.featuredPractice, true);
  assert.equal(loaded.events[0].practice, true);
  input.fields['s-subject'] = 'Input edited'; loaded.fields['s-subject'] = 'Result edited'; first.state.fields['s-subject'] = 'Record edited';
  assert.equal(Library.create(store).load(first.id).fields['s-subject'], 'Workshop night');
});
test('same names create independent records; replacing requires an existing explicit ID', () => {
  const library = Library.create(storage());
  const first = library.save('Issue', state()), second = library.save('Issue', state());
  assert.notEqual(first.id, second.id);
  const next = state(); next.fields['s-subject'] = 'Revised';
  const replacement = library.save('Renamed', next, first.id);
  assert.equal(replacement.createdAt, first.createdAt);
  assert.equal(library.list().length, 2);
  assert.equal(library.load(first.id).fields['s-subject'], 'Revised');
  assert.throws(() => library.save('Lost issue', state(), 'unknown'), /no longer exists/);
  library.remove(first.id);
  assert.throws(() => library.load(first.id), /no longer exists/);
  assert.equal(library.list().length, 1);
});
test('limit never evicts an issue and explicit replacements still work at capacity', () => {
  const store = storage(), library = Library.create(store), ids = [];
  for (let index = 0; index < 30; index++) ids.push(library.save('Issue ' + index, state()).id);
  assert.equal(new Set(ids).size, 30);
  const before = store.getItem(Library.STORAGE_KEY);
  assert.throws(() => library.save('31st issue', state()), /up to 30/);
  assert.equal(store.getItem(Library.STORAGE_KEY), before);
  library.save('Updated issue', state(), ids[0]);
  assert.equal(library.list().length, 30);
});
test('quota failures preserve saved issues for both update and deletion', () => {
  const store = storage(), library = Library.create(store), saved = library.save('Existing', state());
  const before = store.getItem(Library.STORAGE_KEY), originalSet = store.setItem;
  store.setItem = () => { throw new Error('QuotaExceededError'); };
  assert.throws(() => library.save('Replacement', state(), saved.id), /could not be saved.*unchanged/);
  assert.throws(() => library.remove(saved.id), /could not be saved/);
  assert.equal(store.getItem(Library.STORAGE_KEY), before);
  store.setItem = originalSet;
  assert.equal(library.load(saved.id).fields['s-subject'], 'Workshop night');
});
test('corrupt and future library/state formats fail without overwriting storage', () => {
  const store = storage(), library = Library.create(store);
  for (const value of ['{', JSON.stringify({ version: 99, issues: [] })]) {
    store.setItem(Library.STORAGE_KEY, value);
    assert.throws(() => library.list(), /preserved/);
    assert.throws(() => library.save('New', state()), /preserved/);
    assert.equal(store.getItem(Library.STORAGE_KEY), value);
  }
  store.setItem(Library.STORAGE_KEY, JSON.stringify({ version: 1, issues: [] }));
  assert.throws(() => library.save('Future', { ...state(), schemaVersion: Core.SCHEMA_VERSION + 1 }), /newer builder/);
  assert.equal(library.list().length, 0);
  assert.throws(() => library.save(' ', state()), /Enter a name/);
  assert.throws(() => library.save('x'.repeat(121), state()), /120 characters/);
});
