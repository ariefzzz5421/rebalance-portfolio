(function(){
'use strict';
const STORE='porsi.v1';
const STRATEGIES={
  high:{title:'Strategy 1 · High Risk',short:'High Risk',subtitle:'Crypto-heavy growth allocation',color:'#ff6b6b',parts:[['BTC','Bitcoin',50],['HYPE','Hyperliquid',20],['XAUT','Tether Gold',15],['USDT','Tether USD',15]]},
  conservative:{title:'Strategy 2 · Conservative',short:'Conservative',subtitle:'Balanced S&P 500, Bitcoin, and gold',color:'#22c55e',parts:[['SPX','S&P 500',34],['BTC','Bitcoin',33],['GOLD','Emas Fisik / Logam Mulia',33]]},
  pension:{title:'Strategy 3 · Pension Fund',short:'Pension Fund',subtitle:'Global equities with short-duration U.S. Treasury reserves',color:'#60a5fa',parts:[['VT','Vanguard Total World Stock ETF',60],['SHV','iShares 0-1 Year Treasury Bond ETF',20],['SGOV','iShares 0-3 Month Treasury Bond ETF',20]]}
};
let selected=null,market={},strategyMarket={},strategyPerformance={},menuOpen=false;
const $=(s,r)=>(r||document).querySelector(s);
const pctAsset=v=>v==null||!Number.isFinite(v)?'N/A':`${v>0?'+':''}${v.toFixed(1)}%`;
const pctReturn=v=>v==null||!Number.isFinite(v)?'N/A':`${v>0?'+':''}${(v*100).toFixed(1)}%`;
const tone=v=>v==null||!Number.isFinite(v)?'na':v>1e-12?'pos':v<-1e-12?'neg':'zero';
const esc=s=>String(s==null?'':s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function uid(){return 'p'+Math.random().toString(36).slice(2,8);}
function lang(){return window.PORSI_PREFS&&window.PORSI_PREFS.get?window.PORSI_PREFS.get().language:'id';}
function chooseLabel(){return({id:'Pilih strategy',en:'Choose strategy',ja:'戦略を選択',zh:'选择策略'})[lang()]||'Choose strategy';}
function assetMarket(ticker){const symbol=window.MARKET_SYMBOLS&&window.MARKET_SYMBOLS[ticker];return symbol&&market[symbol]&&!market[symbol].error?market[symbol]:null;}
function assetMetric(ticker,key){const m=assetMarket(ticker),v=m&&m.cagr&&m.cagr[key];return Number.isFinite(v)?v:null;}
function dotMarkup(color,extraClass){return `<span class="strategy-color-dot${extraClass?' '+extraClass:''}" style="--strategy-color:${color}" aria-hidden="true"></span>`;}
function assetHistoryText(ticker){return `1M ${pctAsset(assetMetric(ticker,'m1'))} · 1Y ${pctAsset(assetMetric(ticker,'y1'))} · 5Y ${pctAsset(assetMetric(ticker,'y5'))} · 10Y ${pctAsset(assetMetric(ticker,'y10'))}`;}
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
function strategyInput(strategy){
  const assets=[],weights={};
  strategy.parts.forEach(([ticker,,weight])=>{const symbol=window.MARKET_SYMBOLS&&window.MARKET_SYMBOLS[ticker],entry=symbol&&strategyMarket[symbol];assets.push({ticker,history:entry&&Array.isArray(entry.totalReturnHistory)?entry.totalReturnHistory:[],isStablecoin:ticker==='USDT',stablecoinFallbackUsed:!!(entry&&entry.stablecoinFallbackUsed)});weights[ticker]=weight/100;});
  return {assets,weights};
}
function calculateStrategyPerformance(key){const engine=window.StrategyPerformance,s=STRATEGIES[key];if(!engine||!s)return {metrics:[],error:'engine_unavailable'};const input=strategyInput(s);try{return engine.resolvePerformancePeriods(input.assets,input.weights,{rebalanceMode:'none'});}catch(err){console.warn('Strategy performance calculation failed',key,err);return {metrics:[],error:err.message||'calculation_failed'};}}
function recalculateStrategies(){Object.keys(STRATEGIES).forEach(key=>{strategyPerformance[key]=calculateStrategyPerformance(key);});}
function menuMetric(metric){return `<span class="strategy-metric"><small>${esc(metric.label)}</small><strong class="${tone(metric.value)}">${pctReturn(metric.value)}</strong></span>`;}
function menuMetrics(key){const metrics=(strategyPerformance[key]&&strategyPerformance[key].metrics)||[];return metrics.length?metrics.map(menuMetric).join(''):'<span class="strategy-coverage">Performance unavailable</span>';}
function optionMarkup(key,s){return `<button class="strategy-option" type="button" role="option" data-strategy-option="${key}" aria-selected="${selected===key}">${dotMarkup(s.color,'strategy-option__icon')}<span class="strategy-option__copy"><strong>${s.title}</strong><small>${s.subtitle}</small><span class="strategy-option__metrics">${menuMetrics(key)}</span></span><svg class="strategy-option__arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>`;}
function renderMenu(){const menu=$('#strategy-select-menu');if(!menu)return;menu.innerHTML=Object.entries(STRATEGIES).map(([k,s])=>optionMarkup(k,s)).join('');}
function compactPerformance(key){const metrics=(strategyPerformance[key]&&strategyPerformance[key].metrics)||[];return metrics.length?metrics.map(m=>`${m.label} ${pctReturn(m.value)}`).join(' · '):'Performance unavailable';}
function updateTrigger(key){const label=$('#strategy-select-label'),meta=$('#strategy-select-cagr'),trigger=$('#strategy-select-trigger'),icon=trigger&&trigger.querySelector('.strategy-select__generic-icon');if(!label||!meta||!trigger)return;if(!key){label.textContent=chooseLabel();meta.textContent='1Y · YTD · MAX';if(icon)icon.innerHTML=dotMarkup('#60a5fa','strategy-select__dot');return;}const s=STRATEGIES[key];label.textContent=s.title;meta.textContent=compactPerformance(key);if(icon)icon.innerHTML=dotMarkup(s.color,'strategy-select__dot');}
function setMenu(open){const menu=$('#strategy-select-menu'),trigger=$('#strategy-select-trigger');if(!menu||!trigger)return;menuOpen=!!open;menu.hidden=!menuOpen;trigger.setAttribute('aria-expanded',String(menuOpen));$('#strategy-select')&&$('#strategy-select').classList.toggle('is-open',menuOpen);}
function metricTooltip(metric){let text=metric.tooltip||'';text+=`${text?' · ':''}$10,000 normalized NAV · buy and hold · no rebalancing`;if(metric.stablecoinFallbackUsed)text+=' · explicit $1 stablecoin fallback used because market pricing was unavailable';return text;}
function performanceCard(metric){const type=metric.returnType==='cagr'?(metric.periodKey==='MAX'&&metric.actualYears?`${metric.actualYears.toFixed(1)}Y CAGR`:'CAGR'):'Total return',tip=metricTooltip(metric),value=pctReturn(metric.value);return `<span class="strategy-performance-card ${tone(metric.value)}" tabindex="0" data-tooltip="${esc(tip)}" title="${esc(tip)}"><span class="strategy-performance-card__period">${esc(metric.label)}</span><strong>${esc(value)}</strong><small>${esc(type)}</small></span>`;}
function renderModalSummary(key){const host=$('#strategy-summary');if(!host)return;const result=strategyPerformance[key],metrics=result&&result.metrics||[];if(!metrics.length){host.innerHTML='<div class="strategy-performance-empty">Historical strategy performance is unavailable.</div>';return;}host.innerHTML=`<div class="strategy-summary__metrics strategy-summary__metrics--performance">${metrics.map(performanceCard).join('')}</div><div class="strategy-performance-method">$10,000 normalized · buy & hold from period start · rebalance: none</div>`;}
function openStrategy(key){const s=STRATEGIES[key];if(!s)return;selected=key;updateTrigger(key);renderMenu();setMenu(false);$('#strategy-title').textContent=s.title;$('#strategy-subtitle').textContent=s.subtitle;const icon=$('#strategy-modal-icon');if(icon)icon.innerHTML=dotMarkup(s.color,'strategy-modal__dot');renderModalSummary(key);const host=$('#strategy-list');host.textContent='';s.parts.forEach(([ticker,name,weight])=>host.appendChild(buildRow(ticker,name,weight)));const sheet=$('#strategy-modal');sheet.hidden=false;document.body.classList.add('locked');requestAnimationFrame(()=>sheet.classList.add('on'));}
function closeStrategy(){const sheet=$('#strategy-modal');if(!sheet)return;sheet.classList.remove('on');document.body.classList.remove('locked');setTimeout(()=>sheet.hidden=true,180);}
function applyStrategy(){const s=STRATEGIES[selected];if(!s)return;let prev={};try{prev=JSON.parse(localStorage.getItem(STORE)||'{}')||{};}catch{}const next={currency:prev.currency||'IDR',total:Number(prev.total)||0,theme:prev.theme==='light'?'light':'dark',parts:s.parts.map(([ticker,,weight],i)=>({id:uid(),ticker,name:ticker,pct:weight,slot:i+1}))};try{localStorage.setItem(STORE,JSON.stringify(next));}catch{}location.reload();}
async function loadStrategyMetrics(){
  const symbols=[...new Set(Object.values(STRATEGIES).flatMap(s=>s.parts.map(([ticker])=>window.MARKET_SYMBOLS&&window.MARKET_SYMBOLS[ticker]).filter(Boolean)))];if(!symbols.length){renderMenu();return;}
  const urlSymbols=encodeURIComponent(symbols.join(',')),[summaryResult,strategyResult]=await Promise.allSettled([fetch(`/api/market?symbols=${urlSymbols}`),fetch(`/api/market?mode=strategy&symbols=${urlSymbols}`)]);
  try{if(summaryResult.status==='fulfilled'&&summaryResult.value.ok){const j=await summaryResult.value.json();market=j.data||{};}}catch(err){console.warn('Asset CAGR summary unavailable',err);}
  try{if(strategyResult.status==='fulfilled'&&strategyResult.value.ok){const j=await strategyResult.value.json();strategyMarket=j.data||{};}else throw new Error('Strategy history endpoint unavailable');}catch(err){console.warn('Strategy history unavailable',err);strategyMarket={};}
  recalculateStrategies();renderMenu();updateTrigger(selected);if(selected)renderModalSummary(selected);
}
function boot(){const trigger=$('#strategy-select-trigger'),menu=$('#strategy-select-menu');updateTrigger(null);if(trigger)trigger.addEventListener('click',e=>{e.stopPropagation();setMenu(!menuOpen);});if(menu)menu.addEventListener('click',e=>{const b=e.target.closest('[data-strategy-option]');if(b)openStrategy(b.dataset.strategyOption);});document.addEventListener('click',e=>{if(menuOpen&&!e.target.closest('#strategy-select'))setMenu(false);});document.querySelectorAll('#strategy-modal [data-close-strategy]').forEach(btn=>btn.addEventListener('click',closeStrategy));const apply=$('#apply-strategy');if(apply)apply.addEventListener('click',applyStrategy);const ccy=$('#ccy-chip');if(ccy)ccy.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();location.href='settings.html';},true);document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(menuOpen)setMenu(false);else if($('#strategy-modal')&&!$('#strategy-modal').hidden)closeStrategy();}});renderMenu();loadStrategyMetrics();}
document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
