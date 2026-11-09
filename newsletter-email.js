function buildSocialIconsHTML(T,igUrl,igHandle,website,liUrl,gmUrl){
  // Email-safe: pill buttons with label text (icons via PNG from CDN)
  var icons=[];
  if(igUrl) icons.push({url:igUrl,label:"Instagram",color:"#ba0c2f",img:"https://img.icons8.com/ios-filled/16/ffffff/instagram-new.png"});
  if(liUrl) icons.push({url:liUrl,label:"LinkedIn",color:"#0077b5",img:"https://img.icons8.com/ios-filled/16/ffffff/linkedin.png"});
  if(gmUrl) icons.push({url:gmUrl,label:"GroupMe",color:"#00aff0",img:"https://img.icons8.com/ios-filled/16/ffffff/speech-bubble.png"});
  if(!icons.length){
    return '<p style="margin:0 0 18px;font-family:Arial,sans-serif;color:'+T.subtle+';font-size:12px;line-height:1.65;">'+
      (igUrl?'Instagram: <a href="'+escHtml(igUrl)+'" style="color:'+T.title+';text-decoration:underline;">'+emailText(igHandle)+'</a> &nbsp;|&nbsp; ':'')+
      (website?'<a href="'+escHtml(website)+'" style="color:'+T.title+';text-decoration:underline;">Visit Website</a>':'')+'</p>';
  }
  var pillCells=icons.map(function(ic){
    return '<td style="padding:0 8px 12px 0;">'+
      '<a href="'+escHtml(ic.url)+'" style="display:inline-block;background:'+ic.color+';border-radius:999px;padding:8px 16px 8px 12px;text-decoration:none;">'+
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline-table;vertical-align:middle;">'+
          '<tr>'+
            '<td style="vertical-align:middle;padding-right:6px;"><img src="'+ic.img+'" width="14" height="14" alt="" style="display:block;border:0;"/></td>'+
            '<td style="vertical-align:middle;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#ffffff;white-space:nowrap;">'+ic.label+'</td>'+
          '</tr>'+
        '</table>'+
      '</a>'+
    '</td>';
  }).join("");
  return '<p style="margin:0 0 8px;font-family:Arial,sans-serif;color:'+T.subtle+';font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">Follow Us</p>'+
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:8px;"><tr>'+pillCells+'</tr></table>'+
    '<p style="margin:0 0 18px;font-family:Arial,sans-serif;color:'+T.subtle+';font-size:11px;"><a href="'+escHtml(website)+'" style="color:'+T.title+';text-decoration:underline;">Visit our website</a></p>';
}

