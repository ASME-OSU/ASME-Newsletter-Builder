function calendarDateParts(event){
  var start=new Date(event.start),zone=event.allDay?"UTC":calendarTimeZone;
  var date=new Intl.DateTimeFormat("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric",timeZone:zone}).format(start);
  if(event.allDay)return{date:date,time:"All day"};
  var timeFormat=new Intl.DateTimeFormat("en-US",{hour:"numeric",minute:"2-digit",timeZone:calendarTimeZone});
  var time=timeFormat.format(start),end=event.end?new Date(event.end):null;
  if(end&&!Number.isNaN(end.getTime()))time+="–"+timeFormat.format(end);
  return{date:date,time:time};
}

function closestCalendarMatch(items,targetStart,getStart){
  var target=new Date(targetStart).getTime();if(Number.isNaN(target))return null;
  var plausible=items.filter(function(item){var time=new Date(getStart(item)).getTime();return !Number.isNaN(time)&&Math.abs(time-target)<=48*60*60*1000;});
  // Ambiguous replacements need a new import rather than silently choosing another occurrence.
  return plausible.length===1?plausible[0]:null;
}

function findCalendarEventForImported(imported){
  var exact=calendarAllEvents.find(function(source){return source.id===imported.sourceEventId;});if(exact)return exact;
  var key=Core.calendarEventSourceKey(imported.sourceEventId);if(!key)return null;
  var candidates=calendarAllEvents.filter(function(source){return !source.recurring&&Core.calendarEventSourceKey(source)===key&&!events.some(function(other){return other.sourceEventId===source.id;});});
  var match=closestCalendarMatch(candidates,imported.sourceStart,function(source){return source.start;});
  if(!match)return null;
  var unmatched=events.filter(function(other){return other.sourceEventId&&Core.calendarEventSourceKey(other.sourceEventId)===key&&!calendarAllEvents.some(function(source){return source.id===other.sourceEventId;});});
  return closestCalendarMatch(unmatched,match.start,function(other){return other.sourceStart;})===imported?match:null;
}

function findImportedEventForCalendar(source){
  var exact=events.find(function(imported){return imported.sourceEventId===source.id;});if(exact)return exact;
  if(source.recurring)return null;
  return events.find(function(imported){return imported.sourceEventId&&findCalendarEventForImported(imported)===source;})||null;
}

function calendarImportNeedsUpdate(imported,source){
  var effective=Object.assign({},source,{url:calendarIsFictional?"":source.url||calendarSourceUrl});
  return imported.sourceEventId!==source.id||imported.sourceStart!==source.start||String(imported.sourceUpdated||"")!==String(source.updated||"")||Boolean(imported.sourceFingerprint&&imported.sourceFingerprint!==Core.calendarEventFingerprint(effective));
}

function calendarSourceStatus(imported){
  if(!imported.sourceEventId)return "manual";
  if(!calendarFeedLoaded||calendarLoadPending||calendarLoadNotice.indexOf("failed")>=0||calendarIsFictional)return "unavailable";
  if(findCalendarEventForImported(imported))return "current";
  var feed=calendarCurrentFeed||{},start=Date.parse(imported.sourceStart),from=Date.parse(feed.windowStart),to=Date.parse(feed.windowEnd);
  if(!Number.isFinite(start)||!Number.isFinite(from)||!Number.isFinite(to))return "unavailable";
  return start>=from&&start<to?"missing":"outside-coverage";
}

function keepCalendarEvent(id){
  var imported=events.find(function(event){return event.id===id;});if(!imported)return;
  Object.assign(imported,Core.detachCalendarSource(imported));
  ["sourceEventId","sourceStart","sourceUpdated","sourceFingerprint"].forEach(function(key){imported[key]="";});
  renderEventList();renderCalendarList();render();autoSave();
}

function updateCalendarSyncButton(){
  var button=document.getElementById("sync-calendar-imports");if(!button)return;
  var count=events.filter(function(imported){var source=imported.sourceEventId&&findCalendarEventForImported(imported);return source&&calendarImportNeedsUpdate(imported,source);}).length;
  button.hidden=!count;button.textContent=count?"Sync "+count+" Imported Event"+(count===1?"":"s"):"Sync Imported Events";
}

