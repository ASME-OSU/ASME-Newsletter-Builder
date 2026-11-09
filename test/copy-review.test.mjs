import { loadBuilderHTML } from './helpers/load-builder.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import {JSDOM} from 'jsdom';
const html=loadBuilderHTML();
async function fixture(){
 const alerts=[],writes=[];
 const dom=new JSDOM(html,{url:'https://isolated.invalid/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.alert=m=>alerts.push(m);w.confirm=()=>true;w.fetch=async()=>({ok:true,json:async()=>({events:[],timeZone:'America/New_York'})});Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async text=>{writes.push(text);}}});}});
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
test('clipboard failures stay in the dialog and successful HTML copying never navigates',async()=>{
 const {dom,w,alerts,writes}=await fixture();try{
  w.showReadinessChecklist(true);w.navigator.clipboard.writeText=async()=>{throw Error('blocked');};w.document.execCommand=()=>false;
  w.copySubject();await tick();assert.match(w.document.getElementById('checklist-copy-status').textContent,/Could not copy/);
  w.doCopy();await tick();assert.match(w.document.getElementById('checklist-copy-status').textContent,/could not be copied/);assert.equal(w.document.getElementById('checklist-primary').disabled,false);
  w.navigator.clipboard.writeText=async text=>writes.push(text);w.doCopy();await tick();assert.match(writes.at(-1),/<!doctype html>/i);assert.equal(alerts.length,0);assert.equal(w.location.hostname,'isolated.invalid');assert.equal(w.document.getElementById('checklist-modal').classList.contains('open'),true);
 }finally{dom.window.close();}
});

test('warnings precede collapsed passed checks and Fix still targets the original field',async()=>{
 const {dom,w}=await fixture();try{
  w.showReadinessChecklist(true);
  const d=w.document,list=d.getElementById('checklist-items'),passed=list.querySelector('.passed-checks');
  assert.equal(passed.open,false);assert.match(passed.querySelector('summary').textContent,/checks passed/);
  assert.equal(list.lastElementChild,passed);
  assert.ok(list.firstElementChild.querySelector('button'));
  const checks=w.getReadinessChecks(),first=checks.findIndex(c=>!c.ok);
  assert.equal(list.firstElementChild.querySelector('button').getAttribute('onclick'),'fixReadiness('+first+')');
  list.firstElementChild.querySelector('button').click();
  assert.equal(d.activeElement.id,checks[first].field);await tick();
 }finally{w.close();}
});
test('copy confirmation persists and copying metadata afterward clearly replaces the HTML',async()=>{
 const {dom,w,writes}=await fixture();try{
  const d=w.document;d.getElementById('s-subject').value='Member update';d.getElementById('s-preheader').value='This week';
  w.showReadinessChecklist(true);w.proceedCopy();await tick();
  const status=d.getElementById('checklist-copy-status');
  assert.equal(status.hidden,false);assert.match(status.textContent,/HTML copied/);
  assert.match(status.textContent,/has not been sent/);
  w.copyPreheader();await tick();assert.equal(writes.at(-1),'This week');assert.match(status.textContent,/not HTML/);
  w.proceedCopy();await tick();assert.match(writes.at(-1),/<!doctype html>/i);assert.match(status.textContent,/HTML copied/);
 }finally{w.close();}
});
