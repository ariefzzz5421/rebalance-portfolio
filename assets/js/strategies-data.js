(function (root, factory) {
  const strategies = factory();
  if (typeof module === 'object' && module.exports) module.exports = strategies;
  if (root) root.PORSI_STRATEGIES = strategies;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  return {
    high: {
      title: 'Strategy 1 · High Risk', short: 'High Risk',
      subtitle: 'Crypto-heavy growth allocation', color: '#ff6b6b', icon: 'rocket',
      parts: [['BTC', 'Bitcoin', 50], ['HYPE', 'Hyperliquid', 20], ['XAUT', 'Tether Gold', 15], ['USDT', 'Tether USD', 15]],
    },
    conservative: {
      title: 'Strategy 2 · Conservative', short: 'Conservative',
      subtitle: 'Balanced S&P 500, Bitcoin, and gold', color: '#22c55e', icon: 'shield-check',
      parts: [['SPX', 'S&P 500', 34], ['BTC', 'Bitcoin', 33], ['GOLD', 'Emas Fisik / Logam Mulia', 33]],
    },
    pension: {
      title: 'Strategy 3 · Pension Fund', short: 'Pension Fund',
      subtitle: 'Global equities with short-duration U.S. Treasury reserves', color: '#60a5fa', icon: 'landmark',
      parts: [['VT', 'Vanguard Total World Stock ETF', 60], ['SHV', 'iShares 0-1 Year Treasury Bond ETF', 20], ['SGOV', 'iShares 0-3 Month Treasury Bond ETF', 20]],
    },
  };
});
