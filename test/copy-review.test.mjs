import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {JSDOM} from 'jsdom';
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace('<script src="newsletter-core.js"></script>',`<script>${fs.readFileSync(new URL('../newsletter-core.js',import.meta.url),'utf8')}</script>`);
async function fixture(){
 const alerts=[],writes=[];
 const dom=new JSDOM(html,{url:'https://isolated.invalid/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){}});w.alert=m=>alerts.push(m);w.confirm=()=>true;w.fetch=async()=>({ok:true,json:async()=>({events:[],timeZone:'America/New_York'})});Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async text=>{writes.push(text);}}});}});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));return {dom,w:dom.window,alerts,writes};
}
const tick=()=>new Promise(r=>setTimeout(r,10));
test('review mode avoids copy wording and subject guidance remains available before final HTML copy',async()=>{
 const {dom,w,writes}=await fixture();try{
  w.document.getElementById('s-subject').value='Officer update';w.document.getElementById('s-preheader').value='Upcoming meetings';
  w.showReadinessChecklist(false);assert.equal(w.document.getElementById('checklist-title').textContent,'Newsletter Readiness');assert.equal(w.document.getElementById('checklist-back').textContent,'Back to editing');assert.equal(w.document.getElementById('checklist-copy-guidance').hidden,true);
  w.showReadinessChecklist(true);assert.equal(w.document.getElementById('checklist-copy-guidance').hidden,false);assert.equal(w.document.getElementById('checklist-subject-value').value,'Officer update');
  w.copySubject();await tick();assert.equal(writes.at(-1),'Officer update');
  w.copyPreheader();await tick();assert.equal(writes.at(-1),'Upcoming meetings');
  w.doCopy(false);await tick();assert.match(writes.at(-1),/<!doctype html>/i);assert.match(writes.at(-1),/Upcoming meetings/);
 }finally{dom.window.close();}
});
test('failed subject copying reports failure and failed saving prevents leaving after HTML copy',async()=>{
 const {dom,w,alerts,writes}=await fixture();try{
  w.showReadinessChecklist(true);w.navigator.clipboard.writeText=async()=>{throw Error('blocked');};w.document.execCommand=()=>false;
  w.copySubject();await tick();assert.match(w.document.getElementById('checklist-copy-status').textContent,/Could not copy/);
  w.navigator.clipboard.writeText=async text=>writes.push(text);w.flushDraftSave=()=>false;w.doCopy(true);await tick();assert.match(writes.at(-1),/<!doctype html>/i);assert.match(alerts.at(-1),/stayed open/);assert.equal(w.location.hostname,'isolated.invalid');
 }finally{dom.window.close();}
});
