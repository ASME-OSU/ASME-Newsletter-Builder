import assert from 'node:assert/strict';
import test from 'node:test';
import {JSDOM} from 'jsdom';
import {loadBuilderHTML} from './helpers/load-builder.mjs';
async function setup(){
 const dom=new JSDOM(loadBuilderHTML(),{url:'https://isolated.invalid/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};w.alert=()=>{};w.confirm=()=>true;
  w.fetch=async()=>({ok:true,json:async()=>({events:[1,2,3].map(n=>({id:'event-'+n,title:'Workshop '+n,start:'2099-09-1'+n+'T22:00:00Z',location:'Scott Lab'}))})});
 }});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));await new Promise(r=>setTimeout(r,10));return dom.window;
}
test('Select all has checked and mixed states and only selects unimported events shown',async()=>{
 const w=await setup(),d=w.document;try{
  w.importCalendarEvent(0);w.switchTabByName('calendar');
  const all=d.getElementById('calendar-select-all');assert.equal(all.type,'checkbox');assert.equal(all.checked,false);
  w.selectCalendarEvent(1,true);assert.equal(all.indeterminate,true);assert.equal(all.checked,false);
  all.click();assert.equal(all.indeterminate,false);assert.equal(all.checked,true);assert.equal(w.calendarSelected.size,2);
  all.click();assert.equal(all.checked,false);assert.equal(w.calendarSelected.size,0);
  d.getElementById('calendar-search').value='Workshop 3';w.applyCalendarPreview(false);all.click();
  assert.deepEqual(Array.from(w.calendarSelected),['event-3']);assert.equal(d.getElementById('calendar-import-selected').textContent,'Import selected (1)');
  assert.equal(d.getElementById('calendar-clear-selection').hidden,false);
 }finally{w.close();}
});
test('clear active filters resets search, dates and academic year without changing the draft',async()=>{
 const w=await setup(),d=w.document;try{
  w.flushDraftSave();const state=JSON.stringify(w.collectState());
  d.getElementById('calendar-preview-year').value='2099';d.getElementById('calendar-from').value='2099-09-12';d.getElementById('calendar-search').value='Workshop 2';w.applyCalendarPreview();
  assert.equal(w.calendarEvents.length,1);assert.equal(d.getElementById('calendar-filter-reset').hidden,false);
  w.clearCalendarFilters();assert.equal(w.calendarPreviewYear,'');assert.equal(w.calendarEvents.length,3);
  assert.equal(d.getElementById('calendar-filter-reset').hidden,true);assert.equal(d.getElementById('calendar-from').value,'');
  assert.equal(JSON.stringify(w.collectState()),state);assert.equal(w.draftSavePending,false);
 }finally{w.close();}
});
test('guide shortcuts open the relevant editor and phone dark toggle stays in sync without saving',async()=>{
 const w=await setup(),d=w.document;try{
  w.flushDraftSave();const state=JSON.stringify(w.collectState());
  w.openInfoDialog();await new Promise(r=>setTimeout(r,5));
  assert.ok(d.querySelector('#info-modal img[src*="guide-workflow.svg"]'));
  Array.from(d.querySelectorAll('#info-modal .guide-shortcuts button')).find(b=>b.textContent.includes('Browse Calendar')).click();
  assert.equal(d.getElementById('info-modal').classList.contains('open'),false);assert.equal(d.getElementById('tab-calendar').classList.contains('active'),true);assert.equal(d.activeElement.id,'calendar-search');
  d.getElementById('preview-dark-mobile').click();assert.equal(d.getElementById('preview-dark-btn').getAttribute('aria-pressed'),'true');
  d.getElementById('preview-dark-btn').click();assert.equal(d.getElementById('preview-dark-mobile').getAttribute('aria-pressed'),'false');
  assert.equal(JSON.stringify(w.collectState()),state);assert.equal(w.draftSavePending,false);
 }finally{w.close();}
});
