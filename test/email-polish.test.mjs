import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {loadBuilderHTML} from './helpers/load-builder.mjs';
async function setup(){
 const dom=new JSDOM(loadBuilderHTML(),{url:'https://isolated.invalid/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.matchMedia=()=>({matches:false,addEventListener(){}});w.fetch=async()=>({ok:true,json:async()=>({events:[]})});w.alert=()=>{};w.confirm=()=>true;w.HTMLElement.prototype.scrollIntoView=function(){};}});
 await new Promise(r=>dom.window.addEventListener('load',r,{once:true}));await new Promise(r=>setTimeout(r,30));return dom.window;
}
test('date checks use reliable years, flag canonical disagreement and skip ambiguous ranges',async()=>{
 const w=await setup();try{const C=w.Core;
 assert.equal(C.dateConsistency('Thursday, May 29th, 2026').expectedWeekday,'Friday');
 assert.equal(C.dateConsistency('Thursday, May 29th, 2026').weekdayMismatch,true);
 assert.equal(C.dateConsistency('Thursday, May 29th, 2025').weekdayMismatch,false);
 assert.equal(C.dateConsistency('Thursday, May 29th'),null);
 assert.equal(C.dateConsistency('May 29–30, 2026'),null);
 assert.equal(C.dateConsistency('May 29 and June 2, 2026'),null);
 assert.equal(C.dateConsistency('May 29','2026-05-30').calendarMismatch,true);
 const state=w.collectState();state.fields['feat-date']='Thursday, May 29th, 2026';state.fields['feat-dateISO']='';
 const issues=w.NewsletterReadiness.check(state,{});assert.ok(issues.some(i=>!i.ok&&i.field==='feat-date'&&/weekday/.test(i.label)));
 state.fields['feat-date']='Thursday, May 29th';state.fields['issue-bar-text']='December 2026–January 2027';state.fields['s-send-date']='';
 assert.equal(w.NewsletterReadiness.check(state,{}).some(i=>/weekday/.test(i.label)),false);
 }finally{w.close();}
});
test('export skips redundant copy and provides contextual, table-backed event buttons',async()=>{
 const w=await setup();try{const state=w.collectState();state.events=[w.Core.normalizeEvent({id:901,title:'ASME: Friendsgiving',date:'Nov 19',dateISO:'2026-11-19',description:'Friendsgiving',showLink:true,linkText:'View Event',linkUrl:'https://calendar.google.com/calendar/embed?src=test'},901)];
 const doc=new JSDOM(w.renderEmailHTML(state)).window.document,card=doc.querySelector('.email-event');
 assert.ok(card);assert.equal(card.textContent.split('Friendsgiving').length-1,1);assert.match(card.textContent,/Thu/);
 const link=card.querySelector('a');assert.equal(link.textContent,'See calendar');assert.match(link.getAttribute('aria-label'),/Friendsgiving/);
 assert.equal(link.closest('td').getAttribute('height'),'44');assert.ok(link.closest('td').getAttribute('bgcolor'));assert.match(link.getAttribute('style'),/display:inline-block/);
 assert.equal(w.Core.eventLinkLabel({linkUrl:'https://calendar.google.com/calendar/event?eid=abc',linkText:'View Event'}),'View Event');
 assert.equal(w.Core.eventLinkLabel({linkUrl:'https://calendar.google.com/calendar/embed',linkText:'Open schedule'}),'Open schedule');
 assert.equal(w.emailButtonHTML('javascript:alert(1)','Bad','#fff','#000'),'');
 assert.equal(state.events[0].description,'Friendsgiving');
 assert.doesNotMatch(doc.documentElement.outerHTML,/icons8/);
 }finally{w.close();}
});
test('mirror setting is optional, survives handoff and defaults, and older drafts clear it',async()=>{
 const w=await setup();try{const box=w.document.getElementById('s-mirror-link');
 assert.equal(box.checked,false);assert.doesNotMatch(w.generateHTML(),/\{\{ mirror \}\}/);
 box.checked=true;const state=w.collectState();assert.equal(state.fields['s-mirror-link'],'1');assert.match(w.renderEmailHTML(state),/\{\{ mirror \}\}/);
 w.saveOrganizationDefaults();box.checked=false;w.applyOrganizationDefaults(w.getOrganizationDefaults());assert.equal(box.checked,true);
 const round=w.Core.readDraftDocument(JSON.stringify(w.Core.createDraftDocument(state)));w.applyState(round);assert.equal(box.checked,true);
 w.applyState({events:[],fields:{}});assert.equal(box.checked,false);
 const output=w.generateHTML();assert.match(output,/format-detection/);assert.match(output,/color-scheme/);assert.ok(output.split('&#8204;&nbsp;').length>60);
 assert.equal(w.Core.knownLogoSize('https://example.com/custom.png'),null);
 assert.equal(w.Core.knownLogoSize('https://img.mailinblue.com/11115816/images/content_library/original/6a5740d5d5fa2e1f36b1638d.png').height,120);
 }finally{w.close();}
});
test('Guide opens Auto-fill review without applying it',async()=>{
 const w=await setup();try{const before=JSON.stringify(w.collectState());w.openInfoDialog();
 const button=Array.from(w.document.querySelectorAll('.guide-shortcuts button')).find(b=>b.textContent.includes('Auto-fill issue'));assert.ok(button);button.click();await new Promise(r=>setTimeout(r,30));
 assert.equal(w.document.getElementById('prepare-issue-modal').classList.contains('open'),true);assert.equal(JSON.stringify(w.collectState()),before);
 }finally{w.close();}
});

test('email and preview use sharp hosted PNGs for matching quick links and the real GroupMe mark',async()=>{
 const w=await setup();try{
  const doc=new JSDOM(w.generateHTML()).window.document;
  const images=Array.from(doc.querySelectorAll('img[src*="/email-icons/"]'));
  assert.deepEqual(images.map(img=>img.src.split('/').pop()),['members.png','calendar.png','partnership.png','instagram.png','linkedin.png','groupme.png']);
  for(const img of images){
   assert.ok(img.src.startsWith('https://asme-osu.github.io/ASME-Newsletter-Builder/'));
   assert.equal(img.alt,'');assert.equal(img.getAttribute('height'),img.getAttribute('width'));
   const file=fs.readFileSync(new URL('../assets/email-icons/'+img.src.split('/').pop(),import.meta.url));
   assert.equal(file.subarray(1,4).toString(),'PNG');assert.equal(file.readUInt32BE(16),144);assert.equal(file.readUInt32BE(20),144);
  }
  assert.match(doc.querySelector('img[src$="groupme.png"]').closest('a').textContent,/GroupMe/);
  assert.equal(w.document.querySelectorAll('.action-card img[src^="assets/email-icons/"]').length,3);
  assert.equal(w.quickLinkIconName('Contact Us','https://example.com'),'contact');
  assert.equal(w.quickLinkIconName('Custom resource','https://example.com'),'files');
  assert.equal(w.quickLinkIconName('<img onerror=bad>','javascript:bad'),'link');
 }finally{w.close();}
});

test('shared action cards and footer preserve configured content and match preview/export',async()=>{
 const w=await setup();try{
  const state=w.collectState();Object.assign(state.fields,{
   'ql1-title':'Join our chapter','ql1-sub':'Skills & friendships','ql1-btn':'Become a member','ql1-url':'https://example.com/join?source=issue&x=1',
   'footer-name':'Custom Chapter','footer-addr':'Full organization name\n@ University affiliation\nScott Laboratory, Office N147\nCustom address',
   's-ig-url':'https://example.com/instagram','s-li-url':'https://example.com/linkedin','s-gm-url':'https://example.com/groupme','s-website':'https://example.com/site','s-unsub':'{{ unsubscribe }}'});
  w.applyState(state);const before=JSON.stringify(w.collectState());
  const exported=new JSDOM(w.generateHTML()).window.document;
  const preview=w.document.getElementById('preview-inner');
  function normalize(html){return html.replaceAll(w.EMAIL_ICON_BASE,'assets/email-icons/');}
  for(const selector of ['.newsletter-actions','.newsletter-footer'])assert.equal(normalize(exported.querySelector(selector).outerHTML),preview.querySelector(selector).outerHTML);
  const cards=exported.querySelectorAll('.action-card');assert.equal(cards.length,3);
  assert.equal(cards[0].getAttribute('bgcolor'),'#ffffff');assert.equal(cards[0].querySelector('.email-button td').getAttribute('bgcolor'),'#ba0c2f');
  assert.equal(cards[1].querySelector('.email-button td').getAttribute('bgcolor'),'#ffffff');
  assert.equal(cards[0].querySelector('a').getAttribute('href'),state.fields['ql1-url']);assert.match(cards[0].textContent,/Skills & friendships/);
  assert.equal(exported.querySelectorAll('.footer-col').length,2);assert.equal(exported.querySelector('.footer-main').getAttribute('bgcolor'),'#25282d');
  assert.equal(exported.querySelector('.footer-subscription').contains(exported.querySelector('a[href="{{ unsubscribe }}"]')),true);
  for(const key of ['s-ig-url','s-li-url','s-gm-url','s-website'])assert.ok(Array.from(exported.querySelectorAll('.newsletter-footer a')).some(a=>a.getAttribute('href')===state.fields[key]));
  assert.match(exported.querySelector('.pv-footer-addr').textContent,/Custom address/);
  assert.equal(JSON.stringify(w.collectState()),before,'rendering does not modify content or calendar state');
  for(const theme of Object.keys(w.THEMES)){
   const themed={...state,activeTheme:theme};const doc=new JSDOM(w.renderEmailHTML(themed)).window.document;
   assert.equal(doc.querySelector('.action-card').getAttribute('bgcolor'),'#ffffff');assert.equal(doc.querySelector('.footer-main').getAttribute('bgcolor'),'#25282d');
  }
  state.showLinks=false;state.fields['s-gm-url']='javascript:bad';state.fields['footer-addr']='<img src=x onerror=bad>\nSafe address';
  const hidden=new JSDOM(w.renderEmailHTML(state)).window.document;assert.equal(hidden.querySelector('.newsletter-actions'),null);assert.equal(hidden.querySelector('.pv-footer-addr img'),null);assert.equal(hidden.querySelector('a[href^="javascript:"]'),null);
 }finally{w.close();}
});

test('Outlook fallbacks preserve brand surfaces without separating adaptive text from light surfaces',async()=>{
 const w=await setup();try{
  for(const theme of ['light','navy']){
   const state=w.collectState();state.activeTheme=theme;const html=w.renderEmailHTML(state),doc=new JSDOM(html).window.document;
   for(const node of doc.querySelectorAll('[style]')){
    const style=node.getAttribute('style'),bg=style.match(/(?:^|;)background-color:(#[0-9a-f]{6})(?=;|$)/i);
    if(bg&&['BODY','TABLE','TD'].includes(node.tagName))assert.equal(node.getAttribute('bgcolor'),bg[1]);
   }
   assert.match(doc.querySelector('.footer-main').style.boxShadow,/#25282d|rgb\(37, 40, 45\)/);
   assert.ok(doc.querySelector('.email-logo-surface').style.boxShadow);
   assert.equal(doc.querySelector('.action-card').style.boxShadow,'');
   assert.equal(doc.querySelector('.footer-subscription').style.boxShadow,'');
   assert.doesNotMatch(html,/-webkit-text-fill-color|background-image:linear-gradient/);
   assert.equal(w.stabilizeEmailColors(html),html);
   assert.equal(doc.querySelector('script'),null);
  }
 }finally{w.close();}
});
