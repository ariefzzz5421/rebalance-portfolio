(function(){
'use strict';
const host=document.getElementById('asset-detail');
const ticker=(new URLSearchParams(location.search).get('ticker')||'').toUpperCase();
const asset=window.assetByTicker(ticker);
let marketData=null,range='5Y';
const pct=v=>v==null||!Number.isFinite(v)?'N/A':`${v>=0?'+':''}${v.toFixed(1)}%`;
const cls=v=>v==null||!Number.isFinite(v)?'':v>=0?'pos':'neg';
function price(v,c){if(v==null||!Number.isFinite(v))return 'N/A';if(ticker==='SPX')return `${new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v)} pts`;try{return new Intl.NumberFormat(c==='IDR'?'id-ID':'en-US',{style:'currency',currency:c||'USD',maximumFractionDigits:c==='IDR'?0:2}).format(v);}catch{return new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v);}}
function extIcon(){return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';}
function render(m){
 const intel=window.assetIntel(asset),c=m&&m.cagr||{},icon=window.assetIconHTML?window.assetIconHTML(asset.ticker,'xl'):`<span class="asset-icon asset-icon--xl" style="--brand:${asset.color}"><span class="asset-icon__mono">${asset.ticker.slice(0,2)}</span></span>`;
 document.title=`${asset.ticker} — ${asset.name} · Porsi`;
 host.innerHTML=`
 <section class="asset-hero">
  <div class="asset-summary" style="--brand:${asset.color}"><div class="asset-summary__top">${icon}<div class="asset-summary__heading"><h1><strong>${asset.ticker}</strong><span>${asset.name}</span></h1></div></div><div class="asset-summary__price">${m?price(m.price,m.currency):'Market data unavailable'}</div><div class="asset-summary__asof">${m&&m.asOf?`Data terakhir ${new Date(m.asOf).toLocaleString('id-ID')}`:'Aset ini belum terhubung ke market feed'}</div><div class="cagr-grid"><div class="cagr-card"><span>1M CAGR</span><strong class="${cls(c.m1)}">${pct(c.m1)}</strong></div><div class="cagr-card"><span>1Y CAGR</span><strong class="${cls(c.y1)}">${pct(c.y1)}</strong></div><div class="cagr-card"><span>5Y CAGR</span><strong class="${cls(c.y5)}">${pct(c.y5)}</strong></div><div class="cagr-card"><span>10Y CAGR</span><strong class="${cls(c.y10)}">${pct(c.y10)}</strong></div></div></div>
  <aside class="detail-panel prose-panel"><h2 class="asset-about-title"><strong>${asset.ticker}</strong> <span>— ${asset.name}</span></h2><p>${intel.summary}</p><p>${intel.background}</p></aside>
 </section>
 <section class="detail-panel asset-chart-panel"><div class="asset-chart-head"><div><h2>Historical chart</h2><p class="finance-source-note">Pilih rentang untuk melihat arah harga historis.</p></div><div class="chart-ranges"><button class="chart-range" data-range="1Y">1Y</button><button class="chart-range is-on" data-range="5Y">5Y</button><button class="chart-range" data-range="10Y">10Y</button></div></div><div class="asset-chart-wrap">${m&&m.history&&m.history.length?'<canvas class="asset-chart" id="asset-chart" aria-label="Historical price chart"></canvas>':'<div class="chart-empty">Historical chart belum tersedia untuk aset ini.</div>'}</div><div class="finance-links"><a class="finance-link" href="${intel.googleFinanceUrl}" target="_blank" rel="noopener">Google Finance ${extIcon()}</a>${intel.yahooFinanceUrl?`<a class="finance-link" href="${intel.yahooFinanceUrl}" target="_blank" rel="noopener">Yahoo Finance ${extIcon()}</a>`:''}</div><p class="finance-source-note">Google Finance disediakan sebagai referensi utama. Chart di dalam Porsi memakai historical feed Yahoo Finance sebagai fallback karena Google Finance tidak menyediakan public embeddable chart API.</p></section>
 <section class="detail-panel prose-panel"><h2>How to read this asset</h2><p><strong>Catatan metodologi:</strong> CAGR diannualisasi dari observasi adjusted-close bulanan terdekat. Angka 1M dapat terlihat ekstrem dan sebaiknya dibaca sebagai konteks momentum, bukan prediksi return setahun.</p></section>`;
 document.querySelectorAll('[data-range]').forEach(b=>b.addEventListener('click',()=>{range=b.dataset.range;document.querySelectorAll('[data-range]').forEach(x=>x.classList.toggle('is-on',x===b));drawChart();}));
 drawChart();
}
function filteredHistory(){const h=marketData&&Array.isArray(marketData.history)?marketData.history:[];if(!h.length)return[];const months=range==='1Y'?12:range==='10Y'?120:60;const end=h[h.length-1].t,cut=end-months*30.4375*86400000;return h.filter(p=>p.t>=cut);}
function drawChart(){
 const canvas=document.getElementById('asset-chart');if(!canvas)return;const data=filteredHistory();if(data.length<2)return;
 const box=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2);canvas.width=Math.max(320,Math.floor(box.width*dpr));canvas.height=Math.max(220,Math.floor(box.height*dpr));const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,pad={l:16,r:16,t:18,b:20};
 const vals=data.map(p=>p.v),min=Math.min(...vals),max=Math.max(...vals),span=max-min||1;ctx.clearRect(0,0,w,h);const accent=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()||'#3987e5',line=getComputedStyle(document.documentElement).getPropertyValue('--line').trim()||'rgba(255,255,255,.1)';
 ctx.strokeStyle=line;ctx.lineWidth=1*dpr;for(let i=1;i<4;i++){const y=pad.t*dpr+(i/4)*(h-(pad.t+pad.b)*dpr);ctx.beginPath();ctx.moveTo(pad.l*dpr,y);ctx.lineTo(w-pad.r*dpr,y);ctx.stroke();}
 ctx.strokeStyle=accent;ctx.lineWidth=2.5*dpr;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();data.forEach((p,i)=>{const x=pad.l*dpr+(i/(data.length-1))*(w-(pad.l+pad.r)*dpr),y=h-pad.b*dpr-((p.v-min)/span)*(h-(pad.t+pad.b)*dpr);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
 const first=data[0].v,last=data[data.length-1].v,change=((last/first)-1)*100;ctx.font=`${11*dpr}px system-ui`;ctx.fillStyle=change>=0?'#18a558':'#d85b5b';ctx.fillText(`${change>=0?'+':''}${change.toFixed(1)}%`,pad.l*dpr,14*dpr);
}
if(!asset){host.innerHTML='<section class="detail-panel"><h2>Asset tidak ditemukan</h2><p>Ticker ini tidak ada di katalog Porsi.</p></section>';return;}
render(null);
const symbol=window.assetIntel(asset).marketSymbol;
if(symbol)fetch(`/api/market?symbol=${encodeURIComponent(symbol)}`).then(r=>{if(!r.ok)throw 0;return r.json();}).then(j=>{const m=j.data&&j.data[symbol];marketData=m&&!m.error?m:null;render(marketData);}).catch(()=>{marketData=null;render(null);});
window.addEventListener('resize',()=>drawChart());
})();