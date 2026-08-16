/**
 * Live price client.
 *
 * Talks to the local backend (`server/index.js`), which is the thing that
 * actually calls Yahoo Finance — the browser can't, because Yahoo sends no
 * CORS headers. When the page is opened straight from disk there is no backend
 * to talk to, so every call reports `unavailable` and the app keeps its manual
 * price fields. Nothing here ever throws at the caller.
 */
window.Prices = (function () {
  'use strict';

  const TIMEOUT_MS = 10_000;
  const state = { status: 'idle', at: null, error: null, source: 'Yahoo Finance' };

  /** file:// has no server behind it, so don't even try. */
  function possible() {
    return location.protocol === 'http:' || location.protocol === 'https:';
  }

  async function get(url) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const type = res.headers.get('content-type') || '';
      if (!type.includes('json')) throw new Error('backend tidak aktif');
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * @param {string[]} tickers
   * @returns {Promise<{status:'ok'|'unavailable'|'error', quotes:object, fx:object|null, missing:string[], at:string|null, error:string|null}>}
   */
  async function fetchQuotes(tickers) {
    if (!possible()) {
      state.status = 'unavailable';
      state.error = 'dibuka langsung dari file, backend tidak jalan';
      return { status: 'unavailable', quotes: {}, fx: null, missing: tickers.slice(), at: null, error: state.error };
    }
    try {
      const list = Array.from(new Set(tickers)).filter(Boolean).join(',');
      const payload = await get('api/prices?tickers=' + encodeURIComponent(list));
      if (!payload || payload.ok === false) {
        const first = payload && payload.errors && payload.errors[0];
        throw new Error((payload && payload.error) || (first && `${first.symbol}: ${first.message}`) || 'gagal');
      }
      state.status = 'ok';
      state.at = payload.at;
      state.error = null;
      state.source = payload.source || state.source;
      return {
        status: 'ok',
        quotes: payload.quotes || {},
        fx: payload.fx || null,
        missing: payload.missing || [],
        at: payload.at,
        error: null,
      };
    } catch (err) {
      const message = err && err.name === 'AbortError' ? 'waktu tunggu habis' : String(err && err.message || err);
      state.status = message === 'backend tidak aktif' ? 'unavailable' : 'error';
      state.error = message;
      return { status: state.status, quotes: {}, fx: null, missing: tickers.slice(), at: null, error: message };
    }
  }

  return { fetchQuotes, possible, state };
})();
