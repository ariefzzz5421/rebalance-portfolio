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
    dividendIndo: {
      title: 'Strategy 4 · Dividen Play', short: 'Dividen Play',
      subtitle: 'Saham Indonesia dengan riwayat dividen lintas sektor', color: '#efb44f', icon: 'coins',
      parts: [['BBCA', 'Bank Central Asia', 30], ['BMRI', 'Bank Mandiri', 25], ['TLKM', 'Telkom Indonesia', 25], ['UNTR', 'United Tractors', 20]],
      research: [
        ['Riwayat dividen BCA', 'https://www.bca.co.id/en/tentang-bca/Hubungan-Investor/Informasi-Saham/Riwayat-Deviden'],
        ['Dividen Bank Mandiri', 'https://www.bankmandiri.co.id/en/news-detail?backUrl=%2Fnews&primaryKey=435132543'],
        ['Kebijakan dividen Telkom', 'https://www.telkom.co.id/sites/hubungan-investor/id_ID/page/kebijakan-dividen-224'],
        ['Laporan United Tractors', 'https://www.unitedtractors.com/wp-content/uploads/2026/04/FS-UNTR-0326.pdf'],
      ],
      note: 'Riwayat dividen tidak menjamin pembayaran berikutnya. Grafik memakai adjusted close bila tersedia, bukan simulasi arus kas dividen yang dibayarkan tunai.',
    },
    pensionIndo: {
      title: 'Strategy 5 · Pension Fund Indo', short: 'Pension Indo',
      subtitle: 'ETF obligasi pemerintah sebagai inti, saham domestik sebagai pelengkap', color: '#8fafff', icon: 'piggy-bank',
      parts: [['XISB', 'Premier ETF Indonesia Sovereign Bonds', 70], ['BBCA', 'Bank Central Asia', 20], ['KLBF', 'Kalbe Farma', 10]],
      research: [
        ['Panduan risiko investasi OJK', 'https://www.ojk.go.id/Files/box/BukuSakuOJK.pdf'],
        ['Daftar ETF Bursa Efek Indonesia', 'https://idx.id/en/market-data/exchanged-traded-fund-etf-data/exchange-traded-fund-etf-list/'],
        ['Portofolio XISB', 'https://emitten-announcement.stockbit.com/attachments/f-31756148-0_XISB_Laporan_Harian_atas_Nilai_Aktiva_Bersih_dan_Komposisi_Portofolio_31756148_lamp1.pdf'],
      ],
      note: 'XISB adalah ETF obligasi pemerintah Indonesia, bukan SBN ritel yang dipegang hingga jatuh tempo. Harga bursa dan likuiditasnya dapat berfluktuasi; transaksi yang jarang dapat membuat chart pendek tidak tersedia.',
    },
  };
});
