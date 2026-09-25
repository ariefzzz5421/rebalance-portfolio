const test = require('node:test');
const assert = require('node:assert/strict');
const { invertHistory, orientHistory } = require('../assets/js/fx-chart.js');

test('USD per local currency quotes invert real USD/local closes with the correct return direction', () => {
  const series = invertHistory([{ t: 1, v: 16000 }, { t: 2, v: 17000 }]);
  assert.equal(series[0].v, 1 / 16000);
  assert.equal(series[1].v, 1 / 17000);
  assert.ok(series[1].v / series[0].v - 1 < 0, 'IDR weakens as USD/IDR rises');
  assert.equal(invertHistory([{ t: 3, v: 0 }, { t: 4, v: null }]).length, 0);
});

test('reversing every currency pair restores the source quote and reverses the return direction', () => {
  for (const [code, first, last] of [['IDR', 16000, 17000], ['CNY', 7.1, 7.3], ['SGD', 1.3, 1.35], ['CHF', .8, .85]]) {
    const history = [{ t: 1, v: first }, { t: 2, v: last }];
    const localPerUsd = orientHistory(history, true);
    const usdPerLocal = orientHistory(history, false);
    assert.equal(localPerUsd[1].v, last, code);
    assert.ok(localPerUsd[1].v / localPerUsd[0].v - 1 > 0, code);
    assert.ok(usdPerLocal[1].v / usdPerLocal[0].v - 1 < 0, code);
    assert.ok(Math.abs(localPerUsd[1].v * usdPerLocal[1].v - 1) < 1e-12, code);
  }
});
