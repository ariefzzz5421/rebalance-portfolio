(function(){
  'use strict';
  const page=document.body.dataset.page||'portfolio',STORE='porsi.v1';
  if(!document.getElementById('sidebar-theme-style')){
    const style=document.createElement('style');style.id='sidebar-theme-style';
    style.textContent='.sidebar__theme-btn{width:40px;height:40px;display:grid;place-items:center;border:1px solid transparent;border-radius:12px;background:transparent;color:var(--muted);cursor:pointer;transition:color .16s ease,background .16s ease,border-color .16s ease,transform .16s ease}.sidebar__theme-btn svg{width:19px;height:19px}.sidebar__theme-btn:hover{color:var(--ink);background:var(--surface-3);transform:translateY(-1px)}.sidebar__theme-btn:active{transform:scale(.96)}@media(max-width:760px){.sidebar__theme-btn{width:36px;height:36px}.sidebar__divider:last-of-type{width:1px;height:32px;margin:7px 2px}}';
    document.head.appendChild(style);
  }
  const items=[
    ['portfolio','index.html','Portfolio','<path d="M4 19V9m5 10V5m5 14v-7m5 7V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'],
    ['assets','assets.html','Assets','<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 14.8c1.8 1.4 5.2 1.1 5.2-1.1 0-2.8-5.4-1.2-5.4-4 0-2 3-2.7 5-1.4M12 6.2v11.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'],
    ['settings','settings.html','Settings','<path d="M4 7h10m4 0h2M4 17h4m4 0h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/>']
  ];
  function read(){try{return JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch{return {};}}
  function write(s){try{localStorage.setItem(STORE,JSON.stringify(s));}catch{}}
  const nav=document.createElement('nav');nav.className='sidebar';nav.setAttribute('aria-label','Navigasi utama');
  items.forEach((item,i)=>{if(i===2){const d=document.createElement('span');d.className='sidebar__divider';nav.appendChild(d);}const a=document.createElement('a');a.href=item[1];a.className='sidebar__link'+(page===item[0]?' is-active':'');a.title=item[2];a.setAttribute('aria-label',item[2]);a.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${item[3]}</svg>`;nav.appendChild(a);});
  const divider=document.createElement('span');divider.className='sidebar__divider';nav.appendChild(divider);
  const themeBtn=document.createElement('button');themeBtn.type='button';themeBtn.className='sidebar__theme-btn';nav.appendChild(themeBtn);
  const moon='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.4A8.6 8.6 0 0 1 9.6 4a8.6 8.6 0 1 0 10.4 10.4Z" fill="currentColor"/></svg>';
  const sun='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  function syncButton(){const current=document.documentElement.dataset.theme==='light'?'light':'dark',next=current==='dark'?'light':'dark';themeBtn.innerHTML=next==='light'?sun:moon;themeBtn.title=next==='light'?'Light mode':'Dark mode';themeBtn.setAttribute('aria-label',next==='light'?'Gunakan tema terang':'Gunakan tema gelap');themeBtn.setAttribute('aria-pressed',String(current==='light'));}
  function toggleTheme(){const current=document.documentElement.dataset.theme==='light'?'light':'dark',next=current==='dark'?'light':'dark',s=read();s.theme=next;write(s);document.documentElement.dataset.theme=next;document.documentElement.style.colorScheme=next;syncButton();window.dispatchEvent(new CustomEvent('porsi:theme',{detail:{theme:next}}));}
  themeBtn.addEventListener('click',toggleTheme);syncButton();document.body.prepend(nav);
})();