function setCalendarFeed(feed){
  if(!feed||!Array.isArray(feed.events))throw new Error("Calendar snapshot has no events array.");
  calendarCurrentFeed=feed;
  calendarTimeZone=feed.timeZone||"America/New_York";
  calendarSourceUrl=calendarIsFictional?"":Core.safeUrl(feed.sourceUrl);
  calendarAllEvents=feed.events.map(Core.sanitizeCalendarEvent).filter(Boolean);
  calendarFeedLoaded=!calendarIsFictional;
  applyCalendarPreview(false);
}

function applyCalendarPreview(readInput){
  var status=document.getElementById("calendar-status");
  try{
    if(readInput!==false){var selectedYear=document.getElementById("calendar-preview-year").value.trim();if(selectedYear)selectedYear=Core.normalizeAcademicYear(selectedYear);calendarPreviewYear=selectedYear;document.getElementById("calendar-preview-year").value=selectedYear;}
    calendarEvents=calendarPreviewYear?Core.eventsForAcademicYear(calendarAllEvents,calendarPreviewYear,calendarTimeZone):calendarAllEvents.filter(function(event){var end=event.end?new Date(event.end):new Date(event.start);return end.getTime()>=Date.now()-24*60*60*1000;});
    var rangeFrom=g("calendar-from"),rangeTo=g("calendar-to");
    if(rangeFrom&&rangeTo&&rangeFrom>rangeTo)throw new Error("The From date must be on or before Through.");
    calendarEvents=calendarEvents.filter(function(event){var date=Core.calendarEventToNewsletter(event,0,calendarTimeZone).dateISO;return (!rangeFrom||date>=rangeFrom)&&(!rangeTo||date<=rangeTo);});
    var query=g("calendar-search").trim().toLowerCase();
    if(query)calendarEvents=calendarEvents.filter(function(event){return [event.title,event.location,event.description].join(" ").toLowerCase().indexOf(query)>=0;});
    document.getElementById("calendar-filter-reset").hidden=!(rangeFrom||rangeTo||calendarPreviewYear);
    var generated=calendarCurrentFeed&&calendarCurrentFeed.generatedAt?new Date(calendarCurrentFeed.generatedAt):null;
    var updated=generated&&!Number.isNaN(generated.getTime())?generated.toLocaleString(undefined,{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}):"";
    status.textContent=calendarLoadNotice+(calendarIsFictional?"FICTIONAL REHEARSAL — no Google events. ":"")+(calendarLoadPending&&!calendarChapterFeed?"":calendarEvents.length+" event"+(calendarEvents.length===1?"":"s")+" · "+(calendarPreviewYear||"Upcoming")+(!calendarIsFictional&&updated?" · Updated "+updated:""));
    var sourceDetails=document.getElementById("calendar-source-status");
    var coverage=calendarCurrentFeed&&calendarCurrentFeed.windowStart&&calendarCurrentFeed.windowEnd?"Available dates: "+calendarCurrentFeed.windowStart.slice(0,10)+" through "+calendarCurrentFeed.windowEnd.slice(0,10)+" (end exclusive).":"Available date range is unknown. Use Open Calendar to confirm missing dates.";
    var checked=Date.parse(calendarCurrentFeed&&calendarCurrentFeed.checkedAt);
    if(!calendarIsFictional&&!calendarLoadPending&&Number.isFinite(checked)&&Date.now()-checked>6*60*60*1000)status.textContent+=" · Calendar update overdue — confirm recent changes with Open Calendar.";
    sourceDetails.textContent=calendarIsFictional?"Practice events are fictional. Remove fictional events to return to the chapter calendar.":coverage+(calendarCurrentFeed&&calendarCurrentFeed.checkedAt?" Last source check: "+calendarCurrentFeed.checkedAt+".":"");
    document.getElementById("clear-fictional-calendar").hidden=!calendarIsFictional;
    renderCalendarList();renderEventList();renderReadiness();document.getElementById("calendar-list").setAttribute("aria-busy",String(calendarLoadPending));
  }catch(error){status.textContent=error.message;}
}

