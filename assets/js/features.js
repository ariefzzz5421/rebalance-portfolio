(function(){
'use strict';
const STORE='porsi.v1';
const STRATEGIES={
  high:{title:'Strategy 1 · High Risk',short:'High Risk',subtitle:'Crypto-heavy growth allocation',color:'#ff6b6b',parts:[['BTC','Bitcoin',50],['HYPE','Hyperliquid',20],['XAUT','Tether Gold',15],['USDT','Tether USD',15]]},
  conservative:{title:'Strategy 2 · Conservative',short:'Conservative',subtitle:'Balanced S&P 500, Bitcoin, and gold',color:'#22c55e',parts:[['SPX','S&P 500',34],['BTC','Bitcoin',33],['GOLD','Emas Fisik / Logam Mulia',33]]},
  pension:{title:'Strategy 3 · Pension Fund',short:'Pension Fund',subtitle:'Global equities with short-duration U.S. Treasury reserves',color:'#60a5fa',parts:[['VT','Vanguard Total World Stock ETF',60],['SHV','iShares 0-1 Year Treasury Bond ETF',20],['SGOV','iShares 0-3 Month Treasury Bond ETF',20]]}
};
const PERIOD_YEARS={m1:1/12,y1:1,y5:5,y10:10};
let selected=null,market={},menuOpen=false;
const $=(s,r)=>(r||document).querySelector(s);
const pct=v=>v==null||!Number.isFinite(v)?'N/A':`${v>=0?'+':''}${v.toFixed(1)}%`;
const tone=v=>v==null||!Number.isFinite(v)?'':v>=0?'pos':'neg';
function uid(){return 'p'+Math.random().toString(36).slice(2,8);}
function lang(){return window.PORSI_PREFS&&window.PORSI_PREFS.get?window.PORSI_PREFS.get().language:'id';}
function assetMarket(ticker){const symbol=window.MARKET_SYMBOLS&&window.MARKET_SYMBOLS[ticker];return symbol&&market[symbol]&&!market[symbol].error?market[symbol]:null;}
function assetMetric(ticker,key){const m=assetMarket(ticker),v=m&&m.cagr&&m.cagr[key];return Number.isFinite(v)?v:null;}
function assetGrowth(ticker,key,years){
  const m=assetMarket(ticker);if(!m)return null;
  const period=m.periods&&m.periods[key];if(period&&Number.isFinite(period.growth)&&period.growth>0)return period.growth;
  const c=m.cagr&&m.cagr[key];if(!Number.isFinite(c)||1+c/100<=0)return null;
  return Math.pow(1+c/100,years);
}
function strategyMetric(strategy,key){
  const years=PERIOD_YEARS[key];let weightedGrowth=0,coverage=0;
  strategy.parts.forEach(([ticker,,weight])=>{const growth=assetGrowth(ticker,key,years);if(Number.isFinite(growth)&&growth>0){weightedGrowth+=growth*weight;coverage+=weight;}});
  if(!coverage)return {value:null,coverage:0,growth:null};
  const portfolioGrowth=weightedGrowth/coverage,value=(Math.pow(portfolioGrowth,1/years)-1)*100;
  return {value:Number.isFinite(value)?value:null,coverage,growth:portfolioGrowth};
}
function strategyMetrics(strategy){return{y1:strategyMetric(strategy,'y1'),y5:strategyMetric(strategy,'y5'),y10:strategyMetric(strategy,'y10')};}
function metricPill(label,m){return `<span class="strategy-metric"><small>${label}</small><strong class="${tone(m.value)}">${pct(m.value)}</strong></span>`;}
function coverageNote(metrics){const coverage=Math.min(metrics.y1.coverage,metrics.y5.coverage,metrics.y10.coverage);return coverage>=99?'':`<span class="strategy-coverage">${Math.round(coverage)}% data coverage</span>`;}
function dotMarkup(color,extraClass){return `<span class="strategy-color-dot${extraClass?' '+extraClass:''}" style="--strategy-color:${color}" aria-hidden="true"></span>`;}
function assetHistoryText(ticker){return `1M (1 Month) ${pct(assetMetric(ticker,'m1'))} · 1Y (1 Year) ${pct(assetMetric(ticker,'y1'))} · 5Y (5 Years) ${pct(assetMetric(ticker,'y5'))} · 10Y (10 Years) ${pct(assetMetric(ticker,'y10'))}`;}
function buildRow(ticker,name,weight){
  const row=document.createElement('div');row.className='strategy-modal__row';
  const left=document.createElement('div');left.className='strategy-modal__asset';
  if(window.assetIconEl)left.appendChild(window.assetIconEl(ticker,'md'));
  const text=document.createElement('div');text.className='strategy-modal__identity';
  const top=document.createElement('div');top.className='strategy-modal__identity-line';const tk=document.createElement('strong');tk.textContent=ticker;const nm=document.createElement('span');nm.textContent=name;top.append(tk,nm);
  const history=document.createElement('small');history.className='strategy-modal__asset-cagr';history.textContent=assetHistoryText(ticker);
  text.append(top,history);left.appendChild(text);
  const value=document.createElement('span');value.className='strategy-modal__pct';value.textContent=weight+'%';row.append(left,value);return row;
}
function optionMarkup(key,s){const m=strategyMetrics(s);return `<button class="strategy-option" type="button" role="option" data-strategy-option="${key}" aria-selected="${selected===key}">${dotMarkup(s.color,'strategy-option__icon')}<span class="strategy-option__copy"><strong>${s.title}</strong><small>${s.subtitle}</small><span class="strategy-option__metrics">${metricPill('1Y',m.y1)}${metricPill('5Y',m.y5)}${metricPill('10Y',m.y10)}${coverageNote(m)}</span></span><svg class="strategy-option__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;}
function renderMenu(){const menu=$('#strategy-select-menu');if(!menu)return;menu.innerHTML=Object.entries(STRATEGIES).map(([k,s])=>optionMarkup(k,s)).join('');}
function updateTrigger(key){
  const label=$('#strategy-select-label'),meta=$('#strategy-select-cagr'),trigger=$('#strategy-select-trigger'),icon=trigger&&trigger.querySelector('.strategy-select__generic-icon');if(!label||!meta||!trigger)return;
  if(!key){label.textContent=lang()==='en'?'Choose strategy':'Pilih strategy';meta.textContent='1Y · 5Y · 10Y';if(icon)icon.innerHTML=dotMarkup('#60a5fa','strategy-select__dot');return;}
  const s=STRATEGIES[key],m=strategyMetrics(s);label.textContent=s.title;meta.textContent=`1Y ${pct(m.y1.value)} · 5Y ${pct(m.y5.value)} · 10Y ${pct(m.y10.value)}`;if(icon)icon.innerHTML=dotMarkup(s.color,'strategy-select__dot');
}
function setMenu(open){const menu=$('#strategy-select-menu'),trigger=$('#strategy-select-trigger');if(!menu||!trigger)return;menuOpen=!!open;menu.hidden=!menuOpen;trigger.setAttribute('aria-expanded',String(menuOpen));$('#strategy-select')&&$('#strategy-select').classList.toggle('is-open',menuOpen);}
function renderModalSummary(s){const host=$('#strategy-summary');if(!host)return;const m=strategyMetrics(s),minCoverage=Math.min(m.y1.coverage,m.y5.coverage,m.y10.coverage);host.innerHTML=`<div class="strategy-summary__label">Portfolio CAGR · buy-and-hold weighted growth</div><div class="strategy-summary__metrics">${metricPill('1Y',m.y1)}${metricPill('5Y',m.y5)}${metricPill('10Y',m.y10)}</div><p>${minCoverage>=99?'Semua komponen memiliki histori yang cukup untuk horizon tersebut.':'Horizon yang lebih panjang dinormalisasi hanya pada aset dengan histori cukup; coverage minimum '+Math.round(minCoverage)+'%.'}</p>`;}
function openStrategy(key){
  const s=STRATEGIES[key];if(!s)return;selected=key;updateTrigger(key);renderMenu();setMenu(false);$('#strategy-title').textContent=s.title;$('#strategy-subtitle').textContent=s.subtitle;
  const icon=$('#strategy-modal-icon');if(icon)icon.innerHTML=dotMarkup(s.color,'strategy-modal__dot');
  renderModalSummary(s);const host=$('#strategy-list');host.textContent='';s.parts.forEach(([ticker,name,weight])=>host.appendChild(buildRow(ticker,name,weight)));
  const sheet=$('#strategy-modal');sheet.hidden=false;document.body.classList.add('locked');requestAnimationFrame(()=>sheet.classList.add('on'));
}
function closeStrategy(){const sheet=$('#strategy-modal');if(!sheet)return;sheet.classList.remove('on');document.body.classList.remove('locked');setTimeout(()=>sheet.hidden=true,180);}
function applyStrategy(){const s=STRATEGIES[selected];if(!s)return;let prev={};try{prev=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch{}const next={currency:prev.currency||'IDR',total:Number(prev.total)||0,theme:prev.theme==='light'?'light':'dark',parts:s.parts.map(([ticker,,weight],i)=>({id:uid(),ticker,name:ticker,pct:weight,slot:i+1}))};try{localStorage.setItem(STORE,JSON.stringify(next));}catch{}location.reload();}
async function loadStrategyMetrics(){const symbols=[...new Set(Object.values(STRATEGIES).flatMap(s=>s.parts.map(([ticker])=>window.MARKET_SYMBOLS&&window.MARKET_SYMBOLS[ticker]).filter(Boolean)))];if(!symbols.length){renderMenu();return;}try{const r=await fetch(`/api/market?symbols=${encodeURIComponent(symbols.join(','))}`);if(!r.ok)throw new Error('Market API unavailable');const j=await r.json();market=j.data||{};}catch(err){console.warn('Strategy CAGR unavailable',err);}renderMenu();updateTrigger(selected);}
function boot(){const trigger=$('#strategy-select-trigger'),menu=$('#strategy-select-menu');updateTrigger(null);if(trigger)trigger.addEventListener('click',e=>{e.stopPropagation();setMenu(!menuOpen);});if(menu)menu.addEventListener('click',e=>{const b=e.target.closest('[data-strategy-option]');if(b)openStrategy(b.dataset.strategyOption);});document.addEventListener('click',e=>{if(menuOpen&&!e.target.closest('#strategy-select'))setMenu(false);});document.querySelectorAll('#strategy-modal [data-close-strategy]').forEach(btn=>btn.addEventListener('click',closeStrategy));const apply=$('#apply-strategy');if(apply)apply.addEventListener('click',applyStrategy);const ccy=$('#ccy-chip');if(ccy)ccy.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();location.href='settings.html';},true);document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(menuOpen)setMenu(false);else if($('#strategy-modal')&&!$('#strategy-modal').hidden)closeStrategy();}});renderMenu();loadStrategyMetrics();}
document.addEventListener('DOMContentLoaded',boot,{once:true});
})();