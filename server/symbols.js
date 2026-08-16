/**
 * App ticker → Yahoo Finance symbol.
 *
 * The market-data mapping lives only on the backend: the browser sends the
 * tickers it holds and gets back whatever the server could resolve. A ticker
 * absent from this map simply has no live price and stays a manual field.
 *
 * Suffixes: `.JK` = Bursa Efek Indonesia, `.L` = London (UCITS ETFs),
 * `-USD` = crypto pair, `^` = index, `=X` = FX, `=F` = futures.
 */

const YAHOO_SYMBOLS = {
  /* ── Indeks ───────────────────────────────────────────────────────────── */
  SPX: '^GSPC', // index level, not a unit price — buy it through VOO/IVV/CSPX

  /* ── Saham Indonesia ──────────────────────────────────────────────────── */
  BBCA: 'BBCA.JK', BBRI: 'BBRI.JK', BMRI: 'BMRI.JK', BBNI: 'BBNI.JK',
  BRIS: 'BRIS.JK', TLKM: 'TLKM.JK', ASII: 'ASII.JK', UNVR: 'UNVR.JK',
  ICBP: 'ICBP.JK', INDF: 'INDF.JK', KLBF: 'KLBF.JK', UNTR: 'UNTR.JK',
  ADRO: 'ADRO.JK', PTBA: 'PTBA.JK', ITMG: 'ITMG.JK', ANTM: 'ANTM.JK',
  MDKA: 'MDKA.JK', PGAS: 'PGAS.JK', SMGR: 'SMGR.JK', CPIN: 'CPIN.JK',
  JPFA: 'JPFA.JK', AMRT: 'AMRT.JK', MAPI: 'MAPI.JK', MYOR: 'MYOR.JK',
  TOWR: 'TOWR.JK', ISAT: 'ISAT.JK', AKRA: 'AKRA.JK', BRPT: 'BRPT.JK',
  TPIA: 'TPIA.JK', GOTO: 'GOTO.JK', BUKA: 'BUKA.JK',

  /* ── Saham Amerika ────────────────────────────────────────────────────── */
  NVDA: 'NVDA', GOOGL: 'GOOGL', AAPL: 'AAPL', MSFT: 'MSFT', AMZN: 'AMZN',
  META: 'META', TSLA: 'TSLA', AVGO: 'AVGO', 'BRK.B': 'BRK-B', JPM: 'JPM',
  V: 'V', MA: 'MA', UNH: 'UNH', JNJ: 'JNJ', LLY: 'LLY', MRK: 'MRK',
  ABBV: 'ABBV', PG: 'PG', KO: 'KO', PEP: 'PEP', COST: 'COST', WMT: 'WMT',
  HD: 'HD', MCD: 'MCD', XOM: 'XOM', CVX: 'CVX', ORCL: 'ORCL', CRM: 'CRM',
  ADBE: 'ADBE', AMD: 'AMD', QCOM: 'QCOM', INTC: 'INTC', CSCO: 'CSCO',
  NFLX: 'NFLX', DIS: 'DIS', NKE: 'NKE', SBUX: 'SBUX', CAT: 'CAT', BA: 'BA',
  GE: 'GE', AXP: 'AXP', VZ: 'VZ', UBER: 'UBER', PYPL: 'PYPL',

  /* ── ETF ──────────────────────────────────────────────────────────────── */
  VOO: 'VOO', IVV: 'IVV', VTI: 'VTI', QQQ: 'QQQ', SCHD: 'SCHD', BND: 'BND',
  GLD: 'GLD',
  CSPX: 'CSPX.L', VWRA: 'VWRA.L', IWDA: 'IWDA.L', EIMI: 'EIMI.L',
  RLQ45: 'R-LQ45X.JK', XIIT: 'XIIT.JK',

  /* ── Kripto ───────────────────────────────────────────────────────────── */
  BTC: 'BTC-USD', ETH: 'ETH-USD', SOL: 'SOL-USD', BNB: 'BNB-USD',
  XRP: 'XRP-USD', ADA: 'ADA-USD', DOGE: 'DOGE-USD', LINK: 'LINK-USD',
  DOT: 'DOT-USD', LTC: 'LTC-USD', POL: 'POL-USD', OP: 'OP-USD',
  BCH: 'BCH-USD', XLM: 'XLM-USD', XMR: 'XMR-USD',
  USDT: 'USDT-USD', USDC: 'USDC-USD',
  /* Newer/thinner listings — Yahoo coverage is not guaranteed. If it 404s the
     ticker is reported as missing and the field stays manual. */
  HYPE: 'HYPE-USD', XAUT: 'XAUT-USD',
};

/** USD → IDR. Used for every USD-priced asset and for the derived gold price. */
const FX_SYMBOL = 'IDR=X';

/**
 * Prices we compute rather than quote directly.
 * GOLD is sold per gram in Indonesia; Yahoo quotes gold futures in USD per
 * troy ounce, so we convert. This is the spot price — a dealer's buy price
 * (Antam and friends) carries a premium on top.
 */
const TROY_OUNCE_GRAMS = 31.1034768;

const DERIVED = {
  GOLD: {
    from: 'GC=F',
    currency: 'IDR',
    note: 'spot emas per gram, dikonversi dari futures USD/oz — belum termasuk premi dealer',
    compute: (usdPerOunce, usdIdr) => (usdPerOunce / TROY_OUNCE_GRAMS) * usdIdr,
  },
};

module.exports = { YAHOO_SYMBOLS, FX_SYMBOL, DERIVED, TROY_OUNCE_GRAMS };
