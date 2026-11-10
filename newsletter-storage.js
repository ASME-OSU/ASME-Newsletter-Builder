/* ── AUTO-SAVE ── */
var autoSaveTimer=null, draftSavePending=false, draftSaveError=false;
function setSaveStatus(status){
  var indicator=document.getElementById("save-indicator");
  indicator.textContent={pending:"Unsaved changes",saving:"Saving…",saved:"✓ Saved",error:"Could not save"}[status];
  indicator.classList.toggle("saved",status==="saved");
  indicator.dataset.status=status;
}
function showStorageWarning(message){
  var warning=document.getElementById("storage-warning");
  warning.hidden=false;
  document.getElementById("storage-warning-message").textContent=message;
}
function flushDraftSave(){
  clearTimeout(autoSaveTimer);autoSaveTimer=null;
  if(!draftSavePending&&!draftSaveError)return true;
  setSaveStatus("saving");
  try{
    localStorage.setItem("asme_nl_draft",JSON.stringify(collectState()));
    draftSavePending=false;draftSaveError=false;setSaveStatus("saved");
    // A backup warning is independent of the current draft's autosave status.
    if(document.getElementById("storage-warning").dataset.reason!=="backup")document.getElementById("storage-warning").hidden=true;
    return true;
  }catch(error){
    draftSavePending=true;draftSaveError=true;setSaveStatus("error");
    document.getElementById("storage-warning").dataset.reason="save";
    showStorageWarning("Your latest changes are only in this tab. Browser storage could not save them. Export a draft before leaving, or retry saving.");
    return false;
  }
}
function autoSave(){
  clearTimeout(autoSaveTimer);draftSavePending=true;
  if(!draftSaveError)setSaveStatus("pending");
  autoSaveTimer=setTimeout(flushDraftSave,800);
}
window.addEventListener("pagehide",flushDraftSave);
window.addEventListener("beforeunload",function(event){
  if(!flushDraftSave()){event.preventDefault();event.returnValue="";}
});
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")flushDraftSave();});
document.addEventListener("click",function(event){
  var link=event.target.closest&&event.target.closest("a[href]");
  if(link&&!link.hasAttribute("download"))flushDraftSave();
},true);

function collectState(){
  return{
    schemaVersion:Core.SCHEMA_VERSION,
    events:events,showFeatured:showFeatured,showAnnounce:showAnnounce,
    showLinks:showLinks,showFeatImg:showFeatImg,showFeatButton:showFeatButton,activeTheme:activeTheme,
    featuredPractice:featuredPractice,
    fields:Core.FIELD_IDS.reduce(function(fields,id){fields[id]=id==="email-width"?getEmailWidth():g(id);return fields;},{})
  };
}

function applyState(state){
  if(!state) return;
  var clean=Core.sanitizeState(state);
  featuredPractice=clean.featuredPractice;
  events=clean.events; nextId=Core.nextEventId(events,100);
  showFeatured=clean.showFeatured; showAnnounce=clean.showAnnounce; showLinks=clean.showLinks;
  showFeatImg=clean.showFeatImg; showFeatButton=clean.showFeatButton; activeTheme=clean.activeTheme;
  if(clean.fields) Object.keys(clean.fields).forEach(function(k){
    var el=document.getElementById(k); if(el){if(el.type==="checkbox"){el.checked=clean.fields[k]==="1";el.value="1";}else el.value=clean.fields[k];}
  });
  document.getElementById("email-width").value=["600","680","760"].indexOf(clean.fields["email-width"])>=0?clean.fields["email-width"]:"680";
  // Sync toggle buttons
  ["featured","announce","links"].forEach(function(w){
    var on=(w==="featured"?showFeatured:w==="announce"?showAnnounce:showLinks);
    var btn=document.getElementById("toggle-"+w);
    if(btn){btn.textContent=on?"On":"Off";btn.className="btn btn-toggle "+(on?"on":"off");btn.setAttribute("aria-pressed",String(on));}
  });
  var fi=document.getElementById("toggle-feat-img");
  if(fi){fi.textContent=showFeatImg?"On":"Off";fi.className="btn btn-sm btn-toggle "+(showFeatImg?"on":"off");fi.setAttribute("aria-pressed",String(showFeatImg));}
  var fb=document.getElementById("toggle-feat-btn");
  if(fb){fb.textContent=showFeatButton?"On":"Off";fb.className="btn btn-toggle "+(showFeatButton?"on":"off");fb.setAttribute("aria-pressed",String(showFeatButton));}
  document.getElementById("feat-img-fields").style.display=showFeatImg?"block":"none";
  buildThemeChips(); renderEventList(); renderCalendarList(); render();
}

