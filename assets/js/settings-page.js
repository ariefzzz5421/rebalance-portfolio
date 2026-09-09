(function(){
'use strict';
const STORE='porsi.v1';
const prefs=window.PORSI_PREFS;
function defaults(){return{currency:'IDR',total:0,theme:'dark',parts:[]};}
function load(){try{return Object.assign(defaults(),JSON.parse(localStorage.getItem(STORE)||'{}')||{});}catch{return defaults();}}
let state=load();
function saveState(){localStorage.setItem(STORE,JSON.stringify(state));}
function currencyButton(code,c,current){const b=document.createElement('button');b.type='button';b.className='choice-btn choice-btn--icon'+(current===code?' is-on':'');b.dataset.currency=code;b.innerHTML=`<span class="choice-btn__icon pref-flag" aria-hidden="true">${c.flag}</span><span class="choice-btn__copy"><strong>${c.symbol} · ${c.code}</strong><span>${c.name}</span></span>`;return b;}
function languageButton(code,l,current){const b=document.createElement('button');b.type='button';b.className='choice-btn choice-btn--icon'+(current===code?' is-on':'');b.dataset.language=code;b.innerHTML=`<span class="choice-btn__icon pref-flag" aria-hidden="true">${l.icon}</span><span class="choice-btn__copy"><strong>${l.label}</strong><span>${code==='id'?'Indonesia':'International'}</span></span>`;return b;}
function renderChoices(){
 const current=prefs.get();
 const ch=document.getElementById('currency-choices');ch.textContent='';Object.entries(prefs.currencies).forEach(([code,c])=>ch.appendChild(currencyButton(code,c,current.currency)));
 const lh=document.getElementById('language-choices');lh.textContent='';Object.entries(prefs.languages).forEach(([code,l])=>lh.appendChild(languageButton(code,l,current.language)));
 document.querySelectorAll('[data-theme-choice]').forEach(b=>{const on=b.dataset.themeChoice===state.theme;b.classList.toggle('is-on',on);b.setAttribute('aria-checked',String(on));});
 document.documentElement.dataset.theme=state.theme==='light'?'light':'dark';document.documentElement.style.colorScheme=state.theme==='light'?'light':'dark';
}
document.getElementById('currency-choices').addEventListener('click',e=>{const b=e.target.closest('[data-currency]');if(!b)return;prefs.setCurrency(b.dataset.currency);state=load();renderChoices();});
document.getElementById('language-choices').addEventListener('click',e=>{const b=e.target.closest('[data-language]');if(!b)return;prefs.setLanguage(b.dataset.language);renderChoices();});
document.getElementById('theme-choices').addEventListener('click',e=>{const b=e.target.closest('[data-theme-choice]');if(!b)return;state.theme=b.dataset.themeChoice;saveState();renderChoices();});
document.getElementById('reset-data').addEventListener('click',()=>{if(!confirm('Hapus semua isian dan mulai dari awal?'))return;localStorage.removeItem(STORE);localStorage.removeItem('porsi.preferences.v1');location.href='index.html';});
renderChoices();
})();