#!/usr/bin/env node
/**
 * Rebalance — static host + market-price backend.
 *
 * Zero dependencies; needs Node 18+ for global fetch.
 *
 *   node server/index.js            → http://localhost:8787
 *   PORT=3000 node server/index.js
 *
 * Why a backend at all: Yahoo Finance does not send CORS headers, so a browser
 * cannot call it directly. This process makes the call, normalises the payload
 * and caches it, and the page just reads /api/prices. Open the site through
 * this server and prices fill themselves in; open index.html straight from
 * disk and everything still works, just with manual prices.
 */

'use strict';

const http = require('node:http');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { YAHOO_SYMBOLS, FX_SYMBOL, DERIVED } = require('./symbols');

const ROOT = path.join(__dirname, '..');
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || '127.0.0.1';
const CACHE_TTL_MS = Number(process.env.PRICE_TTL_MS) || 60_000;
const UPSTREAM_TIMEOUT_MS = 8_000;

if (typeof fetch !== 'function') {
  console.error('Butuh Node 18 atau lebih baru (global fetch belum ada di versi ini).');
  process.exit(1);
}

/* ── Upstream ─────────────────────────────────────────────────────────────── */

/* Override in tests with a local stand-in that speaks the same JSON shape. */
const CHART_URL = process.env.YAHOO_BASE || 'https://query1.finance.yahoo.com/v8/finance/chart/';

/* Yahoo rejects requests without a browser-ish User-Agent. */
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
};

/** cache: yahoo symbol → { quote, at } */
const cache = new Map();

async function fetchSymbol(symbol) {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.quote;

  const url = `${CHART_URL}${encodeURIComponent(symbol)}?interval=1d&range=5d`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: HEADERS, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();

    const err = body && body.chart && body.chart.error;
    if (err) throw new Error(err.description || err.code || 'upstream error');

    const result = body && body.chart && body.chart.result && body.chart.result[0];
    const meta = result && result.meta;
    if (!meta || typeof meta.regularMarketPrice !== 'number') {
      throw new Error('tidak ada harga di respons');
    }

    const prev = typeof meta.chartPreviousClose === 'number'
      ? meta.chartPreviousClose
      : (typeof meta.previousClose === 'number' ? meta.previousClose : null);

    const quote = {
      symbol: meta.symbol || symbol,
      price: meta.regularMarketPrice,
      currency: meta.currency || null,
      exchange: meta.fullExchangeName || meta.exchangeName || null,
      changePct: prev ? ((meta.regularMarketPrice - prev) / prev) * 100 : null,
      marketTime: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    };
    cache.set(symbol, { quote, at: Date.now() });
    return quote;
  } finally {
    clearTimeout(timer);
  }
}

/** Resolve many tickers at once. Never throws — failures land in `errors`. */
async function quoteTickers(tickers) {
  const wanted = new Set(tickers);
  const needed = new Map(); // yahoo symbol → [app tickers]

  const want = (symbol, ticker) => {
    if (!needed.has(symbol)) needed.set(symbol, []);
    needed.get(symbol).push(ticker);
  };

  for (const t of wanted) {
    if (DERIVED[t]) want(DERIVED[t].from, t);
    else if (YAHOO_SYMBOLS[t]) want(YAHOO_SYMBOLS[t], t);
  }
  needed.set(FX_SYMBOL, needed.get(FX_SYMBOL) || []);

  const symbols = [...needed.keys()];
  const settled = await Promise.allSettled(symbols.map(fetchSymbol));
  const bySymbol = new Map();
  const errors = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') bySymbol.set(symbols[i], r.value);
    else errors.push({ symbol: symbols[i], message: String(r.reason && r.reason.message || r.reason) });
  });

  const fxQuote = bySymbol.get(FX_SYMBOL);
  const usdIdr = fxQuote ? fxQuote.price : null;

  const quotes = {};
  const missing = [];
  for (const t of wanted) {
    const derived = DERIVED[t];
    if (derived) {
      const base = bySymbol.get(derived.from);
      if (base && usdIdr) {
        quotes[t] = {
          price: derived.compute(base.price, usdIdr),
          currency: derived.currency,
          symbol: `${base.symbol} → ${t}`,
          changePct: base.changePct,
          marketTime: base.marketTime,
          derived: true,
          note: derived.note,
        };
      } else missing.push(t);
      continue;
    }
    const symbol = YAHOO_SYMBOLS[t];
    const q = symbol && bySymbol.get(symbol);
    if (q) quotes[t] = q;
    else missing.push(t);
  }

  return {
    ok: Object.keys(quotes).length > 0 || (!wanted.size && !!usdIdr),
    at: new Date().toISOString(),
    source: 'Yahoo Finance',
    fx: usdIdr ? { usdidr: usdIdr, at: fxQuote.marketTime } : null,
    quotes,
    missing,
    errors,
  };
}

/* ── Static files ─────────────────────────────────────────────────────────── */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
};

async function serveStatic(req, res, pathname) {
  const rel = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const file = path.join(ROOT, rel);
  /* Never serve outside the project directory. */
  if (!file.startsWith(ROOT + path.sep) && file !== path.join(ROOT, 'index.html')) {
    return send(res, 403, { 'Content-Type': 'text/plain' }, 'Forbidden');
  }
  try {
    const stat = await fsp.stat(file);
    if (stat.isDirectory()) return serveStatic(req, res, path.posix.join(pathname, 'index.html'));
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(file).pipe(res);
  } catch {
    send(res, 404, { 'Content-Type': 'text/plain; charset=utf-8' }, 'Tidak ditemukan');
  }
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function json(res, status, payload) {
  send(res, status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  }, JSON.stringify(payload));
}

/* ── Routes ───────────────────────────────────────────────────────────────── */

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/prices') {
    const raw = (url.searchParams.get('tickers') || '').trim();
    const tickers = raw ? raw.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean).slice(0, 80) : [];
    try {
      const payload = await quoteTickers(tickers);
      return json(res, 200, payload);
    } catch (err) {
      return json(res, 502, { ok: false, error: String(err && err.message || err) });
    }
  }

  if (url.pathname === '/api/symbols') {
    return json(res, 200, {
      ok: true,
      supported: Object.keys(YAHOO_SYMBOLS).concat(Object.keys(DERIVED)).sort(),
      fx: FX_SYMBOL,
    });
  }

  if (url.pathname === '/api/health') {
    try {
      const fx = await fetchSymbol(FX_SYMBOL);
      return json(res, 200, { ok: true, upstream: 'reachable', usdidr: fx.price, at: new Date().toISOString() });
    } catch (err) {
      return json(res, 200, { ok: false, upstream: 'unreachable', error: String(err && err.message || err) });
    }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, { 'Content-Type': 'text/plain' }, 'Method Not Allowed');
  }

  return serveStatic(req, res, url.pathname);
});

server.listen(PORT, HOST, () => {
  console.log(`Rebalance jalan di http://${HOST}:${PORT}`);
  console.log(`Harga: /api/prices?tickers=BTC,NVDA,BBCA · cek koneksi: /api/health`);
});