function restoreDraft(){
  try{
    var raw=localStorage.getItem("asme_nl_draft");
    if(raw){ applyState(JSON.parse(raw)); return; }
  }catch(e){ console.warn("Draft restore failed:",e); }
  // No draft — render with defaults
  renderEventList(); render();
}

function backupCurrentDraft(reason){
  undoState=Core.sanitizeState(collectState());
  if(!historyRestoring)redoState=null;
  syncDraftHistoryButtons();
  var previousSaved=false;
  try{
    var entry={reason:reason||"Before change",savedAt:new Date().toISOString(),state:Core.sanitizeState(collectState())};
    localStorage.setItem("asme_nl_previous_draft",JSON.stringify(entry));previousSaved=true;
    var revisions=getRevisions(),signature=JSON.stringify(entry.state);
    if(!revisions.length||JSON.stringify(revisions[0].state)!==signature){revisions.unshift(entry);localStorage.setItem("asme_nl_revisions",JSON.stringify(revisions.slice(0,20)));}
    renderRevisionHistory();
    var feedback=document.getElementById("edit-feedback");if(feedback){feedback.hidden=false;document.getElementById("edit-feedback-text").textContent="Previous version saved.";}
    return true;
  }catch(error){
    console.warn("Draft backup failed:",error);
    document.getElementById("storage-warning").dataset.reason="backup";
    showStorageWarning(previousSaved?"Your previous draft snapshot was saved, but revision history could not be updated. Use Undo Last Major Change in Templates for recovery.":"A recovery snapshot could not be saved. Export your current draft before replacing or removing content if you need a backup.");
    return previousSaved;
  }
}

function getRevisions(){try{var revisions=JSON.parse(localStorage.getItem("asme_nl_revisions")||"[]");return Array.isArray(revisions)?revisions:[];}catch(error){return[];}}
function renderRevisionHistory(){
  var list=document.getElementById("revision-list");if(!list)return;
  var revisions=getRevisions();
  if(!revisions.length){list.innerHTML='<div class="empty-state" style="padding:14px 0;">No revisions yet.</div>';return;}
  list.innerHTML=revisions.map(function(entry,index){
    var date=new Date(entry.savedAt),stamp=Number.isNaN(date.getTime())?"Saved version":date.toLocaleString();
    return '<div class="history-item"><div class="history-meta"><strong>'+escHtml(entry.reason||"Saved version")+'</strong>'+escHtml(stamp)+'</div><button class="btn btn-ghost btn-sm" onclick="restoreRevision('+index+')">Restore</button></div>';
  }).join("");
}
function restoreRevision(index){
  var revisions=getRevisions(),entry=revisions[index];if(!entry||!entry.state){alert("That revision is no longer available.");return;}
  var target=entry.state;backupCurrentDraft("Before restoring revision");applyState(target);autoSave();renderRevisionHistory();
}
function clearRevisionHistory(){if(!confirm("Clear all saved revision history from this browser?"))return;localStorage.removeItem("asme_nl_revisions");renderRevisionHistory();}

function downloadJson(data,fileName){
  var blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  var url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=fileName;a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
}

