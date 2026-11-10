/* Small, pure workflows shared by readiness, handoff and issue planning. */
(function(global){
  'use strict';
  var Core=global.NewsletterCore;
  function day(value){return Core.normalizeDateISO(value);}
  function chapterToday(now){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now||new Date());}
  function addDays(value,count){var date=new Date(day(value)+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+count);return date.toISOString().slice(0,10);}
  function eventEnd(event){var start=day(event.dateISO),end=day(event.endDateISO);return end&&end>=start?end:start;}
  function imageHint(value){
    var url;try{url=new URL(value);}catch(error){return '';}
    var host=url.hostname.toLowerCase(),share=host==='docs.google.com'||(host==='drive.google.com'&&!/^\/uc(?:\/|$)/.test(url.pathname))||((host==='dropbox.com'||host==='www.dropbox.com')&&url.searchParams.get('raw')!=='1');
    return share?'This may be a sharing page rather than a direct image. Use an image URL from Brevo’s image library or the chapter website; check a test email before sending.':'';
  }
  function planningChecks(state){
    var f=state.fields||{},send=day(f['s-send-date']),from=day(f['s-issue-from']),through=day(f['s-issue-through']),checks=[];
    function add(label,detail,tab,field,eventId){checks.push({ok:false,label:label,detail:detail,tab:tab,field:field,eventId:eventId==null?null:eventId});}
    var validRange=!from||!through||from<=through;
    if(!validRange)add('Issue dates are out of order','Choose a Through date on or after From.','settings','s-issue-through');
    if(!send&&!from&&!through)return checks;
    (state.events||[]).forEach(function(e,index){
      var start=day(e.dateISO),end=eventEnd(e);
      if(!start){add('Event '+(index+1)+' date needs confirmation','Add its calendar date to check it against the planned issue. The displayed date is unchanged.','events','event-'+e.id+'-dateISO',e.id);return;}
      if(send&&end<send)add('Event '+(index+1)+' ends before the planned send date','Review this event or adjust the planned send date.','events','event-'+e.id+'-dateISO',e.id);
      else if(validRange&&((from&&end<from)||(through&&start>through)))add('Event '+(index+1)+' is outside the issue dates','Review the event or adjust this issue’s optional date range.','events','event-'+e.id+'-dateISO',e.id);
    });
    if(state.showFeatured){var featured=day(f['feat-dateISO']);if(!featured)add('Confirm the featured event date','Add its calendar date to check it against this issue.','featured','feat-dateISO');else if(send&&featured<send)add('Featured event starts before the planned send date','Confirm whether this highlight is still appropriate.','featured','feat-dateISO');}
    return checks;
  }
  function issueWindow(start){
    var from=day(start);if(!from)throw Error('Choose a valid start date.');
    return {from:from,through:addDays(from,13)};
  }
  function windowEvents(sources,start,zone){
    var range=issueWindow(start);
    return sources.map(function(source,index){return {source:source,event:Core.calendarEventToNewsletter(source,index,zone)};})
      .filter(function(item){return item.event.dateISO<=range.through&&eventEnd(item.event)>=range.from;})
      .sort(function(a,b){return Date.parse(a.source.start)-Date.parse(b.source.start);}).map(function(item){return item.source;});
  }
  function issueSuggestions(sources,start){
    var range=issueWindow(start),from=new Date(range.from+'T12:00:00Z'),through=new Date(range.through+'T12:00:00Z');
    function fmt(date,options){return date.toLocaleDateString('en-US',Object.assign({timeZone:'UTC'},options));}
    var sameYear=from.getUTCFullYear()===through.getUTCFullYear(),sameMonth=sameYear&&from.getUTCMonth()===through.getUTCMonth();
    var label=sameMonth?fmt(from,{month:'short',day:'numeric'})+'–'+through.getUTCDate()+', '+through.getUTCFullYear():fmt(from,{month:'short',day:'numeric',year:sameYear?undefined:'numeric'})+'–'+fmt(through,{month:'short',day:'numeric',year:'numeric'});
    var titles=sources.slice().sort(function(a,b){return Number(/^ASME\b/i.test(b.title||''))-Number(/^ASME\b/i.test(a.title||''));}).map(function(e){return String(e.title||'Chapter event').replace(/\s+/g,' ').trim().replace(/^ASME(?: OSU)?[\s:–—-]+/i,'');});
    var subject=titles.length?'ASME OSU: '+titles.slice(0,2).join(' + ')+(titles.length>2?' + '+(titles.length-2)+' more':''):'ASME OSU: Upcoming events · '+label;
    if(subject.length>65){var suffix=titles.length>1?' + '+(titles.length-1)+' more':'';var limit=65-10-suffix.length;subject='ASME OSU: '+(titles[0].length>limit?titles[0].slice(0,limit-1).trimEnd()+'…':titles[0])+suffix;}
    return {subject:subject,issueBar:'Biweekly Newsletter · '+label,from:range.from,through:range.through};
  }
  function nextIssue(state,dates){
    var next=Core.sanitizeState(state),f=next.fields,send=day(dates.send),from=day(dates.from),through=day(dates.through);
    if(!send)throw Error('Choose a planned send date.');
    if(from&&through&&from>through)throw Error('The Through date must be on or after From.');
    next.events=next.events.filter(function(e){var end=eventEnd(e);return !end||end>=send;});
    f['s-send-date']=send;f['s-issue-from']=from;f['s-issue-through']=through;
    f['s-subject']='';f['s-preheader']='';
    f['issue-bar-text']='Biweekly Newsletter · '+new Date(send+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
    ['feat-title','feat-date','feat-dateISO','feat-location','feat-desc','feat-img-url','feat-img-alt','feat-btn-url'].forEach(function(key){f[key]='';});
    next.showFeatured=false;next.showFeatImg=false;next.featuredPractice=false;next.showAnnounce=false;
    return next;
  }
  function digest(state){
    var f=state.fields||{},lines=[],safe=Core.safeUrl;
    if((state.events||[]).some(Core.isPracticeEvent)||state.featuredPractice)lines.push('PRACTICE CONTENT — DO NOT SEND','');
    lines.push(f['s-subject']||f['issue-bar-text']||'ASME update','');
    function eventLines(title,date,time,location,description,url){return[title,[date,time].filter(Boolean).join(' · '),location,description,safe(url)].filter(Boolean).join('\n');}
    if(state.showFeatured&&f['feat-title'])lines.push(eventLines(f['feat-title'],f['feat-date'],'',f['feat-location'],f['feat-desc'],state.showFeatButton?f['feat-btn-url']:''),'');
    (state.events||[]).forEach(function(e){
      var same=state.showFeatured&&e.title.trim().toLowerCase()===String(f['feat-title']||'').trim().toLowerCase()&&((day(e.dateISO)&&day(e.dateISO)===day(f['feat-dateISO']))||e.date===f['feat-date']);
      if(!same)lines.push(eventLines(e.title,e.date,e.time,e.location,e.description,e.showLink?e.linkUrl:''),'');
    });
    if(state.showAnnounce&&f['ann-quote'])lines.push(f['ann-title']||'Update',f['ann-quote'],'');
    if(state.showLinks)[1,2,3].forEach(function(n){var url=safe(f['ql'+n+'-url']);if(url&&f['ql'+n+'-title'])lines.push(f['ql'+n+'-title']+': '+url);});
    return lines.join('\n').trim();
  }
  // This compact fingerprint is for local copy-status feedback, not security.
  function fingerprint(html){var a=2166136261,b=5381;for(var i=0;i<html.length;i++){a=Math.imul(a^html.charCodeAt(i),16777619);b=Math.imul(b,33)^html.charCodeAt(i);}return html.length+':'+(a>>>0).toString(16)+':'+(b>>>0).toString(16);}
  global.NewsletterWorkflows={issueWindow:issueWindow,windowEvents:windowEvents,issueSuggestions:issueSuggestions,day:day,chapterToday:chapterToday,addDays:addDays,eventEnd:eventEnd,imageHint:imageHint,planningChecks:planningChecks,nextIssue:nextIssue,digest:digest,fingerprint:fingerprint};
})(typeof window!=='undefined'?window:globalThis);

