(function(){
  'use strict';
  const page=document.body.dataset.page||'portfolio';
  const items=[
    ['portfolio','index.html','Portfolio','<path d="M4 19V9m5 10V5m5 14v-7m5 7V3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'],
    ['assets','assets.html','Assets','<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8.5 14.8c1.8 1.4 5.2 1.1 5.2-1.1 0-2.8-5.4-1.2-5.4-4 0-2 3-2.7 5-1.4M12 6.2v11.6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'],
    ['settings','settings.html','Settings','<path d="M4 7h10m4 0h2M4 17h4m4 0h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="17" r="2" fill="none" stroke="currentColor" stroke-width="2"/>']
  ];
  const nav=document.createElement('nav');
  nav.className='sidebar';
  nav.setAttribute('aria-label','Navigasi utama');
  items.forEach((item,i)=>{
    if(i===2){const d=document.createElement('span');d.className='sidebar__divider';nav.appendChild(d);}
    const a=document.createElement('a');
    a.href=item[1];a.className='sidebar__link'+(page===item[0]?' is-active':'');a.title=item[2];a.setAttribute('aria-label',item[2]);
    a.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${item[3]}</svg>`;
    nav.appendChild(a);
  });
  document.body.prepend(nav);
})();