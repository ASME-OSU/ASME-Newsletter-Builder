import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { JSDOM } from 'jsdom';
const core = fs.readFileSync(new URL('../newsletter-core.js', import.meta.url),'utf8');
const html = fs.readFileSync(new URL('../index.html', import.meta.url),'utf8').replace('<script src="newsletter-core.js"></script>',`<script>${core}</script>`);
async function fixture(){
  const dom=new JSDOM(html,{url:'https://isolated.invalid/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
    w.matchMedia=()=>({matches:false,addEventListener(){}});
    w.fetch=async()=>({ok:true,json:async()=>({events:[]})});
    w.alert=()=>{};w.confirm=()=>true;
  }});
  await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
  await new Promise(resolve=>setTimeout(resolve,10));
  return dom;
}
test('autosave exposes pending and persistent failures, offers export, and recovers on a successful retry',async()=>{
  const {window:w}=await fixture();
  try{
    const original=w.Storage.prototype.setItem;
    w.Storage.prototype.setItem=function(key,value){if(key==='asme_nl_draft')throw new w.DOMException('Full','QuotaExceededError');return original.call(this,key,value);};
    w.document.getElementById('s-subject').value='Latest unsaved subject';w.autoSave();
    assert.equal(w.document.getElementById('save-indicator').dataset.status,'pending');
    assert.equal(w.flushDraftSave(),false);
    assert.equal(w.document.getElementById('save-indicator').dataset.status,'error');
    assert.equal(w.document.getElementById('storage-warning').hidden,false);
    w.autoSave();
    assert.equal(w.document.getElementById('save-indicator').dataset.status,'error');
    let exported;w.downloadJson=data=>{exported=data;};
    w.document.querySelector('#storage-warning button').click();
    assert.equal(exported.state.fields['s-subject'],'Latest unsaved subject');
    w.Storage.prototype.setItem=original;
    assert.equal(w.flushDraftSave(),true);
    assert.equal(w.document.getElementById('save-indicator').dataset.status,'saved');
    assert.equal(w.document.getElementById('storage-warning').hidden,true);
    assert.equal(JSON.parse(w.localStorage.getItem('asme_nl_draft')).fields['s-subject'],'Latest unsaved subject');
  }finally{w.close();}
});
test('page lifecycle and navigation flush an edit before the debounce elapses',async()=>{
  const {window:w}=await fixture();
  try{
    for(const kind of ['pagehide','beforeunload','navigation','visibilitychange']){
      w.document.getElementById('s-subject').value=kind;w.autoSave();
      if(kind==='navigation')w.document.getElementById('brevo-shortcut').dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));
      else if(kind==='visibilitychange'){
        Object.defineProperty(w.document,'visibilityState',{value:'hidden',configurable:true});
        w.document.dispatchEvent(new w.Event(kind));
      }else w.dispatchEvent(new w.Event(kind));
      assert.equal(JSON.parse(w.localStorage.getItem('asme_nl_draft')).fields['s-subject'],kind);
    }
  }finally{w.close();}
});
test('backup failures return false and never claim a recovery snapshot exists',async()=>{
  const {window:w}=await fixture();
  try{
    const original=w.Storage.prototype.setItem;
    w.Storage.prototype.setItem=()=>{throw new w.DOMException('Blocked','SecurityError');};
    assert.equal(w.backupCurrentDraft('Before import'),false);
    assert.equal(w.document.getElementById('storage-warning').hidden,false);
    assert.match(w.document.getElementById('storage-warning-message').textContent,/snapshot could not be saved/);
    assert.equal(w.localStorage.getItem('asme_nl_previous_draft'),null);
    w.Storage.prototype.setItem=original;
    assert.equal(w.backupCurrentDraft('Before import'),true);
  }finally{w.close();}
});
test('duplicate and missing imported IDs remain independently editable and removable',async()=>{
  const {window:w}=await fixture();
  try{
    w.applyState({events:[{id:100,title:'First'},{id:100,title:'Second'},{title:'Third'},{id:102,title:'Fourth'}],fields:{}});
    const ids=w.events.map(e=>e.id);
    assert.equal(new Set(ids).size,4);
    w.updateEvent(ids[1],'title','Only second changes');
    assert.equal(w.events[0].title,'First');assert.equal(w.events[1].title,'Only second changes');
    w.removeEvent(ids[1]);
    assert.equal(w.events.length,3);assert.equal(w.events[0].title,'First');
  }finally{w.close();}
});
test('a successful previous snapshot remains recoverable when revision history runs out of storage',async()=>{
  const {window:w}=await fixture();
  try{
    const original=w.Storage.prototype.setItem;
    w.Storage.prototype.setItem=function(key,value){if(key==='asme_nl_revisions')throw new w.DOMException('Full','QuotaExceededError');return original.call(this,key,value);};
    w.document.getElementById('s-subject').value='Recover this draft';
    assert.equal(w.backupCurrentDraft('Before import'),true);
    assert.equal(JSON.parse(w.localStorage.getItem('asme_nl_previous_draft')).state.fields['s-subject'],'Recover this draft');
    assert.match(w.document.getElementById('storage-warning-message').textContent,/snapshot was saved, but revision history/);
  }finally{w.close();}
});
test('repeated allocations skip sparse restored IDs after the safe-integer fallback',async()=>{
  const {window:w}=await fixture();
  try{
    w.applyState({events:[{id:100,title:'First'},{id:101,title:'Second'},{id:103,title:'Reserved gap edge'},{id:Number.MAX_SAFE_INTEGER-1,title:'Large ID'}],fields:{}});
    w.addEvent();
    const first=w.events.at(-1).id;
    assert.equal(first,102);
    assert.equal(w.document.activeElement.id,`event-${first}-title`);
    w.addEvent();
    assert.equal(w.events.at(-1).id,104);
    assert.equal(new Set(w.events.map(event=>event.id)).size,w.events.length);
    w.duplicateEvent(first);
    assert.equal(new Set(w.events.map(event=>event.id)).size,w.events.length);
    assert.ok(w.events.every(event=>Number.isSafeInteger(event.id)));
  }finally{w.close();}
});
test('calendar imports expand the new card and focus its title',async()=>{
  const {window:w}=await fixture();
  try{
    w.calendarEvents=[{id:'standalone',title:'Imported focused event',start:'2099-09-01T22:00:00.000Z',url:'https://example.com/event'}];
    w.importCalendarEvent(0);
    const imported=w.events.find(event=>event.sourceEventId==='standalone');
    assert.equal(w.eventExpansion[imported.id],true);
    assert.equal(w.document.activeElement.id,`event-${imported.id}-title`);
    assert.equal(w.document.querySelector('.tab-btn[aria-selected="true"]').getAttribute('aria-controls'),'tab-events');
  }finally{w.close();}
});
