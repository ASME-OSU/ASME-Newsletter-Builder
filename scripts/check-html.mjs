import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=new URL('../',import.meta.url),html=fs.readFileSync(new URL('index.html',base),'utf8');
const scripts=[...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(match=>match[1].split("?")[0]);
assert.ok(scripts.includes('newsletter-editor.js'));
for(const script of scripts)new Function(fs.readFileSync(new URL(script,base),'utf8'));
const styles=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(match=>match[1].split('?')[0]);
for(const style of styles){
  const file=new URL(style,base),css=fs.readFileSync(file,'utf8');assert.ok(css.length>0);
  for(const match of css.matchAll(/url\(['"]?(\.\/fonts\/[^'"\)]+)['"]?\)/g))assert.ok(fs.readFileSync(new URL(match[1],file)).length>0);
}
for(const id of ['tab-calendar','info-modal','checklist-modal'])assert.ok(html.includes('id="'+id+'"'));
assert.match(html,/role="dialog" aria-modal="true"/);
console.log('HTML structure, external assets, and JavaScript syntax are valid.');
