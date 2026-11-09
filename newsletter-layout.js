(function(global){
  'use strict';
  var DEFAULT_WIDTH=420,MIN_WIDTH=340,MAX_WIDTH=760,PREVIEW_MIN=560,HANDLE_WIDTH=12;
  function limits(available){return {min:MIN_WIDTH,max:Math.max(MIN_WIDTH,Math.min(MAX_WIDTH,Math.floor(available-PREVIEW_MIN-HANDLE_WIDTH)))};}
  function clamp(width,available){var range=limits(available);return Math.round(Math.max(range.min,Math.min(range.max,Number.isFinite(width)?width:DEFAULT_WIDTH)));}
  function create(options){
    var main=options.main,editor=options.editor,handle=options.handle,media=options.media,storage=options.storage;
    var preferred=DEFAULT_WIDTH,drag=null,current=DEFAULT_WIDTH;
    try{var saved=Number(storage.getItem('asme_nl_sidebar_width'));if(saved>=MIN_WIDTH&&saved<=MAX_WIDTH)preferred=saved;}catch(error){}
    function available(){return main.getBoundingClientRect().width||global.innerWidth;}
    function measureScrollbar(){
      var scrollbar=Math.max(0,editor.offsetWidth-editor.clientWidth);
      main.style.setProperty('--sidebar-optical-offset',(-scrollbar/2)+'px');
    }
    function apply(width){
      var range=limits(available());current=clamp(width,available());
      main.style.setProperty('--sidebar-width',current+'px');measureScrollbar();
      handle.setAttribute('aria-valuemin',String(range.min));handle.setAttribute('aria-valuemax',String(range.max));
      handle.setAttribute('aria-valuenow',String(current));handle.setAttribute('aria-valuetext',current<400?'Narrow editor width':current<600?'Balanced editor width':'Wide editor width');
    }
    function save(){preferred=current;try{storage.setItem('asme_nl_sidebar_width',String(preferred));}catch(error){}}
    function stop(commit){
      if(!drag)return;var initial=drag.width,pointer=drag.pointer;drag=null;
      main.classList.remove('resizing-sidebar');
      if(!commit)apply(initial);else save();
      try{if(handle.hasPointerCapture&&handle.hasPointerCapture(pointer))handle.releasePointerCapture(pointer);}catch(error){}
    }
    function refresh(){
      var hidden=media.matches||Boolean(options.isFullscreen&&options.isFullscreen());
      if(hidden)stop(false);
      handle.hidden=hidden;handle.tabIndex=hidden?-1:0;apply(preferred);
    }
    handle.addEventListener('pointerdown',function(event){
      if(event.button!==0||handle.hidden)return;
      event.preventDefault();drag={x:event.clientX,width:current,pointer:event.pointerId};
      main.classList.add('resizing-sidebar');handle.focus({preventScroll:true});
      try{if(handle.setPointerCapture)handle.setPointerCapture(event.pointerId);}catch(error){}
    });
    global.document.addEventListener('pointermove',function(event){
      if(!drag||event.pointerId!==drag.pointer)return;
      apply(drag.width+event.clientX-drag.x);
    });
    global.document.addEventListener('pointerup',function(event){if(drag&&event.pointerId===drag.pointer)stop(true);});
    global.document.addEventListener('pointercancel',function(event){if(drag&&event.pointerId===drag.pointer)stop(false);});
    handle.addEventListener('lostpointercapture',function(){stop(false);});
    handle.addEventListener('dblclick',function(){stop(false);preferred=DEFAULT_WIDTH;apply(preferred);save();});
    handle.addEventListener('keydown',function(event){
      if(handle.hidden)return;
      var next=current,step=event.shiftKey?48:16;
      if(event.key==='ArrowLeft')next-=step;
      else if(event.key==='ArrowRight')next+=step;
      else if(event.key==='Home')next=limits(available()).min;
      else if(event.key==='End')next=limits(available()).max;
      else if(event.key==='Enter')next=DEFAULT_WIDTH;
      else return;
      event.preventDefault();event.stopPropagation();apply(next);save();
    });
    global.document.addEventListener('keydown',function(event){if(drag&&event.key==='Escape'){event.preventDefault();event.stopPropagation();stop(false);}},true);
    global.addEventListener('blur',function(){stop(false);});
    global.addEventListener('resize',refresh);
    media.addEventListener('change',refresh);
    if(typeof global.ResizeObserver==='function')new global.ResizeObserver(measureScrollbar).observe(editor);
    refresh();
    return {refresh:refresh,getWidth:function(){return current;}};
  }
  global.NewsletterLayout={create:create,clamp:clamp,limits:limits};
})(typeof window!=='undefined'?window:globalThis);
