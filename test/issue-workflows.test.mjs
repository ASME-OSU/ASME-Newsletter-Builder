import assert from 'node:assert/strict';
import test from 'node:test';
import {JSDOM} from 'jsdom';
import {loadBuilderHTML} from './helpers/load-builder.mjs';
async function setup(){
 const writes=[];
 const dom=new JSDOM(loadBuilderHTML(),{url:'https://isolated.invalid/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
  w.matchMedia=()=>({matches:false,addEventListener(){}});w.HTMLElement.prototype.scrollIntoView=function(){};
  w.fetch=async()=>({ok:true,json:async()=>({events:[]})});w.confirm=()=>true;w.alert=()=>{};
  Object.defineProperty(w.navigator,'clipboard',{configurable:true,value:{writeText:async text=>writes.push(text)}});
 }});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));await tick();return{w:dom.window,d:dom.window.document,writes};
}
const tick=()=>new Promise(r=>setTimeout(r,20));
function event(id,date,end){return{id,title:'Event '+id,date:date||'TBD',dateISO:date||'',endDateISO:end||'',time:'6 PM',location:'Scott Lab',description:'Officer copy',showLink:true,linkUrl:'https://example.com/'+id};}

test('planning is optional and uses event end dates and overlap rather than string date guesses',async()=>{
 const {w}=await setup();try{
  const W=w.NewsletterWorkflows,state={events:[event(1,'2026-12-30','2027-01-03'),event(2,'2026-12-29'),event(3,'2027-02-01'),event(4,'')],fields:{}};
  assert.equal(W.planningChecks(state).length,0);
  state.fields={'s-send-date':'2027-01-01','s-issue-from':'2027-01-01','s-issue-through':'2027-01-14'};
  const checks=W.planningChecks(state);
  assert.equal(checks.some(c=>c.eventId===1),false,'ongoing event is retained and in range');
  assert.match(checks.find(c=>c.eventId===2).label,/ends before/);
  assert.match(checks.find(c=>c.eventId===3).label,/outside/);
  assert.equal(checks.find(c=>c.eventId===4).field,'event-4-dateISO');
  state.fields['s-issue-through']='2026-12-01';assert.match(W.planningChecks(state)[0].label,/out of order/);
 }finally{w.close();}
});

test('next issue retains ongoing, future and undated events while preserving reusable content and the source',async()=>{
 const {w}=await setup();try{
  const state=w.collectState();state.events=[event(1,'2026-12-30','2027-01-03'),event(2,'2026-12-29'),event(3,'2027-02-01'),event(4,'')];
  Object.assign(state.fields,{'s-subject':'Old subject','s-preheader':'Old preview','feat-title':'Old highlight','ann-quote':'Reusable announcement'});state.featuredPractice=true;
  const original=JSON.stringify(state),next=w.NewsletterWorkflows.nextIssue(state,{send:'2027-01-01',from:'2027-01-01',through:'2027-01-14'});
  assert.deepEqual(Array.from(next.events,e=>e.id),[1,3,4]);assert.equal(next.fields['s-subject'],'');assert.equal(next.fields['feat-title'],'');
  assert.equal(next.showFeatured,false);assert.equal(next.featuredPractice,false);assert.equal(next.showAnnounce,false);assert.equal(next.fields['ann-quote'],'Reusable announcement');
  assert.equal(next.fields['ql1-url'],state.fields['ql1-url']);assert.equal(next.fields['s-logo'],state.fields['s-logo']);assert.equal(next.activeTheme,state.activeTheme);
  assert.match(next.fields['issue-bar-text'],/January 2027/);assert.equal(JSON.stringify(state),original);
  assert.throws(()=>w.NewsletterWorkflows.nextIssue(state,{send:'bad'}),/send date/);
 }finally{w.close();}
});

