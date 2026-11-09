var Core=window.NewsletterCore;
var featuredPractice=false;
var nextId=100,showFeatured=true,showAnnounce=true,showLinks=true,showFeatImg=false,showFeatButton=true,activeTheme="light";
var calendarEvents=[],calendarAllEvents=[],calendarCurrentFeed=null,calendarChapterFeed=null,calendarLoadNotice="",calendarLoadPending=false,calendarPreviewYear="",calendarIsFictional=false,calendarLoadGeneration=0,calendarTimeZone="America/New_York",calendarSourceUrl="",calendarFeedLoaded=false;
var calendarSelected=new Set();
var sidebarLayout=null;
var lastFocusedBeforeModal=null;
var autoSortEvents=true,previewMode="desktop",darkSimulation=false;
function getEmailWidth(){var width=g("email-width");return ["600","680","760"].indexOf(width)>=0?width:"680";}
function setEditorTheme(theme){
  var dark=theme==="dark";
  document.documentElement.dataset.editorTheme=dark?"dark":"light";
  var button=document.getElementById("editor-theme-btn");
  button.setAttribute("aria-pressed",String(dark));
  document.getElementById("editor-theme-icon").innerHTML=dark?'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>':'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z"/></svg>';
  document.getElementById("editor-theme-text").textContent=dark?"Light":"Dark";
  button.setAttribute("aria-label",dark?"Switch to light editor mode":"Switch to dark editor mode");
  button.title=dark?"Switch to light editor mode":"Switch to dark editor mode";
  try{localStorage.setItem("asme_nl_editor_theme",dark?"dark":"light");}catch(error){}
}
function toggleEditorTheme(){setEditorTheme(document.documentElement.dataset.editorTheme==="dark"?"light":"dark");}
var ASME_ORG_DEFAULTS={
  "ql1-title":"Join ASME","ql1-sub":"Access events and opportunities.","ql1-btn":"Join Now","ql1-url":"https://org.osu.edu/asme/join/",
  "ql2-title":"Calendar","ql2-sub":"See all upcoming events.","ql2-btn":"See Events","ql2-url":"https://org.osu.edu/asme/calendar/",
  "ql3-title":"Sponsor Us","ql3-sub":"Reach ME students at OSU.","ql3-btn":"Partner","ql3-url":"https://org.osu.edu/asme/sponsor-asme/",
  "footer-name":"Ohio State ASME","footer-addr":"American Society of Mechanical Engineers · Columbus, OH 43210",
  "s-logo":"https://img.mailinblue.com/11115816/images/content_library/original/6a5740d5d5fa2e1f36b1638d.png",
  "s-logo-light":"https://img.mailinblue.com/11115816/images/content_library/original/6a574002fc35afde1ddd649a.png",
  "s-website":"https://org.osu.edu/asme/","s-ig-url":"https://www.instagram.com/asmeohiostate/","s-ig-handle":"@asmeohiostate",
  "s-li-url":"https://www.linkedin.com/company/asme-osu/","s-gm-url":"https://groupme.com/join_group/95825283/iaBgk5Ld","s-unsub":"{{ unsubscribe }}"
};
var ORG_DEFAULT_FIELD_IDS=Object.keys(ASME_ORG_DEFAULTS);
var events=[
  {id:1,date:"MAY 28",title:"CAD Workshop: SolidWorks Basics",time:"5:00 PM",location:"Hitchcock 131",description:"Hands-on intro to SolidWorks for beginners. Laptops provided or bring your own.",eventType:"workshop",accent:"blue",showImg:false,imgUrl:"",imgAlt:"",showLink:false,linkUrl:"",linkText:"Learn More"},
  {id:2,date:"JUN 4",title:"General Body Meeting",time:"6:00 PM",location:"Hitchcock 035",description:"Monthly GBM with project updates, semester announcements, and free food.",eventType:"gbm",accent:"red",showImg:false,imgUrl:"",imgAlt:"",showLink:false,linkUrl:"",linkText:"Learn More"}
];
var EVENT_TYPES={
  event:{label:"Event",accent:"blue"},
  gbm:{label:"GBM",accent:"red"},
  workshop:{label:"Workshop",accent:"blue"},
  social:{label:"Social",accent:"green"},
  info:{label:"Info Session",accent:"gold"},
  tour:{label:"Tour",accent:"blue"}
};
var THEMES={
  navy:{name:"Navy Dark",bg:"#071426",headerBg:"#0f3460",featuredBg:"#0f3460",footerBg:"#0f3460",bodyBg:"#0d1f38",cardBg:"#162d52",cardBorder:"rgba(255,255,255,0.08)",buttonBg:"#0f3460",accent:"#ba0c2f",title:"#ffffff",text:"#d8e2ee",muted:"#a8c4e0",subtle:"#b8c5d4",soft:"#94a3b8",faint:"#94a3b8",border:"rgba(255,255,255,0.14)",tag:"#ff9aae",buttonText:"#ffffff"},
  light:{name:"Light",bg:"#e8ecef",headerBg:"#ffffff",featuredBg:"#fff6f7",footerBg:"#f1f3f5",bodyBg:"#f7f8fa",cardBg:"#ffffff",cardBorder:"#d9dfe5",buttonBg:"#edf0f3",accent:"#ba0c2f",title:"#20262d",text:"#35414c",muted:"#4f5e6b",subtle:"#44525f",soft:"#63717e",faint:"#707d89",border:"#cfd6dd",tag:"#9f0a28",buttonText:"#ffffff"},
  slate:{name:"Slate",bg:"#0e1117",headerBg:"#1c2333",featuredBg:"#1c2333",footerBg:"#1c2333",bodyBg:"#161b27",cardBg:"#1e2a3a",cardBorder:"rgba(255,255,255,0.08)",buttonBg:"#1c2333",accent:"#ba0c2f",title:"#ffffff",text:"#d8e2ee",muted:"#a8c4e0",subtle:"#b8c5d4",soft:"#94a3b8",faint:"#94a3b8",border:"rgba(255,255,255,0.14)",tag:"#ff9aae",buttonText:"#ffffff"},
  dark:{name:"Dark",bg:"#111111",headerBg:"#1a1a1a",featuredBg:"#1a1a1a",footerBg:"#1a1a1a",bodyBg:"#141414",cardBg:"#1f1f1f",cardBorder:"rgba(255,255,255,0.08)",buttonBg:"#1a1a1a",accent:"#ba0c2f",title:"#ffffff",text:"#d8e2ee",muted:"#a8c4e0",subtle:"#b8c5d4",soft:"#94a3b8",faint:"#94a3b8",border:"rgba(255,255,255,0.14)",tag:"#ff9aae",buttonText:"#ffffff"},
  osu:{name:"OSU Red",bg:"#0a0a0a",headerBg:"#1a0000",featuredBg:"#1a0000",footerBg:"#1a0000",bodyBg:"#0f0000",cardBg:"#1c0000",cardBorder:"rgba(255,255,255,0.08)",buttonBg:"#1a0000",accent:"#ba0c2f",title:"#ffffff",text:"#d8e2ee",muted:"#a8c4e0",subtle:"#b8c5d4",soft:"#94a3b8",faint:"#94a3b8",border:"rgba(255,255,255,0.14)",tag:"#ff9aae",buttonText:"#ffffff"}
};

function shouldShowBuilderShortcut(hostname,pathname,isEmbedded){
  if(isEmbedded)return true;
  var hosted=String(hostname||"").toLowerCase()==="asme-osu.github.io";
  var builderPath=/^\/ASME-Newsletter-Builder(?:\/|$)/i.test(String(pathname||""));
  return !(hosted&&builderPath);
}

function updateBuilderShortcutVisibility(){
  var shortcut=document.getElementById("builder-shortcut");if(!shortcut)return;
  shortcut.hidden=!shouldShowBuilderShortcut(window.location.hostname,window.location.pathname,window.self!==window.top);
}

function getActiveLogoUrl(){
  var defaultLogo=Core.safeUrl(g("s-logo"));
  var lightLogo=Core.safeUrl(g("s-logo-light"));
  return activeTheme==="light"&&lightLogo?lightLogo:defaultLogo;
}
function getPreviewLogoUrl(){return darkSimulation?(Core.safeUrl(g("s-logo"))||getActiveLogoUrl()):getActiveLogoUrl();}

function getOrganizationDefaults(){
  try{
    var saved=JSON.parse(localStorage.getItem("asme_nl_org_defaults")||"null");
    return saved&&typeof saved==="object"?Object.assign({},ASME_ORG_DEFAULTS,saved):Object.assign({},ASME_ORG_DEFAULTS);
  }catch(error){return Object.assign({},ASME_ORG_DEFAULTS);}
}
function applyOrganizationDefaults(profile){
  ORG_DEFAULT_FIELD_IDS.forEach(function(id){var el=document.getElementById(id);if(el&&Object.prototype.hasOwnProperty.call(profile,id))el.value=String(profile[id]||"");});
}
function saveOrganizationDefaults(){
  var profile={};ORG_DEFAULT_FIELD_IDS.forEach(function(id){profile[id]=g(id);});
  try{localStorage.setItem("asme_nl_org_defaults",JSON.stringify(profile));alert("Organization defaults saved for future issues on this browser.");}catch(error){alert("Defaults could not be saved in this browser.");}
  render();
}
function restoreAsmeDefaults(){
  if(!confirm("Restore the official ASME branding, links, footer, and GroupMe defaults?"))return;
  backupCurrentDraft("Before restoring ASME defaults");
  applyOrganizationDefaults(ASME_ORG_DEFAULTS);
  try{localStorage.setItem("asme_nl_org_defaults",JSON.stringify(ASME_ORG_DEFAULTS));}catch(error){}
  render();
}