function showUpcomingCalendar(){document.getElementById("calendar-preview-year").value="";calendarPreviewYear="";applyCalendarPreview(false);}
function useChapterCalendar(){return loadCalendarEvents(true);}
function loadFictionalCalendar(){
  var input=document.getElementById("calendar-preview-year"),year=input.value.trim();
  if(!year){var now=new Date(),start=now.getMonth()>=7?now.getFullYear():now.getFullYear()-1;year=start+"-"+(start+1);input.value=year;}
  try{year=Core.normalizeAcademicYear(year);var feed=Core.fictionalCalendarFeed(year);input.value=year;calendarLoadGeneration++;calendarLoadPending=false;calendarLoadNotice="";calendarPreviewYear=year;calendarIsFictional=true;setCalendarFeed(feed);}catch(error){document.getElementById("calendar-status").textContent=error.message;}
}
function clearFictionalCalendar(){if(!calendarIsFictional)return Promise.resolve();return loadCalendarEvents(true,true);}

function loadCalendarEvents(force,removed){
  var status=document.getElementById("calendar-status"),generation=++calendarLoadGeneration;
  if(!status)return Promise.resolve();
  calendarIsFictional=false;calendarLoadPending=true;
  calendarLoadNotice=(removed?"Fictional events removed. ":"")+"Loading events… ";
  setCalendarFeed(calendarChapterFeed||{events:[]});
  calendarFeedLoaded=!!calendarChapterFeed;
  var url="calendar-events.json"+(force?"?refresh="+Date.now():"");
  return fetch(url,{cache:"no-store"}).then(function(response){
    if(!response.ok)throw new Error("Calendar feed returned "+response.status);
    return response.json();
  }).then(function(feed){
    if(generation!==calendarLoadGeneration)return;
    if(!feed||!Array.isArray(feed.events))throw new Error("Calendar snapshot has no events array.");
    calendarChapterFeed=feed;calendarLoadPending=false;calendarLoadNotice=removed?"Fictional events removed. ":"";
    calendarIsFictional=false;setCalendarFeed(feed);
  }).catch(function(error){
    if(generation!==calendarLoadGeneration)return;
    calendarLoadPending=false;
    calendarLoadNotice=(removed?"Fictional events removed. ":"")+(calendarChapterFeed?"Refresh failed; showing the last loaded chapter events. ":"Calendar unavailable. ")+"Use Open Calendar or retry Refresh events. ";
    setCalendarFeed(calendarChapterFeed||{events:[]});calendarFeedLoaded=!!calendarChapterFeed;
    console.warn("Calendar load failed:",error);
  });
}

function renderCalendarList(){
  var list=document.getElementById("calendar-list");if(!list)return;
  updateCalendarSyncButton();
  var eligible=calendarEvents.filter(function(event){return !findImportedEventForCalendar(event);});
  var selected=eligible.filter(function(event){return calendarSelected.has(event.id);});
  var batchButton=document.getElementById("calendar-import-selected");batchButton.disabled=!selected.length;batchButton.textContent="Import selected"+(selected.length?" ("+selected.length+")":"");
  updateCalendarSelectionControls();
  if(!calendarEvents.length){list.innerHTML='<div class="empty-state">No events match this calendar view. Try clearing the filters.</div>';return;}
  list.innerHTML=calendarEvents.map(function(event,index){
    var parts=calendarDateParts(event);
    var imported=findImportedEventForCalendar(event),needsUpdate=imported&&calendarImportNeedsUpdate(imported,event);
    var meta=[parts.time,event.location].filter(Boolean).join(" · ");
    return '<div class="calendar-event '+(imported?'imported':'')+'">'+
      (!imported?'<label class="calendar-select"><input type="checkbox" aria-label="Select '+escHtml(event.title)+'" '+(calendarSelected.has(event.id)?'checked ':'')+'onchange="selectCalendarEvent('+index+',this.checked)"> Select for import</label>':'')+
      '<div class="calendar-event-date">'+escHtml(parts.date)+'</div>'+
      '<div class="calendar-event-title">'+escHtml(event.title)+'</div>'+
      (meta?'<div class="calendar-event-meta">'+escHtml(meta)+'</div>':'')+
      (event.description?'<div class="calendar-event-desc">'+escHtml(event.description.slice(0,320))+(event.description.length>320?'…':'')+'</div>':'')+
      '<button class="btn '+(imported&&!needsUpdate?'btn-ghost':'btn-blue')+'" '+(imported&&!needsUpdate?'disabled':needsUpdate?'onclick="reviewCalendarUpdates('+index+')"':'onclick="importCalendarEvent('+index+')"')+'>'+(needsUpdate?'Update Imported Event':imported?'Synced':'Import Event')+'</button>'+
      '</div>';
  }).join("");
}

