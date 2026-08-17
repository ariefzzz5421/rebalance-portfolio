/**
 * The asset catalogue: what a slice can point at.
 *
 * Static reference data only — ticker, name, class and a brand colour. There
 * are no prices here and no market feed anywhere in the app; a slice is a
 * percentage of the money you typed, nothing more.
 *
 * `color` is the fallback used to tint a monogram tile when the asset has no
 * brand mark in `marks.js`.
 */

window.ASSET_CLASSES = [
  { id: 'idx', label: 'Saham Indonesia', short: 'IDX' },
  { id: 'us', label: 'Saham Amerika', short: 'AS' },
  { id: 'etf', label: 'ETF & Indeks', short: 'ETF' },
  { id: 'crypto', label: 'Kripto', short: 'Kripto' },
  { id: 'gold', label: 'Emas', short: 'Emas' },
  { id: 'bond', label: 'Obligasi & SBN', short: 'Obligasi' },
  { id: 'cash', label: 'Kas & Setara', short: 'Kas' },
];

window.ASSETS = [
  /* ── Saham Indonesia ────────────────────────────────────────────────────── */
  { ticker: 'BBCA', name: 'Bank Central Asia', cls: 'idx', color: '#0060af' },
  { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', cls: 'idx', color: '#00529c' },
  { ticker: 'BMRI', name: 'Bank Mandiri', cls: 'idx', color: '#003d79' },
  { ticker: 'TLKM', name: 'Telkom Indonesia', cls: 'idx', color: '#e30613' },
  { ticker: 'ASII', name: 'Astra International', cls: 'idx', color: '#0a4b9c' },
  { ticker: 'UNVR', name: 'Unilever Indonesia', cls: 'idx', color: '#1f36c7' },
  { ticker: 'ICBP', name: 'Indofood CBP Sukses Makmur', cls: 'idx', color: '#c8102e' },
  { ticker: 'KLBF', name: 'Kalbe Farma', cls: 'idx', color: '#00843d' },
  { ticker: 'ANTM', name: 'Aneka Tambang', cls: 'idx', color: '#d4a017' },
  { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia', cls: 'idx', color: '#00aa13' },

  /* ── Saham Amerika ──────────────────────────────────────────────────────── */
  { ticker: 'AAPL', name: 'Apple', cls: 'us', color: '#555555' },
  { ticker: 'MSFT', name: 'Microsoft', cls: 'us', color: '#00a4ef' },
  { ticker: 'NVDA', name: 'NVIDIA', cls: 'us', color: '#76b900' },
  { ticker: 'GOOGL', name: 'Alphabet (Google)', cls: 'us', color: '#4285f4' },
  { ticker: 'AMZN', name: 'Amazon', cls: 'us', color: '#ff9900' },
  { ticker: 'META', name: 'Meta Platforms', cls: 'us', color: '#0081fb' },
  { ticker: 'TSLA', name: 'Tesla', cls: 'us', color: '#cc0000' },
  { ticker: 'AVGO', name: 'Broadcom', cls: 'us', color: '#cc092f' },
  { ticker: 'JPM', name: 'JPMorgan Chase', cls: 'us', color: '#5c2d18' },
  { ticker: 'V', name: 'Visa', cls: 'us', color: '#1a1f71' },

  /* ── ETF & indeks ───────────────────────────────────────────────────────── */
  { ticker: 'SPX', name: 'S&P 500', cls: 'etf', color: '#2a78d6' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', cls: 'etf', color: '#96151d' },
  { ticker: 'QQQ', name: 'Invesco QQQ (Nasdaq-100)', cls: 'etf', color: '#003d5b' },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market', cls: 'etf', color: '#96151d' },
  { ticker: 'VWRA', name: 'Vanguard FTSE All-World', cls: 'etf', color: '#96151d' },
  { ticker: 'RLQ45', name: 'Premier ETF LQ-45', cls: 'etf', color: '#1b6ca8' },
  { ticker: 'RDINDEX', name: 'Reksa Dana Indeks', cls: 'etf', color: '#1baf7a' },

  /* ── Kripto ─────────────────────────────────────────────────────────────── */
  { ticker: 'BTC', name: 'Bitcoin', cls: 'crypto', color: '#f7931a' },
  { ticker: 'ETH', name: 'Ethereum', cls: 'crypto', color: '#3c3c3d' },
  { ticker: 'SOL', name: 'Solana', cls: 'crypto', color: '#9945ff' },
  { ticker: 'BNB', name: 'BNB', cls: 'crypto', color: '#f0b90b' },
  { ticker: 'XRP', name: 'XRP', cls: 'crypto', color: '#25a768' },
  { ticker: 'DOGE', name: 'Dogecoin', cls: 'crypto', color: '#c2a633' },
  { ticker: 'HYPE', name: 'Hyperliquid', cls: 'crypto', color: '#12a48a' },
  { ticker: 'USDT', name: 'Tether USD (stablecoin)', cls: 'crypto', color: '#26a17b' },

  /* ── Emas ───────────────────────────────────────────────────────────────── */
  { ticker: 'GOLD', name: 'Emas Fisik / Logam Mulia', cls: 'gold', color: '#eda100' },
  { ticker: 'XAUT', name: 'Tether Gold', cls: 'gold', color: '#d4a017' },
  { ticker: 'GLD', name: 'SPDR Gold Shares', cls: 'gold', color: '#c9a227' },

  /* ── Obligasi & SBN ─────────────────────────────────────────────────────── */
  { ticker: 'SBN', name: 'SBN Ritel (ORI/SR/ST/SBR)', cls: 'bond', color: '#4a3aa7' },
  { ticker: 'FR', name: 'Obligasi Pemerintah seri FR', cls: 'bond', color: '#5b4bd6' },
  { ticker: 'RDPT', name: 'Reksa Dana Pendapatan Tetap', cls: 'bond', color: '#6f5fe8' },

  /* ── Kas & setara ───────────────────────────────────────────────────────── */
  { ticker: 'CASH', name: 'Kas / Tabungan', cls: 'cash', color: '#0ca30c' },
  { ticker: 'DEPO', name: 'Deposito Berjangka', cls: 'cash', color: '#0f7a3d' },
  { ticker: 'RDPU', name: 'Reksa Dana Pasar Uang', cls: 'cash', color: '#1baf7a' },
];

window.assetByTicker = function (ticker) {
  return window.ASSETS.find((a) => a.ticker === ticker) || null;
};

window.classById = function (id) {
  return window.ASSET_CLASSES.find((c) => c.id === id) || null;
};

/* Bond and cash glyphs are shared across every asset in those classes. */
window.MARK_ALIASES = {
  SBN: 'BOND', FR: 'BOND', RDPT: 'BOND',
  CASH: 'CASH', DEPO: 'CASH', RDPU: 'CASH',
  GLD: 'GOLD',
};