test('calendar all-day exclusive end dates and issue dates survive editable draft handoff',async()=>{
 const {w}=await setup();try{
  const e=w.Core.calendarEventToNewsletter({id:'trip',title:'Trip',start:'2026-12-30T00:00:00Z',end:'2027-01-04T00:00:00Z',allDay:true},100,'America/New_York');
  assert.equal(e.endDateISO,'2027-01-03');
  const state=w.collectState();state.events=[e];state.fields['s-send-date']='2027-01-01';state.fields['s-issue-through']='2027-01-14';
  const round=w.Core.readDraftDocument(JSON.stringify(w.Core.createDraftDocument(state)));
  assert.equal(round.events[0].endDateISO,'2027-01-03');assert.equal(round.fields['s-send-date'],'2027-01-01');
  assert.equal(w.Core.detachCalendarSource(round.events[0]).endDateISO,'2027-01-03');
  w.applyState(round);w.updateEvent(100,'dateISO','2027-02-01');assert.equal(w.events[0].endDateISO,'');
 }finally{w.close();}
});

test('loading an older draft clears optional planning dates rather than leaking the current issue dates',async()=>{
 const {w,d}=await setup();try{
  d.getElementById('s-send-date').value='2027-01-01';d.getElementById('feat-dateISO').value='2027-01-02';
  w.applyState({events:[],fields:{'s-subject':'Legacy issue'}});
  assert.equal(d.getElementById('s-send-date').value,'');assert.equal(d.getElementById('feat-dateISO').value,'');
 }finally{w.close();}
});

test('successful HTML copy freshness detects content edits and failed copies cannot overwrite the last success',async()=>{
 const {w,d,writes}=await setup();try{
  w.showReadinessChecklist(true);w.doCopy();await tick();
  const record=w.localStorage.getItem('asme_nl_html_copy');assert.ok(record);assert.match(d.getElementById('html-copy-freshness').textContent,/unchanged/);
  w.updateEvent(w.events[0].id,'title','Changed after copy');
  assert.match(d.getElementById('html-copy-freshness').textContent,/Edited since/);assert.equal(d.getElementById('checklist-primary').textContent,'Copy updated HTML');
  w.navigator.clipboard.writeText=async()=>{throw Error('blocked');};d.execCommand=()=>false;w.doCopy();await tick();
  assert.equal(w.localStorage.getItem('asme_nl_html_copy'),record);assert.match(d.getElementById('checklist-copy-status').textContent,/could not be copied/);
  w.navigator.clipboard.writeText=async text=>writes.push(text);w.doCopy();await tick();assert.match(writes.at(-1),/Changed after copy/);assert.match(d.getElementById('html-copy-freshness').textContent,/unchanged/);
  const copied=w.localStorage.getItem('asme_nl_html_copy');d.getElementById('s-preheader').value='New inbox text';w.copyPreheader();await tick();assert.equal(w.localStorage.getItem('asme_nl_html_copy'),copied);
 }finally{w.close();}
});

test('next issue requires a recovery copy and one Undo restores the full prior issue',async()=>{
 const {w,d}=await setup();try{
  w.events=[event(101,'2026-01-01'),event(102,'2099-01-01')].map(e=>w.Core.normalizeEvent(e,e.id));w.render();const before=JSON.stringify(w.collectState());
  w.openNextIssue();d.getElementById('next-send').value='2027-01-01';d.getElementById('next-from').value='2027-01-01';d.getElementById('next-through').value='2027-01-14';w.previewNextIssue();
  assert.match(d.getElementById('next-issue-summary').textContent,/1 dated event/);
  const backup=w.backupCurrentDraft;w.backupCurrentDraft=()=>false;w.startNextIssue();assert.equal(JSON.stringify(w.collectState()),before);assert.match(d.getElementById('next-issue-summary').textContent,/Could not save/);
  w.backupCurrentDraft=backup;w.startNextIssue();assert.deepEqual(Array.from(w.events,e=>e.id),[102]);assert.equal(d.activeElement.id,'s-subject');
  w.undoDraftChange();assert.equal(JSON.stringify(w.collectState()),before);
 }finally{w.close();}
});

test('use saved issue dates filters Calendar without changing stored dates or event content',async()=>{
 const {w,d}=await setup();try{
  d.getElementById('s-issue-from').value='2099-01-01';d.getElementById('s-issue-through').value='2099-01-14';const before=JSON.stringify(w.collectState());
  w.setCalendarFeed({events:[{id:'a',title:'Inside',start:'2099-01-10T12:00:00Z'},{id:'b',title:'Outside',start:'2099-02-01T12:00:00Z'}]});
  w.useIssueDatesInCalendar();assert.deepEqual(Array.from(w.calendarEvents,e=>e.id),['a']);assert.equal(JSON.stringify(w.collectState()),before);
  w.clearCalendarFilters();assert.equal(w.calendarEvents.length,2);assert.equal(d.getElementById('s-issue-from').value,'2099-01-01');
 }finally{w.close();}
});

