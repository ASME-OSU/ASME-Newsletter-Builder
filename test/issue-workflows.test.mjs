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


test('chapter mailing address is prefilled, editable, multiline and passes the footer check',async()=>{
 const {w,d}=await setup();try{
  const address=d.getElementById('footer-addr');assert.equal(address.tagName,'TEXTAREA');assert.equal(address.value,w.Core.CHAPTER_MAILING_ADDRESS);
  assert.match(address.value,/Scott Laboratory, Office N147/);assert.match(address.value,/201 W 19th Ave/);
  assert.equal(w.getReadinessChecks().find(c=>/postal address/.test(c.label)).ok,true);
  assert.match(d.querySelector('.pv-footer-addr').innerHTML,/@ The Ohio State University<br>Scott Laboratory, Office N147/);
  address.value='ASME custom office\n123 Main St\nColumbus, OH 43210';w.render();
  const html=w.generateHTML();assert.match(html,/ASME custom office<br>123 Main St<br>Columbus, OH 43210/);
  w.saveOrganizationDefaults();w.confirmNewIssue();assert.equal(address.value,'ASME custom office\n123 Main St\nColumbus, OH 43210');
 }finally{w.close();}
});

test('only the bundled old placeholder is upgraded in drafts and saved defaults',async()=>{
 const {w,d}=await setup();try{
  const legacy='American Society of Mechanical Engineers · Columbus, OH 43210';
  w.applyState({events:[],fields:{'footer-addr':legacy}});assert.equal(d.getElementById('footer-addr').value,w.Core.CHAPTER_MAILING_ADDRESS);
  w.localStorage.setItem('asme_nl_org_defaults',JSON.stringify({'footer-addr':legacy}));w.applyOrganizationDefaults(w.getOrganizationDefaults());assert.equal(d.getElementById('footer-addr').value,w.Core.CHAPTER_MAILING_ADDRESS);
  w.applyState({events:[],fields:{'footer-addr':'Officer custom mailing address'}});assert.equal(d.getElementById('footer-addr').value,'Officer custom mailing address');
  const round=w.Core.readDraftDocument(JSON.stringify(w.Core.createDraftDocument(w.collectState())));assert.equal(round.fields['footer-addr'],'Officer custom mailing address');
  d.getElementById('footer-addr').value='<img src=x onerror=alert(1)>\n123 Main St, Columbus, OH 43210';w.render();assert.equal(d.querySelector('.pv-footer-addr img'),null);assert.match(w.generateHTML(),/&lt;img src=x onerror=alert\(1\)&gt;<br>/);
 }finally{w.close();}
});

function prepareFeed(){return{timeZone:'America/New_York',windowStart:'2098-12-01T00:00:00Z',windowEnd:'2099-03-01T00:00:00Z',events:[
 {id:'prepare-a',title:'ASME Design Workshop',start:'2099-01-03T23:00:00Z',end:'2099-01-04T00:00:00Z',location:'Scott Lab',description:'Calendar description',url:'https://example.com/a'},
 {id:'prepare-b',title:'ASME Industry Night',start:'2099-01-12T23:00:00Z',end:'2099-01-13T00:00:00Z',location:'Scott Lab',description:'Calendar copy',url:'https://example.com/b'},
 {id:'prepare-c',title:'Later event',start:'2099-01-15T23:00:00Z',end:'2099-01-16T00:00:00Z'}]};}
async function openPrepare(w,d){await w.openPrepareIssue();d.getElementById('prepare-start').value='2099-01-01';w.refreshPrepareIssue();}

test('prefill windows include exactly fourteen chapter dates and overlapping multi-day events',async()=>{
 const {w}=await setup();try{
  const W=w.NewsletterWorkflows;
  assert.equal(W.issueWindow('2026-12-25').through,'2027-01-07');
  assert.equal(W.issueWindow('2028-02-20').through,'2028-03-04');
  const sources=[
   {id:'old',title:'Outside before',start:'2026-11-09T00:30:00Z',end:'2026-11-09T01:00:00Z'},
   {id:'ongoing',title:'Ongoing',start:'2026-11-08T00:00:00Z',end:'2026-11-10T00:00:00Z',allDay:true},
   {id:'first',title:'First day',start:'2026-11-09T12:00:00Z'},
   {id:'last',title:'Last chapter day',start:'2026-11-23T03:00:00Z'},
   {id:'outside',title:'Day fifteen',start:'2026-11-23T12:00:00Z'}];
  assert.deepEqual(Array.from(W.windowEvents(sources,'2026-11-09','America/New_York'),e=>e.id),['ongoing','first','last']);
  const suggestion=W.issueSuggestions([{title:'A very long event title '.repeat(8)},{title:'Other event'}],'2026-12-25');
  assert.ok(suggestion.subject.length<=65);assert.match(suggestion.issueBar,/Dec 25, 2026–Jan 7, 2027/);
  assert.equal(W.issueSuggestions([{title:'Veterans Day observed - no classes, offices closed'},{title:'ASME Friendsgiving'}],'2026-11-09').subject,'ASME OSU: Friendsgiving + 1 more');
 }finally{w.close();}
});