var htmlCopyRecord=null;
function readHTMLCopyRecord(){
  if(htmlCopyRecord)return htmlCopyRecord;
  try{var saved=JSON.parse(localStorage.getItem('asme_nl_html_copy')||'null');if(saved&&typeof saved.signature==='string'&&typeof saved.at==='string'&&!Number.isNaN(Date.parse(saved.at)))htmlCopyRecord=saved;}catch(error){}
  return htmlCopyRecord;
}
function rememberHTMLCopy(html){
  htmlCopyRecord={signature:NewsletterWorkflows.fingerprint(html),at:new Date().toISOString()};
  try{localStorage.setItem('asme_nl_html_copy',JSON.stringify(htmlCopyRecord));}catch(error){}
  syncHTMLCopyStatus();
}
function syncHTMLCopyStatus(){
  var line=document.getElementById('html-copy-freshness'),button=document.getElementById('checklist-primary');if(!line||!checklistCopyMode)return;
  var record=readHTMLCopyRecord(),changed=record&&record.signature!==NewsletterWorkflows.fingerprint(generateHTML());
  line.textContent=!record?'Copy HTML last, after pasting the subject and inbox preview.':changed?'Edited since you last copied HTML. Copy the updated HTML before pasting into Brevo.':'HTML unchanged since you copied '+new Date(record.at).toLocaleString()+'.';
  line.classList.toggle('copy-is-stale',Boolean(changed));
  button.textContent=changed?'Copy updated HTML':'Copy HTML';
}
function syncWorkflowHints(){
  document.querySelectorAll('[data-image-hint]').forEach(function(note){var input=document.getElementById(note.dataset.imageHint),message=input?NewsletterWorkflows.imageHint(input.value):'';note.textContent=message;note.hidden=!message;});
  if(document.getElementById('checklist-modal').classList.contains('open'))syncHTMLCopyStatus();
}
function issueDatesChanged(){render();}
function useIssueDatesInCalendar(){
  var from=g('s-issue-from'),through=g('s-issue-through');
  if(!from&&!through){setWorkspaceView('edit');switchTabByName('settings');document.getElementById('issue-planning').open=true;document.getElementById('s-issue-from').focus();return;}
  document.getElementById('calendar-preview-year').value='';calendarPreviewYear='';
  document.getElementById('calendar-from').value=from;document.getElementById('calendar-to').value=through;applyCalendarPreview(false);
}
function rememberWorkflowFocus(){var active=document.activeElement,menu=active&&active.closest('.toolbar-menu');lastFocusedBeforeModal=menu?menu.querySelector('summary'):active;}
function openNextIssue(){
  var W=NewsletterWorkflows,today=W.chapterToday(),last=W.day(g('s-send-date')),send=last?W.addDays(last,14):today;if(send<today)send=today;
  document.getElementById('next-send').value=send;document.getElementById('next-from').value=send;document.getElementById('next-through').value=W.addDays(send,13);
  rememberWorkflowFocus();document.getElementById('next-issue-modal').classList.add('open');previewNextIssue();document.getElementById('next-send').focus();
}
function closeNextIssue(){document.getElementById('next-issue-modal').classList.remove('open');if(lastFocusedBeforeModal)lastFocusedBeforeModal.focus();}
function nextIssueDates(){return{send:g('next-send'),from:g('next-from'),through:g('next-through')};}
function previewNextIssue(){
  try{var next=NewsletterWorkflows.nextIssue(collectState(),nextIssueDates()),unknown=next.events.filter(function(e){return !NewsletterWorkflows.day(e.dateISO);}).length;
    document.getElementById('next-issue-summary').textContent=(events.length-next.events.length)+' dated event(s) removed; '+next.events.length+' retained'+(unknown?' ('+unknown+' without a calendar date; review these)':'')+'. Branding, design and quick links stay. Subject and featured content are cleared; the announcement is kept but switched off for review. A recovery copy of your current issue is saved before applying.';
    document.getElementById('next-issue-apply').disabled=false;
  }catch(error){document.getElementById('next-issue-summary').textContent=error.message;document.getElementById('next-issue-apply').disabled=true;}
}
function startNextIssue(){
  try{var next=NewsletterWorkflows.nextIssue(collectState(),nextIssueDates());if(!backupCurrentDraft('Before starting next issue')){document.getElementById('next-issue-summary').textContent='Could not save a recovery copy. Export a draft backup or free browser storage before starting the next issue.';return;}applyState(next);document.getElementById('edit-feedback').hidden=false;document.getElementById('edit-feedback-text').textContent='Next issue created. Previous draft saved for Undo.';closeNextIssue();setWorkspaceView('edit');switchTabByName('settings');document.getElementById('s-subject').focus();}
  catch(error){document.getElementById('next-issue-summary').textContent=error.message;}
}
function openChatDigest(){
  rememberWorkflowFocus();document.getElementById('chat-digest-text').value=NewsletterWorkflows.digest(collectState());document.getElementById('chat-digest-status').textContent='';document.getElementById('chat-digest-modal').classList.add('open');var text=document.getElementById('chat-digest-text');text.focus();text.setSelectionRange(0,0);text.scrollTop=0;
}
function closeChatDigest(){document.getElementById('chat-digest-modal').classList.remove('open');if(lastFocusedBeforeModal)lastFocusedBeforeModal.focus();}
function copyChatDigest(){copyTextSafely(g('chat-digest-text'),function(){document.getElementById('chat-digest-status').textContent='Event digest copied. Paste and review it in your chat app; nothing was sent.';},function(){document.getElementById('chat-digest-status').textContent='Could not copy. Select the message text and copy it manually.';});}