window.onload=function(){
  initializeSectionTabs();
  updateBuilderShortcutVisibility();
  document.getElementById("feat-title").value="Industry Night: Meet Top Engineering Employers";
  document.getElementById("feat-date").value="Thursday, May 29th \u00b7 6:00\u20138:30 PM";
  document.getElementById("feat-location").value="Hitchcock Hall, Room 131";
  document.getElementById("feat-desc").value="Network with recruiters and engineers from Honda, Rolls-Royce, P&G, and more. Bring your resume and dress business casual. Pizza provided.";
  document.getElementById("feat-btn-text").value="RSVP Now";
  document.getElementById("feat-btn-url").value="https://org.osu.edu/asme/calendar/";
  document.getElementById("feat-img-url").value="";
  document.getElementById("feat-img-alt").value="Event photo";
  document.getElementById("ann-title").value="From the Board";
  document.getElementById("ann-quote").value="\u201cWe\u2019re thrilled to kick off the year with our biggest lineup of events yet. Whether you\u2019re here to build skills, network with industry, or meet fellow engineers, there\u2019s something for everyone this semester.\u201d";
  document.getElementById("ann-author").value="Matthew Allen, ASME OSU President 2026\u20132027";
  document.getElementById("issue-bar-text").value="Biweekly Newsletter \u00b7 May 2026";
  applyOrganizationDefaults(getOrganizationDefaults());
  try{setEditorTheme(localStorage.getItem("asme_nl_editor_theme"));}catch(error){setEditorTheme("light");}
  try{autoSortEvents=localStorage.getItem("asme_nl_auto_sort")!=="false";}catch(error){}
  syncAutoSortButton();
  buildThemeChips();
  restoreDraft(); // always populates; falls back to defaults if nothing saved
  renderTemplateList();
  renderNamedIssues();
  renderRevisionHistory();
  loadCalendarEvents(false);
  syncWorkspace();
  sidebarLayout=NewsletterLayout.create({main:document.getElementById("main"),editor:document.getElementById("editor"),handle:document.getElementById("sidebar-resizer"),storage:localStorage,media:compactWorkspace,isFullscreen:function(){return isFullscreen;}});
  document.addEventListener("keydown",function(event){
    var modal=document.querySelector(".modal-overlay.open");
    if(!modal)return;
    if(event.key==="Escape"){
      if(modal.id==="info-modal")closeInfoDialog();else closeChecklist();
      return;
    }
    if(event.key==="Tab"){
      var focusable=Array.prototype.slice.call(modal.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])'));
      if(!focusable.length)return;
      var first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&(document.activeElement===first||!focusable.includes(document.activeElement))){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
};

function openInfoDialog(){
  lastFocusedBeforeModal=document.activeElement;
  var toolbar=lastFocusedBeforeModal&&lastFocusedBeforeModal.closest(".toolbar-menu");
  if(toolbar)lastFocusedBeforeModal=toolbar.querySelector("summary");
  document.getElementById("info-modal").classList.add("open");
  document.querySelector("#info-modal .modal").scrollTop=0;
  setTimeout(function(){document.getElementById("info-title").focus();},0);
}

function openGuideSection(name){
  closeInfoDialog();setWorkspaceView("edit");switchTabByName(name);
  var panel=document.getElementById("tab-"+name);panel.scrollIntoView({block:"start"});
  var target=name==='calendar'?document.getElementById('calendar-search'):panel.querySelector('input,button');if(target)target.focus();
}
function closeInfoDialog(){
  document.getElementById("info-modal").classList.remove("open");
  if(lastFocusedBeforeModal&&lastFocusedBeforeModal.focus)lastFocusedBeforeModal.focus();
}

function buildThemeChips(){
  var r=document.getElementById("theme-row");
  var selectableThemes=["light","navy"];
  var selectedMode=activeTheme==="light"?"light":"navy";
  r.innerHTML=selectableThemes.map(function(k){
    var t=THEMES[k],selected=k===selectedMode;
    return '<button type="button" class="theme-chip '+(selected?'selected':'')+'" aria-pressed="'+selected+'" onclick="setTheme(\''+k+'\')" style="background:'+t.headerBg+';color:'+t.title+';"><span class="theme-dot" style="background:'+t.accent+';"></span>'+t.name+'</button>';
  }).join("");
  var note=document.getElementById("theme-mode-note");
  if(note){
    var legacy=activeTheme!=="light"&&activeTheme!=="navy";
    note.textContent=legacy?
      "This saved draft uses the retired "+THEMES[activeTheme].name+" theme. Choose Light or Navy Dark to update it.":
      "Light is recommended for readability. Use Navy Dark when you want a darker presentation.";
  }
}
function setTheme(k){if(k!=="light"&&k!=="navy")return;activeTheme=k;buildThemeChips();render();}

var workspaceView="edit",workspaceScroll={edit:0,preview:0};
var compactWorkspace=window.matchMedia("(max-width:1199px)");
function syncWorkspace(){
  if(sidebarLayout)sidebarLayout.refresh();
  document.getElementById("app").dataset.workspaceView=workspaceView;
  document.getElementById("preview-desktop-label").textContent=compactWorkspace.matches?"Fit width":"Desktop";
  document.getElementById("preview-desktop-btn").setAttribute("aria-label",compactWorkspace.matches?"Fit width preview":"Desktop preview");
  document.getElementById("workspace-edit").setAttribute("aria-pressed",String(workspaceView==="edit"));
  document.getElementById("workspace-preview").setAttribute("aria-pressed",String(workspaceView==="preview"));
  document.getElementById("topbar").inert=!!isFullscreen;
  document.getElementById("editor").inert=!!isFullscreen||(compactWorkspace.matches&&workspaceView!=="edit");
  document.getElementById("preview-panel").inert=compactWorkspace.matches&&workspaceView!=="preview"&&!isFullscreen;
}
function setWorkspaceView(view){
  if(view!=="edit"&&view!=="preview")return;
  var previous=document.getElementById(workspaceView==="edit"?"editor":"preview-panel");
  workspaceScroll[workspaceView]=previous.scrollTop;
  workspaceView=view;
  syncWorkspace();
  document.getElementById(view==="edit"?"editor":"preview-panel").scrollTop=workspaceScroll[view];
}
compactWorkspace.addEventListener("change",function(){
  var leavingFullscreen=isFullscreen;
  if(isFullscreen){isFullscreen=false;document.getElementById("preview-panel").classList.remove("fullscreen");document.getElementById("fullscreen-btn").textContent="Full Preview";workspaceView="preview";}
  syncWorkspace();
  if(leavingFullscreen&&compactWorkspace.matches)document.getElementById("workspace-preview").focus();
});
function closeToolbarMenus(focus){
  document.querySelectorAll(".toolbar-menu[open]").forEach(function(menu){menu.open=false;if(focus)menu.querySelector("summary").focus();});
}
document.addEventListener("click",function(event){
  var menu=event.target.closest(".toolbar-menu");
  document.querySelectorAll(".toolbar-menu[open]").forEach(function(other){if(other!==menu)other.open=false;});
  if(menu&&event.target.closest("button,a")){menu.open=false;var trigger=menu.querySelector("summary");if(menu.isConnected&&event.target.closest("button")&&!document.querySelector(".modal-overlay.open")&&(!document.activeElement||document.activeElement===document.body||menu.contains(document.activeElement)))trigger.focus();}
});
document.addEventListener("keydown",function(event){if(event.key==="Escape"){closeToolbarMenus(true);if(isFullscreen)toggleFullscreen();}});

function initializeSectionTabs(){
  var tabs=Array.from(document.querySelectorAll('.tab-btn'));
  tabs.forEach(function(tab,index){
    tab.id='section-tab-'+index;tab.tabIndex=tab.classList.contains('active')?0:-1;
    var panel=document.getElementById(tab.getAttribute('aria-controls'));
    panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);
    tab.addEventListener('keydown',function(event){
      var next=index;
      if(event.key==='ArrowRight')next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=tabs.length-1;
      else return;
      event.preventDefault();var target=tabs[next];switchTab(target.getAttribute('aria-controls').slice(4),target);target.focus();
    });
  });
}

function switchTab(name,btn){
  closeToolbarMenus(false);
  document.querySelectorAll(".tab-panel").forEach(function(p){p.classList.remove("active");});
  document.querySelectorAll(".tab-btn").forEach(function(b){b.classList.remove("active");b.setAttribute("aria-selected","false");b.tabIndex=-1;});
  document.getElementById("tab-"+name).classList.add("active");
  btn.classList.add("active"); btn.setAttribute("aria-selected","true");btn.tabIndex=0;
  document.getElementById("section-select").value=name;
}
function switchTabByName(name){
  var btn=document.querySelector('.tab-btn[aria-controls="tab-'+name+'"]');
  if(btn) switchTab(name,btn);
}

function toggleSection(which){
  var map={featured:["showFeatured","toggle-featured"],announce:["showAnnounce","toggle-announce"],links:["showLinks","toggle-links"]};
  var info=map[which];
  if(which==="featured") showFeatured=!showFeatured;
  else if(which==="announce") showAnnounce=!showAnnounce;
  else if(which==="links") showLinks=!showLinks;
  var on=(which==="featured"?showFeatured:which==="announce"?showAnnounce:showLinks);
  var btn=document.getElementById(info[1]);
  btn.textContent=on?"On":"Off"; btn.className="btn btn-toggle "+(on?"on":"off");btn.setAttribute("aria-pressed",String(on));
  render();
}

function toggleFeatImg(){
  showFeatImg=!showFeatImg;
  var btn=document.getElementById("toggle-feat-img");
  btn.textContent=showFeatImg?"On":"Off"; btn.className="btn btn-sm btn-toggle "+(showFeatImg?"on":"off");
  btn.setAttribute("aria-pressed",String(showFeatImg));
  document.getElementById("feat-img-fields").style.display=showFeatImg?"block":"none";
  render();
}

function toggleFeatButton(){
  showFeatButton=!showFeatButton;
  var btn=document.getElementById("toggle-feat-btn");
  btn.textContent=showFeatButton?"On":"Off";
  btn.className="btn btn-toggle "+(showFeatButton?"on":"off");
  btn.setAttribute("aria-pressed",String(showFeatButton));
  render();
}

var eventExpansion={};
function allocateEventId(){
  var used=new Set(events.map(function(event){return event.id;}));
  if(!Number.isSafeInteger(nextId)||nextId<100||nextId>=Number.MAX_SAFE_INTEGER-1)nextId=100;
  while(used.has(nextId)){
    nextId++;
    if(nextId>=Number.MAX_SAFE_INTEGER-1)nextId=100;
  }
  var id=nextId;nextId++;return id;
}
function addEvent(){
  backupCurrentDraft("Before adding event");
  var addedId=allocateEventId();eventExpansion[addedId]=true;
  events.push({id:addedId,date:"MON DD",title:"New Event",time:"",location:"",description:"Event description goes here.",eventType:"event",accent:"blue",showImg:false,imgUrl:"",imgAlt:"",showLink:false,linkUrl:"",linkText:"Learn More"});
  renderEventList(); render();document.getElementById("event-"+addedId+"-title").focus();
}
function removeEvent(id){
  var index=events.findIndex(function(e){return e.id===id;});
  backupCurrentDraft("Before removing event");events=events.filter(function(e){return e.id!==id;});delete eventExpansion[id];renderEventList();renderCalendarList();render();
  var next=events[Math.min(index,events.length-1)];
  var target=next?document.getElementById("event-"+next.id+"-summary"):document.querySelector('[onclick="addEvent()"]');if(target)target.focus();
}
function moveEvent(id,dir){
  var idx=events.findIndex(function(e){return e.id===id;});
  if(dir==="up"&&idx===0) return; if(dir==="down"&&idx===events.length-1) return;
  backupCurrentDraft("Before reordering event");
  setAutoSort(false);
  var swap=dir==="up"?idx-1:idx+1; var tmp=events[idx]; events[idx]=events[swap]; events[swap]=tmp;
  renderEventList(); render();
}
function updateEvent(id,field,value){
  var ev=events.find(function(e){return e.id===id;});
  if(ev){
    if(field==="dateISO"){
      ev.dateISO=Core.normalizeDateISO(value);
      if(ev.dateISO){ev.date=new Date(ev.dateISO+"T12:00:00Z").toLocaleDateString("en-US",{month:"short",day:"numeric",timeZone:"UTC"}).toUpperCase();var label=document.getElementById("event-"+id+"-date");if(label)label.value=ev.date;}
    }else{ev[field]=value;}
  }
  if(field==="accent"||field==="eventType") renderEventList();
  render();
}

function eventDateValue(event){
  var raw=String(event.date||"").trim(),sourceDate=event.sourceStart?new Date(event.sourceStart):null,year=sourceDate&&!Number.isNaN(sourceDate.getTime())?sourceDate.getUTCFullYear():(new Date()).getFullYear();
  if(!/\b\d{4}\b/.test(raw))raw+=" "+year;
  var parsed=event.dateISO?Date.parse(event.dateISO+"T12:00:00"):Date.parse(raw);if(Number.isNaN(parsed))return Number.POSITIVE_INFINITY;
  var time=String(event.time||"").match(/\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b/i);
  if(time){var hours=Number(time[1])%12+(time[3].toUpperCase()==="PM"?12:0),minutes=Number(time[2]||0),date=new Date(parsed);date.setHours(hours,minutes,0,0);parsed=date.getTime();}
  return parsed;
}
function normalizedEventKey(event){return[String(event.title||"").trim().toLowerCase(),String(event.date||"").trim().toLowerCase()].join("|");}
function eventWarnings(event){
  var duplicate=events.some(function(other){return other.id!==event.id&&normalizedEventKey(other)===normalizedEventKey(event)&&event.title.trim()&&event.date.trim();});
  var conflict=events.some(function(other){return other.id!==event.id&&String(other.date||"").trim().toLowerCase()===String(event.date||"").trim().toLowerCase()&&String(other.time||"").trim().toLowerCase()===String(event.time||"").trim().toLowerCase()&&event.date.trim()&&event.time.trim();});
  return{duplicate:duplicate,conflict:conflict};
}
function sortEventsChronologically(showNotice){
  if(showNotice)backupCurrentDraft("Before sorting events");
  events=events.map(function(event,index){return{event:event,index:index};}).sort(function(a,b){var diff=eventDateValue(a.event)-eventDateValue(b.event);return Number.isNaN(diff)||diff===0?a.index-b.index:diff;}).map(function(item){return item.event;});
  renderEventList();render();
}
var eventEditRefreshTimer,eventPointerActive=false,pendingEventRefresh=null;
document.addEventListener('pointerdown',function(){eventPointerActive=true;},true);
function finishEventPointer(){eventPointerActive=false;if(pendingEventRefresh!==null){var sort=pendingEventRefresh;pendingEventRefresh=null;sortAfterEventEdit(sort);}}
document.addEventListener('pointerup',finishEventPointer,true);
document.addEventListener('pointercancel',finishEventPointer,true);
function sortAfterEventEdit(sortByDate){
  // Let Tab and pointer activation finish before replacing their destination.
  clearTimeout(eventEditRefreshTimer);
  if(eventPointerActive){pendingEventRefresh=sortByDate!==false;return;}
  eventEditRefreshTimer=setTimeout(function(){if(autoSortEvents&&sortByDate!==false)sortEventsChronologically(false);else renderEventList();},0);
}
function syncAutoSortButton(){
  var btn=document.getElementById("auto-sort-toggle"),once=document.getElementById("sort-events-once");
  if(btn){btn.textContent=autoSortEvents?"On":"Off";btn.className="btn btn-toggle "+(autoSortEvents?"on":"off")+" btn-sm";btn.setAttribute("aria-pressed",String(autoSortEvents));}
  if(once)once.hidden=autoSortEvents;
}
function setAutoSort(enabled){autoSortEvents=enabled;try{localStorage.setItem("asme_nl_auto_sort",String(autoSortEvents));}catch(error){}syncAutoSortButton();}
function toggleAutoSort(){setAutoSort(!autoSortEvents);if(autoSortEvents)sortEventsChronologically(true);}
function toggleEventLink(id){
  var ev=events.find(function(e){return e.id===id;});
  if(!ev) return; ev.showLink=!ev.showLink; renderEventList(); render();
}
function toggleEventImg(id){
  var ev=events.find(function(e){return e.id===id;});
  if(!ev) return; ev.showImg=!ev.showImg; renderEventList(); render();
}

function renderEventList(){
  var list=document.getElementById("event-list");
  var active=document.activeElement,focusId=list.contains(active)?active.id:null;
  var selection=focusId&&typeof active.selectionStart==='number'?[active.selectionStart,active.selectionEnd]:null;
  list.querySelectorAll('details[data-event-id]').forEach(function(card){eventExpansion[card.dataset.eventId]=card.open;});
  document.getElementById("event-count").textContent=events.length+" event"+(events.length!==1?"s":"");
  list.innerHTML=events.map(function(ev,i){
    var eventType=EVENT_TYPES[ev.eventType]?ev.eventType:"event";
    var warnings=eventWarnings(ev);
    var calendarSource=calendarFeedLoaded&&ev.sourceEventId?findCalendarEventForImported(ev):null;
    var calendarUpdate=calendarSource&&calendarImportNeedsUpdate(ev,calendarSource);
    var sourceStatus=calendarSourceStatus(ev);
    var calendarMissing=sourceStatus==="missing";
    var calendarUnverified=sourceStatus==="unavailable"||sourceStatus==="outside-coverage";
    var sourceStatusLabel=sourceStatus==="outside-coverage"?"Outside Calendar coverage":sourceStatus==="unavailable"?"Calendar not verified":"";
    var open=Object.prototype.hasOwnProperty.call(eventExpansion,ev.id)?eventExpansion[ev.id]:!compactWorkspace.matches&&i===0;
    var status=calendarUpdate?'Calendar update available':calendarMissing?'No longer on Calendar':calendarUnverified?sourceStatusLabel:'';
    if(ev.practice)status+=(status?' · ':'')+'Practice event — remove before sending';
    if(warnings.duplicate)status+=(status?' · ':'')+'Possible duplicate';if(warnings.conflict)status+=(status?' · ':'')+'Schedule conflict';
    return '<details class="editor-card event-editor" data-event-id="'+ev.id+'"'+(open?' open':'')+' ontoggle="if(this.isConnected &amp;&amp; typeof document!==\'undefined\'){eventExpansion[this.dataset.eventId]=this.open;syncEventExpansionButton()}">'+
      '<summary id="event-'+ev.id+'-summary"><span class="event-summary-title">'+escHtml(ev.title||'Untitled event')+'</span><span class="event-summary-meta">'+escHtml([ev.date,ev.time].filter(Boolean).join(' · '))+'</span><span class="event-summary-status">'+escHtml(status)+'</span></summary><div class="event-editor-body">'+
      '<div class="row event-utility-row">'+
        '<div class="row-gap">'+
          '<button class="btn btn-ghost btn-sm event-icon-btn" title="Move event up" aria-label="Move event up" data-action="move-up" onclick="moveEvent('+ev.id+',\'up\')"'+(i===0?' disabled':'')+'><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 19V5m-7 7 7-7 7 7"/></svg></button>'+
          '<button class="btn btn-ghost btn-sm event-icon-btn" title="Move event down" aria-label="Move event down" data-action="move-down" onclick="moveEvent('+ev.id+',\'down\')"'+(i===events.length-1?' disabled':'')+'><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 5v14m-7-7 7 7 7-7"/></svg></button>'+
        '</div>'+
        '<details class="toolbar-menu event-actions-menu"><summary id="event-'+ev.id+'-actions" aria-label="Actions for '+escHtml(ev.title||'untitled event')+'" title="Event actions"><span>Actions</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg></summary><div class="toolbar-popover">'+
          '<button class="btn btn-ghost btn-sm event-icon-btn" data-action="duplicate" onclick="duplicateEvent('+ev.id+')" title="Duplicate" aria-label="Duplicate event"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Duplicate</span></button>'+
          '<button class="btn btn-ghost btn-sm" data-action="feature" onclick="useEventAsFeatured('+ev.id+')">Use as featured</button>'+
          '<button class="btn btn-danger btn-sm" data-action="remove" onclick="removeEvent('+ev.id+')">Remove</button>'+
        '</div></details>'+
      '</div>'+
      ((ev.sourceEventId||warnings.duplicate||warnings.conflict)?'<div style="margin:-3px 0 9px;">'+(calendarUpdate?'<span class="warning-badge">Calendar update available</span> ':calendarMissing?'<span class="warning-badge">No longer on Calendar</span> ':calendarUnverified?'<span class="source-badge">'+sourceStatusLabel+'</span> ':ev.sourceEventId?'<span class="source-badge">Synced from Calendar</span> ':'')+(warnings.duplicate?'<span class="warning-badge">Possible duplicate</span>':'')+(warnings.conflict?'<span class="warning-badge">Schedule conflict</span>':'')+'</div>':'')+
      ((calendarMissing||calendarUnverified)?'<button class="btn btn-ghost btn-sm" data-action="keep-copy" onclick="keepCalendarEvent('+ev.id+')" style="margin-bottom:10px;">Keep newsletter copy</button>':'')+
      '<div class="field"><label>Event Type</label><div class="preset-row">'+
        Object.keys(EVENT_TYPES).map(function(key){
          var type=EVENT_TYPES[key],selected=key===eventType;
          return '<button class="preset-btn '+(selected?'selected':'')+'" aria-pressed="'+String(selected)+'" style="'+(selected?'background:'+getAccentColor(type.accent)+';color:'+getAccentTextColor(type.accent)+';':'')+'" data-action="type-'+key+'" onclick="setEventType('+ev.id+',\''+key+'\')">'+type.label+'</button>';
        }).join("")+
      '</div><button class="preset-fill" data-action="preset" onclick="applyPreset('+ev.id+',\''+eventType+'\')">Fill '+escHtml(EVENT_TYPES[eventType].label)+' preset details</button></div>'+
      '<div class="field-row">'+
        '<div class="field"><label>Date</label><input value="'+escHtml(ev.date)+'" data-field="date" oninput="updateEvent('+ev.id+',\'date\',this.value)" onchange="sortAfterEventEdit()" placeholder="MAY 28"/></div>'+
        '<div class="field"><label>Time</label><input value="'+escHtml(ev.time)+'" data-field="time" oninput="updateEvent('+ev.id+',\'time\',this.value)" onchange="sortAfterEventEdit()" placeholder="6:00 PM"/></div>'+
      '</div>'+
      '<div class="field"><label>Calendar date (for sorting)</label><input type="date" data-field="dateISO" value="'+escHtml(ev.dateISO||'')+'" oninput="updateEvent('+ev.id+',\'dateISO\',this.value)" onchange="sortAfterEventEdit()"/><small>Optional. Keeps the year when planning ahead; the display date above stays editable.</small></div>'+
      '<div class="field"><label>Event Title</label><input value="'+escHtml(ev.title)+'" data-field="title" oninput="updateEvent('+ev.id+',\'title\',this.value)" onchange="sortAfterEventEdit(false)"/></div>'+
      '<div class="field"><label>Location</label><input value="'+escHtml(ev.location)+'" data-field="location" oninput="updateEvent('+ev.id+',\'location\',this.value)" placeholder="Hitchcock 035"/></div>'+
      '<div class="field"><label>Description</label><textarea data-field="description" oninput="updateEvent('+ev.id+',\'description\',this.value)">'+escHtml(ev.description)+'</textarea></div>'+
      '<div class="img-toggle-row">'+
        '<span style="font-family:var(--font-ui);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#a8c4e0;">Event Image</span>'+
        '<button class="btn btn-sm btn-toggle '+(ev.showImg?'on':'off')+'" aria-pressed="'+String(Boolean(ev.showImg))+'" data-action="image" onclick="toggleEventImg('+ev.id+')">'+(ev.showImg?'On':'Off')+'</button>'+
      '</div>'+
      (ev.showImg?
        '<div class="img-fields">'+
          '<div class="field"><label>Image URL</label><input value="'+escHtml(ev.imgUrl)+'" data-field="imgUrl" oninput="updateEvent('+ev.id+',\'imgUrl\',this.value)" placeholder="https://..."/></div>'+
          '<div class="field"><label>Alt Text</label><input value="'+escHtml(ev.imgAlt)+'" data-field="imgAlt" oninput="updateEvent('+ev.id+',\'imgAlt\',this.value)" placeholder="Event photo"/></div>'+
        '</div>':"")+
      '<div class="field" style="margin-top:10px;"><label>Accent Color</label>'+
        '<div class="accent-row">'+
          '<button type="button" class="accent-opt c-blue '+(ev.accent==="blue"?"selected":"")+'" data-action="accent-blue" onclick="updateEvent('+ev.id+',\'accent\',\'blue\')">Blue</button>'+
          '<button type="button" class="accent-opt c-red '+(ev.accent==="red"?"selected":"")+'" data-action="accent-red" onclick="updateEvent('+ev.id+',\'accent\',\'red\')">Red</button>'+
          '<button type="button" class="accent-opt c-green '+(ev.accent==="green"?"selected":"")+'" data-action="accent-green" onclick="updateEvent('+ev.id+',\'accent\',\'green\')">Green</button>'+
          '<button type="button" class="accent-opt c-gold '+(ev.accent==="gold"?"selected":"")+'" data-action="accent-gold" onclick="updateEvent('+ev.id+',\'accent\',\'gold\')">Gold</button>'+
        '</div>'+
      '</div>'+
      '<div class="section-divider" style="margin:10px 0;"></div>'+
      '<div class="img-toggle-row">'+
        '<span style="font-family:var(--font-ui);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#a8c4e0;">Link / Button</span>'+
        '<button class="btn btn-sm btn-toggle '+(ev.showLink?'on':'off')+'" aria-pressed="'+String(Boolean(ev.showLink))+'" data-action="link" onclick="toggleEventLink('+ev.id+')">'+(ev.showLink?'On':'Off')+'</button>'+
      '</div>'+
      (ev.showLink?
        '<div class="img-fields">'+
          '<div class="field"><label>Button Text</label><input value="'+escHtml(ev.linkText||'Learn More')+'" data-field="linkText" oninput="updateEvent('+ev.id+',\'linkText\',this.value)" placeholder="RSVP, Sign Up, Learn More..."/></div>'+
          '<div class="field"><label>URL</label><input value="'+escHtml(ev.linkUrl)+'" data-field="linkUrl" oninput="updateEvent('+ev.id+',\'linkUrl\',this.value)" placeholder="https://..."/></div>'+
        '</div>':"")+
    '</div></details>';
  }).join("");
  syncEventExpansionButton();
  list.querySelectorAll('[data-event-id]').forEach(function(card){
    var id=card.dataset.eventId;
    card.querySelectorAll('input,textarea').forEach(function(input){
      var field=input.dataset.field;if(!field)return;input.id='event-'+id+'-'+field;
      var label=input.closest('.field').querySelector('label');if(label)label.htmlFor=input.id;
    });
    card.querySelectorAll('button').forEach(function(button,index){var action=button.dataset.action||String(index);button.id='event-'+id+'-action-'+action;});
    card.querySelectorAll('.img-toggle-row').forEach(function(row){var button=row.querySelector('button');button.setAttribute('aria-label','Include '+row.querySelector('span').textContent.toLowerCase()+' for '+(events.find(function(ev){return String(ev.id)===id;}).title||'untitled event'));});
    card.querySelectorAll('.accent-opt').forEach(function(button){button.setAttribute('aria-pressed',String(button.classList.contains('selected')));button.setAttribute('aria-label',button.textContent+' accent color');});
    card.querySelectorAll('.field > label').forEach(function(label){if(!label.htmlFor){var group=label.nextElementSibling;if(group){label.id='event-'+id+'-group-'+Array.from(card.querySelectorAll('.field > label')).indexOf(label);group.setAttribute('role','group');group.setAttribute('aria-labelledby',label.id);}}});
  });
  if(focusId){var replacement=document.getElementById(focusId);if(!replacement){var eventId=focusId.match(/^event-(\d+)-/);if(eventId)replacement=document.getElementById('event-'+eventId[1]+'-summary');}if(replacement){var card=replacement.closest('details');if(card)card.open=true;if(replacement.disabled&&card)replacement=card.querySelector('summary');replacement.focus({preventScroll:true});if(selection&&typeof replacement.setSelectionRange==='function')replacement.setSelectionRange(selection[0],selection[1]);}}
}
function syncEventExpansionButton(){
  var cards=Array.from(document.querySelectorAll('#event-list > details')),allOpen=cards.length>0&&cards.every(function(card){return card.open;});
  var button=document.getElementById("expand-events");button.textContent=allOpen?"Collapse all":"Expand all";button.setAttribute("aria-expanded",String(allOpen));button.disabled=!cards.length;
}
function expandAllEvents(){
  var cards=Array.from(document.querySelectorAll('#event-list > details')),open=!cards.every(function(card){return card.open;});
  cards.forEach(function(card){card.open=open;eventExpansion[card.dataset.eventId]=open;});syncEventExpansionButton();
}


function g(id){var el=document.getElementById(id);return el?el.value:"";}
function escHtml(s){return Core.escapeHtml(s);}
function emailText(s){return Core.escapeMultiline(s);}
function emailUrl(s,options){return escHtml(Core.safeUrl(s,options));}
function getAccentColor(a){return{blue:"#176b87",red:"#ba0c2f",green:"#247344",gold:"#a87300"}[a]||"#176b87";}
function getDateColor(a,theme){
  var colors=(theme||activeTheme)==="light"?
    {blue:"#176b87",red:"#9f0a28",green:"#256b40",gold:"#795400"}:
    {blue:"#a8c4e0",red:"#ff9aae",green:"#7dd87d",gold:"#ffd966"};
  return colors[a]||colors.blue;
}
function getAccentTextColor(a){return a==="gold"?"#071426":"#ffffff";}
function getEventTypeLabel(type){return(EVENT_TYPES[type]||EVENT_TYPES.event).label;}

function socialSVG(type){
  var svgs={
    instagram:'<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
    linkedin:'<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    groupme:'<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 3.314 1.343 6.314 3.515 8.485L2 22l2.343-.878C6.077 22.588 8.941 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.76 0-5.293-.894-7.354-2.397l-2.587.968.936-2.625A9.955 9.955 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm5-13H7a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2zm-2 4H7a1 1 0 0 0 0 2h8a1 1 0 0 0 0-2z"/></svg>'
  };
  return svgs[type]||"";
}

function buildSocialIconsPreview(T){
  var igUrl=Core.safeUrl(g("s-ig-url")), liUrl=Core.safeUrl(g("s-li-url")), gmUrl=Core.safeUrl(g("s-gm-url"));
  var icons=[];
  if(igUrl) icons.push({url:igUrl,label:"Instagram",type:"instagram",color:"#ba0c2f"});
  if(liUrl) icons.push({url:liUrl,label:"LinkedIn",type:"linkedin",color:"#0077b5"});
  if(gmUrl) icons.push({url:gmUrl,label:"GroupMe",type:"groupme",color:"#00aff0"});
  if(!icons.length) return '<div style="font-family:Arial,sans-serif;font-size:11px;color:'+T.subtle+';margin-bottom:8px;">Follow us on social media</div>';
  var iconHtml=icons.map(function(ic){
    return '<a href="'+escHtml(ic.url)+'" style="display:inline-flex;align-items:center;gap:6px;background:'+ic.color+';color:#fff;font-family:Arial,sans-serif;font-size:11px;font-weight:700;padding:6px 14px 6px 10px;border-radius:999px;text-decoration:none;margin:0 6px 8px 0;">'+socialSVG(ic.type)+ic.label+'</a>';
  }).join("");
  return '<div style="margin-bottom:10px;">'+iconHtml+'</div>';
}

var draftSignature="",draftState=null,undoState=null,redoState=null,historyRestoring=false;
function documentChanged(){
  draftState=collectState();
  var signature=JSON.stringify(draftState);
  if(signature!==draftSignature){if(!historyRestoring)redoState=null;draftSignature=signature;autoSave();if(linkChecker)linkChecker.invalidate();}
  syncDraftHistoryButtons();
  renderPreview();
}
function render(){documentChanged();}
function mutateDraft(reason,change){
  undoState=Core.sanitizeState(collectState());
  backupCurrentDraft(reason);
  change();
  renderEventList();renderCalendarList();documentChanged();
  document.getElementById("edit-feedback").hidden=false;
  document.getElementById("edit-feedback-text").textContent=reason.replace(/^Before /,"Changed: ");
}
function syncDraftHistoryButtons(){
  var undo=document.getElementById("undo-draft-btn"),redo=document.getElementById("redo-draft-btn");
  if(undo)undo.disabled=!undoState;if(redo)redo.disabled=!redoState;
}
function restoreHistoryState(target,direction){
  var current=Core.sanitizeState(collectState());
  historyRestoring=true;
  try{
    backupCurrentDraft(direction==="undo"?"Before undo":"Before redo");
    applyState(target);
    undoState=direction==="redo"?current:null;
    redoState=direction==="undo"?current:null;
    document.getElementById("edit-feedback").hidden=true;
  }finally{historyRestoring=false;syncDraftHistoryButtons();}
}
function undoDraftChange(){if(undoState)restoreHistoryState(undoState,"undo");}
function redoDraftChange(){if(redoState)restoreHistoryState(redoState,"redo");}
function syncContentControls(){
  [["featured",showFeatured],["announce",showAnnounce],["links",showLinks]].forEach(function(section){
    var fields=document.getElementById(section[0]+"-fields"),note=document.getElementById(section[0]+"-disabled-note");
    if(fields){fields.disabled=!section[1];fields.classList.toggle("section-is-off",!section[1]);}
    if(note)note.hidden=section[1];
  });
  document.getElementById("featured-button-fields").hidden=!showFeatButton;
  [1,2,3].forEach(function(n){document.querySelectorAll(".ql-card-header")[n-1].textContent="Link "+n+(g("ql"+n+"-title").trim()?" · "+g("ql"+n+"-title").trim():"");});
}
function browseFeatureEvents(){
  setWorkspaceView("edit");switchTabByName("events");
  var target=events.length?document.getElementById("event-"+events[0].id+"-summary"):document.querySelector('[onclick="addEvent()"]');if(target)target.focus();
}
function renderPreview(){
  syncContentControls();
  var T=THEMES[activeTheme];
  document.getElementById("preview-panel").style.setProperty("--email-width",getEmailWidth()+"px");
  var logoUrl=getPreviewLogoUrl(),igHandle=g("s-ig-handle"),igUrl=Core.safeUrl(g("s-ig-url")),issueBar=g("issue-bar-text");
  var annTitle=g("ann-title"),annQuote=g("ann-quote"),annAuthor=g("ann-author");
  var footerName=g("footer-name"),footerAddr=g("footer-addr");
  var featTitle=g("feat-title"),featDate=g("feat-date"),featLoc=g("feat-location");
  var featDesc=g("feat-desc"),featBtnText=g("feat-btn-text");
  var featImgUrl=Core.safeUrl(g("feat-img-url")),featImgAlt=g("feat-img-alt");
  var featButtonHTML=showFeatButton?'<span class="pv-feat-btn" style="background:'+T.accent+';color:'+T.buttonText+';">'+escHtml(featBtnText)+'</span>':"";

  var featuredHTML=showFeatured?
    '<div class="pv-featured" style="background:'+T.featuredBg+';border:1px solid '+T.cardBorder+';"><div class="pv-feat-content">'+
    '<div class="pv-feat-tag" style="color:'+T.tag+';">Featured Event</div>'+
    '<div class="pv-feat-title" style="color:'+T.title+';">'+escHtml(featTitle)+'</div>'+
    '<div class="pv-feat-date" style="color:'+T.title+';">'+escHtml(featDate)+'</div>'+
    '<div class="pv-feat-loc" style="color:'+T.muted+';">'+escHtml(featLoc)+'</div>'+
    (showFeatImg&&featImgUrl?'<img class="pv-feat-img" src="'+escHtml(featImgUrl)+'" alt="'+escHtml(featImgAlt)+'" onload="recordImageLoad(this,true)" onerror="recordImageLoad(this,false);this.style.display=\'none\'"/>':'')+
    '<div class="pv-feat-desc" style="color:'+T.text+';">'+escHtml(featDesc)+'</div>'+
    featButtonHTML+
    '</div></div>':"";

  var eventsHTML=events.length===0?'<div class="empty-state">No events yet \u2014 add one in the Events tab</div>':
    events.map(function(ev){
      var bar=getAccentColor(ev.accent),dc=getDateColor(ev.accent);
      var dateParts=Core.splitEventDate(ev.date),typeLabel=getEventTypeLabel(ev.eventType);
      var meta=[ev.time,ev.location].filter(Boolean).join(" \u00b7 ");
      var imgUrl=Core.safeUrl(ev.imgUrl),linkUrl=Core.safeUrl(ev.linkUrl);
      var dateHTML=dateParts.day?
        '<div class="pv-event-month" style="color:'+dc+';">'+escHtml(dateParts.month)+'</div><div class="pv-event-day" style="color:'+T.title+';">'+escHtml(dateParts.day)+'</div>':
        '<div class="pv-event-date-full" style="color:'+dc+';">'+escHtml(dateParts.label)+'</div>';
      return '<div class="pv-event" style="background:'+T.cardBg+';border:1px solid '+T.cardBorder+';overflow:hidden;">'+
        (ev.showImg&&imgUrl?'<img class="pv-event-img" src="'+escHtml(imgUrl)+'" alt="'+escHtml(ev.imgAlt)+'" onload="recordImageLoad(this,true)" onerror="recordImageLoad(this,false);this.style.display=\'none\'"/>':'')+
        '<div class="pv-event-body"><div class="pv-event-type" style="background:'+bar+';color:'+getAccentTextColor(ev.accent)+';">'+escHtml(typeLabel)+'</div>'+
        '<div class="pv-event-layout"><div class="pv-event-date-block">'+dateHTML+'</div><div class="pv-event-content">'+
        '<div class="pv-event-title" style="color:'+T.title+';">'+escHtml(ev.title)+'</div>'+
        (meta?'<div class="pv-event-meta" style="color:'+T.muted+';">'+escHtml(meta)+'</div>':'')+
        '<div class="pv-event-desc" style="color:'+T.subtle+';">'+escHtml(ev.description)+'</div>'+
        (ev.showLink&&linkUrl?'<div style="margin-top:10px;"><a href="'+escHtml(linkUrl)+'" style="display:inline-block;background:'+getAccentColor(ev.accent)+';color:'+getAccentTextColor(ev.accent)+';font-family:Arial,sans-serif;font-size:11px;font-weight:700;padding:7px 16px;border-radius:999px;text-decoration:none;">'+escHtml(ev.linkText||'Learn More')+'</a></div>':'')+
        '</div></div></div></div>';
    }).join("");

  var annHTML=showAnnounce?
    '<div class="pv-announcement" style="background:'+T.cardBg+';border:1px solid '+T.cardBorder+';"><div class="pv-ann-title" style="color:'+T.title+';">'+escHtml(annTitle)+'</div>'+
    '<div class="pv-ann-inner"><div class="pv-ann-bar" style="background:'+T.accent+';"></div>'+
    '<div><div class="pv-ann-quote" style="color:'+T.text+';">'+escHtml(annQuote)+'</div>'+
    (annAuthor.trim()?'<div class="pv-ann-author" style="color:'+T.soft+';">\u2014 <strong style="color:'+T.title+';">'+escHtml(annAuthor)+'</strong></div>':'')+'</div></div></div>':"";

  var qlHTML=showLinks?
    '<div class="pv-quicklinks">'+[1,2,3].map(function(n){
      return '<div class="pv-ql" style="background:'+T.cardBg+';border:1px solid '+T.cardBorder+';"><div class="pv-ql-title" style="color:'+T.title+';">'+escHtml(g("ql"+n+"-title"))+'</div>'+
        '<div class="pv-ql-sub" style="color:'+T.subtle+';">'+escHtml(g("ql"+n+"-sub"))+'</div>'+
        '<span class="pv-ql-btn" style="background:'+T.buttonBg+';color:'+T.title+';border-color:'+T.border+';">'+escHtml(g("ql"+n+"-btn"))+'</span></div>';
    }).join("")+'</div>':"";

  document.getElementById("preview-inner").innerHTML=
    '<div class="pv-header" style="background:'+T.headerBg+';"><div class="pv-topbar" style="background:'+T.accent+';"></div>'+
    '<div class="pv-logo-wrap">'+(logoUrl?'<img src="'+escHtml(logoUrl)+'" alt="ASME OSU" onload="recordImageLoad(this,true)" onerror="recordImageLoad(this,false);this.style.display=\'none\'"/>'
      :'<div style="font-family:Georgia,serif;color:'+T.title+';font-size:22px;">ASME at OSU</div>')+
    '</div><div class="pv-issue" style="background:'+T.accent+';">'+escHtml(issueBar)+'</div></div>'+
    '<div class="pv-body" style="background:'+T.bodyBg+';">'+
    featuredHTML+
    '<div class="pv-section-title" style="color:'+T.title+';border-bottom-color:'+T.border+';">Upcoming Events</div>'+
    eventsHTML+annHTML+qlHTML+
    '</div>'+
    '<div class="pv-footer" style="background:'+T.footerBg+';"><div class="pv-footer-name" style="color:'+T.title+';">'+escHtml(footerName)+'</div>'+
    '<div class="pv-footer-addr" style="color:'+T.subtle+';">'+escHtml(footerAddr)+'</div>'+
    buildSocialIconsPreview(T)+
    '<div class="pv-footer-unsub" style="color:'+T.faint+';">You\'re receiving this because you signed up for ASME OSU updates. <span style="color:'+T.muted+';">Unsubscribe</span></div></div>';
  renderLiveTools();
}

function renderLiveTools(){
  var subject=g("s-subject").trim(),preheader=g("s-preheader").trim();
  var subjectCount=document.getElementById("subject-count"),preheaderCount=document.getElementById("preheader-count");
  if(subjectCount){subjectCount.textContent=subject.length+" / 65 recommended";subjectCount.classList.toggle("warning",subject.length>65);}
  if(preheaderCount){preheaderCount.textContent=preheader.length+" / 100 recommended";preheaderCount.classList.toggle("warning",preheader.length>100);}
  var inboxSubject=document.getElementById("inbox-subject"),inboxPreheader=document.getElementById("inbox-preheader");
  if(inboxSubject)inboxSubject.textContent=subject||"Add a subject line";
  if(inboxPreheader)inboxPreheader.textContent=preheader||"Add preheader text in Settings";
  renderReadiness();
}

function setPreviewMode(mode){
  previewMode=mode==="mobile"?"mobile":"desktop";
  var shell=document.getElementById("preview-shell");if(shell)shell.classList.toggle("preview-mobile",previewMode==="mobile");
  var desktop=document.getElementById("preview-desktop-btn"),mobile=document.getElementById("preview-mobile-btn");
  if(desktop)desktop.setAttribute("aria-pressed",String(previewMode==="desktop"));
  if(mobile)mobile.setAttribute("aria-pressed",String(previewMode==="mobile"));
}
function toggleDarkSimulation(){
  darkSimulation=!darkSimulation;
  document.getElementById("preview-panel").classList.toggle("simulate-client-dark",darkSimulation);
  document.getElementById("preview-dark-btn").setAttribute("aria-pressed",String(darkSimulation));
  document.getElementById("preview-dark-mobile").setAttribute("aria-pressed",String(darkSimulation));
  renderPreview();
}

/* ── TEMPLATES ── */
function getTemplates(){try{var value=JSON.parse(localStorage.getItem("asme_nl_templates")||"[]");return Array.isArray(value)?value:[];}catch(e){return[];}}
function setTemplates(t){localStorage.setItem("asme_nl_templates",JSON.stringify(t));}

function saveTemplate(){
  var name=document.getElementById("template-name-input").value.trim();
  if(!name){alert("Please enter a template name.");return;}
  var tpls=getTemplates();
  tpls=tpls.filter(function(t){return t.name!==name;});
  tpls.unshift({name:name,state:collectState(),saved:new Date().toLocaleDateString()});
  setTemplates(tpls);
  document.getElementById("template-name-input").value="";
  renderTemplateList();
}

function loadTemplate(name){
  var tpls=getTemplates();
  var t=tpls.find(function(t){return t.name===name;});
  if(t){backupCurrentDraft("Before loading template");applyState(t.state);}
}

function deleteTemplate(name){
  var tpls=getTemplates().filter(function(t){return t.name!==name;});
  setTemplates(tpls); renderTemplateList();
}

function loadTemplateByIndex(index){
  var t=getTemplates()[index];
  if(t){backupCurrentDraft("Before loading template");applyState(t.state);}
}

function deleteTemplateByIndex(index){
  var tpls=getTemplates();
  if(index<0||index>=tpls.length) return;
  tpls.splice(index,1);
  setTemplates(tpls);
  renderTemplateList();
}

function renderTemplateList(){
  var tpls=getTemplates();
  var list=document.getElementById("template-list");
  if(!list) return;
  if(tpls.length===0){
    list.innerHTML='<div style="font-family:Arial,sans-serif;font-size:12px;color:#94a3b8;text-align:center;padding:16px 0;">No templates saved yet.</div>';
    return;
  }
  list.innerHTML=tpls.map(function(t,i){
    return '<div class="template-item">'+
      '<div><div class="template-name">'+escHtml(t.name)+'</div>'+
      '<div style="font-family:Arial,sans-serif;font-size:10px;color:#94a3b8;">Saved '+escHtml(t.saved)+'</div></div>'+
      '<div class="template-actions">'+
        '<button class="btn btn-ghost btn-sm" onclick="loadTemplateByIndex('+i+')">Use template</button>'+
        '<button class="btn btn-danger btn-sm" onclick="deleteTemplateByIndex('+i+')">&#10005;</button>'+
      '</div>'+
    '</div>';
  }).join("");
}

function setFields(fields){
  Object.keys(fields).forEach(function(id){
    var el=document.getElementById(id);
    if(el) el.value=fields[id];
  });
}

function applyTemplateState(state){
  featuredPractice=Boolean(state.featuredPractice);
  if(state.events){
    events=[];
    state.events.forEach(function(ev){
      var copy=JSON.parse(JSON.stringify(ev));
      copy.id=allocateEventId();events.push(copy);
    });
  }
  showFeatured=state.showFeatured!==undefined?state.showFeatured:true;
  showAnnounce=state.showAnnounce!==undefined?state.showAnnounce:true;
  showLinks=state.showLinks!==undefined?state.showLinks:true;
  showFeatImg=state.showFeatImg||false;
  showFeatButton=state.showFeatButton!==undefined?state.showFeatButton:true;
  activeTheme=state.activeTheme||activeTheme;
  setFields(state.fields||{});
  applyState(collectState());
  autoSave();
}

function loadBuiltInTemplate(key){
  var templates={
    default:{
      activeTheme:"light",
      showFeatured:true,showAnnounce:true,showLinks:true,showFeatImg:false,showFeatButton:true,
      fields:{
        "s-subject":"ASME OSU Biweekly Newsletter",
        "s-preheader":"Your biweekly update from ASME at The Ohio State University.",
        "issue-bar-text":"Biweekly Newsletter · May 2026",
        "feat-title":"Industry Night: Meet Top Engineering Employers",
        "feat-date":"Thursday, May 29th · 6:00–8:30 PM",
        "feat-location":"Hitchcock Hall, Room 131",
        "feat-desc":"Network with recruiters and engineers from Honda, Rolls-Royce, P&G, and more. Bring your resume and dress business casual. Pizza provided.",
        "feat-btn-text":"RSVP Now",
        "feat-btn-url":"https://org.osu.edu/asme/calendar/",
        "ann-title":"From the Board",
        "ann-quote":"“We’re thrilled to kick off the year with our biggest lineup of events yet. Whether you’re here to build skills, network with industry, or meet fellow engineers, there’s something for everyone this semester.”",
        "ann-author":"Matthew Allen, ASME OSU President 2026–2027",
        "ql1-title":"Join ASME","ql1-sub":"Access events and opportunities.","ql1-btn":"Join Now","ql1-url":"https://org.osu.edu/asme/join/",
        "ql2-title":"Calendar","ql2-sub":"See all upcoming events.","ql2-btn":"See Events","ql2-url":"https://org.osu.edu/asme/calendar/",
        "ql3-title":"Sponsor Us","ql3-sub":"Reach ME students at OSU.","ql3-btn":"Partner","ql3-url":"https://org.osu.edu/asme/sponsor-asme/"
      },
      events:[
        {date:"MAY 28",title:"CAD Workshop: SolidWorks Basics",time:"5:00 PM",location:"Hitchcock 131",description:"Hands-on intro to SolidWorks for beginners. Laptops provided or bring your own.",accent:"blue",showImg:false,imgUrl:"",imgAlt:""},
        {date:"JUN 4",title:"General Body Meeting",time:"6:00 PM",location:"Hitchcock 035",description:"Monthly GBM with project updates, semester announcements, and free food.",accent:"red",showImg:false,imgUrl:"",imgAlt:""}
      ]
    },
    sponsor:{
      activeTheme:"light",
      showFeatured:true,showAnnounce:true,showLinks:true,showFeatImg:false,showFeatButton:true,
      fields:{
        "s-subject":"ASME OSU Sponsor Spotlight",
        "s-preheader":"Meet this issue's featured sponsor and see upcoming career events.",
        "issue-bar-text":"Sponsor Spotlight · May 2026",
        "feat-title":"Sponsor Spotlight: Partnering With ASME at Ohio State",
        "feat-date":"Featured Partner · Recruiting and Outreach",
        "feat-location":"Ohio State Mechanical Engineering",
        "feat-desc":"This issue highlights one of the organizations supporting ASME at OSU, plus upcoming opportunities for students to connect with industry representatives.",
        "feat-btn-text":"View Sponsor Info",
        "feat-btn-url":"https://org.osu.edu/asme/sponsor-asme/",
        "ann-title":"Why Sponsorship Matters",
        "ann-quote":"Sponsor support helps us host technical workshops, professional development nights, plant tours, and student networking events throughout the year.",
        "ann-author":"ASME OSU Executive Board",
        "ql1-title":"Sponsor ASME","ql1-sub":"Reach mechanical engineering students at OSU.","ql1-btn":"Partner With Us","ql1-url":"https://org.osu.edu/asme/sponsor-asme/",
        "ql2-title":"Career Events","ql2-sub":"See upcoming professional opportunities.","ql2-btn":"View Calendar","ql2-url":"https://org.osu.edu/asme/calendar/",
        "ql3-title":"Contact Us","ql3-sub":"Talk with the ASME leadership team.","ql3-btn":"Get in Touch","ql3-url":"https://org.osu.edu/asme/contact/"
      },
      events:[
        {date:"MAY 30",title:"Resume Review Night",time:"5:30 PM",location:"Hitchcock 131",description:"Bring a printed or digital resume for feedback from peers, officers, and industry guests.",accent:"blue",showImg:false,imgUrl:"",imgAlt:""},
        {date:"JUN 6",title:"Industry Q&A Panel",time:"6:00 PM",location:"Scott Lab E100",description:"Ask engineers about internships, full-time roles, research experience, and what to expect after graduation.",accent:"red",showImg:false,imgUrl:"",imgAlt:""}
      ]
    },
    gbm:{
      activeTheme:"navy",
      showFeatured:true,showAnnounce:true,showLinks:true,showFeatImg:false,showFeatButton:false,
      fields:{
        "s-subject":"ASME OSU General Body Meeting",
        "s-preheader":"Meeting agenda, project updates, and upcoming ASME events.",
        "issue-bar-text":"General Body Meeting · May 2026",
        "feat-title":"General Body Meeting",
        "feat-date":"Wednesday, June 4th · 6:00 PM",
        "feat-location":"Hitchcock Hall 035",
        "feat-desc":"Join us for officer updates, project announcements, upcoming event details, and time to meet other mechanical engineering students.",
        "ann-title":"Meeting Agenda",
        "ann-quote":"We will cover upcoming workshops, committee opportunities, project timelines, and ways to get involved this semester.",
        "ann-author":"ASME OSU Executive Board",
        "ql1-title":"Join ASME","ql1-sub":"Become an active member.","ql1-btn":"Join Now","ql1-url":"https://org.osu.edu/asme/join/",
        "ql2-title":"Calendar","ql2-sub":"See what is coming up next.","ql2-btn":"See Events","ql2-url":"https://org.osu.edu/asme/calendar/",
        "ql3-title":"Instagram","ql3-sub":"Follow for reminders and photos.","ql3-btn":"Follow Us","ql3-url":"https://www.instagram.com/asmeohiostate/"
      },
      events:[
        {date:"JUN 4",title:"General Body Meeting",time:"6:00 PM",location:"Hitchcock 035",description:"Monthly GBM with project updates, semester announcements, and food.",accent:"red",showImg:false,imgUrl:"",imgAlt:""},
        {date:"JUN 11",title:"Committee Interest Night",time:"5:30 PM",location:"Hitchcock 131",description:"Learn about events, outreach, design, sponsorship, and communications roles.",accent:"blue",showImg:false,imgUrl:"",imgAlt:""}
      ]
    },
    workshop:{
      activeTheme:"navy",
      showFeatured:true,showAnnounce:false,showLinks:true,showFeatImg:false,showFeatButton:true,
      fields:{
        "s-subject":"ASME OSU Workshop Week",
        "s-preheader":"Build technical skills with hands-on ASME workshops.",
        "issue-bar-text":"Workshop Week · May 2026",
        "feat-title":"CAD Workshop: SolidWorks Basics",
        "feat-date":"Thursday, May 28th · 5:00 PM",
        "feat-location":"Hitchcock Hall 131",
        "feat-desc":"A hands-on introduction to SolidWorks for beginners. Bring your laptop if you have one, or use a provided workstation.",
        "feat-btn-text":"Reserve a Spot",
        "feat-btn-url":"https://org.osu.edu/asme/calendar/",
        "ql1-title":"Prep Materials","ql1-sub":"Review files before the workshop.","ql1-btn":"Open Files","ql1-url":"https://org.osu.edu/asme/",
        "ql2-title":"Calendar","ql2-sub":"See future skill sessions.","ql2-btn":"See Events","ql2-url":"https://org.osu.edu/asme/calendar/",
        "ql3-title":"Suggest a Topic","ql3-sub":"Tell us what to teach next.","ql3-btn":"Submit Idea","ql3-url":"https://org.osu.edu/asme/contact/"
      },
      events:[
        {date:"MAY 28",title:"SolidWorks Basics",time:"5:00 PM",location:"Hitchcock 131",description:"Sketches, extrudes, assemblies, and practical workflow tips for new CAD users.",accent:"blue",showImg:false,imgUrl:"",imgAlt:""},
        {date:"JUN 2",title:"Resume Workshop",time:"6:00 PM",location:"TBD",description:"Tune up your engineering resume before career fair season.",accent:"gold",showImg:false,imgUrl:"",imgAlt:""}
      ]
    },
    social:{
      activeTheme:"navy",
      showFeatured:true,showAnnounce:true,showLinks:true,showFeatImg:false,showFeatButton:true,
      fields:{
        "s-subject":"ASME OSU Social + Recruitment Night",
        "s-preheader":"Meet ASME members, invite friends, and get involved.",
        "issue-bar-text":"Social + Recruitment · May 2026",
        "feat-title":"ASME Mixer and New Member Night",
        "feat-date":"Friday, May 31st · 7:00 PM",
        "feat-location":"Ohio Union",
        "feat-desc":"Bring a friend and meet other mechanical engineering students. We will have food, quick introductions, and low-pressure ways to get involved.",
        "feat-btn-text":"Invite a Friend",
        "feat-btn-url":"https://org.osu.edu/asme/join/",
        "ann-title":"New Members Welcome",
        "ann-quote":"You do not need prior ASME experience to show up. Come for the people, stay for the projects, events, and professional opportunities.",
        "ann-author":"ASME OSU Membership Team",
        "ql1-title":"Join ASME","ql1-sub":"Get connected this semester.","ql1-btn":"Join Now","ql1-url":"https://org.osu.edu/asme/join/",
        "ql2-title":"Instagram","ql2-sub":"See event reminders.","ql2-btn":"Follow Us","ql2-url":"https://www.instagram.com/asmeohiostate/",
        "ql3-title":"Calendar","ql3-sub":"Find the next event.","ql3-btn":"See Events","ql3-url":"https://org.osu.edu/asme/calendar/"
      },
      events:[
        {date:"MAY 31",title:"Mixer and New Member Night",time:"7:00 PM",location:"Ohio Union",description:"A casual social for current members, new members, and friends interested in ASME.",accent:"green",showImg:false,imgUrl:"",imgAlt:""},
        {date:"JUN 5",title:"Officer Interest Chat",time:"5:30 PM",location:"TBD",description:"Ask current officers what leadership roles look like and how to get involved.",accent:"red",showImg:false,imgUrl:"",imgAlt:""}
      ]
    }
    ,endofterm:{
      activeTheme:"navy",
      showFeatured:false,showAnnounce:true,showLinks:true,showFeatImg:false,showFeatButton:false,
      fields:{
        "s-subject":"ASME OSU — End of Semester Wrap-Up",
        "s-preheader":"Thanks for an amazing semester. See you next year!",
        "issue-bar-text":"End of Semester · May 2026",
        "ann-title":"Thanks for an Amazing Semester",
        "ann-quote":"From workshops to industry nights, it has been a fantastic semester. We are proud of everything we accomplished together and excited for what is next. Enjoy your break and we will see you in the fall!",
        "ann-author":"ASME OSU Executive Board",
        "ql1-title":"Follow Us","ql1-sub":"Stay connected over the summer.","ql1-btn":"Instagram","ql1-url":"https://www.instagram.com/asmeohiostate/",
        "ql2-title":"Join Next Year","ql2-sub":"Sign up early for fall membership.","ql2-btn":"Join ASME","ql2-url":"https://org.osu.edu/asme/join/",
        "ql3-title":"Give Feedback","ql3-sub":"Help us improve for next semester.","ql3-btn":"Survey","ql3-url":"https://org.osu.edu/asme/"
      },
      events:[
        {date:"MAY 15",title:"End of Year Social",time:"6:00 PM",location:"TBD — Watch Instagram",description:"Celebrate the end of the semester with food, games, and good company. All members welcome.",accent:"green",showImg:false,imgUrl:"",imgAlt:""},
        {date:"APR 30",title:"Final GBM of the Semester",time:"6:00 PM",location:"Hitchcock 035",description:"Year-end recap, officer transition preview, and thank-yous from the board.",accent:"red",showImg:false,imgUrl:"",imgAlt:""}
      ]
    }
  };
  if(templates[key]){backupCurrentDraft("Before loading built-in template");applyTemplateState(templates[key]);}
}

/* ── DUPLICATE EVENT ── */
function duplicateEvent(id){
  var ev=events.find(function(e){return e.id===id;});
  if(!ev) return;
  var clonedId;
  mutateDraft("Before duplicating event",function(){
  var clone=Core.detachCalendarSource(ev);
  clone.id=allocateEventId();clonedId=clone.id;
  clone.title=clone.title+" (Copy)";
  var idx=events.findIndex(function(e){return e.id===id;});
  events.splice(idx+1,0,clone);eventExpansion[clone.id]=true;
  });
  document.getElementById("event-"+clonedId+"-title").focus();
}

function useEventAsFeatured(id){
  var event=events.find(function(item){return item.id===id;});if(!event)return;
  if(g("feat-title").trim()&&!confirm("Replace the current featured event with this event? The original stays in Upcoming Events."))return;
  mutateDraft("Before replacing featured event",function(){
    showFeatured=true;featuredPractice=Boolean(event.practice)||/^fictional-/.test(event.sourceEventId||"");
    var values={"feat-title":event.title,"feat-date":[event.date,event.time].filter(Boolean).join(" · "),"feat-location":event.location,"feat-desc":event.description,"feat-btn-text":event.linkText||"Learn More","feat-btn-url":event.linkUrl||"","feat-img-url":event.imgUrl||"","feat-img-alt":event.imgAlt||""};
    Object.keys(values).forEach(function(key){document.getElementById(key).value=values[key];});
    showFeatImg=Boolean(event.showImg);showFeatButton=Boolean(event.showLink);applyState(collectState());
  });
  switchTabByName("featured");document.getElementById("feat-title").focus();
}

/* ── EVENT PRESETS ── */
var PRESETS={
  event:{title:"Event Name",time:"6:00 PM",location:"Hitchcock Hall",description:"Brief description of the event.",accent:"blue"},
  gbm:{title:"General Body Meeting",time:"6:00 PM",location:"Hitchcock Hall 035",description:"Monthly GBM with project updates, semester announcements, and free food.",accent:"red"},
  workshop:{title:"Workshop: [Topic]",time:"5:00 PM",location:"Hitchcock Hall 131",description:"Hands-on workshop. Bring your laptop. Open to all skill levels.",accent:"blue"},
  social:{title:"Social Event: [Name]",time:"7:00 PM",location:"[Location TBD]",description:"Come hang out with fellow ASME members. Food and fun provided!",accent:"green"},
  info:{title:"Info Session: [Topic/Company]",time:"5:30 PM",location:"Hitchcock Hall 131",description:"Learn more about [topic/company]. Q&A to follow.",accent:"gold"},
  tour:{title:"Tour: [Facility Name]",time:"[Time TBD]",location:"[Facility Address]",description:"Join us for a tour of [facility]. Space is limited — sign up early!",accent:"blue"}
};

function setEventType(id,key){
  var type=EVENT_TYPES[key]; if(!type) return;
  var ev=events.find(function(e){return e.id===id;});
  if(!ev) return;
  ev.eventType=key; ev.accent=type.accent;
  renderEventList(); render(); autoSave();
}

function applyPreset(id,key){
  var p=PRESETS[key]; if(!p) return;
  var ev=events.find(function(e){return e.id===id;});
  if(!ev) return;
  mutateDraft("Before filling event preset",function(){
  ev.title=p.title; ev.time=p.time; ev.location=p.location;
  ev.description=p.description; ev.eventType=key; ev.accent=p.accent;
  });
}

/* ── FULLSCREEN PREVIEW ── */
var isFullscreen=false;
function toggleFullscreen(){
  if(compactWorkspace.matches){setWorkspaceView(workspaceView==="preview"?"edit":"preview");return;}
  isFullscreen=!isFullscreen;
  var panel=document.getElementById("preview-panel");
  var btn=document.getElementById("fullscreen-btn");
  if(isFullscreen){panel.classList.add("fullscreen");btn.textContent="Exit Full Preview";}
  else{panel.classList.remove("fullscreen");btn.textContent="Full Preview";}
  syncWorkspace();
  (isFullscreen?document.getElementById("fullscreen-exit"):btn).focus();
}

/* ── PRE-SEND CHECKLIST ── */
var checklistCopyMode=true;
var imageLoadResults={};
function recordImageLoad(image,ok){
  var url=image.src,result={ok:ok,width:image.naturalWidth||0,height:image.naturalHeight||0};
  if(JSON.stringify(imageLoadResults[url])===JSON.stringify(result))return;
  imageLoadResults[url]=result;renderReadiness();
}
function enabledNewsletterImages(){
  var images=[];
  if(showFeatured&&showFeatImg&&Core.safeUrl(g("feat-img-url")))images.push({url:Core.safeUrl(g("feat-img-url")),label:"Featured image",tab:"featured",field:"feat-img-url"});
  events.forEach(function(event){if(event.showImg&&Core.safeUrl(event.imgUrl))images.push({url:Core.safeUrl(event.imgUrl),label:event.title||"Event image",tab:"events",field:"event-"+event.id+"-imgUrl",eventId:event.id});});
  return images;
}
function getReadinessChecks(){
  var checks=NewsletterReadiness.check(collectState(),{activeLogo:getActiveLogoUrl(),calendarSourceStatus:calendarSourceStatus,eventWarnings:eventWarnings});
  enabledNewsletterImages().forEach(function(image){if(imageLoadResults[image.url]&&!imageLoadResults[image.url].ok)checks.push({ok:false,label:image.label+" could not load",detail:"Check the image URL or choose another image.",tab:image.tab,field:image.field,eventId:image.eventId});});
  return checks;
}
function fixReadiness(index){
  var issue=getReadinessChecks()[index];if(!issue)return;
  closeChecklist();setWorkspaceView("edit");switchTabByName(issue.tab||"events");
  if(issue.eventId!=null){eventExpansion[issue.eventId]=true;renderEventList();}
  var target=document.getElementById(issue.field||"")||document.getElementById("event-"+issue.eventId+"-summary")||document.querySelector('#tab-'+(issue.tab||'events')+' input');
  if(target){for(var parent=target.parentElement;parent;parent=parent.parentElement)if(parent.tagName==="DETAILS")parent.open=true;target.focus();target.scrollIntoView({block:"nearest"});}
}

function readinessScore(issues){
  if(!issues.length)return 100;
  return Math.round(issues.filter(function(item){return item.ok;}).length/issues.length*100);
}
function renderReadiness(){
  var issues=getReadinessChecks(),score=readinessScore(issues),open=issues.filter(function(item){return!item.ok;});
  var scoreEl=document.getElementById("readiness-score"),fill=document.getElementById("readiness-fill"),summary=document.getElementById("readiness-summary");
  if(scoreEl)scoreEl.textContent=score+"%";
  document.getElementById("mobile-readiness-count").textContent=open.length?open.length+" to review":"Ready";
  document.getElementById("mobile-readiness").setAttribute("aria-label",score+"% of readiness checks passed. "+(open.length?open.length+" items to review":"All readiness checks pass")+". Open checklist");
  document.getElementById("readiness-count").textContent=open.length?open.length+" to review":"All checks passed";
  var state=open.length?"review":"ready",card=document.querySelector(".readiness-card"),track=document.querySelector(".readiness-track");
  if(card)card.dataset.state=state;
  document.getElementById("mobile-readiness").dataset.state=state;
  if(track){track.setAttribute("aria-valuenow",String(score));track.setAttribute("aria-valuetext",score+"% of readiness checks passed. "+(open.length?open.length+" items to review":"All checks passed"));}
  if(fill)fill.style.width=score+"%";
  var imageStatus=document.getElementById("image-load-results");
  if(imageStatus)imageStatus.textContent=enabledNewsletterImages().map(function(image){var result=imageLoadResults[image.url];return image.label+": "+(!result?"Loading image…":!result.ok?"Image could not load":result.width+" × "+result.height+" px");}).join(" · ");
  if(summary)summary.textContent=open.length?(open.length+" item"+(open.length===1?"":"s")+" need attention · "+open[0].label):"All live checks pass. Run the link checker before export.";
}

function showReadinessChecklist(copyMode){
  checklistCopyMode=copyMode;
  var issues=getReadinessChecks();

  var el=document.getElementById("checklist-items");
  function checkRow(i,index){
    return '<div class="checklist-item '+(i.ok?'check-passed':'check-warning')+'"><span class="check-icon" aria-hidden="true">'+(i.ok?"✓":"!")+'</span><div class="check-label">'+escHtml(i.label)+(i.detail&&!i.ok?'<small>'+escHtml(i.detail)+'</small>':'')+'</div>'+(!i.ok?'<button class="btn btn-ghost btn-sm" onclick="fixReadiness('+index+')">Fix</button>':'')+'</div>';
  }
  var warnings=[],passed=[];
  issues.forEach(function(i,index){(i.ok?passed:warnings).push(checkRow(i,index));});
  el.innerHTML=warnings.join("")+(passed.length?'<details class="passed-checks"><summary>'+passed.length+' checks passed</summary>'+passed.join("")+'</details>':'');
  document.getElementById("checklist-title").textContent=copyMode?"Copy to Brevo":"Newsletter Readiness";
  document.getElementById("checklist-subtitle").textContent=warnings.length?warnings.length+" item"+(warnings.length===1?"":"s")+" to review. You can still copy while finishing your draft.":"All content checks passed. Send yourself a test before sending to members.";
  document.getElementById("checklist-primary").textContent=copyMode?"Copy HTML":"Close";
  document.getElementById("checklist-brevo").hidden=!copyMode;
  document.getElementById("checklist-html-step").hidden=!copyMode;
  document.getElementById("checklist-back").textContent="Back to editing";
  var subject=g("s-subject").trim(),preheader=g("s-preheader").trim();
  document.getElementById("checklist-copy-guidance").hidden=!copyMode;
  document.getElementById("checklist-copy-guidance").open=true;
  document.getElementById("checklist-subject-value").value=subject;
  document.getElementById("checklist-preheader-value").value=preheader;
  document.getElementById("copy-subject-btn").disabled=!subject;
  document.getElementById("copy-preheader-btn").disabled=!preheader;
  document.getElementById("checklist-copy-status").textContent="";
  document.getElementById("checklist-copy-status").hidden=true;
  document.querySelector(".checklist-body").scrollTop=0;
  document.getElementById("checklist-modal").classList.add("open");
  lastFocusedBeforeModal=document.activeElement;
  var toolbar=lastFocusedBeforeModal&&lastFocusedBeforeModal.closest(".toolbar-menu");
  if(toolbar)lastFocusedBeforeModal=toolbar.querySelector("summary");
  var dialog=document.querySelector("#checklist-modal .modal");
  dialog.scrollTop=0;el.scrollTop=0;
  setTimeout(function(){document.getElementById("checklist-title").focus({preventScroll:true});dialog.scrollTop=0;el.scrollTop=0;},0);
}
function checklistThenCopy(){showReadinessChecklist(true);}
function openReadinessChecklist(){showReadinessChecklist(false);}

function closeChecklist(){
  document.getElementById("checklist-modal").classList.remove("open");
  if(lastFocusedBeforeModal&&lastFocusedBeforeModal.focus)lastFocusedBeforeModal.focus();
}
function proceedCopy(){if(checklistCopyMode)doCopy();else closeChecklist();}

function collectEnabledLinks(){
  var links=[];
  function add(label,url){if(String(url||"").trim())links.push({label:label,url:String(url).trim(),safe:Core.safeUrl(url)});}
  add("Website",g("s-website"));add("Instagram",g("s-ig-url"));add("LinkedIn",g("s-li-url"));add("GroupMe",g("s-gm-url"));
  if(showFeatured&&showFeatButton)add("Featured button",g("feat-btn-url"));
  if(showLinks)[1,2,3].forEach(function(n){add("Quick link "+n,g("ql"+n+"-url"));});
  events.forEach(function(event,index){if(event.showLink)add("Event "+(index+1)+" button",event.linkUrl);});
  return links;
}
function linkCheckRow(result){
  var icon=result.status==="ok"?"✅":result.status==="redirect"?"↪️":result.status==="invalid"||result.status==="broken"?"⚠️":"ℹ️";
  return '<div class="link-result">'+icon+' <strong>'+escHtml(result.label)+'</strong> — '+escHtml(result.message)+'</div>';
}
function probeLink(link){
  if(!link.safe)return Promise.resolve({label:link.label,status:"invalid",message:"Invalid URL"});
  var controller=typeof AbortController!=="undefined"?new AbortController():null;
  var timer=controller?setTimeout(function(){controller.abort();},7000):null;
  return fetch(link.safe,{method:"HEAD",redirect:"follow",cache:"no-store",signal:controller?controller.signal:undefined}).then(function(response){
    if(timer)clearTimeout(timer);
    if(!response.ok){var blocked=[401,403,405,429].indexOf(response.status)>=0;return{label:link.label,status:blocked?"unverified":"broken",message:blocked?"The site blocked the automated check (HTTP "+response.status+")":"Returned HTTP "+response.status};}
    var redirected=Boolean(response.redirected)||Boolean(response.url&&response.url!==link.safe);
    return{label:link.label,status:redirected?"redirect":"ok",message:redirected?"Redirects to "+response.url:"Reachable"};
  }).catch(function(){if(timer)clearTimeout(timer);return{label:link.label,status:"unverified",message:"Could not verify from this browser (the site may block automated checks)"};});
}
function reviewNewsletterLinks(){
  setWorkspaceView("edit");
  var readiness=document.querySelector(".readiness-card");readiness.open=true;
  readiness.querySelector("summary").focus();readiness.scrollIntoView({block:"nearest"});
  return checkAllLinks();
}
var linkChecker=null;
function getLinkChecker(){
  if(!linkChecker)linkChecker=NewsletterLinks.createChecker({collectLinks:collectEnabledLinks,probe:probeLink,onStatus:function(status){
    var container=document.getElementById("link-check-results");
    if(status.state==="complete")container.innerHTML=status.results.map(linkCheckRow).join("");
    else container.textContent=status.state==="checking"?"Checking "+status.count+" links…":status.state==="stale"?"Links changed. Run Check Links again.":"No enabled links to check.";
  }});
  return linkChecker;
}
function checkAllLinks(){document.querySelector(".readiness-card").open=true;return getLinkChecker().run();}

function exportStatus(message){
  var status=document.getElementById("checklist-copy-status");status.textContent=message;status.hidden=false;
}
function copySubject(){
  copyTextSafely(g("s-subject"),function(){exportStatus("Subject copied. Paste it into Brevo, then copy the inbox preview. The clipboard now contains the subject. Copy HTML last.");},function(){copyGuidanceError("subject");});
}
function copyPreheader(){
  copyTextSafely(g("s-preheader"),function(){exportStatus("Inbox preview copied. Paste it into Brevo, then copy HTML. The clipboard now contains the inbox preview, not HTML.");},function(){copyGuidanceError("inbox preview");});
}
function copyGuidanceError(field){exportStatus("Could not copy the "+field+". Select its text and copy it manually.");}
function copyTextSafely(text,onSuccess,onFailure){
  function fallback(){try{fallbackCopy(text,onSuccess,onFailure);}catch(error){onFailure();}}
  try{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(onSuccess).catch(fallback);else fallback();}catch(error){fallback();}
}

function doCopy(){
  var html=generateHTML(),btn=document.getElementById("checklist-primary");
  btn.disabled=true;
  copyTextSafely(html,function(){
    btn.disabled=false;btn.focus({preventScroll:true});
    exportStatus("HTML copied. Paste it into your campaign’s HTML editor in Brevo. This is a copy only; your newsletter has not been sent. Send yourself a test before sending to members.");
  },function(){
    btn.disabled=false;btn.focus({preventScroll:true});
    exportStatus("HTML could not be copied. Try Copy HTML again, or use Export → Download .html and open the file to copy its source.");
  });
}

/* ── NEW ISSUE ── */
function confirmNewIssue(){
  if(!confirm("Start a fresh issue? This will clear the current draft. Your saved templates will stay.")) return;
  backupCurrentDraft("Before starting new issue");
  // The replacement draft is autosaved below; do not remove the last saved copy first.
  // Reset to defaults
  events=[
    {id:allocateEventId(),date:"MON DD",title:"Event Name",time:"6:00 PM",location:"Hitchcock Hall",description:"Brief description of the event.",eventType:"event",accent:"blue",showImg:false,imgUrl:"",imgAlt:""},
  ];
  featuredPractice=false;
  showFeatured=true; showAnnounce=true; showLinks=true; showFeatImg=false; showFeatButton=true;
  activeTheme="light";
  document.getElementById("email-width").value="680";
  var blanks={
    "feat-title":"","feat-date":"","feat-location":"","feat-desc":"",
    "feat-img-url":"","feat-img-alt":"",
    "feat-btn-text":"RSVP Now","feat-btn-url":"https://org.osu.edu/asme/calendar/",
    "ann-title":"From the Board","ann-quote":"","ann-author":"",
    "issue-bar-text":"Biweekly Newsletter · "+new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'}),
    "s-subject":"","s-preheader":""
  };
  Object.keys(blanks).forEach(function(k){var el=document.getElementById(k);if(el)el.value=blanks[k];});
  applyOrganizationDefaults(getOrganizationDefaults());
  // Synchronize every section control with the reset state, including image/button toggles.
  applyState(collectState());
  switchTabByName("events");
}

/* ── EXPORT / IMPORT TEMPLATES ── */
function exportTemplates(){
  var tpls=getTemplates();
  if(!tpls.length){alert("No saved templates to export.");return;}
  var blob=new Blob([JSON.stringify(tpls,null,2)],{type:"application/json"});
  var a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="asme-newsletter-templates.json";
  a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
}

function importTemplates(ev){
  var file=ev.target.files[0]; if(!file) return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var imported=JSON.parse(e.target.result);
      if(!Array.isArray(imported)) throw new Error("Invalid format");
      var existing=getTemplates();
      var accepted=0;
      imported.slice(0,100).forEach(function(t){
        if(t&&typeof t.name==="string"&&t.name.trim()&&t.state){
          var clean={name:t.name.trim().slice(0,120),state:Core.sanitizeState(t.state),saved:String(t.saved||new Date().toLocaleDateString()).slice(0,80)};
          existing=existing.filter(function(x){return x.name!==clean.name;});
          existing.push(clean);accepted++;
        }
      });
      setTemplates(existing);
      renderTemplateList();
      alert("Imported "+accepted+" valid template(s).");
    }catch(e){alert("Import failed: "+e.message);}
  };
  reader.readAsText(file);
  ev.target.value=""; // reset so same file can be re-imported
}

/* ── END OF SEMESTER built-in template ── */
// (injected into loadBuiltInTemplate via patch below)

function copyHTML(){showReadinessChecklist(true);doCopy();}
function fallbackCopy(text,cb,onFailure){var ta=document.createElement("textarea");ta.value=text;ta.style.cssText="position:fixed;opacity:0;";document.body.appendChild(ta);try{ta.select();var copied=document.execCommand("copy");}finally{document.body.removeChild(ta);}if(copied)cb();else if(onFailure)onFailure();else alert("Copy was blocked. Try Copy HTML again, or download the HTML file.");}
function downloadHTML(){
  var html=generateHTML(),blob=new Blob([html],{type:"text/html"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download=Core.exportFilename(g("s-subject")||g("issue-bar-text"),"html");a.click();
  setTimeout(function(){URL.revokeObjectURL(a.href);},1000);
}
