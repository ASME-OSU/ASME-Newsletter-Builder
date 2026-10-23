import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
const core=fs.readFileSync(new URL('../newsletter-core.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').replace('<script src="newsletter-core.js"></script>',`<script>${core}</script>`);
async function setup(){
 const dom=new JSDOM(html,{url:'https://isolated.invalid/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){}});w.fetch=async()=>({ok:true,json:async()=>({events:[]})});w.alert=()=>{};w.confirm=()=>true;}});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));await new Promise(resolve=>dom.window.setTimeout(resolve,10));return dom;
}
const tick=w=>new Promise(resolve=>w.setTimeout(resolve,5));
test('event fields have names and stable focus survives edits, toggles, sorting and removal',async()=>{
 const dom=await setup();const w=dom.window,d=w.document;
 try{
  w.events=[{...w.events[0],id:101,title:'First',date:'MAY 30'},{...w.events[0],id:102,title:'Second',date:'MAY 20'}];w.renderEventList();
  for(const input of d.querySelectorAll('#event-list input,#event-list textarea'))assert.ok(input.labels.length,input.outerHTML);
  for(const input of d.querySelectorAll('.tab-panel .field > input,.tab-panel .field > textarea,.tab-panel .field > select'))assert.ok(input.labels.length,input.id);
  let title=d.getElementById('event-101-title');title.focus();title.value='Updated';title.dispatchEvent(new w.Event('input',{bubbles:true}));title.dispatchEvent(new w.Event('change',{bubbles:true}));
  d.getElementById('event-101-location').focus();await tick(w);assert.equal(d.activeElement.id,'event-101-location');
  d.dispatchEvent(new w.Event('pointerdown',{bubbles:true}));
  const oldTitle=d.getElementById('event-101-title');w.sortAfterEventEdit(false);await tick(w);assert.equal(d.getElementById('event-101-title'),oldTitle,'pointer activation keeps original click target until release');
  d.dispatchEvent(new w.Event('pointerup',{bubbles:true}));await tick(w);
  const img=d.querySelector('[data-event-id="101"] [onclick="toggleEventImg(101)"]');img.focus();img.click();assert.equal(d.activeElement.id,img.id);assert.match(d.activeElement.getAttribute('aria-label'),/image.*Updated/);
  const url=d.getElementById('event-101-imgUrl');url.focus();url.setSelectionRange(0,0);w.sortEventsChronologically(false);assert.equal(d.activeElement.id,url.id);assert.equal(d.querySelector('[data-event-id="101"]').open,true);
  w.removeEvent(101);assert.equal(d.activeElement.id,'event-102-summary');w.removeEvent(102);assert.equal(d.activeElement.getAttribute('onclick'),'addEvent()');
  w.addEvent();assert.match(d.activeElement.id,/event-\d+-title/);assert.equal(d.activeElement.closest('details').open,true);
 }finally{w.close();}
});
test('section tabs use roving keyboard navigation and JSON imports are real buttons',async()=>{
 const dom=await setup();const w=dom.window,d=w.document;
 try{
  const tabs=[...d.querySelectorAll('.tab-btn')];assert.equal(tabs.filter(t=>t.tabIndex===0).length,1);
  tabs[0].focus();tabs[0].dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(d.activeElement,tabs[1]);assert.equal(tabs[1].getAttribute('aria-selected'),'true');
  tabs[1].dispatchEvent(new w.KeyboardEvent('keydown',{key:'End',bubbles:true}));assert.equal(d.activeElement,tabs.at(-1));
  for(const tab of tabs)assert.equal(d.getElementById(tab.getAttribute('aria-controls')).getAttribute('aria-labelledby'),tab.id);
  for(const name of ['templates','draft']){const input=d.getElementById(`import-${name}-file`);const button=d.querySelector(`button[onclick*="import-${name}-file"]`);let activated=false;input.click=()=>{activated=true;};button.focus();button.click();assert.equal(activated,true);assert.equal(button.tabIndex,0);}
 }finally{w.close();}
});
test('event expansion survives rerenders and summaries retain collapsed event context',async()=>{
 const dom=await setup();const w=dom.window,d=w.document;
 try{
  w.events=[{...w.events[0],id:101,title:'First',date:'MAY 30'},{...w.events[0],id:102,title:'Second',date:'MAY 20'}];w.renderEventList();
  assert.equal(d.querySelector('[data-event-id="102"]').open,false);
  assert.match(d.getElementById('event-102-summary').textContent,/Second.*MAY 20.*Manual event/);
  w.expandAllEvents();w.renderEventList();assert.equal([...d.querySelectorAll('#event-list details')].every(card=>card.open),true);
  d.querySelector('[data-event-id="101"]').open=false;w.renderEventList();assert.equal(d.querySelector('[data-event-id="101"]').open,false);
 }finally{w.close();}
});
