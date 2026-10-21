window.__cap = async function (MAIL_ID) {
window.__printCalls = 0;
['__pv', '__pvbg'].forEach(id => { const e = document.getElementById(id); if (e) e.remove(); });
const bg = document.createElement('div'); bg.id = '__pvbg';
bg.style.cssText = 'position:fixed;inset:0;background:#fff;z-index:2147483646;';
document.body.appendChild(bg);
const ifr = document.createElement('iframe'); ifr.id = '__pv';
ifr.style.cssText = 'position:fixed;left:0;top:0;width:700px;height:100vh;z-index:2147483647;background:#fff;border:0;';
let stop = false;
const tick = () => { try { const w = ifr.contentWindow; if (w && !w.__noPrint) { w.print = () => { window.__printCalls++; }; w.__noPrint = 1; } } catch (e) {} if (!stop) setTimeout(tick, 0); };
document.body.appendChild(ifr); tick();
ifr.src = '/newWindow/SENT/' + MAIL_ID + '/?print=true';
await new Promise(r => setTimeout(r, 6000)); stop = true;
const d = ifr.contentDocument;
const s = d.createElement('style');
s.textContent = '.cont_toolbar,.reply_fast,.viewer_footer{display:none!important} html,body{overflow:hidden!important}'
  + ' *{min-width:0!important;max-width:100%!important;white-space:normal!important;word-break:keep-all!important;overflow-wrap:anywhere!important}'
  + ' body,html,.container-doc,.doc-main,.inner-main,.main-content{width:auto!important}';
d.head.appendChild(s);
[...d.querySelectorAll('a,button,span')].forEach(e => { const t = e.textContent.trim(); if (['주소추가', '수신차단', '위', '아래', '미리보기', '모두저장', '프린트'].includes(t)) e.style.display = 'none'; });
[...d.querySelectorAll('[class*=star],[class*=print],[class*=navi],[class*=important]')].forEach(e => { if (!e.querySelector('.tit_info')) e.style.display = 'none'; });
[...d.querySelectorAll('span,em,strong,dd')].forEach(e => { if (e.children.length === 0 && /^\d[\d.,]*\s*[KMG]?B$/i.test(e.textContent.trim())) e.style.setProperty('display', 'none', 'important'); });
await new Promise(r => setTimeout(r, 300));
ifr.style.width = '1100px'; d.documentElement.style.zoom = '1.6';
return JSON.stringify({ printCalls: window.__printCalls, title: d.title.slice(0, 40) });
};