function selectCalendarEvent(index,checked){var event=calendarEvents[index];if(!event)return;if(checked)calendarSelected.add(event.id);else calendarSelected.delete(event.id);updateCalendarSelectionControls();}
function updateCalendarSelectionControls(){
  var eligible=calendarEvents.filter(function(event){return !findImportedEventForCalendar(event);});
  var count=eligible.filter(function(event){return calendarSelected.has(event.id);}).length;
  var button=document.getElementById("calendar-import-selected");button.disabled=!count;button.textContent="Import selected"+(count?" ("+count+")":"");
  var all=document.getElementById("calendar-select-all");all.disabled=!eligible.length;all.checked=eligible.length>0&&count===eligible.length;all.indeterminate=count>0&&count<eligible.length;
  document.getElementById("calendar-clear-selection").hidden=!calendarSelected.size;
}
function toggleAllCalendarEvents(checked){calendarEvents.forEach(function(event){if(!findImportedEventForCalendar(event)){if(checked)calendarSelected.add(event.id);else calendarSelected.delete(event.id);}});renderCalendarList();}
function selectVisibleCalendarEvents(){calendarEvents.forEach(function(event){if(!findImportedEventForCalendar(event))calendarSelected.add(event.id);});renderCalendarList();}
function clearCalendarFilters(){document.getElementById("calendar-search").value="";document.getElementById("calendar-preview-year").value="";calendarPreviewYear="";clearCalendarRange();}
function clearCalendarRange(){document.getElementById("calendar-from").value="";document.getElementById("calendar-to").value="";applyCalendarPreview(false);}
function importCalendarSources(sources){
  var available=sources.filter(function(source){return !findImportedEventForCalendar(source);});if(!available.length)return;
  var importedId;
  mutateDraft("Before importing calendar events",function(){
    available.forEach(function(source){
      var sourceWithUrl=Object.assign({},source,{url:calendarIsFictional?"":source.url||calendarSourceUrl,practice:calendarIsFictional||source.practice});
      importedId=allocateEventId();eventExpansion[importedId]=true;
      events.push(Core.calendarEventToNewsletter(sourceWithUrl,importedId,calendarTimeZone));calendarSelected.delete(source.id);
    });
    if(autoSortEvents)sortEventsChronologically(false);
  });
  document.getElementById("edit-feedback-text").textContent=available.length+" event"+(available.length===1?"":"s")+" imported.";
  switchTabByName("events");document.getElementById("event-"+importedId+"-title").focus();
}
function importSelectedCalendarEvents(){importCalendarSources(calendarEvents.filter(function(event){return calendarSelected.has(event.id);}));}
function importCalendarEvent(index){
  var source=calendarEvents[index];if(!source)return;
  var imported=findImportedEventForCalendar(source);
  if(imported){if(calendarImportNeedsUpdate(imported,source))updateCalendarEvent(index);return;}
  importCalendarSources([source]);
}

function applyCalendarUpdate(imported,source){
  var sourceWithUrl=Object.assign({},source,{url:calendarIsFictional?"":source.url||calendarSourceUrl});
  var next=Core.calendarEventToNewsletter(sourceWithUrl,imported.id,calendarTimeZone);
  var image={showImg:imported.showImg,imgUrl:imported.imgUrl,imgAlt:imported.imgAlt};
  var practice=Boolean(imported.practice)||next.practice;
  Object.assign(imported,next,image,{practice:practice});
}

function updateCalendarEvent(index){
  var source=calendarEvents[index],imported=source&&findImportedEventForCalendar(source);if(!source||!imported)return;
  backupCurrentDraft("Before syncing imported calendar event");
  applyCalendarUpdate(imported,source);
  if(autoSortEvents)sortEventsChronologically(false);else renderEventList();
  renderCalendarList();render();autoSave();
}