function exportDraft(){
  downloadJson(Core.createDraftDocument(collectState()),Core.exportFilename(g("s-subject")||g("issue-bar-text"),"json"));
}

function importDraft(ev){
  var file=ev.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(event){
    try{
      var state=Core.readDraftDocument(event.target.result);
      var backedUp=backupCurrentDraft("Before importing draft");
      if(!backedUp&&!confirm("A recovery snapshot could not be saved. Export your current draft first if you need it. Import anyway?"))return;
      applyState(state);autoSave();
      alert(backedUp?"Draft imported. Your previous draft can be restored from the Templates tab.":"Draft imported without a recovery snapshot of the previous draft.");
    }catch(error){alert("Draft import failed: "+error.message);}
  };
  reader.readAsText(file);ev.target.value="";
}

function restorePreviousDraft(){
  try{
    var raw=localStorage.getItem("asme_nl_previous_draft");
    if(!raw){alert("No previous draft backup is available yet.");return;}
    var backup=JSON.parse(raw);
    if(!backup.state)throw new Error("Backup is invalid");
    var target=Core.sanitizeState(backup.state);
    if(!backupCurrentDraft("Before restore")&&!confirm("A recovery snapshot could not be saved. Restore anyway?"))return;
    applyState(target);
    autoSave();
  }catch(error){alert("Previous draft could not be restored: "+error.message);}
}

function issueLibrary(){return NewsletterLibrary.create(localStorage);}
function renderNamedIssues(){
  var list=document.getElementById("issue-library-list");
  try{list.innerHTML=issueLibrary().list().map(function(issue){return '<div class="history-item"><div class="history-meta"><strong>'+escHtml(issue.name)+'</strong>'+escHtml(new Date(issue.updatedAt).toLocaleString())+'</div><div class="row-gap"><button class="btn btn-ghost btn-sm" data-issue-id="'+escHtml(issue.id)+'" onclick="openNamedIssue(this.dataset.issueId)">Open</button><button class="btn btn-ghost btn-sm" data-issue-id="'+escHtml(issue.id)+'" onclick="replaceNamedIssue(this.dataset.issueId)">Update</button><button class="btn btn-danger btn-sm" data-issue-id="'+escHtml(issue.id)+'" onclick="deleteNamedIssue(this.dataset.issueId)">Delete</button></div></div>';}).join("")||'<p>No named issues saved yet.</p>';}catch(error){document.getElementById("issue-library-status").textContent=error.message;}
}
function saveNamedIssue(){
  try{var name=g("issue-library-name").trim()||g("s-subject").trim();issueLibrary().save(name,collectState());document.getElementById("issue-library-status").textContent="Issue saved in this browser.";renderNamedIssues();}catch(error){document.getElementById("issue-library-status").textContent=error.message;}
}
function openNamedIssue(id){
  try{var target=issueLibrary().load(id);mutateDraft("Before opening saved issue",function(){applyState(target);});switchTabByName("events");document.getElementById("event-count").scrollIntoView({block:"nearest"});}catch(error){document.getElementById("issue-library-status").textContent=error.message;}
}
function replaceNamedIssue(id){
  try{var issue=issueLibrary().list().find(function(item){return item.id===id;});if(!issue||!confirm('Replace saved issue “'+issue.name+'” with the current draft?'))return;issueLibrary().save(issue.name,collectState(),id);document.getElementById("issue-library-status").textContent="Saved issue updated.";renderNamedIssues();}catch(error){document.getElementById("issue-library-status").textContent=error.message;}
}
function deleteNamedIssue(id){
  if(!confirm("Delete this saved issue? Your current draft stays open."))return;
  try{issueLibrary().remove(id);renderNamedIssues();document.getElementById("issue-library-status").textContent="Saved issue deleted.";}catch(error){document.getElementById("issue-library-status").textContent=error.message;}
}
