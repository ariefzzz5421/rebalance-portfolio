(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.StrategyChart = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const HOUR = 3600000;
  const DAY = 24 * HOUR;
  const TOLERANCE = { '1H': 15 * 60000, '1D': 20 * HOUR, '1W': 2 * DAY, '1M': 5 * DAY, '1Y': 14 * DAY, '5Y': 45 * DAY, '10Y': 75 * DAY };

  function targetStart(end, range) {
    if (range === 'MAX') return null;
    if (range === '1H') return end - HOUR;
    if (range === '1D') return end - DAY;
    if (range === '1W') return end - 7 * DAY;
    const date = new Date(end);
    if (range === '1M') date.setUTCMonth(date.getUTCMonth() - 1);
    else if (range === '1Y') date.setUTCFullYear(date.getUTCFullYear() - 1);
    else if (range === '5Y') date.setUTCFullYear(date.getUTCFullYear() - 5);
    else if (range === '10Y') date.setUTCFullYear(date.getUTCFullYear() - 10);
    else throw new Error('Unsupported timeframe');
    return date.getTime();
  }

  function clean(points) {
    const byTime = new Map();
    for (const point of points || []) {
      const t = Number(point && point.t), v = Number(point && point.v);
      if (Number.isFinite(t) && Number.isFinite(v) && v > 0) byTime.set(t, { t, v });
    }
    return [...byTime.values()].sort((a, b) => a.t - b.t);
  }

  function atOrBefore(points, time) {
    let low = 0, high = points.length - 1, found = null;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (points[mid].t <= time) { found = points[mid]; low = mid + 1; }
      else high = mid - 1;
    }
    return found;
  }

  /** Fixed starting weights, buy and hold. Values are indexed to 100. */
  function build(assets, range) {
    if (!Array.isArray(assets) || !assets.length) throw new Error('No strategy assets');
    const rows = assets.map(asset => ({ ...asset, points: clean(asset.history), weight: Number(asset.weight) }));
    if (rows.some(row => row.points.length < 2)) throw new Error('Data histori salah satu aset belum tersedia.');
    const weightSum = rows.reduce((sum, row) => sum + row.weight, 0);
    if (!Number.isFinite(weightSum) || Math.abs(weightSum - 1) > 1e-6) throw new Error('Bobot strategi tidak berjumlah 100%.');
    const commonStart = Math.max(...rows.map(row => row.points[0].t));
    const commonEnd = Math.min(...rows.map(row => row.points[row.points.length - 1].t));
    if (commonEnd <= commonStart) throw new Error('Belum ada periode histori yang sama untuk semua aset.');
    const requested = targetStart(commonEnd, range);
    if (requested != null && commonStart > requested + TOLERANCE[range]) throw new Error(`Histori bersama belum cukup untuk ${range}. Coba timeframe yang lebih pendek atau MAX.`);
    const start = requested == null ? commonStart : Math.max(commonStart, requested);
    if (commonEnd <= start) throw new Error(`Data ${range} belum cukup untuk membentuk chart.`);
    const positions = rows.map(row => {
      const first = atOrBefore(row.points, start);
      const last = atOrBefore(row.points, commonEnd);
      if (!first || !last) throw new Error('Titik harga bersama belum tersedia.');
      return { ...row, first: first.v, last: last.v };
    });
    const times = new Set([start, commonEnd]);
    positions.forEach(row => row.points.forEach(point => {
      if (point.t > start && point.t < commonEnd) times.add(point.t);
    }));
    const series = [...times].sort((a, b) => a - b).map(t => ({
      t,
      v: 100 * positions.reduce((nav, row) => nav + row.weight * atOrBefore(row.points, t).v / row.first, 0),
    }));
    return {
      series, start, end: commonEnd, commonStart,
      return: series[series.length - 1].v / series[0].v - 1,
      assets: positions.map(row => ({ ticker: row.ticker, weight: row.weight, return: row.last / row.first - 1 })),
    };
  }

  return { build, targetStart };
});
