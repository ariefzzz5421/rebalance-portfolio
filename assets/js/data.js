/**
 * Asset library + class metadata.
 *
 * Everything here is static reference data: tickers, names, asset class and
 * trading currency. There are no prices — this app has no market-data feed, so
 * every number that matters is typed in by the user (see README).
 */

/* Asset classes. `slot` is the fixed categorical palette slot (1-8) that the
   class always wears, so a class keeps its colour no matter what is on screen. */
window.ASSET_CLASSES = [
  { id: 'saham-id', slot: 1, label: 'Saham Indonesia', short: 'IDX' },
  { id: 'saham-us', slot: 2, label: 'Saham Amerika', short: 'US' },
  { id: 'etf', slot: 3, label: 'ETF, Indeks & Reksa Dana', short: 'ETF' },
  { id: 'emas', slot: 4, label: 'Emas', short: 'Emas' },
  { id: 'kripto', slot: 5, label: 'Kripto', short: 'Kripto' },
  { id: 'kas', slot: 6, label: 'Kas & Stablecoin', short: 'Kas' },
  { id: 'obligasi', slot: 7, label: 'Obligasi & SBN', short: 'Obligasi' },
];

/**
 * The library. Fields:
 *   ticker   unique id, also what the user sees
 *   name     full name
 *   cls      asset class id
 *   ccy      trading currency — 'IDR' or 'USD'
 *   color    brand colour used for the logo tile when there is no brand mark
 *   lot      shares per lot (IDX trades in lots of 100); 1 elsewhere
 *   unit     what one unit is called, for the units × price helper
 *   featured true = shown in "Aset utama" at the top of its page
 *   note     one-line description
 */