test('sharing-page image hints are specific, conditional and routed through readiness Fix',async()=>{
 const {w,d}=await setup();try{
  const hint=w.NewsletterWorkflows.imageHint;
  assert.match(hint('https://drive.google.com/file/d/example/view'),/sharing page/);assert.match(hint('https://www.dropbox.com/s/example/photo.png?dl=0'),/sharing page/);
  assert.equal(hint('https://example.com/photo.png'),'');assert.equal(hint('https://drive.google.com.evil.test/photo.png'),'');assert.equal(hint('https://www.dropbox.com/s/example/photo.png?raw=1'),'');
  const e=w.events[0];w.updateEvent(e.id,'imgUrl','https://drive.google.com/file/d/example/view');w.toggleEventImg(e.id);
  const note=d.querySelector('[data-image-hint="event-'+e.id+'-imgUrl"]');assert.equal(note.hidden,false);assert.match(note.textContent,/sharing page/);
  const check=w.getReadinessChecks().find(c=>c.label.includes('sharing-page'));assert.equal(check.field,'event-'+e.id+'-imgUrl');
  const input=d.getElementById('event-'+e.id+'-imgUrl');input.value='https://example.com/direct.png';input.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(note.hidden,true);
 }finally{w.close();}
});

test('chat digest respects enabled content, marks practice and omits unsafe links',async()=>{
 const {w}=await setup();try{
  const state=w.collectState();state.events=[{...event(1,'2027-01-01'),practice:true,linkUrl:'javascript:alert(1)'}];state.showFeatured=false;state.showAnnounce=false;state.showLinks=false;
  const text=w.NewsletterWorkflows.digest(state);assert.match(text,/PRACTICE CONTENT/);assert.match(text,/Event 1/);assert.doesNotMatch(text,/javascript:|From the Board|Join Now/);
  state.showFeatured=true;state.fields['feat-title']='Event 1';state.fields['feat-dateISO']='2027-01-01';state.fields['feat-date']='JAN 1';
  assert.equal((w.NewsletterWorkflows.digest(state).match(/Event 1/g)||[]).length,1);
 }finally{w.close();}
});

test('digest modal copies reviewed text only, reports failure, and Escape closes the correct dialog',async()=>{
 const {w,d,writes}=await setup();try{
  w.openChatDigest();d.getElementById('chat-digest-text').value='Reviewed message';w.copyChatDigest();await tick();assert.equal(writes.at(-1),'Reviewed message');assert.match(d.getElementById('chat-digest-status').textContent,/nothing was sent/);
  w.navigator.clipboard.writeText=async()=>{throw Error('blocked');};d.execCommand=()=>false;w.copyChatDigest();await tick();assert.match(d.getElementById('chat-digest-status').textContent,/Could not copy/);
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(d.getElementById('chat-digest-modal').classList.contains('open'),false);
  w.openNextIssue();d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(d.getElementById('next-issue-modal').classList.contains('open'),false);
 }finally{w.close();}
});


test('HTML-copy tracking survives reopening and identifies edits made while copying',async()=>{
 const {w,d}=await setup();try{
  w.showReadinessChecklist(true);w.doCopy();await tick();
  w.htmlCopyRecord=null;w.closeChecklist();w.showReadinessChecklist(true);
  assert.match(d.getElementById('html-copy-freshness').textContent,/unchanged/);
  let finish;w.navigator.clipboard.writeText=()=>new Promise(resolve=>{finish=resolve;});
  w.doCopy();w.updateEvent(w.events[0].id,'title','Edit during copy');finish();await tick();
  assert.match(d.getElementById('checklist-copy-status').textContent,/changed while copying/);
  assert.equal(d.getElementById('checklist-primary').textContent,'Copy updated HTML');
 }finally{w.close();}
});
