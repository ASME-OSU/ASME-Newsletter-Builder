import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function fixture(initialLinks = [{ label: 'Website', url: 'https://old.example/', safe: 'https://old.example/' }]) {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(new URL('../newsletter-links.js', import.meta.url), 'utf8'), context);
  let links = initialLinks;
  const statuses = [], probes = [];
  const checker = context.NewsletterLinks.createChecker({
    collectLinks: () => links,
    probe: link => new Promise(resolve => probes.push({ link, resolve })),
    onStatus: status => statuses.push(status)
  });
  return { checker, statuses, probes, setLinks: value => { links = value; } };
}
const tick = async () => { await Promise.resolve(); await Promise.resolve(); };

test('URL edits clear completed results and mark the check stale', async () => {
  const f = fixture();
  const run = f.checker.run(); await tick();
  f.probes[0].resolve({ label: 'Website', status: 'ok' }); await run;
  assert.equal(f.statuses.at(-1).state, 'complete');
  f.setLinks([{ label: 'Website', url: 'https://new.example/', safe: 'https://new.example/' }]);
  assert.equal(f.checker.invalidate(), true);
  assert.equal(f.statuses.at(-1).state, 'stale');
  assert.equal(f.statuses.at(-1).results.length, 0);
  assert.equal(f.checker.invalidate(), false);
});

test('overlapping checks ignore older results, including when URLs match', async () => {
  const f = fixture();
  const older = f.checker.run(); await tick();
  const newer = f.checker.run(); await tick();
  f.probes[1].resolve({ status: 'broken' }); await newer;
  f.probes[0].resolve({ status: 'ok' }); await older;
  assert.equal(f.statuses.filter(s => s.state === 'complete').length, 1);
  assert.equal(f.statuses.at(-1).results[0].status, 'broken');
});

test('an edit while checking cannot publish old success even without invalidation', async () => {
  const f = fixture();
  const run = f.checker.run(); await tick();
  f.setLinks([{ label: 'Website', url: 'javascript:bad', safe: '' }]);
  f.probes[0].resolve({ status: 'ok' }); await run;
  assert.equal(f.statuses.at(-1).state, 'stale');
  assert.equal(f.statuses.some(s => s.state === 'complete'), false);
});

test('explicit invalidation cancels a pending result and signatures include labels and safe URLs', async () => {
  const f = fixture();
  assert.equal(f.checker.invalidate(), false);
  const run = f.checker.run(); await tick();
  f.setLinks([{ label: 'Featured button', url: 'https://old.example/', safe: '' }]);
  f.checker.invalidate();
  f.probes[0].resolve({ status: 'ok' }); await run;
  assert.equal(f.statuses.at(-1).state, 'stale');
  assert.equal(f.statuses.at(-1).count, 1);
});

test('empty checks publish no results and prevent earlier in-flight results from appearing', async () => {
  const f = fixture();
  const older = f.checker.run(); await tick();
  f.setLinks([]);
  const result = await f.checker.run();
  assert.equal(result.length, 0);
  assert.equal(f.statuses.at(-1).state, 'empty');
  assert.equal(f.statuses.at(-1).count, 0);
  f.probes[0].resolve({ status: 'ok' }); await older;
  assert.equal(f.statuses.at(-1).state, 'empty');
});
