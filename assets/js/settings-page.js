(function(){
'use strict';
const STORE='porsi.v1',PREF='porsi.preferences.v1',prefs=window.PORSI_PREFS;
let openSelect=null,pending=null;
const $=(s,r)=>(r||document).querySelector(s);
const LOCAL={
  id:{currencyChange:'Perubahan mata uang',languageChange:'Perubahan bahasa',switchCurrency:c=>`Ganti ke ${c}?`,switchLanguage:l=>`Ganti ke ${l}?`,currencyCopy:(a,b)=>`Porsi akan mengganti simbol dan format angka dari ${a} ke ${b}. Nominal portofolio yang sudah ada tidak dikonversi.`,languageCopy:(a,b)=>`Bahasa antarmuka akan berubah dari ${a} ke ${b}. Data portofolio tetap aman dan tidak berubah.`,apply:'Terapkan perubahan',cancel:'Batal',erase:'Hapus semua data portofolio tersimpan dan mulai lagi?'},
  en:{currencyChange:'Currency change',languageChange:'Language change',switchCurrency:c=>`Switch to ${c}?`,switchLanguage:l=>`Switch to ${l}?`,currencyCopy:(a,b)=>`Porsi will change the display symbol and number formatting from ${a} to ${b}. Existing portfolio amounts are not converted.`,languageCopy:(a,b)=>`The interface language will change from ${a} to ${b}. Your portfolio data stays untouched.`,apply:'Apply change',cancel:'Cancel',erase:'Erase all saved portfolio data and start over?'},
  ja:{currencyChange:'通貨の変更',languageChange:'言語の変更',switchCurrency:c=>`${c} に変更しますか？`,switchLanguage:l=>`${l} に変更しますか？`,currencyCopy:(a,b)=>`表示記号と数値形式を ${a} から ${b} に変更します。既存のポートフォリオ金額は換算されません。`,languageCopy:(a,b)=>`インターフェース言語を ${a} から ${b} に変更します。ポートフォリオデータは変更されません。`,apply:'変更を適用',cancel:'キャンセル',erase:'保存されたポートフォリオデータをすべて削除して最初からやり直しますか？'},
  zh:{currencyChange:'更改货币',languageChange:'更改语言',switchCurrency:c=>`切换到 ${c}？`,switchLanguage:l=>`切换到 ${l}？`,currencyCopy:(a,b)=>`Porsi 会把显示符号和数字格式从 ${a} 改为 ${b}。现有投资组合金额不会自动换算。`,languageCopy:(a,b)=>`界面语言将从 ${a} 改为 ${b}。投资组合数据不会改变。`,apply:'应用更改',cancel:'取消',erase:'删除所有已保存的投资组合数据并重新开始？'}
};
function lang(){return prefs&&prefs.get?prefs.get().language:'id';}
function strings(){return LOCAL[lang()]||LOCAL.en;}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function flag(src,label){return `<span class="pref-select__flag"><img src="${esc(src)}" alt="${esc(label||'')}" loading="eager" decoding="async"></span>`;}
function chevron(){return '<svg class="pref-select__chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
function currentCurrencyMarkup(code,c){return `${flag(c.flagSrc,c.country)}<span class="pref-select__copy"><small>${esc(prefs.text('currency'))}</small><strong>${c.symbol} · ${c.code}</strong><span>${c.name}</span></span>${chevron()}`;}
function currentLanguageMarkup(code,l){return `${flag(l.iconSrc,l.label)}<span class="pref-select__copy"><small>${esc(prefs.text('language'))}</small><strong>${l.label}</strong><span>${l.country}</span></span>${chevron()}`;}
function currencyOption(code,c,current){return `<button class="pref-select__option${current===code?' is-selected':''}" type="button" role="option" aria-selected="${current===code}" data-pref-type="currency" data-pref-value="${code}">${flag(c.flagSrc,c.country)}<span><strong>${c.symbol} · ${c.code}</strong><small>${c.name}</small></span>${current===code?'<span class="pref-select__check">✓</span>':''}</button>`;}
function languageOption(code,l,current){return `<button class="pref-select__option${current===code?' is-selected':''}" type="button" role="option" aria-selected="${current===code}" data-pref-type="language" data-pref-value="${code}">${flag(l.iconSrc,l.label)}<span><strong>${l.label}</strong><small>${l.country}</small></span>${current===code?'<span class="pref-select__check">✓</span>':''}</button>`;}
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
  const current=prefs.get(),s=strings();
  if(type==='currency'){
    const next=prefs.currencies[value],prev=prefs.currencies[current.currency];
    return {type,value,icon:next.flagSrc,eyebrow:s.currencyChange,title:s.switchCurrency(next.code),copy:s.currencyCopy(prev.code,next.code),preview:`${prev.symbol} · ${prev.code}  →  ${next.symbol} · ${next.code}`};
  }
  const next=prefs.languages[value],prev=prefs.languages[current.language];
  return {type,value,icon:next.iconSrc,eyebrow:s.languageChange,title:s.switchLanguage(next.label),copy:s.languageCopy(prev.label,next.label),preview:`${prev.label}  →  ${next.label}`};
}
function openConfirm(type,value){
  const current=prefs.get();if((type==='currency'&&current.currency===value)||(type==='language'&&current.language===value))return;
  pending=promptFor(type,value);setSelect(null,false);const s=strings();
  $('#preference-confirm-icon').innerHTML=`<img src="${pending.icon}" alt="" aria-hidden="true">`;
  $('#preference-confirm-eyebrow').textContent=pending.eyebrow;$('#preference-confirm-title').textContent=pending.title;$('#preference-confirm-copy').textContent=pending.copy;$('#preference-confirm-preview').textContent=pending.preview;
  $('#preference-confirm-apply').textContent=s.apply;document.querySelectorAll('[data-pref-cancel]').forEach(b=>{if(b.tagName==='BUTTON'&&b.textContent.trim())b.textContent=s.cancel;});
  const sheet=$('#preference-confirm');sheet.hidden=false;document.body.classList.add('locked');requestAnimationFrame(()=>sheet.classList.add('on'));
}
function closeConfirm(){const sheet=$('#preference-confirm');if(!sheet)return;sheet.classList.remove('on');document.body.classList.remove('locked');setTimeout(()=>{sheet.hidden=true;pending=null;},180);}
function applyPending(){if(!pending)return;if(pending.type==='currency')prefs.setCurrency(pending.value);else prefs.setLanguage(pending.value);closeConfirm();setTimeout(render,0);}
function resetData(){if(!confirm(strings().erase))return;try{localStorage.removeItem(STORE);localStorage.removeItem(PREF);}catch{}location.href='index.html';}
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