(function () {
  'use strict';

  const strategies = window.PORSI_STRATEGIES;
  const chartMath = window.StrategyChart;
  const assetColors = { BTC: '#5ba8ff', HYPE: '#3bc7b7', XAUT: '#f5b64f', USDT: '#b59af2', SPX: '#72b7ff', GOLD: '#e8a948', VT: '#9a9dff', SHV: '#42c6bc', SGOV: '#e8ae61', BBCA: '#5ba8ff', BMRI: '#be9aff', TLKM: '#ef786e', UNTR: '#eebc62', XISB: '#66c6c2', KLBF: '#a1b8ff' };
  const fallbackColors = ['#5ba8ff', '#3bc7b7', '#f5b64f', '#b59af2'];
  const longRanges = new Set(['1Y', '5Y', '10Y', 'MAX']);
  const longCache = new Map();
  const rangeCache = new Map();
  const $ = selector => document.querySelector(selector);
  const keys = Object.keys(strategies);
  const queryKey = new URLSearchParams(location.search).get('strategy');
  const methodText = $('#strategy-method').textContent;
  let selected = strategies[queryKey] ? queryKey : keys[0];
  let activeLine = 'strategy';
  let range = '1Y';
  let result = null;
  let plotted = [];
  let plottedAssets = [];
  let geometry = null;
  let hover = null;
  let pinned = false;
  let requestId = 0;
  let raf = 0;

  function iconMarkup(strategy) {
    return `<span class="strategy-icon" style="--strategy-color:${strategy.color}" aria-hidden="true"><span class="strategy-icon__glyph strategy-icon__glyph--${strategy.icon}"></span></span>`;
  }

  function percent(value, digits = 2) {
    if (!Number.isFinite(value)) return '—';
    const amount = value * 100;
    return `${amount > 0 ? '+' : ''}${new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(amount)}%`;
  }

  function dateLabel(ms, short = false) {
    const options = short
      ? { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
      : { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(ms).toLocaleString('id-ID', options);
  }

  function renderPicker() {
    $('#strategy-picker').innerHTML = keys.map(key => {
      const strategy = strategies[key];
      const weights = strategy.parts.map(([ticker, , weight]) => `<span>${ticker} <b>${weight}%</b></span>`).join('');
      return `<button class="strategy-page__choice" type="button" data-strategy="${key}" aria-pressed="${selected === key}" style="--strategy-color:${strategy.color}">
        <span class="strategy-page__choice-head">${iconMarkup(strategy)}<span class="strategy-page__choice-label"><strong>${strategy.title}</strong><small>${strategy.subtitle}</small></span><span class="strategy-page__choice-check" aria-hidden="true">↗</span></span>
        <span class="strategy-page__choice-assets">${weights}</span>
      </button>`;
    }).join('');
  }

  function renderAssetList(returns = new Map()) {
    $('#strategy-asset-list').innerHTML = strategies[selected].parts.map(([ticker, name, weight], index) => {
      const icon = window.assetIconHTML ? window.assetIconHTML(ticker, 'md') : `<span class="strategy-page__asset-fallback">${ticker.slice(0, 1)}</span>`;
      const value = returns.get(ticker);
      return `<div class="strategy-page__asset${activeLine === ticker ? ' is-focused' : ''}" data-asset-card="${ticker}" style="--asset-chart-color:${assetColors[ticker] || fallbackColors[index % fallbackColors.length]}">
        <button type="button" class="strategy-page__asset-select" data-line="${ticker}" aria-label="Sorot garis ${ticker}" aria-pressed="${activeLine === ticker}">
          ${icon}<span class="strategy-page__asset-name"><strong>${ticker}</strong><small>${name}</small></span>
          <span class="strategy-page__asset-data"><strong>${weight}%</strong><small class="${Number.isFinite(value) ? value >= 0 ? 'is-positive' : 'is-negative' : ''}">${percent(value)}</small></span>
        </button>
        <a class="strategy-page__asset-detail" href="${window.porsiRoute('/asset')}?ticker=${encodeURIComponent(ticker)}" aria-label="Buka detail ${ticker}" title="Buka detail ${ticker}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></a>
      </div>`;
    }).join('');
  }

  function renderLegend(assets = []) {
    const items = [{ ticker: 'Strategi', key: 'strategy', color: strategies[selected].color, value: result?.return, main: true }]
      .concat(strategies[selected].parts.map(([ticker], index) => ({ ticker, color: assetColors[ticker] || fallbackColors[index % fallbackColors.length], value: assets.find(asset => asset.ticker === ticker)?.return })));
    $('#strategy-chart-legend').innerHTML = items.map(item => `<button type="button" class="strategy-page__legend-item${item.main ? ' is-main' : ''}${activeLine === (item.key || item.ticker) ? ' is-focused' : ''}" data-line="${item.key || item.ticker}" aria-pressed="${activeLine === (item.key || item.ticker)}" style="--series-color:${item.color}">${item.main ? '<i aria-hidden="true"></i>' : window.assetIconHTML(item.ticker, 'sm')}<span>${item.ticker}</span><strong>${percent(item.value)}</strong></button>`).join('');
  }

  function renderResearch() {
    const strategy = strategies[selected], host = $('#strategy-research');
    host.hidden = !strategy.research;
    host.innerHTML = strategy.research ? `<strong>Dasar pilihan</strong><p>${strategy.note}</p><div>${strategy.research.map(([label, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`).join('')}</div>` : '';
  }

  function updateHeadline() {
    if (!result) return;
    const asset = result.assets.find(item => item.ticker === activeLine);
    const value = asset ? asset.return : result.return;
    const label = asset ? asset.ticker : 'Strategi';
    const headline = $('#strategy-return');
    headline.textContent = percent(value);
    headline.className = value >= 0 ? 'is-positive' : 'is-negative';
    headline.style.fontSize = headline.textContent.length > 12 ? 'clamp(1.65rem,3vw,2.7rem)' : headline.textContent.length > 9 ? 'clamp(1.9rem,3.5vw,3.1rem)' : '';
    $('#strategy-return-label').textContent = `Total return ${label} · ${range}`;
  }

  function updateEdgeLabel(point, position, color, height) {
    const badge = $('#strategy-edge-label');
    if (!badge) return;
    badge.hidden = false;
    badge.style.setProperty('--edge-color', color);
    badge.style.top = `${Math.max(31, Math.min(height - 30, position.y))}px`;
    badge.querySelector('span').textContent = activeLine === 'strategy' ? 'Strategi' : activeLine;
    badge.querySelector('strong').textContent = percent(point.v / 100 - 1);
  }

  function focusLine(key) {
    if (key !== 'strategy' && !strategies[selected].parts.some(([ticker]) => ticker === key)) return;
    activeLine = key;
    renderLegend(result?.assets || []);
    renderAssetList(new Map(result?.assets.map(asset => [asset.ticker, asset.return]) || []));
    updateHeadline();
    scheduleDraw();
  }

  function renderSelection() {
    renderPicker();
    const strategy = strategies[selected];
    $('#active-strategy-icon').outerHTML = iconMarkup(strategy).replace('class="strategy-icon"', 'class="strategy-icon" id="active-strategy-icon"');
    $('#active-strategy-name').textContent = strategy.title;
    $('#strategy-range').value = range;
    $('#strategy-return-label').textContent = `Total return · ${range}`;
    renderAssetList();
    renderLegend();
    renderResearch();
  }

  function symbolFor(ticker) {
    const symbol = window.MARKET_SYMBOLS && window.MARKET_SYMBOLS[ticker];
    if (!symbol) throw new Error(`Simbol pasar ${ticker} belum tersedia.`);
    return symbol;
  }

  function cached(map, key, ttl, loader) {
    const existing = map.get(key);
    if (existing && existing.expires > Date.now()) return existing.promise;
    const promise = loader();
    map.set(key, { expires: Date.now() + ttl, promise });
    promise.catch(() => {
      if (map.get(key)?.promise === promise) map.delete(key);
    });
    return promise;
  }

  async function fetchLong(key) {
    return cached(longCache, key, 15 * 60 * 1000, () => {
      const symbols = strategies[key].parts.map(([ticker]) => symbolFor(ticker));
      return fetch(`/api/market?mode=strategy&symbols=${encodeURIComponent(symbols.join(','))}`)
        .then(response => { if (!response.ok) throw new Error('Histori strategi belum dapat dimuat.'); return response.json(); })
        .then(json => json.data || {});
    });
  }

  async function fetchRange(ticker, frame) {
    const key = `${ticker}:${frame}`;
    const ttl = { '1H': 45, '1D': 60, '1W': 120, '1M': 300 }[frame] * 1000;
    return cached(rangeCache, key, ttl, () => {
      const symbol = symbolFor(ticker);
      return fetch(`/api/market?symbol=${encodeURIComponent(symbol)}&range=${frame}`)
        .then(response => { if (!response.ok) throw new Error(`Data ${ticker} untuk ${frame} belum tersedia.`); return response.json(); })
        .then(json => json.data && json.data[symbol]);
    });
  }

  async function marketData(key, frame) {
    if (longRanges.has(frame)) return fetchLong(key);
    const pairs = await Promise.all(strategies[key].parts.map(async ([ticker]) => [symbolFor(ticker), await fetchRange(ticker, frame)]));
    return Object.fromEntries(pairs);
  }

  function setState(message, loading = false) {
    const state = $('#strategy-chart-state');
    state.textContent = message;
    state.hidden = !message;
    state.classList.toggle('is-loading', loading);
  }

  function resetChart(message) {
    result = null;
    plotted = [];
    plottedAssets = [];
    geometry = null;
    hover = null;
    pinned = false;
    $('#strategy-return').textContent = '—';
    $('#strategy-return').className = '';
    $('#strategy-return').style.fontSize = '';
    $('#strategy-edge-label').hidden = true;
    $('#strategy-dates').textContent = message;
    $('#strategy-asof').textContent = '—';
    renderAssetList();
    renderLegend();
    hideTooltip();
    draw();
    setState(message, message === 'Memuat histori pasar…');
  }

  async function load() {
    const id = ++requestId;
    const key = selected, frame = range, strategy = strategies[key];
    resetChart('Memuat histori pasar…');
    $('#strategy-method').textContent = methodText;
    $('#strategy-source').textContent = `Yahoo Finance · ${frame}`;
    try {
      const data = await marketData(key, frame);
      if (id !== requestId) return;
      const fallbackTickers = [];
      const assets = strategy.parts.map(([ticker, , weight]) => {
        const entry = data[symbolFor(ticker)];
        if (!entry || entry.error) throw new Error(`Data ${ticker} belum tersedia dari penyedia pasar.`);
        if (entry.stablecoinFallbackUsed) fallbackTickers.push(ticker);
        const history = entry.totalReturnHistory || entry.history;
        return { ticker, weight: weight / 100, history };
      });
      const next = chartMath.build(assets, frame);
      if (frame === '1H' && Date.now() - next.end > 2 * 3600000) throw new Error('Tidak ada data bersama dalam dua jam terakhir. Coba 1D atau timeframe lain.');
      result = next;
      const short = ['1H', '1D', '1W'].includes(frame);
      updateHeadline();
      $('#strategy-dates').textContent = `${dateLabel(next.start, short)} → ${dateLabel(next.end, short)}`;
      $('#strategy-asof').textContent = `Titik bersama terakhir: ${dateLabel(next.end, short)}`;
      $('#strategy-source').textContent = `Yahoo Finance · ${frame} · ${next.series.length.toLocaleString('id-ID')} titik${fallbackTickers.length ? ` · asumsi $1 ${fallbackTickers.join(', ')}` : ''}`;
      if (fallbackTickers.length) $('#strategy-method').textContent = `${methodText} Data ${fallbackTickers.join(', ')} menggunakan asumsi harga $1 karena histori penyedia tidak tersedia.`;
      renderAssetList(new Map(next.assets.map(asset => [asset.ticker, asset.return])));
      renderLegend(next.assets);
      setState('');
      draw();
    } catch (error) {
      if (id !== requestId) return;
      const message = error && error.message || 'Data strategi belum dapat dimuat.';
      resetChart(message);
      $('#strategy-source').textContent = 'Histori pasar belum tersedia';
    }
  }

  function sampleIndexes(length, maxPoints) {
    if (length <= maxPoints) return Array.from({ length }, (_, index) => index);
    const step = Math.ceil((length - 1) / (maxPoints - 1));
    const indexes = [];
    for (let index = 0; index < length; index += step) indexes.push(index);
    if (indexes[indexes.length - 1] !== length - 1) indexes.push(length - 1);
    return indexes;
  }

  function geometryFor(points, assets, width, height) {
    const values = points.map(point => point.v - 100).concat(assets.flatMap(asset => asset.points.map(point => point.v - 100)));
    let min = Math.min(0, ...values), max = Math.max(0, ...values);
    const extra = Math.max((max - min) * 0.12, 0.5);
    min -= extra; max += extra;
    const axisLength = Math.max(`${min.toFixed(0)}%`.length, `+${max.toFixed(0)}%`.length);
    const pad = { left: 12, right: Math.min(width * .36, Math.max(90, axisLength * 7 + 24)), top: 18, bottom: 34 };
    return { width, height, pad, min, max, plotWidth: width - pad.left - pad.right, plotHeight: height - pad.top - pad.bottom, start: points[0].t, end: points[points.length - 1].t };
  }

  function xy(point, geometry) {
    return {
      x: geometry.pad.left + (point.t - geometry.start) / (geometry.end - geometry.start) * geometry.plotWidth,
      y: geometry.pad.top + (geometry.max - (point.v - 100)) / (geometry.max - geometry.min) * geometry.plotHeight,
    };
  }

  function draw() {
    const canvas = $('#strategy-chart');
    const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const context = canvas.getContext('2d');
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    if (!result || result.series.length < 2) return;
    const indexes = sampleIndexes(result.series.length, 420);
    plotted = indexes.map(index => result.series[index]);
    plottedAssets = result.assets.map((asset, index) => ({ ticker: asset.ticker, color: assetColors[asset.ticker] || fallbackColors[index % fallbackColors.length], points: indexes.map(pointIndex => asset.series[pointIndex]) }));
    geometry = geometryFor(plotted, plottedAssets, width, height);
    const css = getComputedStyle(document.documentElement);
    const muted = css.getPropertyValue('--muted').trim();
    const line = css.getPropertyValue('--line').trim();
    const accent = strategies[selected].color;
    const g = geometry;

    context.font = '11px system-ui';
    context.textBaseline = 'middle';
    context.strokeStyle = line;
    context.fillStyle = muted;
    context.lineWidth = 1;
    const tickPositions = [];
    for (let index = 0; index < 5; index++) {
      const y = g.pad.top + index / 4 * g.plotHeight;
      tickPositions.push(y);
      const value = g.max - index / 4 * (g.max - g.min);
      context.beginPath(); context.moveTo(g.pad.left, y); context.lineTo(width - g.pad.right, y); context.stroke();
      context.textAlign = 'left'; context.fillText(`${value > 0 ? '+' : ''}${value.toFixed(0)}%`, width - g.pad.right + 8, y);
    }

    const zeroY = g.pad.top + g.max / (g.max - g.min) * g.plotHeight;
    if (tickPositions.every(y => Math.abs(y - zeroY) > 16)) context.fillText('0%', width - g.pad.right + 8, zeroY);
    context.save(); context.setLineDash([3, 4]); context.strokeStyle = muted; context.globalAlpha = 0.45;
    context.beginPath(); context.moveTo(g.pad.left, zeroY); context.lineTo(width - g.pad.right, zeroY); context.stroke(); context.restore();

    context.textBaseline = 'top';
    const ticks = width < 500 ? [0, plotted.length - 1] : [0, Math.floor((plotted.length - 1) / 2), plotted.length - 1];
    ticks.forEach((index, position) => {
      const point = plotted[index], x = xy(point, g).x;
      context.textAlign = position === 0 ? 'left' : position === ticks.length - 1 ? 'right' : 'center';
      context.fillText(dateLabel(point.t, ['1H', '1D', '1W'].includes(range)), x, height - g.pad.bottom + 10);
    });

    const first = xy(plotted[0], g), last = xy(plotted[plotted.length - 1], g);
    const gradient = context.createLinearGradient(0, g.pad.top, 0, height - g.pad.bottom);
    gradient.addColorStop(0, `${accent}24`); gradient.addColorStop(1, `${accent}00`);
    context.beginPath(); context.moveTo(first.x, height - g.pad.bottom);
    plotted.forEach(point => { const pointXY = xy(point, g); context.lineTo(pointXY.x, pointXY.y); });
    context.lineTo(last.x, height - g.pad.bottom); context.closePath();
    context.fillStyle = gradient; context.fill();
    context.lineJoin = 'round'; context.lineCap = 'round';
    plottedAssets.forEach(asset => {
      context.beginPath(); asset.points.forEach((point, index) => { const p = xy(point, g); if (index) context.lineTo(p.x, p.y); else context.moveTo(p.x, p.y); });
      context.strokeStyle = asset.color; context.globalAlpha = activeLine === 'strategy' ? 0.64 : activeLine === asset.ticker ? 1 : 0.18;
      context.lineWidth = activeLine === asset.ticker ? 4.5 : 1.6; context.stroke();
    });
    context.globalAlpha = 1;
    context.beginPath(); plotted.forEach((point, index) => { const p = xy(point, g); if (index) context.lineTo(p.x, p.y); else context.moveTo(p.x, p.y); });
    context.strokeStyle = accent; context.globalAlpha = activeLine === 'strategy' ? 1 : 0.32; context.lineWidth = activeLine === 'strategy' ? 4.5 : 2; context.stroke(); context.globalAlpha = 1;
    if (activeLine !== 'strategy') {
      const focused = plottedAssets.find(asset => asset.ticker === activeLine);
      if (focused) { context.beginPath(); focused.points.forEach((point, index) => { const p = xy(point, g); if (index) context.lineTo(p.x, p.y); else context.moveTo(p.x, p.y); }); context.strokeStyle = focused.color; context.lineWidth = 4.5; context.stroke(); }
    }
    const focusedPoints = plottedAssets.find(asset => asset.ticker === activeLine)?.points || plotted;
    const focusedPoint = focusedPoints[hover == null ? focusedPoints.length - 1 : hover];
    const active = xy(focusedPoint, g);
    const activeColor = activeLine === 'strategy' ? accent : plottedAssets.find(asset => asset.ticker === activeLine)?.color || accent;
    context.save(); context.setLineDash([2, 4]); context.strokeStyle = activeColor; context.globalAlpha = .54; context.lineWidth = 1;
    context.beginPath(); context.moveTo(g.pad.left, active.y); context.lineTo(width - g.pad.right, active.y); context.stroke(); context.restore();
    if (hover != null) {
      context.save(); context.setLineDash([4, 5]); context.strokeStyle = muted; context.lineWidth = 1;
      context.beginPath(); context.moveTo(active.x, g.pad.top); context.lineTo(active.x, height - g.pad.bottom); context.stroke(); context.restore();
      plottedAssets.forEach(asset => {
        const point = xy(asset.points[hover], g);
        context.fillStyle = asset.color; context.beginPath(); context.arc(point.x, point.y, activeLine === asset.ticker ? 5 : 3, 0, 2 * Math.PI); context.fill();
      });
      showTooltip(plotted[hover], active, width);
    } else hideTooltip();
    context.fillStyle = activeColor;
    context.beginPath(); context.arc(active.x, active.y, hover == null ? 5 : 6, 0, 2 * Math.PI); context.fill();
    updateEdgeLabel(focusedPoint, active, activeColor, height);
  }

  function showTooltip(point, position, width) {
    const tip = $('#strategy-tooltip');
    const rows = plottedAssets.map(asset => `<span class="strategy-page__tooltip-row" style="--series-color:${asset.color}">${window.assetIconHTML(asset.ticker, 'sm')}${asset.ticker}<b>${percent(asset.points[hover].v / 100 - 1)}</b></span>`).join('');
    const selectedAsset = plottedAssets.find(asset => asset.ticker === activeLine);
    const focusedValue = selectedAsset ? selectedAsset.points[hover].v : point.v;
    tip.innerHTML = `<span class="strategy-page__tooltip-date">${dateLabel(point.t, ['1H', '1D', '1W'].includes(range))}</span><strong>${activeLine === 'strategy' ? strategies[selected].short : activeLine} <b>${percent(focusedValue / 100 - 1)}</b></strong>${rows}`;
    tip.style.left = `${Math.max(100, Math.min(width - 100, position.x))}px`;
    tip.style.top = `${Math.max(78, position.y)}px`;
    tip.classList.add('is-visible');
    tip.setAttribute('aria-hidden', 'false');
  }

  function hideTooltip() {
    const tip = $('#strategy-tooltip');
    tip.classList.remove('is-visible');
    tip.setAttribute('aria-hidden', 'true');
  }

  function scheduleDraw() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; draw(); });
  }

  function pointerIndex(event) {
    if (!result || !geometry || !plotted.length) return;
    const x = event.clientX - $('#strategy-chart').getBoundingClientRect().left;
    const target = geometry.start + Math.max(0, Math.min(1, (x - geometry.pad.left) / geometry.plotWidth)) * (geometry.end - geometry.start);
    let low = 0, high = plotted.length - 1;
    while (low < high) { const mid = (low + high) >> 1; if (plotted[mid].t < target) low = mid + 1; else high = mid; }
    hover = low > 0 && Math.abs(plotted[low - 1].t - target) < Math.abs(plotted[low].t - target) ? low - 1 : low;
    scheduleDraw();
  }

  function lineAtPointer(event) {
    if (hover == null || !geometry) return null;
    const y = event.clientY - $('#strategy-chart').getBoundingClientRect().top;
    const candidates = [{ key: 'strategy', point: plotted[hover] }, ...plottedAssets.map(asset => ({ key: asset.ticker, point: asset.points[hover] }))];
    const nearest = candidates.map(item => ({ key: item.key, distance: Math.abs(xy(item.point, geometry).y - y) })).sort((a, b) => a.distance - b.distance)[0];
    return nearest?.distance <= 22 ? nearest.key : null;
  }

  function boot() {
    window.PORSI_TIMEFRAMES?.apply($('#strategy-range'));
    renderSelection();
    $('#strategy-picker').addEventListener('click', event => {
      const choice = event.target.closest('[data-strategy]');
      if (!choice || choice.dataset.strategy === selected) return;
      selected = choice.dataset.strategy;
      activeLine = 'strategy';
      const url = new URL(location.href); url.searchParams.set('strategy', selected); history.replaceState(null, '', url);
      renderSelection(); load();
    });
    $('#strategy-range').addEventListener('change', event => { range = event.target.value; $('#strategy-return-label').textContent = `Total return · ${range}`; load(); });
    $('#strategy-chart-legend').addEventListener('click', event => { const button = event.target.closest('[data-line]'); if (button) focusLine(button.dataset.line); });
    $('#strategy-asset-list').addEventListener('click', event => { if (event.target.closest('a')) return; const card = event.target.closest('[data-asset-card]'); if (card) focusLine(card.dataset.assetCard); });
    const canvas = $('#strategy-chart');
    canvas.addEventListener('pointermove', pointerIndex, { passive: true });
    canvas.addEventListener('pointerdown', event => { pointerIndex(event); const line = lineAtPointer(event); if (line) focusLine(line); pinned = true; });
    canvas.addEventListener('pointerleave', () => { if (!pinned) { hover = null; scheduleDraw(); } });
    canvas.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Escape'].includes(event.key) || !plotted.length) return;
      event.preventDefault();
      if (event.key === 'Escape') { hover = null; pinned = false; }
      else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { const lines = ['strategy', ...strategies[selected].parts.map(([ticker]) => ticker)]; focusLine(lines[(lines.indexOf(activeLine) + (event.key === 'ArrowDown' ? 1 : lines.length - 1)) % lines.length]); }
      else { hover = Math.max(0, Math.min(plotted.length - 1, (hover == null ? plotted.length - 1 : hover) + (event.key === 'ArrowRight' ? 1 : -1))); pinned = true; }
      scheduleDraw();
    });
    new ResizeObserver(scheduleDraw).observe(canvas.parentElement);
    window.addEventListener('porsi:theme', scheduleDraw);
    load();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
