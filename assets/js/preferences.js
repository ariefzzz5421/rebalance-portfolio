(function(){
  'use strict';
  const STORE='porsi.v1',PREF='porsi.preferences.v1';
  const currencies={
    IDR:{code:'IDR',symbol:'Rp',name:'Rupiah Indonesia',country:'Indonesia',flagSrc:'assets/flags/id.svg',compat:'IDR'},
    USD:{code:'USD',symbol:'$',name:'US Dollar',country:'United States',flagSrc:'assets/flags/us.svg',compat:'USD'},
    CNY:{code:'CNY',symbol:'¥',name:'Chinese Yuan',country:'China',flagSrc:'assets/flags/cn.svg',compat:'USD'},
    SGD:{code:'SGD',symbol:'S$',name:'Singapore Dollar',country:'Singapore',flagSrc:'assets/flags/sg.svg',compat:'USD'},
    CHF:{code:'CHF',symbol:'CHF',name:'Swiss Franc',country:'Switzerland',flagSrc:'assets/flags/ch.svg',compat:'USD'}
  };
  const languages={id:{code:'id',label:'Bahasa Indonesia',iconSrc:'assets/flags/id.svg'},en:{code:'en',label:'English',iconSrc:'assets/flags/globe.svg'}};
  function readJson(key){try{return JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{return {};}}
  function writeJson(key,value){try{localStorage.setItem(key,JSON.stringify(value));}catch{}}
  function derive(){const state=readJson(STORE),saved=readJson(PREF);return{currency:currencies[saved.currency]?saved.currency:(state.currency==='USD'?'USD':'IDR'),language:languages[saved.language]?saved.language:'id'};}
  function get(){return derive();}
  function setCurrency(code){if(!currencies[code])return;const pref=derive();pref.currency=code;writeJson(PREF,pref);const state=readJson(STORE);state.currency=currencies[code].compat;writeJson(STORE,state);patchPortfolio();window.dispatchEvent(new CustomEvent('porsi:preferences',{detail:pref}));}
  function setLanguage(code){if(!languages[code])return;const pref=derive();pref.language=code;writeJson(PREF,pref);document.documentElement.lang=code;applyLanguage();window.dispatchEvent(new CustomEvent('porsi:preferences',{detail:pref}));}
  function assignText(el,value){if(el&&value!=null&&el.textContent!==value)el.textContent=value;}
  function assignPlaceholder(el,value){if(el&&el.getAttribute('placeholder')!==value)el.setAttribute('placeholder',value);}
  function buttonLabel(el,value){if(!el)return;const textNode=[...el.childNodes].find(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim());if(textNode){if(textNode.textContent.trim()!==value)textNode.textContent=value;}else if(!el.querySelector('svg'))assignText(el,value);}
  function applyLanguage(){
    const lang=derive().language;document.documentElement.lang=lang;if(lang!=='en')return;
    const page=document.body&&document.body.dataset.page;
    if(page==='portfolio'){
      assignText(document.querySelector('.hero__label'),'Money you have');assignText(document.getElementById('hero-note'),'Enter an amount — every allocation below updates instantly.');
      assignText(document.querySelector('.strategy-strip__copy strong'),'Start faster with a preset strategy');assignText(document.querySelector('.strategy-strip__copy span'),'Choose a strategy, then enter your portfolio amount. Percentages are filled automatically.');
      buttonLabel(document.getElementById('add'),'Add allocation');assignText(document.getElementById('even'),'Split evenly');assignText(document.getElementById('fit'),'Fit to 100%');
      assignText(document.querySelector('.export__text strong'),'Save this setup');assignText(document.querySelector('.export__text span'),'Download as JPG or PDF with the chart and allocation details.');
      assignText(document.querySelector('.strategy-modal__note'),'Applying a strategy replaces the active allocation while keeping your amount, currency, and theme.');assignText(document.querySelector('.strategy-modal__actions [data-close-strategy]'),'Cancel');assignText(document.getElementById('apply-strategy'),'Use strategy');
      assignText(document.getElementById('picker-h'),'Choose asset');assignPlaceholder(document.getElementById('pick-search'),'Search ticker or name — BBCA, NVDA, BTC…');assignText(document.getElementById('pick-custom'),'Use a custom name');
    }else if(page==='settings'){
      assignText(document.querySelector('.page-head p'),'Set currency, language, and local data. Use the single sun/moon button below Settings to switch theme.');
      const cards=document.querySelectorAll('.settings-card');if(cards[0]){assignText(cards[0].querySelector('h2'),'Currency');assignText(cards[0].querySelector('p'),'Changes display symbol and number format only — portfolio amounts are not converted automatically.');}
      if(cards[1]){assignText(cards[1].querySelector('h2'),'Language');assignText(cards[1].querySelector('p'),'Choose the interface language.');}
      if(cards[2]){assignText(cards[2].querySelector('h2'),'Local data');assignText(cards[2].querySelector('p'),'Reset removes the saved amount and the entire portfolio composition from this browser.');assignText(document.getElementById('reset-data'),'Erase everything & start over');}
    }else if(page==='assets'){
      const head=document.querySelector('.page-head p');if(head)assignText(head,'Track assets available in Porsi, their logos, historical charts, and 1M / 1Y / 5Y / 10Y annualized returns.');assignPlaceholder(document.getElementById('asset-search'),'Search BTC, BBCA, NVIDIA, gold…');
    }
  }
  function setFlag(host,src,label){if(!host)return;const old=host.querySelector('img');if(old&&old.getAttribute('src')===src)return;host.textContent='';const img=document.createElement('img');img.src=src;img.alt=label||'';img.decoding='async';img.width=26;img.height=17;host.appendChild(img);}
  function patchPortfolio(){
    if(!document.body||document.body.dataset.page!=='portfolio')return;
    const pref=derive(),c=currencies[pref.currency];document.documentElement.lang=pref.language;
    assignText(document.getElementById('ccy-code'),c.code);assignText(document.getElementById('symbol'),c.symbol);setFlag(document.getElementById('ccy-flag'),c.flagSrc,c.country);
    if(c.compat==='USD'&&c.code!=='USD')document.querySelectorAll('.part__amount,.tip strong').forEach(el=>{if(/^\$\s/.test(el.textContent))el.textContent=el.textContent.replace(/^\$\s/,c.symbol+' ');});
  }
  function wrapExporter(){
    if(!window.Exporter||window.Exporter.__porsiPrefs)return;const original=window.Exporter.save;
    window.Exporter.save=async function(data,format){const pref=derive(),c=currencies[pref.currency];if(c.compat==='USD'&&c.code!=='USD'){const cloned=JSON.parse(JSON.stringify(data));const swap=v=>typeof v==='string'?v.replace(/^\$\s/,c.symbol+' '):v;cloned.totalText=swap(cloned.totalText);(cloned.slices||[]).forEach(s=>{s.amountText=swap(s.amountText);});return original.call(this,cloned,format);}return original.call(this,data,format);};window.Exporter.__porsiPrefs=true;
  }
  function boot(){
    document.documentElement.lang=derive().language;applyLanguage();patchPortfolio();wrapExporter();
    if(document.body&&document.body.dataset.page==='portfolio'){
      const parts=document.getElementById('parts');
      if(parts){let queued=false;const mo=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;patchPortfolio();});});mo.observe(parts,{subtree:true,childList:true,characterData:true});}
    }
  }
  window.PORSI_PREFS={currencies,languages,get,setCurrency,setLanguage,applyLanguage,patchPortfolio};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();