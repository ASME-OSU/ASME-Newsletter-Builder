import assert from 'node:assert/strict';
import test from 'node:test';
import {JSDOM} from 'jsdom';
import {loadBuilderHTML} from './helpers/load-builder.mjs';
async function setup(compact=false){
 const dom=new JSDOM(loadBuilderHTML(),{url:'https://isolated.invalid/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=()=>({matches:compact,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};
  w.confirm=()=>true;w.alert=()=>{};w.fetch=async()=>({ok:true,json:async()=>({events:[
   {id:'first',title:'Design workshop',start:'2099-11-01T23:00:00Z',location:'Scott Lab',description:'Practice CAD'},
   {id:'second',title:'Company visit',start:'2099-11-10T23:00:00Z',location:'Factory',description:'Meet engineers'}
  ]})});
 }});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));await new Promise(r=>setTimeout(r,10));return dom.window;
}

test('section toggles disable editing without erasing copy and re-enable retained controls',async()=>{
 const w=await setup(),d=w.document;try{
  for(const [section,field] of [['featured','feat-title'],['announce','ann-quote'],['links','ql1-title']]){
   const before=d.getElementById(field).value;
   w.toggleSection(section);
   assert.equal(d.getElementById(field).matches(':disabled'),true);
   assert.equal(d.getElementById(section+'-disabled-note').hidden,false);
   assert.equal(d.getElementById(field).value,before);
   w.toggleSection(section);assert.equal(d.getElementById(field).matches(':disabled'),false);assert.equal(d.getElementById(field).value,before);
  }
  const link=d.getElementById('feat-btn-url').value;w.toggleFeatButton();assert.equal(d.getElementById('featured-button-fields').hidden,true);
  w.toggleFeatButton();assert.equal(d.getElementById('featured-button-fields').hidden,false);assert.equal(d.getElementById('feat-btn-url').value,link);
 }finally{w.close();}
});

test('preview rail keeps device selection and dark simulation independent of draft saving',async()=>{
 const w=await setup(),d=w.document;try{
  const rail=d.getElementById('preview-controls');assert.equal(rail.parentElement.id,'preview-panel');
  assert.equal(d.querySelector('.preview-content').parentElement,rail.parentElement);
  w.flushDraftSave();const state=JSON.stringify(w.collectState()),saved=w.localStorage.getItem('asme_nl_draft');
  d.getElementById('preview-mobile-btn').click();assert.equal(d.getElementById('preview-mobile-btn').getAttribute('aria-pressed'),'true');
  d.getElementById('preview-dark-btn').click();assert.equal(d.getElementById('preview-dark-btn').getAttribute('aria-pressed'),'true');
  assert.equal(d.getElementById('preview-mobile-btn').getAttribute('aria-pressed'),'true');
  d.getElementById('preview-desktop-btn').click();assert.equal(d.getElementById('preview-mobile-btn').getAttribute('aria-pressed'),'false');
  assert.equal(d.getElementById('preview-dark-btn').getAttribute('aria-pressed'),'true');
  assert.equal(JSON.stringify(w.collectState()),state);assert.equal(w.localStorage.getItem('asme_nl_draft'),saved);assert.equal(w.draftSavePending,false);
  assert.equal(d.querySelector('.sidebar-width-label'),null);
 }finally{w.close();}
});

test('calendar search filters title and location, and clear filters restores events without changing the draft',async()=>{
 const w=await setup(),d=w.document;try{
  w.flushDraftSave();const state=JSON.stringify(w.collectState());
  const search=d.getElementById('calendar-search');search.value='factory';search.dispatchEvent(new w.Event('input',{bubbles:true}));
  assert.equal(w.calendarEvents.length,1);assert.equal(w.calendarEvents[0].title,'Company visit');
  search.value='design';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(w.calendarEvents[0].id,'first');
  search.value='not found';search.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(w.calendarEvents.length,0);
  w.clearCalendarFilters();assert.equal(search.value,'');assert.equal(w.calendarEvents.length,2);
  assert.equal(JSON.stringify(w.collectState()),state);assert.equal(w.draftSavePending,false);
 }finally{w.close();}
});

test('event expansion can collapse again without modifying newsletter content',async()=>{
 const w=await setup(),d=w.document;try{
  w.flushDraftSave();const state=JSON.stringify(w.collectState());w.expandAllEvents();
  assert.equal(d.getElementById('expand-events').textContent,'Collapse all');
  w.expandAllEvents();assert.equal(d.getElementById('expand-events').textContent,'Expand all');
  assert.ok([...d.querySelectorAll('#event-list>details')].every(card=>!card.open));
  assert.equal(JSON.stringify(w.collectState()),state);assert.equal(w.draftSavePending,false);
 }finally{w.close();}
});

test('optional announcement attribution is omitted cleanly in the preview and exported email',async()=>{
 const w=await setup(),d=w.document;try{
  d.getElementById('ann-author').value='';w.documentChanged();
  assert.equal(d.querySelector('.pv-ann-author'),null);
  assert.doesNotMatch(w.generateHTML(),/— <strong[^>]*><\/strong>/);
  d.getElementById('ann-author').value='Chapter board';w.documentChanged();
  assert.match(d.querySelector('.pv-ann-author').textContent,/Chapter board/);assert.match(w.generateHTML(),/Chapter board/);
 }finally{w.close();}
});


test('inbox shortcuts reach the correct editable field from phone preview without changing the draft',async()=>{
 const w=await setup(true),d=w.document;try{
  const before=JSON.stringify(w.collectState());
  for(const [button,field] of [['inbox-subject','s-subject'],['inbox-preheader','s-preheader']]){
   w.setWorkspaceView('preview');d.getElementById(button).click();
   assert.equal(w.workspaceView,'edit');
   assert.equal(d.getElementById('tab-settings').classList.contains('active'),true);
   assert.equal(d.activeElement.id,field);
   assert.equal(d.getElementById('editor').inert,false);
  }
  assert.equal(JSON.stringify(w.collectState()),before);
 }finally{w.close();}
});
test('inbox shortcuts leave full preview before focusing Settings',async()=>{
 const w=await setup(),d=w.document;try{
  w.toggleFullscreen();assert.equal(w.isFullscreen,true);
  d.getElementById('inbox-subject').click();
  assert.equal(w.isFullscreen,false);assert.equal(d.activeElement.id,'s-subject');
  d.getElementById('s-subject').value='September issue';w.render();
  assert.equal(d.getElementById('inbox-subject').textContent,'September issue');
 }finally{w.close();}
});
