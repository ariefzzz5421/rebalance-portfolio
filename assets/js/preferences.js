(function(){
  'use strict';
  const STORE='porsi.v1';
  const PREF='porsi.preferences.v1';
  const currencies={
    IDR:{code:'IDR',symbol:'Rp',name:'Rupiah Indonesia',country:'Indonesia',flag:'🇮🇩',compat:'IDR'},
    USD:{code:'USD',symbol:'$',name:'US Dollar',country:'United States',flag:'🇺🇸',compat:'USD'},
    CNY:{code:'CNY',symbol:'¥',name:'Chinese Yuan',country:'China',flag:'🇨🇳',compat:'USD'},
    SGD:{code:'SGD',symbol:'S$',name:'Singapore Dollar',country:'Singapore',flag:'🇸🇬',compat:'USD'},
    CHF:{code:'CHF',symbol:'CHF',name:'Swiss Franc',country:'Switzerland',flag:'🇨🇭',compat:'USD'}
  };
  const languages={id:{code:'id',label:'Bahasa Indonesia',icon:'🇮🇩'},en:{code:'en',label:'English',icon:'🌐'}};
  function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{return {};}}
  function writeJson(key,value){localStorage.setItem(key,JSON.stringify(value));}
  function derive(){const state=readJson(STORE),saved=readJson(PREF);return{currency:currencies[saved.currency]?saved.currency:(state.currency==='USD'?'USD':'IDR'),language:languages[saved.language]?saved.language:'id'};}
  function get(){return derive();}
  function setCurrency(code){
    if(!currencies[code])return;
    const pref=derive();pref.currency=code;writeJson(PREF,pref);
    const state=readJson(STORE);state.currency=currencies[code].compat;writeJson(STORE,state);
    window.dispatchEvent(new CustomEvent('porsi:preferences',{detail:pref}));
  }
  function setLanguage(code){if(!languages[code])return;const pref=derive();pref.language=code;writeJson(PREF,pref);document.documentElement.lang=code;window.dispatchEvent(new CustomEvent('porsi:preferences',{detail:pref}));}
  function patchPortfolio(){
    if(document.body&&document.body.dataset.page!=='portfolio')return;
    const pref=derive(),c=currencies[pref.currency];
    document.documentElement.lang=pref.language;
    const code=document.getElementById('ccy-code'),symbol=document.getElementById('symbol'),flag=document.getElementById('ccy-flag');
    if(code)code.textContent=c.code;if(symbol)symbol.textContent=c.symbol;if(flag)flag.textContent=c.flag;
    if(c.compat==='USD'&&c.code!=='USD'){
      document.querySelectorAll('.part__amount,.tip strong').forEach(el=>{if(/^\$\s/.test(el.textContent))el.textContent=el.textContent.replace(/^\$\s/,c.symbol+' ');});
    }
  }
  function wrapExporter(){
    if(!window.Exporter||window.Exporter.__porsiPrefs)return;
    const original=window.Exporter.save;
    window.Exporter.save=async function(data,format){
      const pref=derive(),c=currencies[pref.currency];
      if(c.compat==='USD'&&c.code!=='USD'){
        const cloned=JSON.parse(JSON.stringify(data));
        const swap=v=>typeof v==='string'?v.replace(/^\$\s/,c.symbol+' '):v;
        cloned.totalText=swap(cloned.totalText);(cloned.slices||[]).forEach(s=>{s.amountText=swap(s.amountText);});
        return original.call(this,cloned,format);
      }
      return original.call(this,data,format);
    };
    window.Exporter.__porsiPrefs=true;
  }
  function boot(){document.documentElement.lang=derive().language;patchPortfolio();wrapExporter();if(document.body){const mo=new MutationObserver(()=>patchPortfolio());mo.observe(document.body,{subtree:true,childList:true,characterData:true});}}
  window.PORSI_PREFS={currencies,languages,get,setCurrency,setLanguage,patchPortfolio};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();