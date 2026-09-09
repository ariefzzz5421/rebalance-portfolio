(function(){
  'use strict';
  const page=document.body.dataset.page||'portfolio',STORE='porsi.v1';
  const items=[
    ['portfolio','index.html','Portfolio','<path d="M4 19V9m5 10V5m5 14v-7m5 7V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'],
    ['assets','assets.html','Assets','<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 14.8c1.8 1.4 5.2 1.1 5.2-1.1 0-2.8-5.4-1.2-5.4-4 0-2 3-2.7 5-1.4M12 6.2v11.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'],
    ['settings','settings.html','Settings','<path d="M4 7h10m4 0h2M4 17h4m4 0h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/>']
  ];
  function read(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch{return {};}}
  function setTheme(theme){const s=read();s.theme=theme;localStorage.setItem(STORE,JSON.stringify(s));document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;location.reload();}
  const nav=document.createElement('nav');nav.className='sidebar';nav.setAttribute('aria-label','Navigasi utama');
  items.forEach((item,i)=>{if(i===2){const d=document.createElement('span');d.className='sidebar__divider';nav.appendChild(d);}const a=document.createElement('a');a.href=item[1];a.className='sidebar__link'+(page===item[0]?' is-active':'');a.title=item[2];a.setAttribute('aria-label',item[2]);a.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${item[3]}</svg>`;nav.appendChild(a);});
  const themeDivider=document.createElement('span');themeDivider.className='sidebar__divider';nav.appendChild(themeDivider);
  const themeWrap=document.createElement('div');themeWrap.className='sidebar__theme';
  const current=read().theme==='light'?'light':'dark';
  const dark=document.createElement('button');dark.type='button';dark.className='sidebar__theme-btn'+(current==='dark'?' is-on':'');dark.title='Dark';dark.setAttribute('aria-label','Gunakan tema gelap');dark.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.4A8.6 8.6 0 0 1 9.6 4a8.6 8.6 0 1 0 10.4 10.4Z" fill="currentColor"/></svg>';dark.addEventListener('click',()=>setTheme('dark'));
  const light=document.createElement('button');light.type='button';light.className='sidebar__theme-btn'+(current==='light'?' is-on':'');light.title='Light';light.setAttribute('aria-label','Gunakan tema terang');light.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';light.addEventListener('click',()=>setTheme('light'));
  themeWrap.append(dark,light);nav.appendChild(themeWrap);document.body.prepend(nav);
})();