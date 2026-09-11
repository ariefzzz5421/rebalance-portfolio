(function(){
'use strict';
const grid=document.getElementById('asset-grid'),status=document.getElementById('asset-status'),search=document.getElementById('asset-search');
const CACHE_KEY='porsi.asset-library.market.v2',CACHE_TTL=15*60*1000;
let market={},cards=[],redrawTimer=0,visibleCards=new Set(),sparkObserver=null,resizeObserver=null;
const lang=()=>window.PORSI_PREFS&&window.PORSI_PREFS.get?window.PORSI_PREFS.get().language:'id';
const STATUS={
 id:{ok:'Market data dimuat · cache hingga 15 menit',err:'Market data tidak tersedia — asset library tetap bisa dibuka'},
 en:{ok:'Market data loaded · cached up to 15 min',err:'Market data unavailable — the asset library still works'},
 ja:{ok:'マーケットデータを読み込みました · 最大15分キャッシュ',err:'マーケットデータを取得できません — 資産ライブラリは引き続き利用できます'},
 zh:{ok:'市场数据已加载 · 最长缓存15分钟',err:'市场数据暂不可用 — 资产库仍可正常浏览'}
};
const fmtPct=v=>v==null||!Number.isFinite(v)?'N/A':`${v>=0?'+':''}${v.toFixed(1)}%`;
const pctClass=v=>v==null||!Number.isFinite(v)?'':v>=0?'pos':'neg';
const metricLabel=(short,long)=>`<span class="metric-mini__label"><b>${short}</b><small>(${long})</small></span>`;
function card(a){
 const intel=window.assetIntel(a),tracked=!!intel.marketSymbol;
 const icon=window.assetIconHTML?window.assetIconHTML(a.ticker,'md'):`<span class="asset-icon asset-icon--md" style="--brand:${a.color}"><span class="asset-icon__mono">${a.ticker.slice(0,2)}</span></span>`;
 return `<a class="asset-card${tracked?'':' is-untracked'}" href="asset.html?ticker=${encodeURIComponent(a.ticker)}" data-ticker="${a.ticker}" data-search="${(a.ticker+' '+a.name).toLowerCase()}">${icon}<div class="asset-card__body"><div class="asset-card__title"><strong>${a.ticker}</strong></div><div class="asset-card__name">${a.name}</div><div class="asset-card__metrics"><div class="metric-mini">${metricLabel('1M','1 Month')}<strong data-metric="m1">N/A</strong></div><div class="metric-mini">${metricLabel('1Y','1 Year')}<strong data-metric="y1">N/A</strong></div><div class="metric-mini">${metricLabel('5Y','5 Years')}<strong data-metric="y5">N/A</strong></div><div class="metric-mini">${metricLabel('10Y','10 Years')}<strong data-metric="y10">N/A</strong></div></div><canvas class="asset-card__spark" width="480" height="88" aria-hidden="true"></canvas></div><span class="asset-card__arrow">›</span></a>`;
}
function drawSpark(canvas,points,accent){
 if(!canvas||!Array.isArray(points)||points.length<2){if(canvas)canvas.style.opacity='.25';return;}
 canvas.style.opacity='1';const data=points.slice(-18),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,pad=8,vals=data.map(p=>p.v),min=Math.min(...vals),max=Math.max(...vals),span=max-min||1;
 ctx.clearRect(0,0,w,h);ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=accent;ctx.beginPath();
 data.forEach((p,i)=>{const x=pad+(i/(data.length-1))*(w-pad*2),y=h-pad-((p.v-min)/span)*(h-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
}
function marketForCard(el){const a=window.assetByTicker(el.dataset.ticker),intel=window.assetIntel(a);return intel.marketSymbol?market[intel.marketSymbol]:null;}
function drawCardSpark(el,accent){if(!el||el.hidden)return;const m=marketForCard(el);drawSpark(el.querySelector('canvas'),m&&m.history,accent);}
function redrawSparks(){const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#3987e5',targets=sparkObserver?[...visibleCards]:cards;targets.forEach(el=>drawCardSpark(el,accent));}
function scheduleRedraw(){clearTimeout(redrawTimer);redrawTimer=setTimeout(redrawSparks,70);}
function hydrateCard(el){const m=marketForCard(el),c=m&&m.cagr||{};el.querySelectorAll('[data-metric]').forEach(node=>{const v=c[node.dataset.metric];node.textContent=fmtPct(v);node.classList.remove('pos','neg');const cls=pctClass(v);if(cls)node.classList.add(cls);});}
function hydrateCards(){cards.forEach(hydrateCard);requestAnimationFrame(redrawSparks);}
function setupObservers(){
 if(sparkObserver)sparkObserver.disconnect();visibleCards.clear();
 if('IntersectionObserver'in window){sparkObserver=new IntersectionObserver(entries=>{const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#3987e5';entries.forEach(entry=>{const el=entry.target;if(entry.isIntersecting&&!el.hidden){visibleCards.add(el);drawCardSpark(el,accent);}else visibleCards.delete(el);});},{rootMargin:'180px 0px'});cards.forEach(el=>sparkObserver.observe(el));}
 if(resizeObserver)resizeObserver.disconnect();
 if('ResizeObserver'in window){resizeObserver=new ResizeObserver(scheduleRedraw);resizeObserver.observe(grid);}
}
function render(){grid.innerHTML=window.ASSETS.map(card).join('');cards=[...grid.querySelectorAll('.asset-card')];setupObservers();filter();}
function filter(){const q=(search.value||'').trim().toLowerCase();cards.forEach(el=>{el.hidden=!!(q&&!el.dataset.search.includes(q));if(el.hidden)visibleCards.delete(el);});scheduleRedraw();}
function compactForCache(data){const out={};Object.entries(data||{}).forEach(([symbol,value])=>{if(!value||value.error)return;out[symbol]={cagr:value.cagr||{},history:Array.isArray(value.history)?value.history.slice(-18):[]};});return out;}
function readCache(){try{const cached=JSON.parse(sessionStorage.getItem(CACHE_KEY)||'null');if(!cached||!cached.ts||Date.now()-cached.ts>CACHE_TTL)return null;return cached.data||null;}catch{return null;}}
function writeCache(){try{sessionStorage.setItem(CACHE_KEY,JSON.stringify({ts:Date.now(),data:compactForCache(market)}));}catch{}}
async function load(){
 render();const t=STATUS[lang()]||STATUS.en,cached=readCache();if(cached){market=cached;status.textContent=t.ok;hydrateCards();return;}
 const symbols=[...new Set(window.ASSETS.map(a=>window.assetIntel(a).marketSymbol).filter(Boolean))];
 try{const r=await fetch(`/api/market?symbols=${encodeURIComponent(symbols.join(','))}`);if(!r.ok)throw new Error('Market API unavailable');const j=await r.json();market=j.data||{};status.textContent=t.ok;writeCache();hydrateCards();}
 catch(e){status.textContent=t.err;console.error(e);}
}
search.addEventListener('input',filter,{passive:true});window.addEventListener('porsi:theme',scheduleRedraw);if(!('ResizeObserver'in window))window.addEventListener('resize',scheduleRedraw,{passive:true});load();
})();
