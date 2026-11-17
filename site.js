/*
 Revive Creative — shared behaviour for the zh (/revive-creative/) and en (/revive-creative/en/) pages.
 Page-specific text lives in <script type="application/json" id="rc-config"> on each page.

 Conversion events (no analytics tool is installed; nothing is sent anywhere by this file).
 track() dispatches a "rc:track" CustomEvent on window and, only if a dataLayer array already exists, pushes to it.
 Events: service_inquiry_click{service,keyword?} · need_nav_click{service} · hero_service_click{service}
         line_chat_click{keyword?} · line_add_friend_click · email_click{service} · email_copy
         template_copy{service} · keyword_copy{keyword} · instagram_click · nav_contact_click
         hero_contact_click · lang_switch{to}
 A click is only a click: it does not mean a friend was added, a message was sent or a request was submitted.
 No names, emails, budgets or message contents are collected.
*/
(function(){
var cfg={};try{cfg=JSON.parse(document.getElementById('rc-config').textContent)}catch(e){}
var $=function(id){return document.getElementById(id)};
function track(name,detail){var d=Object.assign({event:name,lang:cfg.lang},detail||{});try{window.dispatchEvent(new CustomEvent('rc:track',{detail:d}))}catch(e){}if(Array.isArray(window.dataLayer))window.dataLayer.push(d)}
window.rcTrack=track;
var toastT;function toast(m){var t=$('toast');if(!t)return;t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(function(){t.classList.remove('on')},2400)}
function copy(text,ok,el){var fail=function(){if(el){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);toast(cfg.t_selected)}else toast(cfg.t_copy_fail)};try{navigator.clipboard.writeText(text).then(function(){toast(ok)},fail)}catch(e){fail()}}
function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

// mobile menu
var mb=$('menu-btn'),menu=$('menu');
function setMenu(o){menu.classList.toggle('open',o);mb.setAttribute('aria-expanded',o?'true':'false');mb.textContent=o?cfg.t_close:cfg.t_menu}
mb.addEventListener('click',function(){setMenu(!menu.classList.contains('open'))});
menu.addEventListener('click',function(e){if(e.target.closest('a'))setMenu(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&menu.classList.contains('open')){setMenu(false);mb.focus()}});

// current section + language switch keeps the section
var current='';
var sectionMap=cfg.section_map||{};
function langHref(base){var s=current&&sectionMap.hasOwnProperty(current)?sectionMap[current]:current;return base+(s?'#'+s:'')}
function updateLangLinks(){[].forEach.call(document.querySelectorAll('a[data-lang-to]'),function(a){a.href=langHref(a.getAttribute('data-base'))})}
var navLinks=[].slice.call(menu.querySelectorAll('a[href^="#"]'));
if('IntersectionObserver' in window){
 var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){current=e.target.id;navLinks.forEach(function(a){a.setAttribute('aria-current',a.getAttribute('href')==='#'+current?'true':'false')});updateLangLinks()}})},{rootMargin:'-40% 0px -55% 0px'});
 [].forEach.call(document.querySelectorAll('main > section[id]'),function(s){io.observe(s)});
}
[].forEach.call(document.querySelectorAll('a[data-lang-to]'),function(a){a.addEventListener('click',function(){store('rc-lang',a.getAttribute('data-lang-to'));track('lang_switch',{to:a.getAttribute('data-lang-to')})})});
updateLangLinks();
// light suggestion, never a redirect
(function(){var hint=$('lang-hint');if(!hint)return;var chosen=store('rc-lang');if(chosen)return;
 var langs=(navigator.languages||[navigator.language||'']).join(',').toLowerCase();
 var show=cfg.lang==='zh-Hant-TW'?!/(^|,)zh/.test(langs):/(^|,)zh/.test(langs);
 if(show){hint.hidden=false;var c=$('lang-hint-close');if(c)c.addEventListener('click',function(){hint.hidden=true;store('rc-lang',cfg.lang)})}})();

