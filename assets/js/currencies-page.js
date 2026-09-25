(function () {
  'use strict';
  const currencies = [
    { code: 'IDR', name: 'Rupiah Indonesia', flag: 'id', color: '#5ba8ff', symbol: 'IDR=X' },
    { code: 'CNY', name: 'Yuan Tiongkok', flag: 'cn', color: '#efb44f', symbol: 'CNY=X' },
    { code: 'SGD', name: 'Dolar Singapura', flag: 'sg', color: '#48c7b5', symbol: 'SGD=X' },
    { code: 'CHF', name: 'Franc Swiss', flag: 'ch', color: '#bc9cf3', symbol: 'CHF=X' },
  ];
  const $ = id => document.getElementById(id);
  const cache = new Map();
  let active = currencies[0], range = '1Y', points = [], hovered = null, pinned = false, geometry = null, token = 0, raf = 0;
  const format = (value, code) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: code === 'IDR' ? 8 : 5, minimumFractionDigits: code === 'IDR' ? 6 : 2 }).format(value);
  const percent = value => `${value > 0 ? '+' : ''}${new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(value)}%`;
  const date = time => new Date(time).toLocaleString('id-ID', ['1H', '1D', '1W'].includes(range) ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short', year: 'numeric' });

  function renderCards() {
    $('currency-grid').innerHTML = currencies.map(item => `<button type="button" class="currencies-page__choice${active.code === item.code ? ' is-active' : ''}" data-currency="${item.code}" aria-pressed="${active.code === item.code}" style="--currency-color:${item.color}"><img src="assets/flags/${item.flag}.svg" width="32" height="32" alt=""><span><strong>${item.code}</strong><small>${item.name}</small></span><b>${item.code} / USD</b></button>`).join('') + '<div class="currencies-page__base"><span class="currencies-page__usd">$</span><span><strong>USD</strong><small>Dolar AS · mata uang acuan</small></span><b>USD / USD = 1</b></div>';
  }

  function setState(message) { $('currency-state').textContent = message; $('currency-state').hidden = !message; }
  function reset() { points = []; hovered = null; pinned = false; geometry = null; $('currency-price').textContent = '—'; $('currency-change').textContent = '—'; $('currency-change').className = ''; $('currency-asof').textContent = 'Memuat data pasar…'; $('currency-tooltip').classList.remove('is-visible'); draw(); }
  async function load() {
    const id = ++token, item = active, frame = range;
    reset(); setState('Memuat histori kurs…');
    $('currency-title').textContent = `${item.code} / USD`;
    $('currency-subtitle').textContent = `Nilai 1 ${item.code} dalam dolar AS`;
    const key = `${item.code}:${frame}`;
    try {
      const cached = cache.get(key);
      let entry = cached?.expires > Date.now() ? cached.data : null;
      if (!entry) {
        const response = await fetch(`/api/market?symbol=${encodeURIComponent(item.symbol)}&range=${frame === 'MAX' ? '10Y' : frame}`);
        if (!response.ok) throw new Error(`Data ${item.code} belum tersedia dari penyedia pasar.`);
        const payload = await response.json();
        entry = payload.data && payload.data[item.symbol];
        if (!entry || entry.error) throw new Error(entry?.error || `Data ${item.code} belum tersedia.`);
        cache.set(key, { data: entry, expires: Date.now() + (['1H', '1D', '1W'].includes(frame) ? 60000 : 900000) });
      }
      if (id !== token) return;
      points = window.PorsiFX.invertHistory(entry.history);
      if (points.length < 2) throw new Error(`Histori ${item.code} untuk ${frame} belum cukup. Pilih timeframe lain.`);
      if (frame === '1H' && Date.now() - points[points.length - 1].t > 2 * 3600000) throw new Error('Tidak ada transaksi kurs dalam dua jam terakhir. Coba 1D atau timeframe lain.');
      const first = points[0], last = points[points.length - 1], change = (last.v / first.v - 1) * 100;
      $('currency-price').textContent = `1 ${item.code} = $${format(last.v, item.code)}`;
      $('currency-change').textContent = `${percent(change)} · ${frame}`;
      $('currency-change').className = change >= 0 ? 'is-positive' : 'is-negative';
      $('currency-asof').textContent = `Titik terakhir ${date(last.t)} · ${points.length.toLocaleString('id-ID')} titik pasar`;
      setState(''); draw();
    } catch (error) { if (id === token) { setState(error.message || 'Data kurs belum tersedia.'); $('currency-asof').textContent = 'Sumber pasar belum tersedia'; } }
  }

  function draw() {
    const canvas = $('currency-chart'), width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight), dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    if (points.length < 2) return;
    const sample = points.length > 480 ? points.filter((_, index) => index % Math.ceil(points.length / 480) === 0 || index === points.length - 1) : points;
    const values = sample.map(p => p.v), low = Math.min(...values), high = Math.max(...values), extra = Math.max((high - low) * .12, high * .0001);
    const pad = { left: 12, right: width < 500 ? 76 : 92, top: 20, bottom: 35 };
    geometry = { width, height, pad, min: low - extra, max: high + extra, sample, plotWidth: width - pad.left - pad.right, plotHeight: height - pad.top - pad.bottom };
    const g = geometry, x = p => pad.left + (p.t - sample[0].t) / (sample[sample.length - 1].t - sample[0].t) * g.plotWidth, y = p => pad.top + (g.max - p.v) / (g.max - g.min) * g.plotHeight;
    const css = getComputedStyle(document.documentElement), muted = css.getPropertyValue('--muted').trim(), line = css.getPropertyValue('--line').trim();
    ctx.font = '10px system-ui'; ctx.fillStyle = muted; ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.textBaseline = 'middle';
    for (let i = 0; i < 5; i++) { const yy = pad.top + i / 4 * g.plotHeight, v = g.max - i / 4 * (g.max - g.min); ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(width - pad.right, yy); ctx.stroke(); ctx.textAlign = 'left'; ctx.fillText(format(v, active.code), width - pad.right + 7, yy); }
    ctx.textBaseline = 'top'; [sample[0], sample[Math.floor((sample.length - 1) / 2)], sample[sample.length - 1]].forEach((p, i) => { if (width < 450 && i === 1) return; ctx.textAlign = i === 0 ? 'left' : i === 2 ? 'right' : 'center'; ctx.fillText(date(p.t), x(p), height - pad.bottom + 10); });
    ctx.beginPath(); sample.forEach((p, i) => i ? ctx.lineTo(x(p), y(p)) : ctx.moveTo(x(p), y(p))); ctx.strokeStyle = active.color; ctx.lineWidth = 3.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
    const index = hovered == null ? sample.length - 1 : Math.min(sample.length - 1, hovered), point = sample[index], px = x(point), py = y(point);
    ctx.fillStyle = active.color; ctx.beginPath(); ctx.arc(px, py, hovered == null ? 4.5 : 6, 0, Math.PI * 2); ctx.fill();
    const tooltip = $('currency-tooltip');
    if (hovered != null) { tooltip.innerHTML = `<strong>1 ${active.code} = $${format(point.v, active.code)}</strong><span>${date(point.t)}</span>`; tooltip.style.left = `${Math.max(88, Math.min(width - 88, px))}px`; tooltip.style.top = `${Math.max(74, py)}px`; tooltip.classList.add('is-visible'); tooltip.setAttribute('aria-hidden', 'false'); }
    else { tooltip.classList.remove('is-visible'); tooltip.setAttribute('aria-hidden', 'true'); }
  }
  function scheduleDraw() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); }
  function setPointer(event) { if (!geometry) return; const rect = $('currency-chart').getBoundingClientRect(), g = geometry, fraction = Math.max(0, Math.min(1, (event.clientX - rect.left - g.pad.left) / g.plotWidth)); hovered = Math.round(fraction * (g.sample.length - 1)); scheduleDraw(); }
  $('currency-grid').addEventListener('click', event => { const button = event.target.closest('[data-currency]'); if (!button || button.dataset.currency === active.code) return; active = currencies.find(item => item.code === button.dataset.currency); renderCards(); load(); });
  $('currency-range').addEventListener('change', event => { range = event.target.value; load(); });
  $('currency-chart').addEventListener('pointermove', setPointer, { passive: true });
  $('currency-chart').addEventListener('pointerdown', event => { setPointer(event); pinned = true; });
  $('currency-chart').addEventListener('pointerleave', () => { if (!pinned) { hovered = null; scheduleDraw(); } });
  $('currency-chart').addEventListener('keydown', event => { if (!['ArrowLeft', 'ArrowRight', 'Escape'].includes(event.key) || !geometry) return; event.preventDefault(); if (event.key === 'Escape') { hovered = null; pinned = false; } else { hovered = Math.max(0, Math.min(geometry.sample.length - 1, (hovered == null ? geometry.sample.length - 1 : hovered) + (event.key === 'ArrowRight' ? 1 : -1))); pinned = true; } scheduleDraw(); });
  new ResizeObserver(scheduleDraw).observe($('currency-chart').parentElement);
  window.addEventListener('porsi:theme', scheduleDraw);
  window.PORSI_TIMEFRAMES?.apply($('currency-range'));
  renderCards(); load();
})();
