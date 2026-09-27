const test = require('node:test');
const assert = require('node:assert/strict');
const { simulate } = require('../assets/js/strategy-simulator');

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