test('prepare issue uses the full snapshot, preserves authored imports, fills metadata, and undoes once',async()=>{
 const {w,d}=await setup();try{
  w.applyState({...w.collectState(),events:[]});w.setCalendarFeed(prepareFeed());w.importCalendarEvent(0);
  const id=w.events[0].id;w.updateEvent(id,'title','Officer-written workshop title');w.events[0].showImg=true;w.events[0].imgUrl='https://example.com/custom.png';w.events[0].imgAlt='Workshop';
  w.events.push(w.Core.normalizeEvent(event(999,'2099-02-01'),999));w.render();
  const before=JSON.stringify(w.Core.sanitizeState(w.collectState()));
  d.getElementById('calendar-search').value='No matching results';w.renderCalendarList();
  await openPrepare(w,d);
  assert.equal(d.querySelectorAll('[data-prepare-index]').length,2,'ignores unrelated list/search filters');
  w.selectPrepareEvent(1,false);
  d.getElementById('prepare-subject').value='Officer custom subject';d.getElementById('prepare-issue-bar').value='January kickoff';
  w.applyPreparedIssue();
  assert.equal(w.events.length,1);assert.equal(w.events[0].id,id);assert.equal(w.events[0].title,'Officer-written workshop title');assert.equal(w.events[0].imgUrl,'https://example.com/custom.png');
  assert.equal(d.getElementById('s-subject').value,'Officer custom subject');assert.equal(d.getElementById('issue-bar-text').value,'January kickoff');assert.equal(d.getElementById('s-issue-through').value,'2099-01-14');
  assert.equal(d.getElementById('prepare-issue-modal').classList.contains('open'),false);assert.equal(d.activeElement.id,'event-count');
  w.undoDraftChange();assert.equal(JSON.stringify(w.Core.sanitizeState(w.collectState())),before);
 }finally{w.close();}
});

test('prefill can keep other events without duplicating matching imports, and custom suggestions survive selection changes',async()=>{
 const {w,d}=await setup();try{
  w.applyState({...w.collectState(),events:[event(999,'2099-02-01')]});w.setCalendarFeed(prepareFeed());w.importCalendarEvent(0);
  await openPrepare(w,d);d.getElementById('prepare-keep-events').checked=true;
  d.getElementById('prepare-subject').value='Keep this subject';d.getElementById('prepare-issue-bar').value='Keep this issue date';
  w.selectPrepareEvent(1,false);w.selectPrepareEvent(1,true);
  assert.equal(d.getElementById('prepare-subject').value,'Keep this subject');assert.equal(d.getElementById('prepare-issue-bar').value,'Keep this issue date');
  w.applyPreparedIssue();assert.equal(w.events.length,3);assert.equal(w.events.filter(e=>e.sourceEventId==='prepare-a').length,1);assert.ok(w.events.find(e=>e.id===999));
 }finally{w.close();}
});

test('prefill does not replace a changed draft or proceed without a recovery copy',async()=>{
 const {w,d}=await setup();try{
  w.setCalendarFeed(prepareFeed());await openPrepare(w,d);const before=JSON.stringify(w.collectState());
  const backup=w.backupCurrentDraft;w.backupCurrentDraft=()=>false;w.applyPreparedIssue();assert.equal(JSON.stringify(w.collectState()),before);assert.match(d.getElementById('prepare-summary').textContent,/Could not save/);
  w.backupCurrentDraft=backup;d.getElementById('s-subject').value='New edit made during review';w.applyPreparedIssue();assert.match(d.getElementById('prepare-summary').textContent,/draft changed/);assert.equal(d.getElementById('s-subject').value,'New edit made during review');
  w.closePrepareIssue();w.setCalendarFeed({events:[]});await openPrepare(w,d);assert.equal(d.getElementById('prepare-apply').disabled,true);const emptyBefore=JSON.stringify(w.collectState());w.applyPreparedIssue();assert.equal(JSON.stringify(w.collectState()),emptyBefore);
 }finally{w.close();}
});

test('prefill marks practice content and Escape closes its own dialog',async()=>{
 const {w,d}=await setup();try{
  w.calendarIsFictional=true;w.setCalendarFeed({...prepareFeed(),events:[{...prepareFeed().events[0],id:'fictional-prepare',practice:true}]});
  await openPrepare(w,d);assert.match(d.getElementById('prepare-summary').textContent,/Practice calendar/);w.applyPreparedIssue();assert.equal(w.events[0].practice,true);
  await openPrepare(w,d);d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(d.getElementById('prepare-issue-modal').classList.contains('open'),false);
 }finally{w.close();}
});

test('closing prefill while a feed loads prevents a late result from reopening or filling the draft',async()=>{
 const {w,d}=await setup();try{
  w.calendarCurrentFeed=null;let resolveFeed;w.fetch=()=>new Promise(resolve=>{resolveFeed=resolve;});
  const before=JSON.stringify(w.collectState()),pending=w.openPrepareIssue();w.closePrepareIssue();resolveFeed({ok:true,json:async()=>prepareFeed()});await pending;
  assert.equal(d.getElementById('prepare-issue-modal').classList.contains('open'),false);assert.equal(JSON.stringify(w.collectState()),before);
 }finally{w.close();}
});
