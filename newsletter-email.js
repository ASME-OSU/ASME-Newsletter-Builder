// Use explicit background fallbacks so Outlook can restore light mode. Preserve
// dark brand surfaces and the logo backplate; let light surfaces and their text
// adapt together. Foreground locks are stripped by the received-message renderer.
function emailColorLuminance(color){
  var channels=[1,3,5].map(function(offset){var c=parseInt(color.slice(offset,offset+2),16)/255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);});
  return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
}
function stabilizeEmailColors(html){
  return html.replace(/<([a-z][\w:-]*)([^>]*?)\sstyle="([^"]*)"([^>]*)>/gi,function(match,tag,before,style,after){
    var background=style.match(/(?:^|;)\s*background(?:-color)?:\s*(#[0-9a-f]{6})(?=;|$)/i);
    var foreground=style.match(/(?:^|;)\s*color:\s*(#[0-9a-f]{6})(?=;|$)/i);
    if(background){
      style=style.replace(/(^|;)\s*background:/i,'$1background-color:');
      var preserve=/\bemail-logo-surface\b/.test(before+after)||(emailColorLuminance(background[1])<0.18&&(!foreground||emailColorLuminance(foreground[1])>0.5));
      if(preserve&&!/(?:^|;)\s*box-shadow:/i.test(style))style+=';box-shadow:inset 0 0 0 9999px '+background[1];
      if(/^(?:body|table|td)$/i.test(tag)&&!(/\sbgcolor=/i.test(before+after)))after+=' bgcolor="'+background[1]+'"';
    }
    return '<'+tag+before+' style="'+style+'"'+after+'>';
  });
}
// Exported email assets use public HTTPS URLs; the editor uses local copies for drafts.
var EMAIL_ICON_BASE='https://asme-osu.github.io/ASME-Newsletter-Builder/assets/email-icons/';
function emailIconHTML(name,size,preview){
  return '<img src="'+(preview?'assets/email-icons/':EMAIL_ICON_BASE)+name+'.png" width="'+size+'" height="'+size+'" alt="" role="presentation" style="display:block;width:'+size+'px;height:'+size+'px;border:0;">';
}
function quickLinkIconName(title,url){
  var copy=String(title||'').toLowerCase(),target=String(url||'').toLowerCase();
  if(/calendar|event/.test(copy)||/\/calendar\b/.test(target))return 'calendar';
  if(/sponsor|partner/.test(copy)||/\/sponsor/.test(target))return 'partnership';
  if(/join|member/.test(copy)||/\/join\b/.test(target))return 'members';
  if(/instagram|follow/.test(copy)||/instagram\.com/.test(target))return 'camera';
  if(/contact|touch/.test(copy)||/\/contact\b/.test(target))return 'contact';
  if(/material|file|resource/.test(copy))return 'files';
  if(/feedback|survey|topic|idea/.test(copy))return 'feedback';
  return 'link';
}
function quickLinkIconHTML(title,url,preview){return '<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 12px;"><tr><td>'+emailIconHTML(quickLinkIconName(title,url),48,preview)+'</td></tr></table>';}
function emailButtonHTML(url,label,background,color,accessibleLabel,align,options){
  var safe=Core.safeUrl(url);if(!safe||!String(label||'').trim())return '';
  options=options||{};
  var name=accessibleLabel||label,hasIcon=Boolean(options.icon);
  var icon=hasIcon?emailIconHTML(options.icon,24,options.preview).replace('display:block;','display:inline-block;vertical-align:middle;margin-right:8px;'):'';
  return '<table role="presentation" class="email-button"'+(options.fullWidth?' width="100%"':'')+' cellpadding="0" cellspacing="0" border="0"'+(align?' align="'+align+'"':'')+' style="border-collapse:separate;max-width:100%;'+(options.fullWidth?'width:100%;':'')+'"><tr><td height="44" align="center" valign="middle" bgcolor="'+background+'" style="background:'+background+';'+(options.border?'border:1px solid '+options.border+';':'')+'border-radius:8px;mso-padding-alt:12px 18px;">'+
    '<a href="'+escHtml(safe)+'" aria-label="'+escHtml(name)+'" title="'+escHtml(name)+'" style="display:'+(options.fullWidth?'block':'inline-block')+';padding:'+(hasIcon?'10px 18px':'12px 18px')+';border-radius:8px;font-family:Arial,sans-serif;font-size:13px;line-height:'+(hasIcon?'24px':'20px')+';font-weight:700;color:'+color+';text-decoration:none;overflow-wrap:anywhere;word-break:break-word;mso-padding-alt:0;">'+icon+escHtml(label)+'</a></td></tr></table>';
}
// These components are shared verbatim by the editor preview and exported email.
function renderActionCardsHTML(fields,preview){
  function field(id){return fields[id]||'';}
  return stabilizeEmailColors('<table class="newsletter-actions" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;margin-top:24px;"><tr>'+[1,2,3].map(function(n,i){
    var title=field('ql'+n+'-title'),subtitle=field('ql'+n+'-sub'),label=field('ql'+n+'-btn'),url=field('ql'+n+'-url');
    var pad=i===0?'padding-right:6px':i===1?'padding:0 3px':'padding-left:6px';
    return '<td class="action-col" width="33.33%" height="244" valign="top" style="height:244px;'+pad+';">'+
      '<table class="action-card" role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="width:100%;height:100%;background:#ffffff;border:1px solid #dfe3e7;border-radius:14px;border-collapse:separate;overflow:hidden;">'+
      '<tr><td class="action-content" align="center" valign="top" style="padding:22px 14px 16px;overflow-wrap:anywhere;word-break:break-word;">'+quickLinkIconHTML(title,url,preview)+
      '<h3 class="action-title" style="margin:0 0 8px;font-family:Arial,sans-serif;color:#20262d;font-size:16px;line-height:1.35;font-weight:700;">'+emailText(title)+'</h3>'+
      '<p class="action-description" style="margin:0;font-family:Arial,sans-serif;color:#53606b;font-size:13px;line-height:1.55;">'+emailText(subtitle)+'</p></td></tr>'+
      '<tr><td align="center" valign="bottom" style="padding:0 12px 22px;">'+emailButtonHTML(url,label,i===0?'#ba0c2f':'#ffffff',i===0?'#ffffff':'#20262d',label+' — '+title,'center',{fullWidth:true,border:i===0?'':'#d9dfe5'})+'</td></tr></table></td>';
  }).join('')+'</tr></table>');
}
function renderFooterSocialHTML(fields,preview){
  var links=[['s-ig-url','Instagram','#ba0c2f','instagram'],['s-li-url','LinkedIn','#0077b5','linkedin'],['s-gm-url','GroupMe','#006b93','groupme']].filter(function(item){return Core.safeUrl(fields[item[0]]);});
  return links.map(function(item){
    var button=emailButtonHTML(fields[item[0]],item[1],item[2],'#ffffff','Visit ASME on '+item[1],null,{icon:item[3],preview:preview,fullWidth:true});
    return '<tr><td style="padding:0 0 8px;">'+button.replace('class="email-button"','class="email-button footer-social-button"')+'</td></tr>';
  }).join('');
}
function renderNewsletterFooterHTML(fields,preview){
  var website=Core.safeUrl(fields['s-website']),unsub=Core.safeUrl(fields['s-unsub'],{allowBrevo:true});
  return stabilizeEmailColors('<table class="newsletter-footer" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;">'+
    '<tr><td class="footer-main" bgcolor="#25282d" style="background:#25282d;padding:30px 28px;">'+
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;table-layout:fixed;"><tr>'+
    '<td class="footer-col footer-org" width="58%" valign="top" style="padding:0 24px 0 0;">'+
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="34" style="margin:0 0 14px;"><tr><td height="3" bgcolor="#e63753" style="height:3px;background:#e63753;font-size:0;line-height:0;">&nbsp;</td></tr></table>'+
    '<p class="pv-footer-name" style="margin:0 0 14px;font-family:Arial,sans-serif;color:#ffffff;font-size:13px;line-height:1.5;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">'+emailText(fields['footer-name']||'')+'</p>'+
    '<p class="pv-footer-addr" style="margin:0;font-family:Arial,sans-serif;color:#c9cdd3;font-size:13px;line-height:1.75;overflow-wrap:anywhere;word-break:break-word;">'+emailText(fields['footer-addr']||'')+'</p></td>'+
    '<td class="footer-col footer-social" width="42%" valign="top" style="padding:0 0 0 24px;border-left:1px solid #464a51;">'+
    '<p style="margin:0 0 14px;font-family:Arial,sans-serif;color:#ffffff;font-size:12px;line-height:1.5;font-weight:700;letter-spacing:1.4px;">FOLLOW US</p>'+
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">'+renderFooterSocialHTML(fields,preview)+'</table>'+
    (website?'<p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:13px;line-height:1.5;"><a href="'+escHtml(website)+'" style="display:inline-block;padding:10px 0;color:#ffffff;text-decoration:underline;">Visit our website</a></p>':'')+
    '</td></tr></table></td></tr>'+
    '<tr><td class="footer-subscription" bgcolor="#ffffff" style="background:#ffffff;border-top:1px solid #dfe3e7;padding:16px 28px 18px;border-radius:0 0 18px 18px;">'+
    '<p class="pv-footer-unsub" style="margin:0;font-family:Arial,sans-serif;color:#53606b;font-size:12px;line-height:1.7;">You\'re receiving this because you signed up for ASME OSU updates. '+
    (unsub?'<a href="'+escHtml(unsub)+'" style="color:#35414c;text-decoration:underline;">Unsubscribe</a>':'Unsubscribe')+'</p></td></tr></table>');
}

function generateHTML(state){return renderEmailHTML(state||collectState());}
function renderEmailHTML(state){
  var clean=Core.sanitizeState(state),fields=clean.fields;
  function g(id){return fields[id]||"";}
  var events=clean.events,showFeatured=clean.showFeatured,showFeatImg=clean.showFeatImg,showFeatButton=clean.showFeatButton,showAnnounce=clean.showAnnounce,showLinks=clean.showLinks;
  var T=THEMES[clean.activeTheme]||THEMES.light;
  var emailWidth=["600","680","760"].indexOf(g("email-width"))>=0?g("email-width"):"680";
  var defaultLogo=Core.safeUrl(g("s-logo")),lightLogo=Core.safeUrl(g("s-logo-light"));
  var logo=clean.activeTheme==="light"&&lightLogo?lightLogo:defaultLogo;
  var issueBar=emailText(g("issue-bar-text")),annTitle=emailText(g("ann-title")),annQuote=emailText(g("ann-quote")),annAuthor=emailText(g("ann-author"));
  var featTitle=emailText(g("feat-title")),featDate=emailText(g("feat-date")),featLoc=emailText(g("feat-location")),featDesc=emailText(g("feat-desc")),featBtnText=emailText(g("feat-btn-text")),featBtnUrl=Core.safeUrl(g("feat-btn-url"));
  var featImgUrl=Core.safeUrl(g("feat-img-url")),featImgAlt=escHtml(g("feat-img-alt"));

  var logoSize=Core.knownLogoSize(logo),logoHeight=logoSize?' height="'+logoSize.height+'"':"";
  var preheader=emailText(g("s-preheader")||"Your biweekly update from ASME at The Ohio State University.");
  var featImgBlock=(showFeatured&&showFeatImg&&featImgUrl)?'<tr><td style="padding:0 26px 16px;"><img src="'+escHtml(featImgUrl)+'" alt="'+featImgAlt+'" width="100%" style="width:100%;height:auto;border-radius:6px;display:block;"></td></tr>':"";
  var featButtonBlock=(showFeatButton&&featBtnUrl&&featBtnText)?emailButtonHTML(featBtnUrl,g("feat-btn-text"),T.accent,T.buttonText,g("feat-btn-text")+" — "+g("feat-title")):"";

  var featuredBlock=showFeatured?
    '\n              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:'+T.featuredBg+';border:1px solid '+T.cardBorder+';border-radius:16px;overflow:hidden;">'+
    '<tr><td>'+
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'+
    '<tr><td style="padding:28px 26px 16px;">'+
    '<p style="margin:0 0 12px;font-family:Arial,sans-serif;color:'+T.tag+';font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">Featured Event</p>'+
    '<h1 style="margin:0 0 14px;font-family:Georgia,serif;color:'+T.title+';font-size:27px;line-height:1.25;font-weight:400;">'+featTitle+'</h1>'+
    '<p style="margin:0 0 6px;font-family:Arial,sans-serif;color:'+T.title+';font-size:14px;line-height:1.5;font-weight:700;">'+featDate+'</p>'+
    '<p style="margin:0 0 18px;font-family:Arial,sans-serif;color:'+T.muted+';font-size:13px;line-height:1.5;">'+featLoc+'</p>'+
    '</td></tr>'+featImgBlock+
    '<tr><td style="padding:0 26px 26px;">'+
    '<p style="margin:0 0 22px;font-family:Arial,sans-serif;color:'+T.text+';font-size:14px;line-height:1.7;">'+featDesc+'</p>'+
    featButtonBlock+
    '</td></tr></table></td></tr></table>':"";

  var eventCards=events.map(function(ev){
    var bar=getAccentColor(ev.accent),dc=getDateColor(ev.accent,clean.activeTheme);
    var dateParts=Core.splitEventDate(ev.date),typeLabel=getEventTypeLabel(ev.eventType),weekday=Core.eventWeekday(ev),description=Core.usefulDescription(ev.title,ev.description),linkLabel=Core.eventLinkLabel(ev);
    var metaParts=[ev.time,ev.location].filter(Boolean);
    var imgUrl=Core.safeUrl(ev.imgUrl),linkUrl=Core.safeUrl(ev.linkUrl);
    var imgRow=ev.showImg&&imgUrl?'<tr><td colspan="2" style="padding:0;"><img src="'+escHtml(imgUrl)+'" alt="'+escHtml(ev.imgAlt||'Event')+'" width="100%" style="width:100%;height:auto;display:block;max-height:220px;object-fit:cover;"></td></tr>':"";
    var dateBlock=dateParts.day?
      '<p style="margin:0;font-family:Arial,sans-serif;color:'+dc+';font-size:12px;line-height:1.2;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">'+emailText(dateParts.month)+'</p>'+
      '<p class="event-day" style="margin:4px 0 0;font-family:Georgia,serif;color:'+T.title+';font-size:45px;line-height:.95;font-weight:400;">'+emailText(dateParts.day)+'</p>':
      '<p style="margin:0;font-family:Arial,sans-serif;color:'+dc+';font-size:12px;line-height:1.4;font-weight:700;letter-spacing:1px;text-transform:uppercase;">'+emailText(dateParts.label)+'</p>';
    return '\n              <table class="email-event" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:'+T.cardBg+';border:1px solid '+T.cardBorder+';border-radius:12px;overflow:hidden;">'+
      imgRow+
      '<tr><td class="event-date-cell" width="94" rowspan="2" align="center" valign="middle" style="width:94px;padding:22px 10px 18px 16px;">'+dateBlock+(weekday?'<p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:12px;line-height:1.4;color:'+T.muted+';">'+escHtml(weekday)+'</p>':'')+'</td>'+
      '<td align="right" valign="top" style="padding:0;">'+
      '<table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr><td align="center" style="background:'+bar+';color:'+getAccentTextColor(ev.accent)+';border-radius:0 0 0 10px;padding:9px 13px 8px;font-family:Arial,sans-serif;font-size:12px;line-height:1.2;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">'+emailText(typeLabel)+'</td></tr></table>'+
      '</td></tr><tr><td valign="top" style="padding:2px 18px 18px 12px;">'+
      '<p style="margin:0 0 6px;font-family:Arial,sans-serif;color:'+T.title+';font-size:15px;font-weight:700;">'+emailText(ev.title)+'</p>'+
      (metaParts.length?'<p style="margin:0 0 6px;font-family:Arial,sans-serif;color:'+T.muted+';font-size:12px;">'+emailText(metaParts.join(' \u00b7 '))+'</p>':'')+
      (description?'<p style="margin:0'+(ev.showLink&&linkUrl?' 0 12px':'')+';font-family:Arial,sans-serif;color:'+T.subtle+';font-size:13px;line-height:1.6;">'+emailText(description)+'</p>':'')+
      (ev.showLink&&linkUrl?emailButtonHTML(linkUrl,linkLabel,bar,getAccentTextColor(ev.accent),linkLabel+' — '+ev.title):'')+
      '</td></tr></table>';
  }).join("");

  var announceBlock=showAnnounce?
    '\n              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;background:'+T.cardBg+';border:1px solid '+T.cardBorder+';border-radius:16px;">'+
    '<tr><td style="padding:26px;">'+
    '<h2 style="margin:0 0 16px;font-family:Georgia,serif;color:'+T.title+';font-size:22px;font-weight:400;">'+annTitle+'</h2>'+
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>'+
    '<td width="4" style="background:'+T.accent+';border-radius:2px;font-size:0;">&nbsp;</td>'+
    '<td style="padding-left:16px;">'+
    '<p style="margin:0 0 12px;font-family:Georgia,serif;color:'+T.text+';font-size:16px;line-height:1.75;font-style:italic;">'+annQuote+'</p>'+
    (g("ann-author").trim()?'<p style="margin:0;font-family:Arial,sans-serif;color:'+T.soft+';font-size:12px;line-height:1.5;">\u2014 <strong style="color:'+T.title+';">'+annAuthor+'</strong></p>':'')+
    '</td></tr></table></td></tr></table>':"";

  var linksBlock=showLinks?renderActionCardsHTML(fields,false):'';

  return stabilizeEmailColors('<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="x-apple-disable-message-reformatting">\n  <meta name="format-detection" content="telephone=no,date=no,address=no,email=no,url=no">\n  <meta name="color-scheme" content="light">\n  <meta name="supported-color-schemes" content="light">\n  <title>ASME OSU Newsletter</title>\n  <style>\n    body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}\n    table,td{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}\n    img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;display:block;}\n    body{margin:0!important;padding:0!important;width:100%!important;background:'+T.bg+';}\n    a{text-decoration:none;}\n    :root{color-scheme:light;supported-color-schemes:light;}\n    a[x-apple-data-detectors]{color:inherit!important;text-decoration:none!important;font-size:inherit!important;font-family:inherit!important;font-weight:inherit!important;line-height:inherit!important;}\n    @media screen and (max-width:600px){.action-col{display:block!important;width:100%!important;height:auto!important;padding:0 0 12px!important;}.action-card{height:auto!important;}.footer-col{display:block!important;width:100%!important;box-sizing:border-box!important;}.footer-org{padding:0 0 24px!important;}.footer-social{padding:24px 0 0!important;border-left:0!important;border-top:1px solid #464a51!important;}.footer-main{padding:26px 22px!important;}.footer-subscription{padding:16px 22px!important;}}\n    @media screen and (max-width:'+(Number(emailWidth)+20)+'px){.container{width:100%!important;}.pad{padding-left:16px!important;padding-right:16px!important;}.social-item{display:block!important;padding:0 0 8px!important;}.event-date-cell{width:64px!important;padding-left:8px!important;padding-right:8px!important;}.event-day{font-size:36px!important;}}\n  </style>\n</head>\n<body style="margin:0;padding:0;background:'+T.bg+';">\n  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:'+T.bg+';">'+preheader+'<span aria-hidden="true">'+new Array(81).join('&#8204;&nbsp;')+'</span></div>\n  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:'+T.bg+';">\n    <tr><td align="center" style="padding:26px 12px;">\n      '+(g('s-mirror-link')==='1'?'<p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:12px;line-height:1.5;"><a href="{{ mirror }}" style="color:'+T.muted+';text-decoration:underline;">View in browser</a></p>':'')+'<table role="presentation" width="'+emailWidth+'" cellpadding="0" cellspacing="0" class="container" style="width:'+emailWidth+'px;max-width:'+emailWidth+'px;">\n        <tr><td class="email-logo-surface" style="background:'+T.headerBg+';border-radius:18px 18px 0 0;overflow:hidden;">\n          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n            <tr><td style="height:6px;background:'+T.accent+';font-size:0;line-height:0;">&nbsp;</td></tr>\n            <tr><td align="center" style="padding:24px 30px 18px;"><img src="'+escHtml(logo)+'" width="360"'+logoHeight+' alt="ASME at The Ohio State University" style="width:360px;max-width:100%;height:auto;"></td></tr>\n            <tr><td align="center" style="background:'+T.accent+';padding:14px 28px;"><p style="margin:0;font-family:Arial,sans-serif;font-size:12px;line-height:1.4;color:'+T.buttonText+';font-weight:700;letter-spacing:2.4px;text-transform:uppercase;">'+issueBar+'</p></td></tr>\n          </table>\n        </td></tr>\n        <tr><td class="pad" style="background:'+T.bodyBg+';padding:24px 18px 18px;">\n          '+featuredBlock+'\n          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="padding:0 0 10px;border-bottom:1px solid '+T.border+';"><h2 style="margin:0;font-family:Georgia,serif;color:'+T.title+';font-size:22px;line-height:1.3;font-weight:400;">Upcoming Events</h2></td></tr></table>\n          '+eventCards+'\n          '+announceBlock+'\n          '+linksBlock+'\n        </td></tr>\n        <tr><td>'+renderNewsletterFooterHTML(fields,false)+'</td></tr>\n      </table>\n    </td></tr>\n  </table>\n</body>\n</html>');
}
