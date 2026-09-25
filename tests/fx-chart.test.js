const test = require('node:test');
const assert = require('node:assert/strict');
const { invertHistory } = require('../assets/js/fx-chart.js');

test('USD per local currency quotes invert real USD/local closes with the correct return direction', () => {
  const series = invertHistory([{ t: 1, v: 16000 }, { t: 2, v: 17000 }]);
  assert.equal(series[0].v, 1 / 16000);
  assert.equal(series[1].v, 1 / 17000);
  assert.ok(series[1].v / series[0].v - 1 < 0, 'IDR weakens as USD/IDR rises');
  assert.equal(invertHistory([{ t: 3, v: 0 }, { t: 4, v: null }]).length, 0);
});