window.ASSET_LIBRARY = [
  /* ── Aset utama ─────────────────────────────────────────────────────────── */
  { ticker: 'SPX', name: 'S&P 500', cls: 'etf', ccy: 'USD', color: '#2a78d6', lot: 1, unit: 'unit', featured: true,
    note: '500 perusahaan terbesar AS — lewat ETF seperti VOO/IVV/CSPX' },
  { ticker: 'BTC', name: 'Bitcoin', cls: 'kripto', ccy: 'USD', color: '#f7931a', lot: 1, unit: 'BTC', featured: true,
    note: 'Kripto dengan kapitalisasi terbesar' },
  { ticker: 'USDT', name: 'Tether USD', cls: 'kas', ccy: 'USD', color: '#26a17b', lot: 1, unit: 'USDT', featured: true,
    note: 'Stablecoin dolar — dipakai sebagai kas di portofolio kripto' },
  { ticker: 'XAUT', name: 'Tether Gold', cls: 'emas', ccy: 'USD', color: '#d4a017', lot: 1, unit: 'XAUT', featured: true,
    note: 'Token yang dijamin emas fisik, 1 XAUT ≈ 1 troy ounce' },
  { ticker: 'GOLD', name: 'Emas Fisik / Logam Mulia', cls: 'emas', ccy: 'IDR', color: '#eda100', lot: 1, unit: 'gram', featured: true,
    note: 'Emas batangan atau tabungan emas, dihitung per gram' },
  { ticker: 'HYPE', name: 'Hyperliquid', cls: 'kripto', ccy: 'USD', color: '#12a48a', lot: 1, unit: 'HYPE', featured: true,
    note: 'Token bursa perpetual on-chain' },
  { ticker: 'SOL', name: 'Solana', cls: 'kripto', ccy: 'USD', color: '#9945ff', lot: 1, unit: 'SOL', featured: true,
    note: 'Layer-1 throughput tinggi' },
  { ticker: 'ETH', name: 'Ethereum', cls: 'kripto', ccy: 'USD', color: '#3c3c3d', lot: 1, unit: 'ETH', featured: true,
    note: 'Layer-1 smart contract terbesar' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', cls: 'saham-us', ccy: 'USD', color: '#76b900', lot: 1, unit: 'lembar', featured: true,
    note: 'Chip AI dan GPU' },
  { ticker: 'GOOGL', name: 'Alphabet (Google)', cls: 'saham-us', ccy: 'USD', color: '#4285f4', lot: 1, unit: 'lembar', featured: true,
    note: 'Mesin pencari, YouTube, Google Cloud' },

  /* ── Saham Indonesia (bluechip IDX) ─────────────────────────────────────── */
  { ticker: 'BBCA', name: 'Bank Central Asia', cls: 'saham-id', ccy: 'IDR', color: '#0060af', lot: 100, unit: 'lembar', note: 'Bank swasta terbesar' },
  { ticker: 'BBRI', name: 'Bank Rakyat Indonesia', cls: 'saham-id', ccy: 'IDR', color: '#00529c', lot: 100, unit: 'lembar', note: 'Bank mikro & UMKM' },
  { ticker: 'BMRI', name: 'Bank Mandiri', cls: 'saham-id', ccy: 'IDR', color: '#003d79', lot: 100, unit: 'lembar', note: 'Bank BUMN terbesar' },
  { ticker: 'BBNI', name: 'Bank Negara Indonesia', cls: 'saham-id', ccy: 'IDR', color: '#f26a2b', lot: 100, unit: 'lembar', note: 'Bank BUMN' },
  { ticker: 'BRIS', name: 'Bank Syariah Indonesia', cls: 'saham-id', ccy: 'IDR', color: '#00a39d', lot: 100, unit: 'lembar', note: 'Bank syariah terbesar' },
  { ticker: 'TLKM', name: 'Telkom Indonesia', cls: 'saham-id', ccy: 'IDR', color: '#e30613', lot: 100, unit: 'lembar', note: 'Telekomunikasi & data center' },
  { ticker: 'ASII', name: 'Astra International', cls: 'saham-id', ccy: 'IDR', color: '#0a4b9c', lot: 100, unit: 'lembar', note: 'Otomotif, alat berat, jasa keuangan' },
  { ticker: 'UNVR', name: 'Unilever Indonesia', cls: 'saham-id', ccy: 'IDR', color: '#1f36c7', lot: 100, unit: 'lembar', note: 'Barang konsumsi' },
  { ticker: 'ICBP', name: 'Indofood CBP Sukses Makmur', cls: 'saham-id', ccy: 'IDR', color: '#c8102e', lot: 100, unit: 'lembar', note: 'Mie instan & makanan olahan' },
  { ticker: 'INDF', name: 'Indofood Sukses Makmur', cls: 'saham-id', ccy: 'IDR', color: '#a4161a', lot: 100, unit: 'lembar', note: 'Agribisnis & makanan terintegrasi' },
  { ticker: 'KLBF', name: 'Kalbe Farma', cls: 'saham-id', ccy: 'IDR', color: '#00843d', lot: 100, unit: 'lembar', note: 'Farmasi & nutrisi' },
  { ticker: 'UNTR', name: 'United Tractors', cls: 'saham-id', ccy: 'IDR', color: '#ffb800', lot: 100, unit: 'lembar', note: 'Alat berat & kontraktor tambang' },
  { ticker: 'ADRO', name: 'Alamtri Resources (d/h Adaro Energy)', cls: 'saham-id', ccy: 'IDR', color: '#1b6ca8', lot: 100, unit: 'lembar', note: 'Batu bara & energi' },
  { ticker: 'PTBA', name: 'Bukit Asam', cls: 'saham-id', ccy: 'IDR', color: '#005baa', lot: 100, unit: 'lembar', note: 'Batu bara BUMN' },
  { ticker: 'ITMG', name: 'Indo Tambangraya Megah', cls: 'saham-id', ccy: 'IDR', color: '#0f5c3f', lot: 100, unit: 'lembar', note: 'Batu bara, dividen tinggi' },
  { ticker: 'ANTM', name: 'Aneka Tambang', cls: 'saham-id', ccy: 'IDR', color: '#d4a017', lot: 100, unit: 'lembar', note: 'Emas & nikel BUMN' },
  { ticker: 'MDKA', name: 'Merdeka Copper Gold', cls: 'saham-id', ccy: 'IDR', color: '#b8860b', lot: 100, unit: 'lembar', note: 'Tembaga, emas, nikel' },
  { ticker: 'PGAS', name: 'Perusahaan Gas Negara', cls: 'saham-id', ccy: 'IDR', color: '#0072bc', lot: 100, unit: 'lembar', note: 'Distribusi gas bumi' },
  { ticker: 'SMGR', name: 'Semen Indonesia', cls: 'saham-id', ccy: 'IDR', color: '#d62828', lot: 100, unit: 'lembar', note: 'Semen BUMN' },
  { ticker: 'CPIN', name: 'Charoen Pokphand Indonesia', cls: 'saham-id', ccy: 'IDR', color: '#e63946', lot: 100, unit: 'lembar', note: 'Pakan & unggas' },
  { ticker: 'JPFA', name: 'Japfa Comfeed Indonesia', cls: 'saham-id', ccy: 'IDR', color: '#2a9d8f', lot: 100, unit: 'lembar', note: 'Pakan, unggas, akuakultur' },
  { ticker: 'AMRT', name: 'Sumber Alfaria Trijaya (Alfamart)', cls: 'saham-id', ccy: 'IDR', color: '#e11b22', lot: 100, unit: 'lembar', note: 'Ritel minimarket' },
  { ticker: 'MAPI', name: 'Mitra Adiperkasa', cls: 'saham-id', ccy: 'IDR', color: '#1d3557', lot: 100, unit: 'lembar', note: 'Ritel merek global' },
  { ticker: 'MYOR', name: 'Mayora Indah', cls: 'saham-id', ccy: 'IDR', color: '#e76f51', lot: 100, unit: 'lembar', note: 'Makanan & minuman kemasan' },
  { ticker: 'TOWR', name: 'Sarana Menara Nusantara', cls: 'saham-id', ccy: 'IDR', color: '#457b9d', lot: 100, unit: 'lembar', note: 'Menara telekomunikasi' },
  { ticker: 'ISAT', name: 'Indosat Ooredoo Hutchison', cls: 'saham-id', ccy: 'IDR', color: '#ed1c24', lot: 100, unit: 'lembar', note: 'Telekomunikasi' },
  { ticker: 'AKRA', name: 'AKR Corporindo', cls: 'saham-id', ccy: 'IDR', color: '#f4a261', lot: 100, unit: 'lembar', note: 'Distribusi BBM & kawasan industri' },
  { ticker: 'BRPT', name: 'Barito Pacific', cls: 'saham-id', ccy: 'IDR', color: '#264653', lot: 100, unit: 'lembar', note: 'Petrokimia & panas bumi' },
  { ticker: 'TPIA', name: 'Chandra Asri Pacific', cls: 'saham-id', ccy: 'IDR', color: '#1b998b', lot: 100, unit: 'lembar', note: 'Petrokimia terbesar' },
  { ticker: 'GOTO', name: 'GoTo Gojek Tokopedia', cls: 'saham-id', ccy: 'IDR', color: '#00aa13', lot: 100, unit: 'lembar', note: 'Ride hailing, e-commerce, fintech' },
  { ticker: 'BUKA', name: 'Bukalapak', cls: 'saham-id', ccy: 'IDR', color: '#e31e52', lot: 100, unit: 'lembar', note: 'E-commerce & mitra warung' },

  /* ── Saham Amerika (bluechip) ───────────────────────────────────────────── */
  { ticker: 'AAPL', name: 'Apple Inc.', cls: 'saham-us', ccy: 'USD', color: '#555555', lot: 1, unit: 'lembar', note: 'iPhone, Mac, layanan' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', cls: 'saham-us', ccy: 'USD', color: '#00a4ef', lot: 1, unit: 'lembar', note: 'Windows, Office, Azure' },
  { ticker: 'AMZN', name: 'Amazon.com', cls: 'saham-us', ccy: 'USD', color: '#ff9900', lot: 1, unit: 'lembar', note: 'E-commerce & AWS' },
  { ticker: 'META', name: 'Meta Platforms', cls: 'saham-us', ccy: 'USD', color: '#0081fb', lot: 1, unit: 'lembar', note: 'Facebook, Instagram, WhatsApp' },
  { ticker: 'TSLA', name: 'Tesla, Inc.', cls: 'saham-us', ccy: 'USD', color: '#cc0000', lot: 1, unit: 'lembar', note: 'Kendaraan listrik & energi' },
  { ticker: 'AVGO', name: 'Broadcom Inc.', cls: 'saham-us', ccy: 'USD', color: '#cc092f', lot: 1, unit: 'lembar', note: 'Semikonduktor & software infrastruktur' },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway B', cls: 'saham-us', ccy: 'USD', color: '#1f4e79', lot: 1, unit: 'lembar', note: 'Konglomerat Warren Buffett' },
  { ticker: 'JPM', name: 'JPMorgan Chase', cls: 'saham-us', ccy: 'USD', color: '#5c2d18', lot: 1, unit: 'lembar', note: 'Bank terbesar AS' },
  { ticker: 'V', name: 'Visa Inc.', cls: 'saham-us', ccy: 'USD', color: '#1a1f71', lot: 1, unit: 'lembar', note: 'Jaringan pembayaran' },
  { ticker: 'MA', name: 'Mastercard', cls: 'saham-us', ccy: 'USD', color: '#eb001b', lot: 1, unit: 'lembar', note: 'Jaringan pembayaran' },
  { ticker: 'UNH', name: 'UnitedHealth Group', cls: 'saham-us', ccy: 'USD', color: '#0079c8', lot: 1, unit: 'lembar', note: 'Asuransi kesehatan' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', cls: 'saham-us', ccy: 'USD', color: '#d51900', lot: 1, unit: 'lembar', note: 'Farmasi & alat medis' },
  { ticker: 'LLY', name: 'Eli Lilly and Company', cls: 'saham-us', ccy: 'USD', color: '#d52b1e', lot: 1, unit: 'lembar', note: 'Farmasi, obat diabetes & obesitas' },
  { ticker: 'MRK', name: 'Merck & Co.', cls: 'saham-us', ccy: 'USD', color: '#00857c', lot: 1, unit: 'lembar', note: 'Farmasi' },
  { ticker: 'ABBV', name: 'AbbVie Inc.', cls: 'saham-us', ccy: 'USD', color: '#071d49', lot: 1, unit: 'lembar', note: 'Bioteknologi & farmasi' },
  { ticker: 'PG', name: 'Procter & Gamble', cls: 'saham-us', ccy: 'USD', color: '#003da5', lot: 1, unit: 'lembar', note: 'Barang konsumsi' },
  { ticker: 'KO', name: 'The Coca-Cola Company', cls: 'saham-us', ccy: 'USD', color: '#f40009', lot: 1, unit: 'lembar', note: 'Minuman' },
  { ticker: 'PEP', name: 'PepsiCo', cls: 'saham-us', ccy: 'USD', color: '#004b93', lot: 1, unit: 'lembar', note: 'Minuman & snack' },
  { ticker: 'COST', name: 'Costco Wholesale', cls: 'saham-us', ccy: 'USD', color: '#e31837', lot: 1, unit: 'lembar', note: 'Ritel keanggotaan' },
  { ticker: 'WMT', name: 'Walmart Inc.', cls: 'saham-us', ccy: 'USD', color: '#0071ce', lot: 1, unit: 'lembar', note: 'Ritel terbesar dunia' },
  { ticker: 'HD', name: 'The Home Depot', cls: 'saham-us', ccy: 'USD', color: '#f96302', lot: 1, unit: 'lembar', note: 'Ritel perbaikan rumah' },
  { ticker: 'MCD', name: "McDonald's Corporation", cls: 'saham-us', ccy: 'USD', color: '#ffc72c', lot: 1, unit: 'lembar', note: 'Restoran cepat saji' },
  { ticker: 'XOM', name: 'Exxon Mobil', cls: 'saham-us', ccy: 'USD', color: '#ee1c25', lot: 1, unit: 'lembar', note: 'Minyak & gas' },
  { ticker: 'CVX', name: 'Chevron Corporation', cls: 'saham-us', ccy: 'USD', color: '#0b5ed7', lot: 1, unit: 'lembar', note: 'Minyak & gas' },
  { ticker: 'ORCL', name: 'Oracle Corporation', cls: 'saham-us', ccy: 'USD', color: '#c74634', lot: 1, unit: 'lembar', note: 'Database & cloud' },
  { ticker: 'CRM', name: 'Salesforce, Inc.', cls: 'saham-us', ccy: 'USD', color: '#00a1e0', lot: 1, unit: 'lembar', note: 'Software CRM' },
  { ticker: 'ADBE', name: 'Adobe Inc.', cls: 'saham-us', ccy: 'USD', color: '#ed2224', lot: 1, unit: 'lembar', note: 'Software kreatif & dokumen' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', cls: 'saham-us', ccy: 'USD', color: '#ed1c24', lot: 1, unit: 'lembar', note: 'CPU & GPU' },
  { ticker: 'QCOM', name: 'Qualcomm', cls: 'saham-us', ccy: 'USD', color: '#3253dc', lot: 1, unit: 'lembar', note: 'Chip mobile & modem' },
  { ticker: 'INTC', name: 'Intel Corporation', cls: 'saham-us', ccy: 'USD', color: '#0068b5', lot: 1, unit: 'lembar', note: 'Semikonduktor' },
  { ticker: 'CSCO', name: 'Cisco Systems', cls: 'saham-us', ccy: 'USD', color: '#1ba0d7', lot: 1, unit: 'lembar', note: 'Perangkat jaringan' },
  { ticker: 'NFLX', name: 'Netflix, Inc.', cls: 'saham-us', ccy: 'USD', color: '#e50914', lot: 1, unit: 'lembar', note: 'Streaming' },
  { ticker: 'DIS', name: 'The Walt Disney Company', cls: 'saham-us', ccy: 'USD', color: '#113ccf', lot: 1, unit: 'lembar', note: 'Media & taman hiburan' },
  { ticker: 'NKE', name: 'NIKE, Inc.', cls: 'saham-us', ccy: 'USD', color: '#6c6c6c', lot: 1, unit: 'lembar', note: 'Pakaian & sepatu olahraga' },
  { ticker: 'SBUX', name: 'Starbucks Corporation', cls: 'saham-us', ccy: 'USD', color: '#00704a', lot: 1, unit: 'lembar', note: 'Jaringan kedai kopi' },
  { ticker: 'CAT', name: 'Caterpillar Inc.', cls: 'saham-us', ccy: 'USD', color: '#ffcd11', lot: 1, unit: 'lembar', note: 'Alat berat' },
  { ticker: 'BA', name: 'The Boeing Company', cls: 'saham-us', ccy: 'USD', color: '#1d4f91', lot: 1, unit: 'lembar', note: 'Pesawat & kedirgantaraan' },
  { ticker: 'GE', name: 'GE Aerospace', cls: 'saham-us', ccy: 'USD', color: '#3874c8', lot: 1, unit: 'lembar', note: 'Mesin pesawat' },
  { ticker: 'AXP', name: 'American Express', cls: 'saham-us', ccy: 'USD', color: '#006fcf', lot: 1, unit: 'lembar', note: 'Kartu kredit premium' },
  { ticker: 'VZ', name: 'Verizon Communications', cls: 'saham-us', ccy: 'USD', color: '#cd040b', lot: 1, unit: 'lembar', note: 'Telekomunikasi' },
  { ticker: 'UBER', name: 'Uber Technologies', cls: 'saham-us', ccy: 'USD', color: '#333333', lot: 1, unit: 'lembar', note: 'Ride hailing & pengantaran' },
  { ticker: 'PYPL', name: 'PayPal Holdings', cls: 'saham-us', ccy: 'USD', color: '#003087', lot: 1, unit: 'lembar', note: 'Pembayaran digital' },

  /* ── ETF, indeks & reksa dana ───────────────────────────────────────────── */
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', cls: 'etf', ccy: 'USD', color: '#96151d', lot: 1, unit: 'unit', note: 'ETF S&P 500, biaya sangat rendah' },
  { ticker: 'IVV', name: 'iShares Core S&P 500 ETF', cls: 'etf', ccy: 'USD', color: '#000d3b', lot: 1, unit: 'unit', note: 'ETF S&P 500' },
  { ticker: 'CSPX', name: 'iShares Core S&P 500 UCITS', cls: 'etf', ccy: 'USD', color: '#000d3b', lot: 1, unit: 'unit', note: 'Versi Irlandia, pajak dividen lebih ringan untuk investor non-AS' },
  { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', cls: 'etf', ccy: 'USD', color: '#96151d', lot: 1, unit: 'unit', note: 'Seluruh pasar saham AS' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', cls: 'etf', ccy: 'USD', color: '#003d5b', lot: 1, unit: 'unit', note: 'Nasdaq-100, berat di teknologi' },
  { ticker: 'VWRA', name: 'Vanguard FTSE All-World UCITS', cls: 'etf', ccy: 'USD', color: '#96151d', lot: 1, unit: 'unit', note: 'Saham seluruh dunia dalam satu produk' },
  { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', cls: 'etf', ccy: 'USD', color: '#00a0df', lot: 1, unit: 'unit', note: 'Saham dividen berkualitas' },
  { ticker: 'IWDA', name: 'iShares Core MSCI World UCITS', cls: 'etf', ccy: 'USD', color: '#000d3b', lot: 1, unit: 'unit', note: 'Saham negara maju' },
  { ticker: 'EIMI', name: 'iShares Core MSCI EM IMI UCITS', cls: 'etf', ccy: 'USD', color: '#000d3b', lot: 1, unit: 'unit', note: 'Pasar berkembang termasuk Indonesia' },
  { ticker: 'GLD', name: 'SPDR Gold Shares', cls: 'emas', ccy: 'USD', color: '#c9a227', lot: 1, unit: 'unit', note: 'ETF emas fisik' },
  { ticker: 'RLQ45', name: 'Premier ETF LQ-45 (R-LQ45X)', cls: 'etf', ccy: 'IDR', color: '#1b6ca8', lot: 100, unit: 'unit', note: 'ETF 45 saham paling likuid di BEI' },
  { ticker: 'XIIT', name: 'Premier ETF IDX30', cls: 'etf', ccy: 'IDR', color: '#1b6ca8', lot: 100, unit: 'unit', note: 'ETF 30 saham berkapitalisasi besar' },
  { ticker: 'RD-INDEX', name: 'Reksa Dana Indeks (IHSG/LQ45)', cls: 'etf', ccy: 'IDR', color: '#1baf7a', lot: 1, unit: 'unit', note: 'Reksa dana indeks lokal' },
  { ticker: 'RD-SAHAM', name: 'Reksa Dana Saham', cls: 'etf', ccy: 'IDR', color: '#1baf7a', lot: 1, unit: 'unit', note: 'Reksa dana saham aktif' },

  /* ── Kripto lain ────────────────────────────────────────────────────────── */
  { ticker: 'BNB', name: 'BNB', cls: 'kripto', ccy: 'USD', color: '#f0b90b', lot: 1, unit: 'BNB', note: 'Token ekosistem BNB Chain' },
  { ticker: 'XRP', name: 'XRP', cls: 'kripto', ccy: 'USD', color: '#25a768', lot: 1, unit: 'XRP', note: 'Token pembayaran lintas negara' },
  { ticker: 'ADA', name: 'Cardano', cls: 'kripto', ccy: 'USD', color: '#0133ad', lot: 1, unit: 'ADA', note: 'Layer-1 berbasis riset' },
  { ticker: 'DOGE', name: 'Dogecoin', cls: 'kripto', ccy: 'USD', color: '#c2a633', lot: 1, unit: 'DOGE', note: 'Memecoin tertua' },
  { ticker: 'LINK', name: 'Chainlink', cls: 'kripto', ccy: 'USD', color: '#375bd2', lot: 1, unit: 'LINK', note: 'Jaringan oracle' },
  { ticker: 'DOT', name: 'Polkadot', cls: 'kripto', ccy: 'USD', color: '#e6007a', lot: 1, unit: 'DOT', note: 'Jaringan multi-chain' },
  { ticker: 'LTC', name: 'Litecoin', cls: 'kripto', ccy: 'USD', color: '#a6a9aa', lot: 1, unit: 'LTC', note: 'Kripto pembayaran' },
  { ticker: 'POL', name: 'Polygon', cls: 'kripto', ccy: 'USD', color: '#6c00f6', lot: 1, unit: 'POL', note: 'Scaling Ethereum' },
  { ticker: 'OP', name: 'Optimism', cls: 'kripto', ccy: 'USD', color: '#ff0420', lot: 1, unit: 'OP', note: 'Layer-2 Ethereum' },
  { ticker: 'BCH', name: 'Bitcoin Cash', cls: 'kripto', ccy: 'USD', color: '#0ac18e', lot: 1, unit: 'BCH', note: 'Hasil fork Bitcoin' },
  { ticker: 'XLM', name: 'Stellar', cls: 'kripto', ccy: 'USD', color: '#7d00ff', lot: 1, unit: 'XLM', note: 'Jaringan transfer nilai' },
  { ticker: 'XMR', name: 'Monero', cls: 'kripto', ccy: 'USD', color: '#ff6600', lot: 1, unit: 'XMR', note: 'Kripto privasi' },
  { ticker: 'USDC', name: 'USD Coin', cls: 'kas', ccy: 'USD', color: '#2775ca', lot: 1, unit: 'USDC', note: 'Stablecoin dolar teregulasi' },

  /* ── Kas, obligasi & lainnya ────────────────────────────────────────────── */
  { ticker: 'IDR', name: 'Kas Rupiah', cls: 'kas', ccy: 'IDR', color: '#008300', lot: 1, unit: 'rupiah', note: 'Saldo rekening, bukan investasi' },
  { ticker: 'DEPOSITO', name: 'Deposito Berjangka', cls: 'kas', ccy: 'IDR', color: '#0f7a3d', lot: 1, unit: 'rupiah', note: 'Bunga tetap, dijamin LPS' },
  { ticker: 'RDPU', name: 'Reksa Dana Pasar Uang', cls: 'kas', ccy: 'IDR', color: '#1baf7a', lot: 1, unit: 'unit', note: 'Alternatif kas, cair dalam 1-2 hari' },
  { ticker: 'SBN', name: 'SBN Ritel (ORI/SR/ST/SBR)', cls: 'obligasi', ccy: 'IDR', color: '#4a3aa7', lot: 1, unit: 'rupiah', note: 'Surat utang negara ritel' },
  { ticker: 'FR', name: 'Obligasi Pemerintah (seri FR)', cls: 'obligasi', ccy: 'IDR', color: '#5b4bd6', lot: 1, unit: 'rupiah', note: 'Obligasi negara di pasar sekunder' },
  { ticker: 'RDPT', name: 'Reksa Dana Pendapatan Tetap', cls: 'obligasi', ccy: 'IDR', color: '#6f5fe8', lot: 1, unit: 'unit', note: 'Portofolio obligasi dikelola manajer investasi' },
  { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', cls: 'obligasi', ccy: 'USD', color: '#96151d', lot: 1, unit: 'unit', note: 'Obligasi AS berkualitas' },
];

/* Ready-made target allocations. `mix` maps ticker → target weight (%). */
window.PRESET_PORTFOLIOS = [
  {
    id: 'seimbang',
    name: 'Seimbang Global',
    desc: 'Inti indeks global, pelengkap emas dan kripto, kas sebagai bantalan.',
    mix: { SPX: 40, RLQ45: 15, GOLD: 15, BTC: 10, ETH: 5, SBN: 10, IDR: 5 },
  },
  {
    id: 'agresif',
    name: 'Agresif Teknologi',
    desc: 'Berat di saham teknologi AS dan kripto. Naik-turunnya besar.',
    mix: { SPX: 30, NVDA: 12, GOOGL: 8, BTC: 20, ETH: 10, SOL: 5, HYPE: 5, USDT: 10 },
  },
  {
    id: 'indo',
    name: 'Bluechip Indonesia',
    desc: 'Bank, telko, dan konsumsi papan atas BEI plus SBN.',
    mix: { BBCA: 20, BBRI: 15, BMRI: 12, TLKM: 12, ASII: 8, ICBP: 8, KLBF: 5, SBN: 15, IDR: 5 },
  },
  {
    id: 'konservatif',
    name: 'Konservatif',
    desc: 'Mayoritas pendapatan tetap dan emas, sedikit saham indeks.',
    mix: { SBN: 35, RDPU: 15, GOLD: 20, SPX: 15, RLQ45: 10, BTC: 5 },
  },
];

window.getAsset = function (ticker) {
  return window.ASSET_LIBRARY.find((a) => a.ticker === ticker) || null;
};

window.getClass = function (id) {
  return window.ASSET_CLASSES.find((c) => c.id === id) || window.ASSET_CLASSES[0];
};
