const test = require('node:test');
const assert = require('node:assert/strict');
const { build, targetStart } = require('../assets/js/strategy-chart.js');

const hour = 3600000;

test('combined chart uses fixed starting weights and buy-and-hold returns', () => {
  const end = Date.UTC(2026, 8, 23, 12);
  const assets = [
    { ticker: 'A', weight: 0.6, history: [{ t: end - hour, v: 100 }, { t: end, v: 120 }] },
    { ticker: 'B', weight: 0.4, history: [{ t: end - hour, v: 100 }, { t: end, v: 90 }] },
  ];
  const result = build(assets, '1H');
  assert.equal(result.series[0].v, 100);
  assert.equal(result.series.at(-1).v, 108);
  assert.ok(Math.abs(result.return - 0.08) < 1e-12);
  assert.ok(Math.abs(result.assets[0].return - 0.2) < 1e-12);
});

test('short frames keep intraday observations rather than collapsing by date', () => {
  const end = Date.UTC(2026, 8, 23, 12);
  const result = build([{ ticker: 'A', weight: 1, history: [
    { t: end - hour, v: 100 }, { t: end - hour / 2, v: 102 }, { t: end, v: 103 },
  ] }], '1H');
  assert.equal(result.series.length, 3);
  assert.equal(result.series[1].v, 102);
});

test('long frames report insufficient shared history instead of relabeling a shorter window', () => {
  const end = Date.UTC(2026, 8, 23);
  const assets = [{ ticker: 'A', weight: 1, history: [
    { t: end - 30 * 86400000, v: 100 }, { t: end, v: 110 },
  ] }];
  assert.throws(() => build(assets, '1Y'), /belum cukup untuk 1Y/);
  assert.ok(Math.abs(build(assets, 'MAX').return - 0.1) < 1e-12);
});

test('requested calendar years use UTC calendar dates', () => {
  assert.equal(targetStart(Date.UTC(2026, 1, 28), '1Y'), Date.UTC(2025, 1, 28));
});
