(function(){
'use strict';
const host=document.getElementById('asset-detail');
const ticker=(new URLSearchParams(location.search).get('ticker')||'').toUpperCase();
const asset=window.assetByTicker(ticker);
let marketData=null,range='1Y',resizeObserver=null,raf=0;
const pointer={index:null,pinned:false};
const pct=v=>v==null||!Number.isFinite(v)?'N/A':`${v>=0?'+':''}${v.toFixed(1)}%`;
const cls=v=>v==null||!Number.isFinite(v)?'':v>=0?'pos':'neg';
function price(v,c,compact){
  if(v==null||!Number.isFinite(v))return 'N/A';
  if(ticker==='SPX')return `${new Intl.NumberFormat('en-US',{notation:compact?'compact':'standard',maximumFractionDigits:compact?1:2}).format(v)} pts`;
  try{return new Intl.NumberFormat(c==='IDR'?'id-ID':'en-US',{style:'currency',currency:c||'USD',notation:compact?'compact':'standard',maximumFractionDigits:compact?1:(c==='IDR'?0:2)}).format(v);}catch{return new Intl.NumberFormat('en-US',{notation:compact?'compact':'standard',maximumFractionDigits:2}).format(v);}
}
function extIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';}
function render(m){
 const intel=window.assetIntel(asset),c=m&&m.cagr||{},icon=window.assetIconHTML?window.assetIconHTML(asset.ticker,'xl'):`<span class="asset-icon asset-icon--xl" style="--brand:${asset.color}"><span class="asset-icon__mono">${asset.ticker.slice(0,2)}</span></span>`;
 document.title=`${asset.ticker} — ${asset.name} · Porsi`;
 host.innerHTML=`
 <section class="asset-hero">
  <div class="asset-summary" style="--brand:${asset.color}"><div class="asset-summary__top">${icon}<div class="asset-summary__heading"><h1><strong>${asset.ticker}</strong><span>${asset.name}</span></h1></div></div><div class="asset-summary__price">${m?price(m.price,m.currency):'Market data unavailable'}</div><div class="asset-summary__asof">${m&&m.asOf?`Harga terakhir · ${new Date(m.asOf).toLocaleString('id-ID')}`:'Aset ini belum terhubung ke market feed'}</div><div class="cagr-grid"><div class="cagr-card"><span>1M CAGR</span><strong class="${cls(c.m1)}">${pct(c.m1)}</strong></div><div class="cagr-card"><span>1Y CAGR</span><strong class="${cls(c.y1)}">${pct(c.y1)}</strong></div><div class="cagr-card"><span>5Y CAGR</span><strong class="${cls(c.y5)}">${pct(c.y5)}</strong></div><div class="cagr-card"><span>10Y CAGR</span><strong class="${cls(c.y10)}">${pct(c.y10)}</strong></div></div></div>
  <aside class="detail-panel prose-panel"><h2 class="asset-about-title"><strong>${asset.ticker}</strong> <span>— ${asset.name}</span></h2><p>${intel.summary}</p><p>${intel.background}</p></aside>
 </section>
 <section class="detail-panel asset-chart-panel">
  <div class="asset-chart-head"><div><h2>Historical price</h2><p class="finance-source-note">Gerakkan pointer atau klik chart untuk membaca harga nyata pada tanggal tertentu.</p>${m?`<div class="asset-chart-live">Latest ${price(m.price,m.currency)}</div>`:''}</div><div class="chart-ranges"><button class="chart-range" data-range="1M">1M</button><button class="chart-range" data-range="6M">6M</button><button class="chart-range is-on" data-range="1Y">1Y</button><button class="chart-range" data-range="5Y">5Y</button><button class="chart-range" data-range="10Y">10Y</button></div></div>
  <div class="asset-chart-wrap">${m&&m.history&&m.history.length?'<canvas class="asset-chart" id="asset-chart" tabindex="0" aria-label="Interactive historical price chart. Use pointer or left and right arrow keys."></canvas><div class="chart-tooltip" id="chart-tooltip" role="status"></div>':'<div class="chart-empty">Historical chart belum tersedia untuk aset ini.</div>'}</div>
  <div class="chart-stats" id="chart-stats"></div>
  <div class="finance-links"><a class="finance-link" href="${intel.googleFinanceUrl}" target="_blank" rel="noopener">Google Finance ${extIcon()}</a>${intel.yahooFinanceUrl?`<a class="finance-link" href="${intel.yahooFinanceUrl}" target="_blank" rel="noopener">Yahoo Finance ${extIcon()}</a>`:''}</div>
  <p class="finance-source-note">Chart Porsi memakai harga pasar historis dari Yahoo Finance dan menambahkan harga terbaru dari feed yang sama. Google Finance tersedia sebagai referensi eksternal utama.</p>
 </section>
 <section class="detail-panel prose-panel"><h2>How to read this asset</h2><p><strong>Catatan metodologi:</strong> CAGR memakai adjusted close agar corporate actions/dividend handling lebih konsisten, sedangkan garis chart menampilkan historical market close price. 1M annualized sebaiknya dibaca sebagai konteks momentum, bukan prediksi return setahun.</p></section>`;
 document.querySelectorAll('[data-range]').forEach(b=>b.addEventListener('click',()=>{if(range===b.dataset.range)return;range=b.dataset.range;pointer.index=null;pointer.pinned=false;document.querySelectorAll('[data-range]').forEach(x=>x.classList.toggle('is-on',x===b));drawChart();}));
 setupChart();
}
function monthsForRange(){return range==='1M'?1:range==='6M'?6:range==='1Y'?12:range==='10Y'?120:60;}
function filteredHistory(){const h=marketData&&Array.isArray(marketData.history)?marketData.history:[];if(!h.length)return[];const end=h[h.length-1].t,cut=end-monthsForRange()*30.4375*86400000;return h.filter(p=>p.t>=cut);}
function plotGeometry(canvas,data){const rect=canvas.getBoundingClientRect(),w=Math.max(320,rect.width),h=Math.max(220,rect.height),pad={l:72,r:18,t:18,b:32},vals=data.map(p=>p.v),rawMin=Math.min(...vals),rawMax=Math.max(...vals),extra=(rawMax-rawMin||Math.max(rawMax*.02,1))*.08,min=Math.max(0,rawMin-extra),max=rawMax+extra,span=max-min||1;return{w,h,pad,min,max,span,plotW:w-pad.l-pad.r,plotH:h-pad.t-pad.b};}
function pointXY(i,p,data,g){return{x:g.pad.l+(i/(data.length-1))*g.plotW,y:g.pad.t+((g.max-p.v)/g.span)*g.plotH};}
function drawChart(){
 const canvas=document.getElementById('asset-chart');if(!canvas)return;const data=filteredHistory();if(data.length<2)return;
 const g=plotGeometry(canvas,data),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.round(g.w*dpr);canvas.height=Math.round(g.h*dpr);const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,g.w,g.h);
 const css=getComputedStyle(document.documentElement),accent=css.getPropertyValue('--accent').trim()||'#3987e5',grid=css.getPropertyValue('--line').trim()||'rgba(255,255,255,.1)',muted=css.getPropertyValue('--muted').trim()||'#8b8981',ink=css.getPropertyValue('--ink').trim()||'#fff';
 ctx.font='11px system-ui';ctx.textBaseline='middle';ctx.strokeStyle=grid;ctx.fillStyle=muted;ctx.lineWidth=1;
 for(let i=0;i<5;i++){const ratio=i/4,y=g.pad.t+ratio*g.plotH,value=g.max-ratio*g.span;ctx.beginPath();ctx.moveTo(g.pad.l,y);ctx.lineTo(g.w-g.pad.r,y);ctx.stroke();ctx.textAlign='right';ctx.fillText(price(value,marketData&&marketData.currency,true),g.pad.l-9,y);}
 const labelIdx=[0,Math.floor((data.length-1)/2),data.length-1];ctx.textBaseline='top';labelIdx.forEach((idx,n)=>{const pt=pointXY(idx,data[idx],data,g);ctx.textAlign=n===0?'left':n===2?'right':'center';ctx.fillText(new Date(data[idx].t).toLocaleDateString('id-ID',{month:'short',year:'2-digit'}),pt.x,g.h-g.pad.b+8);});
 ctx.strokeStyle=accent;ctx.lineWidth=2.25;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();data.forEach((p,i)=>{const pt=pointXY(i,p,data,g);i?ctx.lineTo(pt.x,pt.y):ctx.moveTo(pt.x,pt.y);});ctx.stroke();
 if(pointer.index!=null){const idx=Math.max(0,Math.min(data.length-1,pointer.index)),p=data[idx],pt=pointXY(idx,p,data,g);ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle=muted;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pt.x,g.pad.t);ctx.lineTo(pt.x,g.h-g.pad.b);ctx.stroke();ctx.restore();ctx.fillStyle=accent;ctx.beginPath();ctx.arc(pt.x,pt.y,4.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle=ink;ctx.lineWidth=2;ctx.stroke();positionTooltip(canvas,pt,p,data[0]);}
 else hideTooltip();
 renderStats(data);
 canvas._chart={data,g};
}
function renderStats(data){const el=document.getElementById('chart-stats');if(!el||!data.length)return;const vals=data.map(p=>p.v),first=data[0].v,last=data[data.length-1].v,change=(last/first-1)*100,high=Math.max(...vals),low=Math.min(...vals);el.innerHTML=`<div class="chart-stat"><span>Range return</span><strong class="${cls(change)}">${pct(change)}</strong></div><div class="chart-stat"><span>Start</span><strong>${price(first,marketData.currency)}</strong></div><div class="chart-stat"><span>High</span><strong>${price(high,marketData.currency)}</strong></div><div class="chart-stat"><span>Low</span><strong>${price(low,marketData.currency)}</strong></div>`;}
function positionTooltip(canvas,pt,p,base){const tip=document.getElementById('chart-tooltip');if(!tip)return;const change=(p.v/base.v-1)*100;tip.innerHTML=`<strong>${price(p.v,marketData.currency)}</strong><span>${new Date(p.t).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</span><span class="${cls(change)}">${pct(change)} from range start</span>`;tip.classList.add('is-on');const maxX=canvas.clientWidth-85,minX=85;tip.style.left=`${Math.max(minX,Math.min(maxX,pt.x))}px`;tip.style.top=`${Math.max(66,pt.y)}px`;}
function hideTooltip(){const tip=document.getElementById('chart-tooltip');if(tip)tip.classList.remove('is-on');}
function setPointerFromEvent(ev){const canvas=document.getElementById('asset-chart');if(!canvas||!canvas._chart)return;const {data,g}=canvas._chart,rect=canvas.getBoundingClientRect(),x=ev.clientX-rect.left,ratio=Math.max(0,Math.min(1,(x-g.pad.l)/g.plotW));pointer.index=Math.round(ratio*(data.length-1));scheduleDraw();}
function scheduleDraw(){if(raf)return;raf=requestAnimationFrame(()=>{raf=0;drawChart();});}
function setupChart(){
 const canvas=document.getElementById('asset-chart');if(!canvas)return;drawChart();
 canvas.addEventListener('pointermove',setPointerFromEvent,{passive:true});
 canvas.addEventListener('pointerdown',e=>{setPointerFromEvent(e);pointer.pinned=true;canvas.setPointerCapture&&canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('click',e=>{setPointerFromEvent(e);pointer.pinned=!pointer.pinned;});
 canvas.addEventListener('pointerleave',()=>{if(!pointer.pinned){pointer.index=null;scheduleDraw();}});
 canvas.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight'&&e.key!=='Escape')return;e.preventDefault();const data=filteredHistory();if(e.key==='Escape'){pointer.index=null;pointer.pinned=false;}else{const step=e.key==='ArrowRight'?1:-1;pointer.index=Math.max(0,Math.min(data.length-1,(pointer.index==null?data.length-1:pointer.index)+step));pointer.pinned=true;}scheduleDraw();});
 if(resizeObserver)resizeObserver.disconnect();resizeObserver=new ResizeObserver(()=>scheduleDraw());resizeObserver.observe(canvas.parentElement);
}
if(!asset){host.innerHTML='<section class="detail-panel"><h2>Asset tidak ditemukan</h2><p>Ticker ini tidak ada di katalog Porsi.</p></section>';return;}
render(null);
const symbol=window.assetIntel(asset).marketSymbol;
if(symbol)fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&detail=1`).then(r=>{if(!r.ok)throw new Error('Market API unavailable');return r.json();}).then(j=>{const m=j.data&&j.data[symbol];marketData=m&&!m.error?m:null;render(marketData);}).catch(err=>{console.error(err);marketData=null;render(null);});
window.addEventListener('porsi:theme',()=>scheduleDraw());
})();