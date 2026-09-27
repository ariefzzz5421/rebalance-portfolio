const test = require('node:test');
const assert = require('node:assert/strict');
const { parseAbbreviated, yahooSymbol } = require('../api/market-cap')._test;

test('Yahoo abbreviated capitalization values retain their units', () => {
  assert.equal(parseAbbreviated('767.761T'), 767761000000000);
  assert.equal(parseAbbreviated('101.67B'), 101670000000);
  assert.equal(parseAbbreviated('--'), null);
});

test('Indonesian stock and ETF listings use their own Yahoo symbols', () => {
  assert.equal(yahooSymbol('BBCA'), 'BBCA.JK');
  assert.equal(yahooSymbol('XISB'), 'XISB.JK');
  assert.equal(yahooSymbol('VT'), 'VT');
});
