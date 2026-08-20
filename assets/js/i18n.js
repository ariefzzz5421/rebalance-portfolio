/**
 * Interface strings, Indonesian and English.
 *
 * Markup carries `data-i18n` (text), `data-i18n-ph` (placeholder) and
 * `data-i18n-aria` (accessible name); `applyLang()` walks those. Anything the
 * app builds at runtime asks `t()` directly.
 *
 * `{n}`-style placeholders are filled by passing an object to `t()`.
 */
window.I18N = (function () {
  'use strict';

  const STRINGS = {
    id: {
      'app.title': 'Porsi',
      'app.tagline': 'bagi uangmu',

      'hero.label': 'Uang yang kamu punya',
      'hero.note': 'Ketik nominalnya — tiap porsi di bawah langsung terhitung.',
      'hero.ccyAria': 'Ganti mata uang',
      'hero.totalAria': 'Jumlah uang yang kamu punya',

      'parts.title': 'Porsi',
      'parts.empty': 'Belum ada porsi. Tambahkan satu untuk mulai membagi.',
      'parts.namePh': 'Nama porsi',
      'parts.nameAria': 'Nama atau ticker porsi',
      'parts.pctAria': 'Persen untuk {name}',
      'parts.pickAria': 'Pilih aset untuk {name}',
      'parts.removeAria': 'Hapus {name}',
      'parts.thisOne': 'porsi ini',

      'btn.add': 'Tambah porsi',
      'btn.even': 'Bagi rata',
      'btn.fit': 'Paskan 100%',

      'badge.exact': 'Pas 100%.',
      'badge.over': 'Kelebihan {p} dari 100%.',
      'badge.under': 'Masih ada {p} yang belum dibagi.',

      'pie.rest': 'Belum dibagi',
      'pie.restSub': 'sisa yang belum dibagi',
      'pie.none': 'Belum ada porsi',
      'pie.count': '{n} porsi',
      'pie.left': ' · {p} belum dibagi',
      'pie.unnamed': 'Tanpa nama',

      'export.title': 'Simpan setup ini',
      'export.note': 'Unduh sebagai gambar atau PDF — lengkap dengan pie dan rinciannya.',
      'export.saving': 'Menyimpan…',
      'export.cardTotal': 'Uang yang kamu punya',
      'export.footer': 'Dibuat dengan Porsi — kalkulator alokasi, bukan nasihat investasi.',
      'export.failed': 'Gagal menyimpan: {err}',

      'settings.title': 'Pengaturan',
      'settings.currency': 'Mata uang',
      'settings.currencyNote': 'Mengganti mata uang hanya mengubah simbol dan format angkanya — nominal yang sudah kamu ketik tidak dikonversi.',
      'settings.language': 'Bahasa',
      'settings.languageNote': 'Mengubah bahasa antarmuka. Nama aset dan tickernya tetap seperti aslinya.',
      'settings.display': 'Tampilan',
      'settings.themeDark': 'Tema gelap',
      'settings.themeLight': 'Tema terang',
      'settings.data': 'Data',
      'settings.reset': 'Hapus semua & mulai lagi',
      'settings.dataNote': 'Semua isian tersimpan di browser ini saja.',
      'settings.resetConfirm': 'Hapus semua isian dan mulai dari awal?',
      'settings.aria': 'Pengaturan',
      'settings.close': 'Tutup',

      'picker.title': 'Pilih aset',
      'picker.searchPh': 'Cari ticker atau nama — BBCA, NVDA, BTC…',
      'picker.custom': 'Pakai nama sendiri',
      'picker.all': 'Semua',
      'picker.taken': 'sudah dipakai',
      'picker.none': 'Tidak ketemu. Coba kata kunci lain, atau pakai nama sendiri.',

      'cls.idx': 'IDX Stock',
      'cls.us': 'US Stock',
      'cls.etf': 'ETF & Indeks',
      'cls.crypto': 'Kripto',
      'cls.gold': 'Emas',
      'cls.bond': 'Obligasi & SBN',
      'cls.cash': 'Kas & Setara',

      'clsShort.idx': 'IDX',
      'clsShort.us': 'US',
      'clsShort.etf': 'ETF',
      'clsShort.crypto': 'Kripto',
      'clsShort.gold': 'Emas',
      'clsShort.bond': 'Obligasi',
      'clsShort.cash': 'Kas',

      'ccy.IDR.name': 'Rupiah',
      'ccy.IDR.country': 'Indonesia',
      'ccy.USD.name': 'Dolar Amerika',
      'ccy.USD.country': 'Amerika Serikat',
      'ccy.EUR.name': 'Euro',
      'ccy.EUR.country': 'Zona Euro',
      'ccy.SGD.name': 'Dolar Singapura',
      'ccy.SGD.country': 'Singapura',
      'ccy.CHF.name': 'Franc Swiss',
      'ccy.CHF.country': 'Swiss',
      'ccy.JPY.name': 'Yen Jepang',
      'ccy.JPY.country': 'Jepang',

      'asset.GOLD': 'Emas Fisik / Logam Mulia',
      'asset.CASH': 'Kas / Tabungan',
      'asset.DEPO': 'Deposito Berjangka',
      'asset.RDPU': 'Reksa Dana Pasar Uang',
      'asset.RDPT': 'Reksa Dana Pendapatan Tetap',
      'asset.RDINDEX': 'Reksa Dana Indeks',
      'asset.FR': 'Obligasi Pemerintah seri FR',
    },

    en: {
      'app.title': 'Porsi',
      'app.tagline': 'split your money',

      'hero.label': 'The money you have',
      'hero.note': 'Type the amount — every portion below works itself out.',
      'hero.ccyAria': 'Change currency',
      'hero.totalAria': 'The amount of money you have',

      'parts.title': 'Portions',
      'parts.empty': 'No portions yet. Add one to start splitting.',
      'parts.namePh': 'Portion name',
      'parts.nameAria': 'Portion name or ticker',
      'parts.pctAria': 'Percentage for {name}',
      'parts.pickAria': 'Pick an asset for {name}',
      'parts.removeAria': 'Remove {name}',
      'parts.thisOne': 'this portion',

      'btn.add': 'Add portion',
      'btn.even': 'Split evenly',
      'btn.fit': 'Fit to 100%',

      'badge.exact': 'Exactly 100%.',
      'badge.over': '{p} over 100%.',
      'badge.under': '{p} still unassigned.',

      'pie.rest': 'Unassigned',
      'pie.restSub': 'the share left over',
      'pie.none': 'No portions yet',
      'pie.count': '{n} portions',
      'pie.left': ' · {p} unassigned',
      'pie.unnamed': 'Unnamed',

      'export.title': 'Save this setup',
      'export.note': 'Download it as an image or a PDF — pie and breakdown included.',
      'export.saving': 'Saving…',
      'export.cardTotal': 'The money you have',
      'export.footer': 'Made with Porsi — an allocation calculator, not investment advice.',
      'export.failed': 'Could not save: {err}',

      'settings.title': 'Settings',
      'settings.currency': 'Currency',
      'settings.currencyNote': 'Changing currency only changes the symbol and number format — the amount you typed is not converted.',
      'settings.language': 'Language',
      'settings.languageNote': 'Changes the interface language. Asset names and tickers stay as they are.',
      'settings.display': 'Appearance',
      'settings.themeDark': 'Dark theme',
      'settings.themeLight': 'Light theme',
      'settings.data': 'Data',
      'settings.reset': 'Clear everything and start over',
      'settings.dataNote': 'Everything you type stays in this browser only.',
      'settings.resetConfirm': 'Clear everything and start from scratch?',
      'settings.aria': 'Settings',
      'settings.close': 'Close',

      'picker.title': 'Pick an asset',
      'picker.searchPh': 'Search ticker or name — BBCA, NVDA, BTC…',
      'picker.custom': 'Use my own name',
      'picker.all': 'All',
      'picker.taken': 'already used',
      'picker.none': 'Nothing found. Try another word, or use your own name.',

      'cls.idx': 'IDX Stock',
      'cls.us': 'US Stock',
      'cls.etf': 'ETF & Index',
      'cls.crypto': 'Crypto',
      'cls.gold': 'Gold',
      'cls.bond': 'Bonds & Govt Notes',
      'cls.cash': 'Cash & Equivalents',

      'clsShort.idx': 'IDX',
      'clsShort.us': 'US',
      'clsShort.etf': 'ETF',
      'clsShort.crypto': 'Crypto',
      'clsShort.gold': 'Gold',
      'clsShort.bond': 'Bonds',
      'clsShort.cash': 'Cash',

      'ccy.IDR.name': 'Indonesian Rupiah',
      'ccy.IDR.country': 'Indonesia',
      'ccy.USD.name': 'US Dollar',
      'ccy.USD.country': 'United States',
      'ccy.EUR.name': 'Euro',
      'ccy.EUR.country': 'Eurozone',
      'ccy.SGD.name': 'Singapore Dollar',
      'ccy.SGD.country': 'Singapore',
      'ccy.CHF.name': 'Swiss Franc',
      'ccy.CHF.country': 'Switzerland',
      'ccy.JPY.name': 'Japanese Yen',
      'ccy.JPY.country': 'Japan',

      /* Only instruments whose name is a description get translated; a proper
         name like "SBN Ritel (ORI/SR/ST/SBR)" stays as it is. */
      'asset.GOLD': 'Physical Gold / Bullion',
      'asset.CASH': 'Cash / Savings',
      'asset.DEPO': 'Term Deposit',
      'asset.RDPU': 'Money Market Fund',
      'asset.RDPT': 'Fixed Income Fund',
      'asset.RDINDEX': 'Index Fund',
      'asset.FR': 'Government Bonds, FR series',
    },
  };

  const LANGUAGES = [
    { code: 'id', label: 'Bahasa Indonesia', native: 'Indonesia' },
    { code: 'en', label: 'English', native: 'English' },
  ];

  let lang = 'id';

  /** The browser's language if we speak it, Indonesian otherwise. */
  function detect() {
    const tags = navigator.languages || [navigator.language || ''];
    for (const tag of tags) {
      const base = String(tag).toLowerCase().split('-')[0];
      if (STRINGS[base]) return base;
    }
    return 'id';
  }

  function setLang(next) {
    lang = STRINGS[next] ? next : 'id';
    document.documentElement.lang = lang;
    return lang;
  }

  /**
   * A string only if we actually have one, so callers can fall back to their
   * own default rather than printing a raw key.
   */
  function maybe(key) {
    const table = STRINGS[lang] || STRINGS.id;
    return table[key] !== undefined ? table[key] : STRINGS.id[key];
  }

  /** Look up a string, filling any {placeholders}. Falls back to Indonesian. */
  function t(key, vars) {
    const table = STRINGS[lang] || STRINGS.id;
    let text = table[key];
    if (text === undefined) text = STRINGS.id[key];
    if (text === undefined) return key;
    if (!vars) return text;
    return text.replace(/\{(\w+)\}/g, (whole, name) =>
      (vars[name] === undefined ? whole : vars[name]));
  }

  /** Push the current language into every tagged element. */
  function applyLang(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.dataset.i18n);
    });
    scope.querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.placeholder = t(el.dataset.i18nPh);
    });
    scope.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
  }

  return { t, maybe, setLang, applyLang, detect, LANGUAGES, get lang() { return lang; } };
})();
