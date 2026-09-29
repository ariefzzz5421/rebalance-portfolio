(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.StrategySimulator = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function simulate(result, initial, monthly) {
    if (!result || !Array.isArray(result.series) || !result.series.length || !Number.isFinite(initial) || !Number.isFinite(monthly) || initial < 0 || monthly < 0) throw new Error('Input simulasi tidak valid.');
    const assets = result.assets;
    const units = assets.map(asset => initial * asset.weight / asset.series[0].v);
    let contributions = initial;
    let deposits = 0;
    let startMonth = new Date(result.series[0].t).getUTCFullYear() * 12 + new Date(result.series[0].t).getUTCMonth();
    result.series.forEach((point, pointIndex) => {
      const date = new Date(point.t);
      const month = date.getUTCFullYear() * 12 + date.getUTCMonth();
      if (month <= startMonth || !monthly) return;
      for (let due = startMonth + 1; due <= month; due++) {
        assets.forEach((asset, index) => { units[index] += monthly * asset.weight / asset.series[pointIndex].v; });
        contributions += monthly;
        deposits++;
      }
      startMonth = month;
    });
    const assetValues = assets.map((asset, index) => ({ ticker: asset.ticker, weight: asset.weight, initial: initial * asset.weight, monthly: monthly * asset.weight, value: units[index] * asset.series[asset.series.length - 1].v }));
    const value = assetValues.reduce((sum, asset) => sum + asset.value, 0);
    return { value, contributions, profit: value - contributions, return: contributions ? value / contributions - 1 : null, deposits, assetValues };
  }
  function durationLabel(start, end) {
    const elapsed = Number(end) - Number(start);
    if (!Number.isFinite(elapsed) || elapsed < 0) return '—';
    if (elapsed >= 86400000) return `${new Intl.NumberFormat('id-ID').format(Math.round(elapsed / 86400000))} hari`;
    if (elapsed >= 3600000) return `${Math.round(elapsed / 3600000)} jam`;
    return `${Math.max(1, Math.round(elapsed / 60000))} menit`;
  }
  return { simulate, durationLabel };
});