// generic data-track
document.addEventListener('click',function(e){var a=e.target.closest('[data-track]');if(a)track(a.getAttribute('data-track'),a.dataset.service?{service:a.dataset.service}:{})});
// jump highlight for service anchors
[].forEach.call(document.querySelectorAll('a[href^="#svc-"]'),function(a){a.addEventListener('click',function(){var el=document.querySelector(a.getAttribute('href'));if(!el)return;setTimeout(function(){el.focus({preventScroll:true});el.classList.add('flash');setTimeout(function(){el.classList.remove('flash')},1600)},350)})});

// inquiry state
var state={service:'',kw:cfg.default_kw||''};
function body(s){return cfg.body_intro+'\n\n'+cfg.body_fields.map(function(f){return f+(f===cfg.service_field?(s?' '+s:''):'')}).join('\n')+'\n'}
function subj(s){return cfg.subject(s)}
cfg.subject=function(s){return cfg.subject_with_service&&s?cfg.subject_with_service.replace('{s}',s):cfg.subject_default};
function render(){
 if(cfg.line_keywords&&$('line-chat'))$('line-chat').href='https://line.me/R/oaMessage/'+cfg.line_enc+'/?'+encodeURIComponent(state.kw);
 $('mail-btn').href='mailto:'+cfg.email+'?subject='+encodeURIComponent(subj(state.service))+'&body='+encodeURIComponent(body(state.service));
 [].forEach.call(document.querySelectorAll('[data-kw-text]'),function(el){el.textContent=state.kw});
 $('picked').classList.toggle('on',!!state.service);$('picked-name').textContent=state.service;
}
function setService(s,kw){state.service=s||'';state.kw=s&&kw?kw:(cfg.default_kw||'');render()}
[].forEach.call(document.querySelectorAll('.svc-cta'),function(a){a.addEventListener('click',function(){setService(a.dataset.service,a.dataset.kw);var d={service:a.dataset.service};if(a.dataset.kw)d.keyword=a.dataset.kw;track('service_inquiry_click',d)})});
$('picked-clear').addEventListener('click',function(){setService('');toast(cfg.t_cleared)});
if($('line-chat'))$('line-chat').addEventListener('click',function(){track('line_chat_click',cfg.line_keywords?{keyword:state.kw,service:state.service}:{})});
if($('line-add'))$('line-add').addEventListener('click',function(){track('line_add_friend_click')});
$('mail-btn').addEventListener('click',function(){track('email_click',{service:state.service})});
$('copy-mail').addEventListener('click',function(){copy(cfg.email,cfg.t_email_copied+cfg.email,$('mail'));track('email_copy')});
$('copy-tpl').addEventListener('click',function(){copy(cfg.t_to+cfg.email+'\n'+cfg.t_subject+subj(state.service)+'\n\n'+body(state.service),cfg.t_tpl_copied);track('template_copy',{service:state.service})});
if($('copy-kw'))$('copy-kw').addEventListener('click',function(){copy(state.kw,cfg.t_kw_copied.replace('{k}',state.kw));track('keyword_copy',{keyword:state.kw})});
render();

// archive filter + expand
var grid=$('works-grid');
if(grid){var fb=[].slice.call(document.querySelectorAll('.chain button'));
 fb.forEach(function(b){b.addEventListener('click',function(){var f=b.dataset.f;fb.forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});[].forEach.call(grid.querySelectorAll('.wcol'),function(c){c.hidden=!(f==='all'||c.dataset.col===f)})})});
 [].forEach.call(document.querySelectorAll('.more-btn'),function(b){var col=b.closest('.wcol'),n=col.querySelectorAll('li').length;b.addEventListener('click',function(){var on=col.classList.toggle('all');b.setAttribute('aria-expanded',on?'true':'false');b.textContent=on?cfg.t_collapse:cfg.t_show_all.replace('{n}',n)})});
}
})();