var prepareIssueSources=[],prepareIssueSelected=new Set(),prepareIssueBase='',prepareIssueGeneration=0,prepareIssueSuggested={subject:'',issueBar:''};
async function openPrepareIssue(){
  rememberWorkflowFocus();var generation=++prepareIssueGeneration;
  prepareIssueBase=JSON.stringify(collectState());prepareIssueSources=[];prepareIssueSelected.clear();prepareIssueSuggested={subject:'',issueBar:''};
  var today=NewsletterWorkflows.chapterToday(),saved=NewsletterWorkflows.day(g('s-send-date'));
  document.getElementById('prepare-start').value=saved&&saved>=today?saved:today;
  document.getElementById('prepare-subject').value='';document.getElementById('prepare-issue-bar').value='';
  document.getElementById('prepare-keep-events').checked=false;
  document.getElementById('prepare-issue-modal').classList.add('open');
  document.getElementById('prepare-start').focus();
  document.getElementById('prepare-events').textContent='Loading calendar events…';document.getElementById('prepare-apply').disabled=true;
  if(!calendarCurrentFeed||calendarLoadPending)await loadCalendarEvents(false);
  if(generation!==prepareIssueGeneration)return;
  refreshPrepareIssue();
}
function closePrepareIssue(){prepareIssueGeneration++;document.getElementById('prepare-issue-modal').classList.remove('open');if(lastFocusedBeforeModal)lastFocusedBeforeModal.focus();}
function refreshPrepareIssue(){
  try{
    prepareIssueSources=NewsletterWorkflows.windowEvents(calendarAllEvents,g('prepare-start'),calendarTimeZone);
    prepareIssueSelected=new Set(prepareIssueSources.map(function(e){return e.id;}));
    document.getElementById('prepare-events').innerHTML=prepareIssueSources.length?prepareIssueSources.map(function(source,index){
      var info=calendarDateParts(source),imported=findImportedEventForCalendar(source);
      return '<label class="prepare-event"><input type="checkbox" checked data-prepare-index="'+index+'" onchange="selectPrepareEvent('+index+',this.checked)"><span><strong>'+escHtml(source.title)+'</strong><small>'+escHtml(info.date+' · '+info.time)+(imported?' · Current newsletter copy kept':'')+'</small></span></label>';
    }).join(''):'<p class="calendar-status">No events found in this two-week window. Choose another start date or refresh Calendar.</p>';
    updatePrepareIssue();
  }catch(error){document.getElementById('prepare-summary').textContent=error.message;document.getElementById('prepare-apply').disabled=true;}
}
function selectPrepareEvent(index,checked){var source=prepareIssueSources[index];if(!source)return;if(checked)prepareIssueSelected.add(source.id);else prepareIssueSelected.delete(source.id);updatePrepareIssue();}
function updatePrepareIssue(){
  var selected=prepareIssueSources.filter(function(e){return prepareIssueSelected.has(e.id);}),suggestion=NewsletterWorkflows.issueSuggestions(selected,g('prepare-start'));
  var subject=document.getElementById('prepare-subject'),issue=document.getElementById('prepare-issue-bar');
  if(!subject.value||subject.value===prepareIssueSuggested.subject)subject.value=suggestion.subject;
  if(!issue.value||issue.value===prepareIssueSuggested.issueBar)issue.value=suggestion.issueBar;
  prepareIssueSuggested=suggestion;
  var from=Date.parse(suggestion.from+'T12:00:00Z'),through=Date.parse(suggestion.through+'T12:00:00Z'),feed=calendarCurrentFeed||{},coverageFrom=Date.parse(feed.windowStart),coverageThrough=Date.parse(feed.windowEnd);
  var warning=calendarIsFictional?'Practice calendar: these are fictional events. ':(!calendarFeedLoaded?'Calendar could not be verified. ':Number.isFinite(coverageFrom)&&Number.isFinite(coverageThrough)&&(from<coverageFrom||through>=coverageThrough)?'Some dates are outside the saved calendar’s coverage. ':'');
  document.getElementById('prepare-window').textContent=suggestion.issueBar.replace('Biweekly Newsletter · ','')+' · 14 days';
  document.getElementById('prepare-summary').textContent=warning+selected.length+' event'+(selected.length===1?'':'s')+' selected. '+(document.getElementById('prepare-keep-events').checked?'Other current events stay.':'The current event list will be replaced.')+' Undo restores this draft.';
  document.getElementById('prepare-summary').classList.toggle('copy-is-stale',Boolean(warning));
  var button=document.getElementById('prepare-apply');button.textContent='Fill issue ('+selected.length+' event'+(selected.length===1?'':'s')+')';button.disabled=!selected.length;
}
function applyPreparedIssue(){
  var summary=document.getElementById('prepare-summary');
  if(JSON.stringify(collectState())!==prepareIssueBase){summary.textContent='The draft changed while this review was open. Close and reopen Auto-fill issue to use the latest draft.';return;}
  var selected=prepareIssueSources.filter(function(e){return prepareIssueSelected.has(e.id);});if(!selected.length)return;
  var subject=g('prepare-subject').trim(),issueBar=g('prepare-issue-bar').trim();
  if(!subject||!issueBar){summary.textContent='Add a subject line and newsletter date before filling the issue.';document.getElementById(!subject?'prepare-subject':'prepare-issue-bar').focus();return;}
  if(!backupCurrentDraft('Before preparing issue')){summary.textContent='Could not save a recovery copy. Export a draft backup or free browser storage before filling the issue.';return;}
  try{
    var state=Core.sanitizeState(collectState()),current=state.events,chosen=[],ids=new Set();
    selected.forEach(function(source){var match=findImportedEventForCalendar(source),event=match?current.find(function(e){return e.id===match.id;}):null;
      if(!event){var id=Core.nextEventId(current.concat(chosen),100);event=Core.calendarEventToNewsletter(Object.assign({},source,{url:calendarIsFictional?'':source.url||calendarSourceUrl,practice:calendarIsFictional||source.practice}),id,calendarTimeZone);}
      if(!ids.has(event.id)){chosen.push(event);ids.add(event.id);}
    });
    if(document.getElementById('prepare-keep-events').checked)chosen=chosen.concat(current.filter(function(e){return !ids.has(e.id);}));
    if(autoSortEvents)chosen=chosen.map(function(e,i){return{event:e,index:i};}).sort(function(a,b){var difference=eventDateValue(a.event)-eventDateValue(b.event);return Number.isNaN(difference)||difference===0?a.index-b.index:difference;}).map(function(item){return item.event;});
    state.events=chosen;state.fields['s-subject']=subject;state.fields['issue-bar-text']=issueBar;
    state.fields['s-send-date']=prepareIssueSuggested.from;state.fields['s-issue-from']=prepareIssueSuggested.from;state.fields['s-issue-through']=prepareIssueSuggested.through;
    applyState(state);calendarSelected.clear();renderCalendarList();
    document.getElementById('edit-feedback').hidden=false;document.getElementById('edit-feedback-text').textContent='Issue prepared with '+selected.length+' selected calendar event'+(selected.length===1?'':'s')+'. Review the other sections before copying.';
    closePrepareIssue();setWorkspaceView('edit');switchTabByName('events');document.getElementById('event-count').focus();
  }catch(error){summary.textContent='Could not prepare this issue: '+error.message;}
}