function generateHTML(state){return renderEmailHTML(state||collectState());}
function renderEmailHTML(state){
  var clean=Core.sanitizeState(state),fields=clean.fields;
  function g(id){return fields[id]||"";}
  var events=clean.events,showFeatured=clean.showFeatured,showFeatImg=clean.showFeatImg,showFeatButton=clean.showFeatButton,showAnnounce=clean.showAnnounce,showLinks=clean.showLinks;
  var T=THEMES[clean.activeTheme]||THEMES.light;
  var emailWidth=["600","680","760"].indexOf(g("email-width"))>=0?g("email-width"):"680";
  var defaultLogo=Core.safeUrl(g("s-logo")),lightLogo=Core.safeUrl(g("s-logo-light"));
  var logo=clean.activeTheme==="light"&&lightLogo?lightLogo:defaultLogo,website=Core.safeUrl(g("s-website")),igUrl=Core.safeUrl(g("s-ig-url")),igHandle=g("s-ig-handle"),unsub=Core.safeUrl(g("s-unsub"),{allowBrevo:true}),liUrl=Core.safeUrl(g("s-li-url")),gmUrl=Core.safeUrl(g("s-gm-url"));
  var issueBar=emailText(g("issue-bar-text")),annTitle=emailText(g("ann-title")),annQuote=emailText(g("ann-quote")),annAuthor=emailText(g("ann-author"));
  var footerName=emailText(g("footer-name")),footerAddr=emailText(g("footer-addr"));
  var featTitle=emailText(g("feat-title")),featDate=emailText(g("feat-date")),featLoc=emailText(g("feat-location")),featDesc=emailText(g("feat-desc")),featBtnText=emailText(g("feat-btn-text")),featBtnUrl=Core.safeUrl(g("feat-btn-url"));
  var featImgUrl=Core.safeUrl(g("feat-img-url")),featImgAlt=escHtml(g("feat-img-alt"));

  var preheader=emailText(g("s-preheader")||"Your biweekly update from ASME at The Ohio State University.");
  var featImgBlock=(showFeatured&&showFeatImg&&featImgUrl)?'<tr><td style="padding:0 26px 16px;"><img src="'+escHtml(featImgUrl)+'" alt="'+featImgAlt+'" width="100%" style="width:100%;height:auto;border-radius:6px;display:block;"></td></tr>':"";
  var featButtonBlock=(showFeatButton&&featBtnUrl&&featBtnText)?'<a href="'+escHtml(featBtnUrl)+'" style="display:inline-block;background:'+T.accent+';color:'+T.buttonText+';font-family:Arial,sans-serif;font-size:13px;font-weight:700;padding:12px 26px;border-radius:999px;text-decoration:none;">'+featBtnText+'</a>':"";

  var featuredBlock=showFeatured?
    '\n              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:'+T.featuredBg+';border:1px solid '+T.cardBorder+';border-radius:16px;overflow:hidden;">'+
    '<tr><td>'+
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">'+
    '<tr><td style="padding:28px 26px 16px;">'+
    '<p style="margin:0 0 12px;font-family:Arial,sans-serif;color:'+T.tag+';font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;">Featured Event</p>'+
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
    var dateParts=Core.splitEventDate(ev.date),typeLabel=getEventTypeLabel(ev.eventType);
    var metaParts=[ev.time,ev.location].filter(Boolean);
    var imgUrl=Core.safeUrl(ev.imgUrl),linkUrl=Core.safeUrl(ev.linkUrl);
    var imgRow=ev.showImg&&imgUrl?'<tr><td colspan="2" style="padding:0;"><img src="'+escHtml(imgUrl)+'" alt="'+escHtml(ev.imgAlt||'Event')+'" width="100%" style="width:100%;height:auto;display:block;max-height:220px;object-fit:cover;"></td></tr>':"";
    var dateBlock=dateParts.day?
      '<p style="margin:0;font-family:Arial,sans-serif;color:'+dc+';font-size:12px;line-height:1.2;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">'+emailText(dateParts.month)+'</p>'+
      '<p style="margin:4px 0 0;font-family:Georgia,serif;color:'+T.title+';font-size:45px;line-height:.95;font-weight:400;">'+emailText(dateParts.day)+'</p>':
      '<p style="margin:0;font-family:Arial,sans-serif;color:'+dc+';font-size:11px;line-height:1.4;font-weight:700;letter-spacing:1px;text-transform:uppercase;">'+emailText(dateParts.label)+'</p>';
    return '\n              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;background:'+T.cardBg+';border:1px solid '+T.cardBorder+';border-radius:12px;overflow:hidden;">'+
      imgRow+
      '<tr><td width="94" rowspan="2" align="center" valign="middle" style="width:94px;padding:22px 10px 18px 16px;">'+dateBlock+'</td>'+
      '<td align="right" valign="top" style="padding:0;">'+
      '<table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr><td align="center" style="background:'+bar+';color:'+getAccentTextColor(ev.accent)+';border-radius:0 0 0 10px;padding:9px 13px 8px;font-family:Arial,sans-serif;font-size:9px;line-height:1.2;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">'+emailText(typeLabel)+'</td></tr></table>'+
      '</td></tr><tr><td valign="top" style="padding:2px 18px 18px 12px;">'+
      '<p style="margin:0 0 6px;font-family:Arial,sans-serif;color:'+T.title+';font-size:15px;font-weight:700;">'+emailText(ev.title)+'</p>'+
      (metaParts.length?'<p style="margin:0 0 6px;font-family:Arial,sans-serif;color:'+T.muted+';font-size:12px;">'+emailText(metaParts.join(' \u00b7 '))+'</p>':'')+
      '<p style="margin:0'+(ev.showLink&&linkUrl?' 0 12px':'')+';font-family:Arial,sans-serif;color:'+T.subtle+';font-size:12px;line-height:1.6;">'+emailText(ev.description)+'</p>'+
      (ev.showLink&&linkUrl?'<a href="'+escHtml(linkUrl)+'" style="display:inline-block;background:'+bar+';color:'+getAccentTextColor(ev.accent)+';font-family:Arial,sans-serif;font-size:11px;font-weight:700;padding:8px 18px;border-radius:999px;text-decoration:none;">'+emailText(ev.linkText||'Learn More')+'</a>':'')+
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

  var linksBlock=showLinks?
    '\n              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr>'+
    [1,2,3].map(function(n,i){
      var pad=i===0?"padding-right:6px":i===1?"padding:0 3px":"padding-left:6px";
      return '<td class="stack" width="33.33%" style="'+pad+';">'+
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:'+T.cardBg+';border:1px solid '+T.cardBorder+';border-radius:12px;">'+
        '<tr><td align="center" style="padding:20px 12px;">'+
        '<p style="margin:0 0 8px;font-family:Arial,sans-serif;color:'+T.title+';font-size:13px;font-weight:700;">'+emailText(g("ql"+n+"-title"))+'</p>'+
        '<p style="margin:0 0 14px;font-family:Arial,sans-serif;color:'+T.subtle+';font-size:11px;line-height:1.5;">'+emailText(g("ql"+n+"-sub"))+'</p>'+
        '<a href="'+emailUrl(g("ql"+n+"-url"))+'" style="background:'+T.buttonBg+';color:'+T.title+';border:1px solid '+T.border+';border-radius:999px;padding:8px 14px;font-family:Arial,sans-serif;font-size:11px;font-weight:700;text-decoration:none;">'+emailText(g("ql"+n+"-btn"))+'</a>'+
        '</td></tr></table></td>';
    }).join("")+'</tr></table>':"";

  return '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="x-apple-disable-message-reformatting">\n  <title>ASME OSU Newsletter</title>\n  <style>\n    body,table,td,p,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}\n    table,td{border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt;}\n    img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;display:block;}\n    body{margin:0!important;padding:0!important;width:100%!important;background:'+T.bg+';}\n    a{text-decoration:none;}\n    @media screen and (max-width:'+(Number(emailWidth)+20)+'px){.container{width:100%!important;}.pad{padding-left:16px!important;padding-right:16px!important;}.stack{display:block!important;width:100%!important;padding:0 0 10px!important;}}\n  </style>\n</head>\n<body style="margin:0;padding:0;background:'+T.bg+';">\n  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;color:'+T.bg+';">'+preheader+'</div>\n  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:'+T.bg+';">\n    <tr><td align="center" style="padding:26px 12px;">\n      <table role="presentation" width="'+emailWidth+'" cellpadding="0" cellspacing="0" class="container" style="width:'+emailWidth+'px;max-width:'+emailWidth+'px;">\n        <tr><td style="background:'+T.headerBg+';border-radius:18px 18px 0 0;overflow:hidden;">\n          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">\n            <tr><td style="height:6px;background:'+T.accent+';font-size:0;line-height:0;">&nbsp;</td></tr>\n            <tr><td align="center" style="padding:24px 30px 18px;"><img src="'+escHtml(logo)+'" width="360" alt="ASME at The Ohio State University" style="width:360px;max-width:100%;height:auto;"></td></tr>\n            <tr><td align="center" style="background:'+T.accent+';padding:14px 28px;"><p style="margin:0;font-family:Arial,sans-serif;font-size:12px;line-height:1.4;color:'+T.buttonText+';font-weight:700;letter-spacing:2.4px;text-transform:uppercase;">'+issueBar+'</p></td></tr>\n          </table>\n        </td></tr>\n        <tr><td class="pad" style="background:'+T.bodyBg+';padding:24px 18px 18px;">\n          '+featuredBlock+'\n          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="padding:0 0 10px;border-bottom:1px solid '+T.border+';"><h2 style="margin:0;font-family:Georgia,serif;color:'+T.title+';font-size:22px;line-height:1.3;font-weight:400;">Upcoming Events</h2></td></tr></table>\n          '+eventCards+'\n          '+announceBlock+'\n          '+linksBlock+'\n        </td></tr>\n        <tr><td style="background:'+T.headerBg+';border-radius:0 0 18px 18px;padding:30px 36px 26px;">\n          <p style="margin:0 0 12px;font-family:Arial,sans-serif;color:'+T.title+';font-size:12px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;">'+footerName+'</p>\n          <p style="margin:0 0 12px;font-family:Arial,sans-serif;color:'+T.subtle+';font-size:12px;line-height:1.65;">'+footerAddr+'</p>\n          '+buildSocialIconsHTML(T,igUrl,igHandle,website,liUrl,gmUrl)+'\n          <p style="margin:0;font-family:Arial,sans-serif;color:'+T.faint+';font-size:11px;line-height:1.6;">You\'re receiving this because you signed up for ASME OSU updates. <a href="'+escHtml(unsub)+'" style="color:'+T.muted+';text-decoration:underline;">Unsubscribe</a></p>\n        </td></tr>\n      </table>\n    </td></tr>\n  </table>\n</body>\n</html>';
}
