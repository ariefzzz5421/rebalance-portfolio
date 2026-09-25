(function () {
  'use strict';
  const labels = {
    id: { '1H': '1 Jam', '1D': '1 Hari', '1W': '1 Minggu', '1M': '1 Bulan', '1Y': '1 Tahun', '5Y': '5 Tahun', '10Y': '10 Tahun', MAX: 'Maks. 10 Tahun' },
    en: { '1H': '1 Hour', '1D': '1 Day', '1W': '1 Week', '1M': '1 Month', '1Y': '1 Year', '5Y': '5 Years', '10Y': '10 Years', MAX: 'Up to 10 Years' },
    ja: { '1H': '1時間', '1D': '1日', '1W': '1週間', '1M': '1か月', '1Y': '1年', '5Y': '5年', '10Y': '10年', MAX: '最大10年' },
    zh: { '1H': '1小时', '1D': '1天', '1W': '1周', '1M': '1个月', '1Y': '1年', '5Y': '5年', '10Y': '10年', MAX: '最多10年' },
  };
  window.PORSI_TIMEFRAMES = {
    apply(select) {
      let language = 'id';
      try { language = JSON.parse(localStorage.getItem('porsi.preferences.v1') || '{}').language || 'id'; } catch {}
      const copy = labels[language] || labels.id;
      for (const option of select.options) if (copy[option.value]) option.textContent = `${option.value} (${copy[option.value]})`;
    },
  };
})();
