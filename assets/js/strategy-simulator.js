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
    const value = assets.reduce((sum, asset, index) => sum + units[index] * asset.series[asset.series.length - 1].v, 0);
    return { value, contributions, profit: value - contributions, return: contributions ? value / contributions - 1 : null, deposits };
  }
  return { simulate };
});
