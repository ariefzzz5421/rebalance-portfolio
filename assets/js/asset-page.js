(function(){
'use strict';
const host=document.getElementById('asset-detail');
const ticker=(new URLSearchParams(location.search).get('ticker')||'').toUpperCase();
const asset=window.assetByTicker(ticker);
const pct=v=>v==null||!Number.isFinite(v)?'N/A':`${v>=0?'+':''}${v.toFixed(1)}%`;
const cls=v=>v==null||!Number.isFinite(v)?'':v>=0?'pos':'neg';
function price(v,c){if(v==null||!Number.isFinite(v))return 'N/A';if(ticker==='SPX')return `${new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(v)} pts`;return new Intl.NumberFormat(c==='IDR'?'id-ID':'en-US',{style:'currency',currency:c||'USD',maximumFractionDigits:c==='IDR'?0:2}).format(v);}
function render(m){
 const intel=window.assetIntel(asset),c=m&&m.cagr||{};
 document.title=`${asset.ticker} — Porsi`;
 host.innerHTML=`<section class="asset-hero"><div class="asset-summary" style="--brand:${asset.color}"><div class="asset-summary__top"><div class="asset-summary__mark">${asset.ticker.slice(0,5)}</div><div><h1>${asset.ticker}</h1><div class="asset-summary__name">${asset.name}</div></div></div><div class="asset-summary__price">${m?price(m.price,m.currency):'Market data unavailable'}</div><div class="asset-summary__asof">${m&&m.asOf?`Data terakhir ${new Date(m.asOf).toLocaleString('id-ID')}`:'Aset ini belum terhubung ke market feed'}</div><div class="cagr-grid"><div class="cagr-card"><span>1M CAGR</span><strong class="${cls(c.m1)}">${pct(c.m1)}</strong></div><div class="cagr-card"><span>1Y CAGR</span><strong class="${cls(c.y1)}">${pct(c.y1)}</strong></div><div class="cagr-card"><span>5Y CAGR</span><strong class="${cls(c.y5)}">${pct(c.y5)}</strong></div><div class="cagr-card"><span>10Y CAGR</span><strong class="${cls(c.y10)}">${pct(c.y10)}</strong></div></div></div><aside class="detail-panel prose-panel"><h2>Ringkasan</h2><p>${intel.summary}</p></aside></section><section class="detail-panel prose-panel"><h2>Lore</h2><p>${intel.lore}</p><p><strong>Catatan metodologi:</strong> CAGR di halaman ini diannualisasi dari observasi adjusted-close bulanan terdekat. Untuk 1M, angka annualized bisa terlihat ekstrem dan sebaiknya dibaca sebagai momentum jangka pendek, bukan ekspektasi return setahun.</p></section>`;
}
if(!asset){host.innerHTML='<section class="detail-panel"><h2>Asset tidak ditemukan</h2><p>Ticker ini tidak ada di katalog Porsi.</p></section>';return;}
render(null);
const symbol=window.assetIntel(asset).marketSymbol;
if(symbol)fetch(`/api/market?symbol=${encodeURIComponent(symbol)}`).then(r=>{if(!r.ok)throw 0;return r.json();}).then(j=>{const m=j.data&&j.data[symbol];render(m&&!m.error?m:null);}).catch(()=>render(null));
})();