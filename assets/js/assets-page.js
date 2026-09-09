(function(){
'use strict';
const grid=document.getElementById('asset-grid'),status=document.getElementById('asset-status'),search=document.getElementById('asset-search');
let market={};
const fmtPct=v=>v==null||!Number.isFinite(v)?'N/A':`${v>=0?'+':''}${v.toFixed(1)}%`;
const pctClass=v=>v==null||!Number.isFinite(v)?'':v>=0?'pos':'neg';
function icon(a){return `<span class="asset-card__icon" style="--brand:${a.color}">${a.ticker.slice(0,5)}</span>`;}
function card(a){const intel=window.assetIntel(a),m=intel.marketSymbol?market[intel.marketSymbol]:null,c=m&&m.cagr||{};return `<a class="asset-card${intel.marketSymbol?'':' is-untracked'}" href="asset.html?ticker=${encodeURIComponent(a.ticker)}" data-search="${(a.ticker+' '+a.name).toLowerCase()}">${icon(a)}<div class="asset-card__body"><div class="asset-card__title"><strong>${a.ticker}</strong></div><div class="asset-card__name">${a.name}</div><div class="asset-card__metrics"><div class="metric-mini"><span>1M CAGR</span><strong class="${pctClass(c.m1)}">${fmtPct(c.m1)}</strong></div><div class="metric-mini"><span>1Y CAGR</span><strong class="${pctClass(c.y1)}">${fmtPct(c.y1)}</strong></div><div class="metric-mini"><span>5Y CAGR</span><strong class="${pctClass(c.y5)}">${fmtPct(c.y5)}</strong></div><div class="metric-mini"><span>10Y CAGR</span><strong class="${pctClass(c.y10)}">${fmtPct(c.y10)}</strong></div></div></div><span class="asset-card__arrow">›</span></a>`;}
function render(){grid.innerHTML=window.ASSETS.map(card).join('');filter();}
function filter(){const q=(search.value||'').trim().toLowerCase();grid.querySelectorAll('.asset-card').forEach(el=>el.hidden=q&&!el.dataset.search.includes(q));}
async function load(){render();const symbols=[...new Set(window.ASSETS.map(a=>window.assetIntel(a).marketSymbol).filter(Boolean))];try{const r=await fetch(`/api/market?symbols=${encodeURIComponent(symbols.join(','))}`);if(!r.ok)throw new Error('Market API unavailable');const j=await r.json();market=j.data||{};status.textContent='Market data loaded · cached up to 15 min';render();}catch(e){status.textContent='Market data unavailable — asset library tetap bisa dibuka';console.error(e);}}
search.addEventListener('input',filter);load();
})();