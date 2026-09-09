(function(){
  'use strict';
  const SYMBOLS={
    BBCA:'BBCA.JK',BBRI:'BBRI.JK',BMRI:'BMRI.JK',TLKM:'TLKM.JK',ASII:'ASII.JK',UNVR:'UNVR.JK',ICBP:'ICBP.JK',KLBF:'KLBF.JK',ANTM:'ANTM.JK',GOTO:'GOTO.JK',
    AAPL:'AAPL',MSFT:'MSFT',NVDA:'NVDA',GOOGL:'GOOGL',AMZN:'AMZN',META:'META',TSLA:'TSLA',AVGO:'AVGO',JPM:'JPM',V:'V',
    SPX:'^GSPC',VOO:'VOO',QQQ:'QQQ',VTI:'VTI',VWRA:'VWRA.L',RLQ45:'RLQ45.JK',
    BTC:'BTC-USD',ETH:'ETH-USD',SOL:'SOL-USD',BNB:'BNB-USD',XRP:'XRP-USD',DOGE:'DOGE-USD',HYPE:'HYPE32196-USD',USDT:'USDT-USD',
    GOLD:'GC=F',XAUT:'XAUT-USD',GLD:'GLD'
  };
  const GOOGLE={
    BBCA:'BBCA:IDX',BBRI:'BBRI:IDX',BMRI:'BMRI:IDX',TLKM:'TLKM:IDX',ASII:'ASII:IDX',UNVR:'UNVR:IDX',ICBP:'ICBP:IDX',KLBF:'KLBF:IDX',ANTM:'ANTM:IDX',GOTO:'GOTO:IDX',
    AAPL:'AAPL:NASDAQ',MSFT:'MSFT:NASDAQ',NVDA:'NVDA:NASDAQ',GOOGL:'GOOGL:NASDAQ',AMZN:'AMZN:NASDAQ',META:'META:NASDAQ',TSLA:'TSLA:NASDAQ',AVGO:'AVGO:NASDAQ',JPM:'JPM:NYSE',V:'V:NYSE',
    SPX:'.INX:INDEXSP',VOO:'VOO:NYSEARCA',QQQ:'QQQ:NASDAQ',VTI:'VTI:NYSEARCA',VWRA:'VWRA:LON',
    BTC:'BTC-USD',ETH:'ETH-USD',SOL:'SOL-USD',BNB:'BNB-USD',XRP:'XRP-USD',DOGE:'DOGE-USD',USDT:'USDT-USD',GLD:'GLD:NYSEARCA'
  };
  const SPECIAL={
    BTC:{summary:'Bitcoin adalah aset moneter digital dengan suplai maksimum 21 juta koin. Jaringannya memindahkan dan menyelesaikan nilai tanpa bank sentral, sementara harga ditentukan pasar global.',background:'Diluncurkan pada 2009 oleh Satoshi Nakamoto. Narasinya berevolusi dari peer-to-peer electronic cash menjadi digital scarcity, collateral global, dan aset makro yang semakin terhubung dengan pasar modal tradisional.'},
    HYPE:{summary:'HYPE adalah token inti ekosistem Hyperliquid, jaringan berperforma tinggi yang berfokus pada perdagangan on-chain, perpetual futures, dan aplikasi finansial berbasis order book.',background:'Hyperliquid tumbuh dari venue trading menjadi ekosistem L1. Nilai HYPE sangat terkait dengan penggunaan jaringan, ekonomi token, likuiditas, aktivitas trader, dan kemampuan ekosistem mempertahankan network effects.'},
    XAUT:{summary:'Tether Gold memberi eksposur tokenized gold: token merepresentasikan kepemilikan atas emas fisik yang dikelola penerbit. Tujuannya menggabungkan karakter emas dengan settlement aset digital.',background:'XAUT membawa aset safe-haven tradisional ke infrastruktur kripto. Thesis-nya bertumpu pada backing emas, kualitas custody dan redemption, serta utilitas token untuk memindahkan eksposur emas secara digital.'},
    USDT:{summary:'USDT adalah stablecoin yang dirancang mengikuti nilai dolar AS. Fungsi utamanya adalah unit akun, collateral, dan likuiditas lintas exchange serta blockchain, bukan mencari capital gain dari kenaikan harga.',background:'Tether menjadi salah satu jembatan terbesar antara sistem dolar dan pasar aset digital. Risiko utamanya lebih terkait kualitas cadangan, redemption, regulasi, dan counterparty dibanding volatilitas harga seperti aset kripto biasa.'},
    SPX:{summary:'S&P 500 adalah indeks saham perusahaan besar Amerika Serikat dan benchmark utama untuk pasar ekuitas AS. Bobotnya berbasis kapitalisasi pasar sehingga perusahaan terbesar memiliki pengaruh paling besar.',background:'Indeks ini menjadi salah satu cara paling umum untuk mengukur kinerja korporasi besar AS. Return jangka panjang datang dari pertumbuhan laba, dividen, perubahan valuasi, dan komposisi perusahaan yang terus diperbarui.'},
    GOLD:{summary:'Emas adalah komoditas langka sekaligus aset moneter yang digunakan sebagai penyimpan nilai. Harga modernnya dipengaruhi real yield, dolar AS, permintaan bank sentral, inflasi, dan risk sentiment.',background:'Emas telah digunakan sebagai simbol kekayaan dan cadangan moneter selama ribuan tahun. Dalam portofolio modern, perannya sering sebagai diversifier ketika kepercayaan terhadap aset finansial atau mata uang melemah.'},
    BBCA:{summary:'BBCA adalah saham Bank Central Asia, salah satu bank swasta terbesar di Indonesia. Kekuatan utamanya berasal dari franchise transaksi, dana murah, kualitas aset, dan disiplin kredit.',background:'BCA berkembang menjadi salah satu bisnis berkualitas paling konsisten di BEI. Investor biasanya memantau pertumbuhan kredit, CASA, NIM, cost of credit, kualitas aset, serta valuasi premium yang melekat pada kualitas franchise.'},
    NVDA:{summary:'NVIDIA adalah perusahaan semikonduktor dan accelerated computing yang menjadi pemain utama GPU, data center, dan infrastruktur AI.',background:'Berawal dari grafis gaming, CUDA mengubah GPU NVIDIA menjadi platform komputasi umum. Gelombang AI memperkuat moat dari kombinasi hardware, software, networking, dan developer ecosystem.'}
  };
  const CLASS_COPY={
    idx:['saham Indonesia yang memberi kepemilikan pada perusahaan publik di Bursa Efek Indonesia.','Nilainya terutama digerakkan pertumbuhan laba, kualitas neraca, valuasi, kebijakan domestik, dan siklus ekonomi Indonesia.'],
    us:['saham Amerika yang merepresentasikan kepemilikan pada perusahaan publik di pasar AS.','Return utamanya datang dari pertumbuhan bisnis, arus kas, dividen atau buyback, serta perubahan valuasi pasar.'],
    etf:['instrumen indeks atau ETF yang memberi eksposur terdiversifikasi ke sekumpulan aset melalui satu posisi.','Kinerjanya mengikuti metodologi indeks atau keranjang yang mendasarinya, dikurangi biaya dan tracking difference bila berlaku.'],
    crypto:['aset kripto yang nilainya dipengaruhi utilitas jaringan, token economics, likuiditas, adopsi, serta ekspektasi pasar terhadap protokol.','Risiko dan upside bisa ekstrem karena teknologi, supply token, kompetisi, regulasi, dan network effects berubah cepat.'],
    gold:['instrumen yang memberi eksposur terhadap emas atau harga emas.','Return terutama mengikuti harga emas, dengan tambahan risiko struktur produk, custody, tracking, atau penerbit tergantung instrumennya.'],
    bond:['instrumen pendapatan tetap yang fokus pada kupon, kualitas kredit, durasi, dan perubahan suku bunga.','Return cenderung lebih terukur dibanding saham, tetapi tetap sensitif terhadap inflasi, yield, likuiditas, dan risiko kredit.'],
    cash:['kas atau instrumen setara kas yang mengutamakan likuiditas dan stabilitas nominal.','Fungsi utamanya adalah optionality, kebutuhan jangka pendek, dan dry powder; return biasanya mengikuti suku bunga kas setelah biaya dan pajak.']
  };
  const googleUrl=ticker=>GOOGLE[ticker]?`https://www.google.com/finance/quote/${encodeURIComponent(GOOGLE[ticker])}`:'https://www.google.com/finance/';
  const yahooUrl=symbol=>symbol?`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`:null;
  window.MARKET_SYMBOLS=SYMBOLS;
  window.assetIntel=function(asset){
    const special=SPECIAL[asset.ticker],base=CLASS_COPY[asset.cls]||['aset investasi.','Setiap aset memiliki sumber return dan risiko yang berbeda.'];
    const summary=special?special.summary:`${asset.name} (${asset.ticker}) adalah ${base[0]}`;
    const background=special?special.background:base[1];
    const marketSymbol=SYMBOLS[asset.ticker]||null;
    return {summary,background,lore:background,marketSymbol,googleFinanceUrl:googleUrl(asset.ticker),yahooFinanceUrl:yahooUrl(marketSymbol)};
  };
})();