(function(){
'use strict';
const STORE='porsi.v1';
const STRATEGIES={
  high:{title:'Strategy 1 · High Risk',short:'High Risk',subtitle:'Crypto-heavy growth allocation',icon:'assets/icons/strategy-high.svg',parts:[['BTC','Bitcoin',50],['HYPE','Hyperliquid',20],['XAUT','Tether Gold',15],['USDT','Tether USD',15]]},
  conservative:{title:'Strategy 2 · Conservative',short:'Conservative',subtitle:'Balanced S&P 500, Bitcoin, and gold',icon:'assets/icons/strategy-conservative.svg',parts:[['SPX','S&P 500',34],['BTC','Bitcoin',33],['GOLD','Emas Fisik / Logam Mulia',33]]}
};
let selected=null,market={},menuOpen=false;
const $=(s,r)=>(r||document).querySelector(s);
const pct=v=>v==null||!Number.isFinite(v)?'N/A':`${v>=0?'+':''}${v.toFixed(1)}%`;
const tone=v=>v==null||!Number.isFinite(v)?'':v>=0?'pos':'neg';
function uid(){return 'p'+Math.random().toString(36).slice(2,8);}
function lang(){return window.PORSI_PREFS&&window.PORSI_PREFS.get?window.PORSI_PREFS.get().language:'id';}
function metricFor(strategy,key){
  let weighted=0,coverage=0;
  strategy.parts.forEach(([ticker,,weight])=>{const symbol=window.MARKET_SYMBOLS&&window.MARKET_SYMBOLS[ticker],m=symbol&&market[symbol],v=m&&m.cagr&&m.cagr[key];if(Number.isFinite(v)){weighted+=v*weight;coverage+=weight;}});
  return {value:coverage?weighted/coverage:null,coverage};
}
function strategyMetrics(strategy){return{y1:metricFor(strategy,'y1'),y5:metricFor(strategy,'y5'),y10:metricFor(strategy,'y10')};}
function metricPill(label,m){return `<span class="strategy-metric"><small>${label}</small><strong class="${tone(m.value)}">${pct(m.value)}</strong></span>`;}
function coverageNote(metrics){const coverage=Math.min(metrics.y1.coverage,metrics.y5.coverage,metrics.y10.coverage);return coverage>=99?'':`<span class="strategy-coverage">${Math.round(coverage)}% data coverage</span>`;}
function buildRow(ticker,name,weight){
  const row=document.createElement('div');row.className='strategy-modal__row';
  const left=document.createElement('div');left.className='strategy-modal__asset';
  if(window.assetIconEl)left.appendChild(window.assetIconEl(ticker,'md'));
  const text=document.createElement('div');text.className='strategy-modal__identity';
  const tk=document.createElement('strong');tk.textContent=ticker;const nm=document.createElement('span');nm.textContent=name;text.append(tk,nm);left.appendChild(text);
  const value=document.createElement('span');value.className='strategy-modal__pct';value.textContent=weight+'%';row.append(left,value);return row;
}
function optionMarkup(key,s){
  const m=strategyMetrics(s);
  return `<button class="strategy-option" type="button" role="option" data-strategy-option="${key}" aria-selected="${selected===key}"><img class="strategy-option__icon" src="${s.icon}" alt="" aria-hidden="true"><span class="strategy-option__copy"><strong>${s.title}</strong><small>${s.subtitle}</small><span class="strategy-option__metrics">${metricPill('1Y',m.y1)}${metricPill('5Y',m.y5)}${metricPill('10Y',m.y10)}${coverageNote(m)}</span></span><svg class="strategy-option__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;
}
function renderMenu(){const menu=$('#strategy-select-menu');if(!menu)return;menu.innerHTML=Object.entries(STRATEGIES).map(([k,s])=>optionMarkup(k,s)).join('');}
function updateTrigger(key){
  const label=$('#strategy-select-label'),meta=$('#strategy-select-cagr'),trigger=$('#strategy-select-trigger');if(!label||!meta||!trigger)return;
  if(!key){label.textContent=lang()==='en'?'Choose strategy':'Pilih strategy';meta.textContent='1Y · 5Y · 10Y';return;}
  const s=STRATEGIES[key],m=strategyMetrics(s);label.textContent=s.title;meta.textContent=`1Y ${pct(m.y1.value)} · 5Y ${pct(m.y5.value)} · 10Y ${pct(m.y10.value)}`;trigger.style.setProperty('--strategy-icon',`url("${s.icon}")`);
}
function setMenu(open){const menu=$('#strategy-select-menu'),trigger=$('#strategy-select-trigger');if(!menu||!trigger)return;menuOpen=!!open;menu.hidden=!menuOpen;trigger.setAttribute('aria-expanded',String(menuOpen));$('#strategy-select')&&$('#strategy-select').classList.toggle('is-open',menuOpen);}
function renderModalSummary(s){
  const host=$('#strategy-summary');if(!host)return;const m=strategyMetrics(s),minCoverage=Math.min(m.y1.coverage,m.y5.coverage,m.y10.coverage);
  host.innerHTML=`<div class="strategy-summary__label">Weighted asset CAGR</div><div class="strategy-summary__metrics">${metricPill('1Y',m.y1)}${metricPill('5Y',m.y5)}${metricPill('10Y',m.y10)}</div><p>${minCoverage>=99?'Menggunakan semua komponen strategy.':'Ringkasan memakai komponen yang memiliki histori cukup; coverage minimum '+Math.round(minCoverage)+'%.'}</p>`;
}
function openStrategy(key){
  const s=STRATEGIES[key];if(!s)return;selected=key;updateTrigger(key);renderMenu();setMenu(false);
  $('#strategy-title').textContent=s.title;$('#strategy-subtitle').textContent=s.subtitle;
  const icon=$('#strategy-modal-icon');if(icon)icon.innerHTML=`<img src="${s.icon}" alt="" aria-hidden="true">`;
  renderModalSummary(s);
  const host=$('#strategy-list');host.textContent='';s.parts.forEach(([ticker,name,weight])=>host.appendChild(buildRow(ticker,name,weight)));
  const sheet=$('#strategy-modal');sheet.hidden=false;document.body.classList.add('locked');requestAnimationFrame(()=>sheet.classList.add('on'));
}
function closeStrategy(){const sheet=$('#strategy-modal');if(!sheet)return;sheet.classList.remove('on');document.body.classList.remove('locked');setTimeout(()=>sheet.hidden=true,180);}
function applyStrategy(){
  const s=STRATEGIES[selected];if(!s)return;let prev={};try{prev=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch{}
  const next={currency:prev.currency||'IDR',total:Number(prev.total)||0,theme:prev.theme==='light'?'light':'dark',parts:s.parts.map(([ticker,,weight],i)=>({id:uid(),ticker,name:ticker,pct:weight,slot:i+1}))};
  try{localStorage.setItem(STORE,JSON.stringify(next));}catch{}location.reload();
}
async function loadStrategyMetrics(){
  const symbols=[...new Set(Object.values(STRATEGIES).flatMap(s=>s.parts.map(([ticker])=>window.MARKET_SYMBOLS&&window.MARKET_SYMBOLS[ticker]).filter(Boolean)))];
  if(!symbols.length){renderMenu();return;}
  try{const r=await fetch(`/api/market?symbols=${encodeURIComponent(symbols.join(','))}`);if(!r.ok)throw new Error('Market API unavailable');const j=await r.json();market=j.data||{};}catch(err){console.warn('Strategy CAGR unavailable',err);}renderMenu();updateTrigger(selected);
}
function boot(){
  const trigger=$('#strategy-select-trigger'),menu=$('#strategy-select-menu');
  if(trigger)trigger.addEventListener('click',e=>{e.stopPropagation();setMenu(!menuOpen);});
  if(menu)menu.addEventListener('click',e=>{const b=e.target.closest('[data-strategy-option]');if(b)openStrategy(b.dataset.strategyOption);});
  document.addEventListener('click',e=>{if(menuOpen&&!e.target.closest('#strategy-select'))setMenu(false);});
  document.querySelectorAll('#strategy-modal [data-close-strategy]').forEach(btn=>btn.addEventListener('click',closeStrategy));
  const apply=$('#apply-strategy');if(apply)apply.addEventListener('click',applyStrategy);
  const ccy=$('#ccy-chip');if(ccy)ccy.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();location.href='settings.html';},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(menuOpen)setMenu(false);else if($('#strategy-modal')&&!$('#strategy-modal').hidden)closeStrategy();}});
  renderMenu();loadStrategyMetrics();
}
document.addEventListener('DOMContentLoaded',boot,{once:true});
})();