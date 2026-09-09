(function(){
'use strict';
const grid=document.getElementById('asset-grid'),status=document.getElementById('asset-status'),search=document.getElementById('asset-search');
let market={},redrawTimer=0;
const lang=()=>window.PORSI_PREFS&&window.PORSI_PREFS.get?window.PORSI_PREFS.get().language:'id';
const fmtPct=v=>v==null||!Number.isFinite(v)?'N/A':`${v>=0?'+':''}${v.toFixed(1)}%`;
const pctClass=v=>v==null||!Number.isFinite(v)?'':v>=0?'pos':'neg';
function card(a){
 const intel=window.assetIntel(a),m=intel.marketSymbol?market[intel.marketSymbol]:null,c=m&&m.cagr||{},tracked=!!intel.marketSymbol;
 const icon=window.assetIconHTML?window.assetIconHTML(a.ticker,'md'):`<span class="asset-icon asset-icon--md" style="--brand:${a.color}"><span class="asset-icon__mono">${a.ticker.slice(0,2)}</span></span>`;
 return `<a class="asset-card${tracked?'':' is-untracked'}" href="asset.html?ticker=${encodeURIComponent(a.ticker)}" data-ticker="${a.ticker}" data-search="${(a.ticker+' '+a.name).toLowerCase()}">${icon}<div class="asset-card__body"><div class="asset-card__title"><strong>${a.ticker}</strong></div><div class="asset-card__name">${a.name}</div><div class="asset-card__metrics"><div class="metric-mini"><span>1M CAGR</span><strong class="${pctClass(c.m1)}">${fmtPct(c.m1)}</strong></div><div class="metric-mini"><span>1Y CAGR</span><strong class="${pctClass(c.y1)}">${fmtPct(c.y1)}</strong></div><div class="metric-mini"><span>5Y CAGR</span><strong class="${pctClass(c.y5)}">${fmtPct(c.y5)}</strong></div><div class="metric-mini"><span>10Y CAGR</span><strong class="${pctClass(c.y10)}">${fmtPct(c.y10)}</strong></div></div><canvas class="asset-card__spark" width="480" height="88" aria-hidden="true"></canvas></div><span class="asset-card__arrow">›</span></a>`;
}
function drawSpark(canvas,points){
 if(!canvas||!Array.isArray(points)||points.length<2){if(canvas)canvas.style.opacity='.25';return;}
 const data=points.slice(-18),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,pad=8,vals=data.map(p=>p.v),min=Math.min(...vals),max=Math.max(...vals),span=max-min||1;
 ctx.clearRect(0,0,w,h);ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#3987e5';ctx.beginPath();
 data.forEach((p,i)=>{const x=pad+(i/(data.length-1))*(w-pad*2),y=h-pad-((p.v-min)/span)*(h-pad*2);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
}
function redrawSparks(){grid.querySelectorAll('.asset-card').forEach(el=>{if(el.hidden)return;const a=window.assetByTicker(el.dataset.ticker),intel=window.assetIntel(a),m=intel.marketSymbol?market[intel.marketSymbol]:null;drawSpark(el.querySelector('canvas'),m&&m.history);});}
function scheduleRedraw(){clearTimeout(redrawTimer);redrawTimer=setTimeout(redrawSparks,80);}
function render(){grid.innerHTML=window.ASSETS.map(card).join('');filter();requestAnimationFrame(redrawSparks);}
function filter(){const q=(search.value||'').trim().toLowerCase();grid.querySelectorAll('.asset-card').forEach(el=>el.hidden=!!(q&&!el.dataset.search.includes(q)));scheduleRedraw();}
async function load(){
 render();const symbols=[...new Set(window.ASSETS.map(a=>window.assetIntel(a).marketSymbol).filter(Boolean))];
 try{const r=await fetch(`/api/market?symbols=${encodeURIComponent(symbols.join(','))}`);if(!r.ok)throw new Error('Market API unavailable');const j=await r.json();market=j.data||{};status.textContent=lang()==='en'?'Market data loaded · cached up to 15 min':'Market data dimuat · cache hingga 15 menit';render();}
 catch(e){status.textContent=lang()==='en'?'Market data unavailable — the asset library still works':'Market data tidak tersedia — asset library tetap bisa dibuka';console.error(e);}
}
search.addEventListener('input',filter,{passive:true});window.addEventListener('porsi:theme',scheduleRedraw);const ro=new ResizeObserver(scheduleRedraw);ro.observe(grid);load();
})();