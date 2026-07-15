import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1])
  .filter((script) => script.trim());

assert.equal(inlineScripts.length, 1, "Expected one inline application script");
new Function(inlineScripts[0]);
assert.match(html, /<script src="newsletter-core\.js"><\/script>/);
assert.match(html, /id="tab-calendar"/);
assert.match(html, /function importCalendarEvent\(/);
assert.match(html, /function exportDraft\(/);
assert.match(html, /role="dialog" aria-modal="true"/);
assert.match(html, /id="info-modal" role="dialog" aria-modal="true"/);
assert.match(html, /function openInfoDialog\(/);

console.log("HTML structure and inline JavaScript syntax are valid.");
