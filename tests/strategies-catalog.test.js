const test = require('node:test');
const assert = require('node:assert/strict');
const strategies = require('../assets/js/strategies-data.js');

test('five strategies have valid, distinct 100% allocations', () => {
  assert.equal(Object.keys(strategies).length, 5);
  for (const [key, strategy] of Object.entries(strategies)) {
    assert.equal(strategy.parts.reduce((sum, [, , weight]) => sum + weight, 0), 100, key);
    assert.equal(new Set(strategy.parts.map(([ticker]) => ticker)).size, strategy.parts.length, key);
    assert.ok(strategy.parts.every(([, , weight]) => weight > 0 && weight <= 100), key);
  }
});

test('Indonesian strategies use domestic listings and disclose their source and risk notes', () => {
  for (const key of ['dividendIndo', 'pensionIndo']) {
    const strategy = strategies[key];
    assert.ok(strategy.parts.every(([ticker]) => ['BBCA', 'BMRI', 'TLKM', 'UNTR', 'XISB', 'KLBF'].includes(ticker)));
    assert.ok(strategy.research.length >= 3);
    assert.ok(strategy.note.length > 60);
  }
});
