const https = require('https');

const COINS = { BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin', XRP: 'ripple', DOGE: 'dogecoin', HYPE: 'hyperliquid', USDT: 'tether', XAUT: 'tether-gold' };
const NO_CAP = { SPX: 'Indeks tidak memiliki market cap tunggal.', GOLD: 'Harga emas spot tidak memiliki market cap tunggal.' };
const ETF = new Set(['VOO', 'QQQ', 'VTI', 'VT', 'VWRA', 'VWCE', 'IWDA', 'RLQ45', 'IDX', 'GLD', 'VBIL', 'SGOV', 'TBIL', 'BIL', 'SHV', 'GOVT', 'IEF', 'BND', 'XISB', 'USFR', 'TFLO', 'JPST']);
const STOCKS_ID = new Set(['BBCA', 'BBRI', 'BMRI', 'TLKM', 'ASII', 'UNVR', 'ICBP', 'KLBF', 'ANTM', 'GOTO', 'UNTR']);
const SYMBOLS = { V: 'V', SPX: '^GSPC', VWRA: 'VWRA.L', VWCE: 'VWCE.DE', IWDA: 'IWDA.L', RLQ45: 'RLQ45.JK', XISB: 'XISB.JK' };
const VALID = /^[A-Z0-9]{1,6}$/;

function yahooPage(symbol) {
  return new Promise((resolve, reject) => {
    const url = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`;
    const request = https.get(url, { maxHeaderSize: 65536, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Porsi/1.0)', Accept: 'text/html' } }, response => {
      if (response.statusCode !== 200) { response.resume(); reject(new Error(`Yahoo ${response.statusCode}`)); return; }
      let html = '';
      response.setEncoding('utf8');
      response.on('data', chunk => { html += chunk; if (html.length > 1500000) response.destroy(new Error('Response too large')); });
      response.on('end', () => resolve(html));
      response.on('error', reject);
    });
    request.setTimeout(12000, () => request.destroy(new Error('Yahoo timeout')));
    request.on('error', reject);
  });
}

function parseAbbreviated(value) {
  const match = String(value).replace(/,/g, '').match(/^([\d.]+)\s*([KMBT])?$/i);
  if (!match) return null;
  const result = Number(match[1]) * ({ K: 1e3, M: 1e6, B: 1e9, T: 1e12 }[String(match[2] || '').toUpperCase()] || 1);
  return Number.isFinite(result) && result > 0 ? result : null;
}

function yahooSymbol(ticker) { return SYMBOLS[ticker] || (STOCKS_ID.has(ticker) ? `${ticker}.JK` : ticker); }

async function yahooCapital(ticker) {
  const symbol = yahooSymbol(ticker);
  const url = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`;
  const kind = ETF.has(ticker) ? 'aum' : 'marketCap';
  try {
    const html = await yahooPage(symbol);
    const label = kind === 'aum' ? 'Net Assets' : 'Market Cap (intraday)';
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = html.match(new RegExp(`title="${escaped}"[\\s\\S]{0,360}?class="value[^>]*" title="([^"]+)"`, 'i'));
    const value = parseAbbreviated(match && match[1]);
    const currency = symbol.endsWith('.JK') ? 'IDR' : symbol.endsWith('.DE') ? 'EUR' : 'USD';
    return { kind, value, currency, source: 'Yahoo Finance', url, asOf: new Date().toISOString(), status: value ? 'ok' : 'unavailable' };
  } catch {
    return { kind, value: null, currency: null, source: 'Yahoo Finance', url, status: 'unavailable' };
  }
}

async function cryptoCapital(tickers) {
  const ids = tickers.map(ticker => COINS[ticker]);
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(','))}&sparkline=false`;
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`CoinGecko ${response.status}`);
    const rows = await response.json();
    const byId = new Map(rows.map(row => [row.id, row]));
    return Object.fromEntries(tickers.map(ticker => {
      const row = byId.get(COINS[ticker]);
      const value = Number(row && row.market_cap);
      return [ticker, { kind: 'marketCap', value: Number.isFinite(value) && value > 0 ? value : null, currency: 'USD', source: 'CoinGecko', url: `https://www.coingecko.com/en/coins/${COINS[ticker]}`, asOf: row && row.last_updated || null, status: value > 0 ? 'ok' : 'unavailable' }];
    }));
  } catch {
    return Object.fromEntries(tickers.map(ticker => [ticker, { kind: 'marketCap', value: null, currency: 'USD', source: 'CoinGecko', url: `https://www.coingecko.com/en/coins/${COINS[ticker]}`, status: 'unavailable' }]));
  }
}

async function collect(tickers) {
  const output = {};
  const coins = tickers.filter(ticker => COINS[ticker]);
  if (coins.length) Object.assign(output, await cryptoCapital(coins));
  const queue = tickers.filter(ticker => !COINS[ticker] && !NO_CAP[ticker]);
  await Promise.all(Array.from({ length: Math.min(3, queue.length) }, async () => {
    while (queue.length) { const ticker = queue.shift(); output[ticker] = await yahooCapital(ticker); }
  }));
  tickers.filter(ticker => NO_CAP[ticker]).forEach(ticker => { output[ticker] = { kind: 'notApplicable', value: null, note: NO_CAP[ticker], status: 'not-applicable' }; });
  return output;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const tickers = [...new Set(String(req.query.tickers || '').toUpperCase().split(',').map(value => value.trim()).filter(Boolean))];
  if (!tickers.length || tickers.length > 8 || tickers.some(ticker => !VALID.test(ticker))) return res.status(400).json({ error: 'Invalid tickers' });
  const data = await collect(tickers);
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');
  return res.status(200).json({ data, asOf: new Date().toISOString() });
};
module.exports._test = { parseAbbreviated, yahooSymbol, collect };