function syncImportedCalendarEvents(){
  var updates=events.map(function(imported){var source=imported.sourceEventId&&findCalendarEventForImported(imported);return source&&calendarImportNeedsUpdate(imported,source)?{imported:imported,source:source}:null;}).filter(Boolean);
  if(!updates.length){updateCalendarSyncButton();return;}
  backupCurrentDraft("Before syncing imported calendar events");
  updates.forEach(function(update){applyCalendarUpdate(update.imported,update.source);});
  if(autoSortEvents)sortEventsChronologically(false);else renderEventList();
  renderCalendarList();render();autoSave();
  document.getElementById("calendar-status").textContent=updates.length+" imported event"+(updates.length===1?" was":"s were")+" updated from the calendar.";
}

var pendingCalendarUpdates=[];
function reviewCalendarUpdates(index){
  pendingCalendarUpdates=events.map(function(imported){var source=imported.sourceEventId&&findCalendarEventForImported(imported);return source&&calendarImportNeedsUpdate(imported,source)&&(index==null||source===calendarEvents[index])?{id:imported.id,source:source}:null;}).filter(Boolean);
  var panel=document.getElementById("calendar-update-review");if(!pendingCalendarUpdates.length){panel.hidden=true;return;}
  var fields=["title","date","time","location","description","eventType","linkUrl"];
  panel.innerHTML='<h3 tabindex="-1" id="calendar-update-heading">Review calendar changes</h3><p>Choose which changes to apply. Unchecked fields keep your newsletter copy. Images stay as they are.</p>'+pendingCalendarUpdates.map(function(update,i){
    var current=events.find(function(event){return event.id===update.id;}),next=Core.calendarEventToNewsletter(Object.assign({},update.source,{url:calendarIsFictional?"":update.source.url||calendarSourceUrl}),update.id,calendarTimeZone);
    return '<fieldset><legend>'+escHtml(current.title)+'</legend>'+fields.filter(function(field){return String(current[field]||"")!==String(next[field]||"")||(field==="date"&&current.dateISO!==next.dateISO);}).map(function(field){return '<label class="sync-change"><input type="checkbox" data-update="'+i+'" data-field="'+field+'" checked> <strong>'+escHtml(field)+'</strong><span>Current: '+escHtml((current[field]||"(empty)")+(field==="date"&&current.dateISO?" ("+current.dateISO+")":""))+'</span><span>Calendar: '+escHtml((next[field]||"(empty)")+(field==="date"&&next.dateISO?" ("+next.dateISO+")":""))+'</span></label>';}).join("")+'</fieldset>';
  }).join("")+'<div class="calendar-toolbar"><button class="btn btn-blue" onclick="applyReviewedCalendarUpdates()">Apply selected changes</button><button class="btn btn-ghost" onclick="cancelCalendarUpdateReview()">Cancel</button></div>';
  panel.hidden=false;document.getElementById("calendar-update-heading").focus();panel.scrollIntoView({block:"nearest"});
}
function cancelCalendarUpdateReview(){pendingCalendarUpdates=[];document.getElementById("calendar-update-review").hidden=true;var button=document.getElementById("sync-calendar-imports");(button.hidden?document.querySelector('#tab-calendar button'):button).focus();}
function applyReviewedCalendarUpdates(){
  if(!pendingCalendarUpdates.length)return;
  var choices=Array.from(document.querySelectorAll('#calendar-update-review input:checked')).map(function(input){return {index:Number(input.dataset.update),field:input.dataset.field};});
  mutateDraft("Before applying reviewed calendar changes",function(){
    pendingCalendarUpdates.forEach(function(update,i){
      var current=events.find(function(event){return event.id===update.id;});if(!current)return;
      var next=Core.calendarEventToNewsletter(Object.assign({},update.source,{url:calendarIsFictional?"":update.source.url||calendarSourceUrl}),update.id,calendarTimeZone);
      choices.filter(function(choice){return choice.index===i;}).forEach(function(choice){current[choice.field]=next[choice.field];if(choice.field==="date")current.dateISO=next.dateISO;if(choice.field==="linkUrl"){current.showLink=next.showLink;current.linkText=next.linkText;}});
      ["sourceEventId","sourceStart","sourceUpdated","sourceFingerprint"].forEach(function(field){current[field]=next[field];});current.practice=Boolean(current.practice)||next.practice;
    });
    if(autoSortEvents)sortEventsChronologically(false);
  });
  cancelCalendarUpdateReview();
}
