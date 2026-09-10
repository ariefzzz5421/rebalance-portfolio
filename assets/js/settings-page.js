(function(){
'use strict';
const STORE='porsi.v1',PREF='porsi.preferences.v1',prefs=window.PORSI_PREFS;
let openSelect=null,pending=null;
const $=(s,r)=>(r||document).querySelector(s);
function lang(){return prefs&&prefs.get?prefs.get().language:'id';}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function flag(src,label){return `<span class="pref-select__flag"><img src="${esc(src)}" alt="${esc(label||'')}" loading="eager" decoding="async"></span>`;}
function chevron(){return '<svg class="pref-select__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function currentCurrencyMarkup(code,c){return `${flag(c.flagSrc,c.country)}<span class="pref-select__copy"><small>${lang()==='en'?'Currency':'Mata uang'}</small><strong>${c.symbol} · ${c.code}</strong><span>${c.name}</span></span>${chevron()}`;}
function currentLanguageMarkup(code,l){return `${flag(l.iconSrc,l.label)}<span class="pref-select__copy"><small>${lang()==='en'?'Language':'Bahasa'}</small><strong>${l.label}</strong><span>${code==='id'?'Indonesia':'International'}</span></span>${chevron()}`;}
function currencyOption(code,c,current){return `<button class="pref-select__option${current===code?' is-selected':''}" type="button" role="option" aria-selected="${current===code}" data-pref-type="currency" data-pref-value="${code}">${flag(c.flagSrc,c.country)}<span><strong>${c.symbol} · ${c.code}</strong><small>${c.name}</small></span>${current===code?'<span class="pref-select__check">✓</span>':''}</button>`;}
function languageOption(code,l,current){return `<button class="pref-select__option${current===code?' is-selected':''}" type="button" role="option" aria-selected="${current===code}" data-pref-type="language" data-pref-value="${code}">${flag(l.iconSrc,l.label)}<span><strong>${l.label}</strong><small>${code==='id'?'Indonesia':'International'}</small></span>${current===code?'<span class="pref-select__check">✓</span>':''}</button>`;}
function render(){
  const current=prefs.get(),currency=prefs.currencies[current.currency],language=prefs.languages[current.language];
  $('#currency-trigger').innerHTML=currentCurrencyMarkup(current.currency,currency);$('#language-trigger').innerHTML=currentLanguageMarkup(current.language,language);
  $('#currency-menu').innerHTML=Object.entries(prefs.currencies).map(([code,c])=>currencyOption(code,c,current.currency)).join('');
  $('#language-menu').innerHTML=Object.entries(prefs.languages).map(([code,l])=>languageOption(code,l,current.language)).join('');
  prefs.applyLanguage&&prefs.applyLanguage();
}
function setSelect(type,open){
  ['currency','language'].forEach(k=>{const root=$(`#${k}-select`),menu=$(`#${k}-menu`),trigger=$(`#${k}-trigger`),isOpen=open&&k===type;root&&root.classList.toggle('is-open',!!isOpen);if(menu)menu.hidden=!isOpen;if(trigger)trigger.setAttribute('aria-expanded',String(!!isOpen));});
  openSelect=open?type:null;
}
function promptFor(type,value){
  const current=prefs.get();
  if(type==='currency'){
    const next=prefs.currencies[value],prev=prefs.currencies[current.currency];
    return {type,value,icon:next.flagSrc,eyebrow:lang()==='en'?'Currency change':'Perubahan mata uang',title:lang()==='en'?`Switch to ${next.code}?`:`Ganti ke ${next.code}?`,copy:lang()==='en'?`Porsi will change the display symbol and number formatting from ${prev.code} to ${next.code}. Existing portfolio amounts are not converted.`:`Porsi akan mengganti simbol dan format angka dari ${prev.code} ke ${next.code}. Nominal portofolio yang sudah ada tidak dikonversi.`,preview:`${prev.symbol} · ${prev.code}  →  ${next.symbol} · ${next.code}`};
  }
  const next=prefs.languages[value],prev=prefs.languages[current.language];
  return {type,value,icon:next.iconSrc,eyebrow:lang()==='en'?'Language change':'Perubahan bahasa',title:lang()==='en'?`Switch to ${next.label}?`:`Ganti ke ${next.label}?`,copy:lang()==='en'?`The interface language will change from ${prev.label} to ${next.label}. Your portfolio data stays untouched.`:`Bahasa antarmuka akan berubah dari ${prev.label} ke ${next.label}. Data portofolio tetap aman dan tidak berubah.`,preview:`${prev.label}  →  ${next.label}`};
}
function openConfirm(type,value){
  const current=prefs.get();if((type==='currency'&&current.currency===value)||(type==='language'&&current.language===value))return;
  pending=promptFor(type,value);setSelect(null,false);
  $('#preference-confirm-icon').innerHTML=`<img src="${pending.icon}" alt="" aria-hidden="true">`;
  $('#preference-confirm-eyebrow').textContent=pending.eyebrow;$('#preference-confirm-title').textContent=pending.title;$('#preference-confirm-copy').textContent=pending.copy;$('#preference-confirm-preview').textContent=pending.preview;
  const apply=$('#preference-confirm-apply');apply.textContent=lang()==='en'?'Apply change':'Terapkan perubahan';document.querySelectorAll('[data-pref-cancel]').forEach(b=>{if(b.tagName==='BUTTON'&&b.textContent.trim())b.textContent=lang()==='en'?'Cancel':'Batal';});
  const sheet=$('#preference-confirm');sheet.hidden=false;document.body.classList.add('locked');requestAnimationFrame(()=>sheet.classList.add('on'));
}
function closeConfirm(){const sheet=$('#preference-confirm');if(!sheet)return;sheet.classList.remove('on');document.body.classList.remove('locked');setTimeout(()=>{sheet.hidden=true;pending=null;},180);}
function applyPending(){if(!pending)return;if(pending.type==='currency')prefs.setCurrency(pending.value);else prefs.setLanguage(pending.value);closeConfirm();setTimeout(render,0);}
function resetData(){
  const message=lang()==='en'?'Erase all saved portfolio data and start over?':'Hapus semua data portofolio tersimpan dan mulai lagi?';
  if(!confirm(message))return;try{localStorage.removeItem(STORE);localStorage.removeItem(PREF);}catch{}location.href='index.html';
}
function boot(){
  render();
  $('#currency-trigger').addEventListener('click',e=>{e.stopPropagation();setSelect('currency',openSelect!=='currency');});
  $('#language-trigger').addEventListener('click',e=>{e.stopPropagation();setSelect('language',openSelect!=='language');});
  $('#currency-menu').addEventListener('click',e=>{const b=e.target.closest('[data-pref-value]');if(b)openConfirm('currency',b.dataset.prefValue);});
  $('#language-menu').addEventListener('click',e=>{const b=e.target.closest('[data-pref-value]');if(b)openConfirm('language',b.dataset.prefValue);});
  document.addEventListener('click',e=>{if(openSelect&&!e.target.closest('.pref-select'))setSelect(null,false);});
  document.querySelectorAll('[data-pref-cancel]').forEach(b=>b.addEventListener('click',closeConfirm));
  $('#preference-confirm-apply').addEventListener('click',applyPending);$('#reset-data').addEventListener('click',resetData);
  document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('#preference-confirm').hidden)closeConfirm();else if(openSelect)setSelect(null,false);});
  window.addEventListener('porsi:preferences',render);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();