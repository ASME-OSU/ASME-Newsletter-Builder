import assert from 'node:assert/strict';
import test from 'node:test';
import {JSDOM} from 'jsdom';
import {loadBuilderHTML} from './helpers/load-builder.mjs';
async function setup({compact=false,width=1440,saved}={}){
  let media;
  const dom=new JSDOM(loadBuilderHTML(),{url:'https://isolated.invalid/',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){
    Object.defineProperty(w,'innerWidth',{value:width,writable:true,configurable:true});
    const listeners=[];
    media={matches:compact,addEventListener(type,fn){listeners.push(fn);},setMatches(value){this.matches=value;listeners.forEach(fn=>fn({matches:value}));}};
    w.matchMedia=()=>media;w.fetch=async()=>({ok:true,json:async()=>({events:[]})});w.alert=()=>{};w.confirm=()=>true;
    if(saved!==undefined)w.localStorage.setItem('asme_nl_sidebar_width',String(saved));
    w.HTMLElement.prototype.scrollIntoView=function(){};
  }});
  await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
  await new Promise(resolve=>setTimeout(resolve,10));
  return {w:dom.window,d:dom.window.document,media};
}
function pointer(w,target,type,x,id=7){const e=new w.Event(type,{bubbles:true,cancelable:true});Object.defineProperties(e,{clientX:{value:x},button:{value:0},pointerId:{value:id}});target.dispatchEvent(e);}
function key(w,target,name,shiftKey=false){target.dispatchEvent(new w.KeyboardEvent('keydown',{key:name,shiftKey,bubbles:true,cancelable:true}));}
const width=d=>Number(d.getElementById('sidebar-resizer').getAttribute('aria-valuenow'));

test('separator dragging resizes and saves only the layout preference, leaving the draft clean',async()=>{
  const {w,d}=await setup();try{
    const handle=d.getElementById('sidebar-resizer');w.flushDraftSave();
    const draft=w.localStorage.getItem('asme_nl_draft');
    assert.equal(width(d),420);assert.equal(handle.hidden,false);
    pointer(w,handle,'pointerdown',420);pointer(w,d,'pointermove',555);
    assert.equal(width(d),555);assert.equal(w.localStorage.getItem('asme_nl_sidebar_width'),null);
    assert.equal(d.getElementById('main').classList.contains('resizing-sidebar'),true);
    pointer(w,d,'pointerup',555);
    assert.equal(w.localStorage.getItem('asme_nl_sidebar_width'),'555');
    assert.equal(d.getElementById('main').style.getPropertyValue('--sidebar-width'),'555px');
    assert.equal(d.getElementById('main').classList.contains('resizing-sidebar'),false);
    assert.equal(w.localStorage.getItem('asme_nl_draft'),draft);assert.equal(w.draftSavePending,false);
  }finally{w.close();}
});

test('resize limits protect both panes and keyboard and reset actions are available',async()=>{
  const {w,d}=await setup({width:1200});try{
    const handle=d.getElementById('sidebar-resizer');
    handle.focus();key(w,handle,'End');assert.equal(width(d),628);
    key(w,handle,'ArrowRight');assert.equal(width(d),628);
    key(w,handle,'Home');assert.equal(width(d),340);
    key(w,handle,'ArrowLeft');assert.equal(width(d),340);
    key(w,handle,'ArrowRight',true);assert.equal(width(d),388);
    key(w,handle,'Enter');assert.equal(width(d),420);
    key(w,handle,'ArrowRight');assert.equal(width(d),436);
    handle.dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true}));assert.equal(width(d),420);
    assert.equal(d.activeElement,handle);assert.equal(handle.getAttribute('aria-valuetext'),'Balanced editor width');
  }finally{w.close();}
});

test('escape, pointer cancellation and loss of focus cancel an unfinished resize',async()=>{
  const {w,d}=await setup({saved:500});try{
    const handle=d.getElementById('sidebar-resizer');
    for(const cancel of ['escape','pointercancel','blur']){
      pointer(w,handle,'pointerdown',500);pointer(w,d,'pointermove',650);assert.equal(width(d),650);
      if(cancel==='escape')key(w,handle,'Escape');else if(cancel==='blur')w.dispatchEvent(new w.Event('blur'));else pointer(w,d,'pointercancel',650);
      assert.equal(width(d),500);assert.equal(w.localStorage.getItem('asme_nl_sidebar_width'),'500');
      assert.equal(d.getElementById('main').classList.contains('resizing-sidebar'),false);
    }
  }finally{w.close();}
});

test('saved preference restores, clamps on a smaller desktop and survives compact and fullscreen views',async()=>{
  const {w,d,media}=await setup({saved:720});try{
    const handle=d.getElementById('sidebar-resizer');assert.equal(width(d),720);
    w.innerWidth=1200;w.dispatchEvent(new w.Event('resize'));assert.equal(width(d),628);
    assert.equal(w.localStorage.getItem('asme_nl_sidebar_width'),'720');
    media.setMatches(true);assert.equal(handle.hidden,true);assert.equal(handle.tabIndex,-1);
    w.innerWidth=1440;media.setMatches(false);assert.equal(width(d),720);assert.equal(handle.hidden,false);
    w.toggleFullscreen();assert.equal(handle.hidden,true);w.toggleFullscreen();assert.equal(handle.hidden,false);
  }finally{w.close();}
});

test('sidebar menus close when changing section and feature actions retain their destination focus',async()=>{
  const {w,d}=await setup();try{
    const first=w.events[0];w.eventExpansion[first.id]=true;w.renderEventList();
    let menu=d.querySelector('.event-actions-menu');menu.querySelector('summary').click();assert.equal(menu.open,true);
    w.switchTabByName('calendar');assert.equal(menu.open,false);
    assert.equal(d.querySelectorAll('#tab-calendar details').length,1,'calendar has one optional disclosure');
    assert.equal(d.getElementById('list-options').querySelector('summary'),null,'list actions are directly available');
    w.switchTabByName('events');menu=d.querySelector('.event-actions-menu');menu.querySelector('summary').click();
    menu.querySelector('[data-action="feature"]').click();
    assert.equal(d.getElementById('tab-featured').classList.contains('active'),true);
    assert.equal(d.activeElement.id,'feat-title');
    assert.equal(d.getElementById('feat-title').value,first.title);
  }finally{w.close();}
});


test('divider compensates for a reserved scrollbar lane without changing sidebar width',async()=>{
  const {w,d}=await setup();try{
    const editor=d.getElementById('editor');
    Object.defineProperty(editor,'offsetWidth',{value:420,configurable:true});
    Object.defineProperty(editor,'clientWidth',{value:414,configurable:true});
    w.sidebarLayout.refresh();
    assert.equal(d.getElementById('main').style.getPropertyValue('--sidebar-optical-offset'),'-3px');
    assert.equal(width(d),420);
    Object.defineProperty(editor,'clientWidth',{value:420,configurable:true});w.sidebarLayout.refresh();
    assert.equal(d.getElementById('main').style.getPropertyValue('--sidebar-optical-offset'),'0px');
  }finally{w.close();}
});
