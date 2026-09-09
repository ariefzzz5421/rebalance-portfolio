(function(){
'use strict';
const STORE='porsi.v1',prefs=window.PORSI_PREFS;
function flagMarkup(src,label){return `<span class="choice-btn__icon pref-flag" aria-hidden="true"><img src="${src}" alt="${label||''}" loading="eager" decoding="async"></span>`;}
function currencyButton(code,c,current){const b=document.createElement('button');b.type='button';b.className='choice-btn choice-btn--icon'+(current===code?' is-on':'');b.dataset.currency=code;b.setAttribute('aria-pressed',String(current===code));b.innerHTML=`${flagMarkup(c.flagSrc,c.country)}<span class="choice-btn__copy"><strong>${c.symbol} · ${c.code}</strong><span>${c.name}</span></span>`;return b;}
function languageButton(code,l,current){const b=document.createElement('button');b.type='button';b.className='choice-btn choice-btn--icon'+(current===code?' is-on':'');b.dataset.language=code;b.setAttribute('aria-pressed',String(current===code));b.innerHTML=`${flagMarkup(l.iconSrc,l.label)}<span class="choice-btn__copy"><strong>${l.label}</strong><span>${code==='id'?'Indonesia':'International'}</span></span>`;return b;}
function renderChoices(){const current=prefs.get(),ch=document.getElementById('currency-choices'),lh=document.getElementById('language-choices');ch.replaceChildren(...Object.entries(prefs.currencies).map(([code,c])=>currencyButton(code,c,current.currency)));lh.replaceChildren(...Object.entries(prefs.languages).map(([code,l])=>languageButton(code,l,current.language)));}
document.getElementById('currency-choices').addEventListener('click',e=>{const b=e.target.closest('[data-currency]');if(!b||b.classList.contains('is-on'))return;prefs.setCurrency(b.dataset.currency);renderChoices();});
document.getElementById('language-choices').addEventListener('click',e=>{const b=e.target.closest('[data-language]');if(!b||b.classList.contains('is-on'))return;prefs.setLanguage(b.dataset.language);renderChoices();});
document.getElementById('reset-data').addEventListener('click',()=>{if(!confirm('Hapus semua isian dan mulai dari awal?'))return;localStorage.removeItem(STORE);localStorage.removeItem('porsi.preferences.v1');location.href='index.html';});
renderChoices();
})();