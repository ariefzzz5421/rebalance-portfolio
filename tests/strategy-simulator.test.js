const test = require('node:test');
const assert = require('node:assert/strict');
const { simulate, durationLabel } = require('../assets/js/strategy-simulator');

const day = 86400000;
const start = Date.UTC(2026, 0, 30);
const series = [start, start + day, Date.UTC(2026, 1, 2), Date.UTC(2026, 2, 2)];
const result = {
  series: series.map((t, index) => ({ t, v: [100, 110, 120, 150][index] })),
  assets: [{ ticker: 'TEST', weight: 1, series: series.map((t, index) => ({ t, v: [100, 110, 120, 150][index] })) }],
};

test('one-time example follows the selected historical return', () => {
  const value = simulate(result, 100000000, 0);
  assert.equal(value.value, 150000000);
  assert.equal(value.profit, 50000000);
  assert.equal(value.deposits, 0);
});

test('monthly deposits buy at the first available point of each new month', () => {
  const value = simulate(result, 100, 12);
  assert.equal(value.deposits, 2);
  assert.equal(value.contributions, 124);
  assert.ok(Math.abs(value.value - 177) < 1e-9);
});

test('invalid amounts are rejected', () => {
  assert.throws(() => simulate(result, -1, 0));
  assert.throws(() => simulate(result, 0, Number.POSITIVE_INFINITY));
});

test('each asset receives its strategy share of the initial and monthly deposits', () => {
  const split = {
    series: [{ t: start, v: 100 }, { t: Date.UTC(2026, 1, 2), v: 110 }],
    assets: [
      { ticker: 'A', weight: .6, series: [{ t: start, v: 100 }, { t: Date.UTC(2026, 1, 2), v: 120 }] },
      { ticker: 'B', weight: .4, series: [{ t: start, v: 100 }, { t: Date.UTC(2026, 1, 2), v: 95 }] },
    ],
  };
  const simulated = simulate(split, 100000000, 1000000);
  assert.deepEqual(simulated.assetValues.map(asset => [asset.initial, asset.monthly]), [[60000000, 600000], [40000000, 400000]]);
  assert.ok(Math.abs(simulated.assetValues.reduce((sum, asset) => sum + asset.value, 0) - simulated.value) < 1e-6);
});

test('investment duration uses actual common market dates', () => {
  assert.equal(durationLabel(Date.UTC(2024, 10, 29), Date.UTC(2026, 8, 29)), '669 hari');
  assert.equal(durationLabel(0, 3600000), '1 jam');
  assert.equal(durationLabel(0, 60000), '1 menit');
});
