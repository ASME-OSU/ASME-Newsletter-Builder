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
  global.NewsletterWorkflows={day:day,chapterToday:chapterToday,addDays:addDays,eventEnd:eventEnd,imageHint:imageHint,planningChecks:planningChecks,nextIssue:nextIssue,digest:digest,fingerprint:fingerprint};
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
