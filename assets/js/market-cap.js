(function (root) {
  'use strict';
  const cache = new Map();
  const ttl = 60 * 60 * 1000;
  const units = [{ value: 1e15, label: 'Kuadriliun' }, { value: 1e12, label: 'Triliun' }, { value: 1e9, label: 'Miliar' }, { value: 1e6, label: 'Juta' }];
  function format(entry, compact = false) {
    if (!entry || entry.status === 'unavailable') return 'Data belum tersedia';
    if (entry.status === 'not-applicable') return 'Tidak berlaku';
    if (!Number.isFinite(entry.value) || entry.value <= 0) return 'Data belum tersedia';
    const unit = units.find(item => entry.value >= item.value);
    const value = unit ? entry.value / unit.value : entry.value;
    const maximumFractionDigits = value < 10 ? 2 : value < 100 ? 1 : 0;
    return `${entry.currency || ''} ${new Intl.NumberFormat('id-ID', { maximumFractionDigits }).format(value)}${unit ? ` ${compact ? { Kuadriliun: 'K', Triliun: 'T', Miliar: 'M', Juta: 'Jt' }[unit.label] : unit.label}` : ''}`.trim();
  }
  function label(entry, ticker) {
    const asset = root.assetByTicker && root.assetByTicker(ticker);
    const fund = asset && ['etf', 'bond', 'cash'].includes(asset.cls) || ticker === 'GLD';
    return entry && entry.kind === 'aum' || (!entry || entry.status === 'unavailable') && fund ? 'Dana kelolaan' : 'Market cap';
  }
  async function get(tickers) {
    const unique = [...new Set(tickers)].filter(Boolean);
    const missing = unique.filter(ticker => !cache.has(ticker) || cache.get(ticker).expires < Date.now());
    for (let offset = 0; offset < missing.length; offset += 8) {
      const batch = missing.slice(offset, offset + 8);
      const response = await fetch(`/api/market-cap?tickers=${encodeURIComponent(batch.join(','))}`);
      if (!response.ok) throw new Error('Data kapitalisasi belum tersedia.');
      const json = await response.json();
      batch.forEach(ticker => cache.set(ticker, { entry: json.data && json.data[ticker] || null, expires: Date.now() + ttl }));
    }
    return Object.fromEntries(unique.map(ticker => [ticker, cache.get(ticker)?.entry || null]));
  }
  root.PORSI_MARKET_CAP = { get, format, label };
})(window);
