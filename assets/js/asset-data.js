(function(){
  'use strict';
  const SYMBOLS={
    BBCA:'BBCA.JK',BBRI:'BBRI.JK',BMRI:'BMRI.JK',TLKM:'TLKM.JK',ASII:'ASII.JK',UNVR:'UNVR.JK',ICBP:'ICBP.JK',KLBF:'KLBF.JK',ANTM:'ANTM.JK',GOTO:'GOTO.JK',
    AAPL:'AAPL',MSFT:'MSFT',NVDA:'NVDA',GOOGL:'GOOGL',AMZN:'AMZN',META:'META',TSLA:'TSLA',AVGO:'AVGO',JPM:'JPM',V:'V',
    SPX:'^GSPC',VOO:'VOO',QQQ:'QQQ',VTI:'VTI',VWRA:'VWRA.L',RLQ45:'RLQ45.JK',
    BTC:'BTC-USD',ETH:'ETH-USD',SOL:'SOL-USD',BNB:'BNB-USD',XRP:'XRP-USD',DOGE:'DOGE-USD',HYPE:'HYPE32196-USD',USDT:'USDT-USD',
    GOLD:'GC=F',XAUT:'XAUT-USD',GLD:'GLD'
  };
  const SPECIAL={
    BTC:{summary:'Bitcoin adalah aset digital moneter dengan suplai maksimum 21 juta koin dan penyelesaian transaksi tanpa bank sentral.',lore:'Diluncurkan pada 2009 oleh Satoshi Nakamoto setelah krisis finansial global. Narasi utamanya berkembang dari eksperimen peer-to-peer cash menjadi digital scarcity dan aset makro yang diperdagangkan secara global.'},
    HYPE:{summary:'HYPE adalah token ekosistem Hyperliquid, jaringan dan venue perdagangan on-chain yang berfokus pada perpetual futures serta aplikasi finansial berperforma tinggi.',lore:'Hyperliquid tumbuh dari produk trading menjadi ekosistem L1 dengan fokus kuat pada pengalaman order-book on-chain. HYPE menjadi aset inti untuk menyelaraskan penggunaan jaringan, governance, dan ekonomi ekosistem.'},
    XAUT:{summary:'Tether Gold adalah token yang merepresentasikan kepemilikan emas fisik yang disimpan oleh penerbit, sehingga memberi eksposur emas dalam bentuk token.',lore:'XAUT membawa aset safe-haven tradisional ke jalur settlement kripto. Thesis utamanya sederhana: mempertahankan karakter emas sambil memberi portabilitas dan composability aset digital.'},
    USDT:{summary:'USDT adalah stablecoin yang dirancang mengikuti nilai dolar AS dan menjadi salah satu unit likuiditas utama di pasar kripto.',lore:'Tether menjadi salah satu jembatan paling penting antara dolar dan pasar aset digital. Perannya bukan mencari capital gain dari harga, melainkan menyediakan unit akun, collateral, dan likuiditas lintas bursa serta blockchain.'},
    SPX:{summary:'S&P 500 adalah indeks sekitar 500 perusahaan besar AS dan sering dipakai sebagai benchmark utama pasar saham Amerika.',lore:'Indeks ini berkembang menjadi proksi paling populer untuk kepemilikan korporasi besar AS. Bobot berbasis kapitalisasi membuat pemenang terbesar otomatis mendapat pengaruh lebih besar seiring pertumbuhan nilainya.'},
    GOLD:{summary:'Emas adalah aset moneter dan komoditas langka yang telah digunakan sebagai penyimpan nilai selama ribuan tahun.',lore:'Jauh sebelum pasar saham dan aset digital, emas sudah berfungsi sebagai simbol kekayaan, cadangan negara, dan perlindungan terhadap ketidakpastian moneter. Thesis modernnya tetap bertumpu pada kelangkaan, durability, dan penerimaan global.'},
    BBCA:{summary:'BBCA adalah saham Bank Central Asia, salah satu bank swasta terbesar di Indonesia dengan franchise transaksi dan dana murah yang kuat.',lore:'BCA berkembang dari bank domestik menjadi salah satu bisnis berkualitas paling konsisten di Bursa Efek Indonesia. Investor biasanya menyorot kualitas aset, CASA, disiplin kredit, dan ekosistem transaksi sebagai sumber moat.'},
    NVDA:{summary:'NVIDIA adalah perusahaan semikonduktor dan komputasi yang menjadi pemain utama GPU, accelerated computing, dan infrastruktur AI.',lore:'Berawal dari grafis gaming, CUDA mengubah GPU NVIDIA menjadi platform komputasi umum. Ledakan AI kemudian membuat kombinasi hardware, software, dan developer ecosystem menjadi salah satu posisi strategis paling kuat di industri teknologi.'}
  };
  const CLASS_COPY={
    idx:['Saham Indonesia yang memberi eksposur ke bisnis publik di Bursa Efek Indonesia.','Lore aset ini mengikuti evolusi perusahaan dan sektor tempatnya beroperasi di ekonomi Indonesia. Nilainya terutama digerakkan oleh pertumbuhan laba, kualitas neraca, valuasi, dan siklus domestik.'],
    us:['Saham Amerika yang merepresentasikan kepemilikan pada perusahaan publik di pasar AS.','Lore aset ini dibentuk oleh kemampuan bisnis mengubah inovasi, distribusi, dan arus kas menjadi nilai pemegang saham dalam pasar modal paling dalam di dunia.'],
    etf:['Instrumen indeks atau ETF yang memberi eksposur terdiversifikasi ke sekumpulan aset melalui satu posisi.','Lore utamanya adalah simplifikasi diversifikasi: daripada memilih setiap perusahaan satu per satu, investor membeli aturan indeks atau keranjang yang sudah ditentukan.'],
    crypto:['Aset kripto yang nilainya berasal dari jaringan, utilitas token, likuiditas, dan ekspektasi pasar terhadap adopsi protokol.','Lore aset kripto lahir dari eksperimen koordinasi ekonomi berbasis internet. Risiko dan upside-nya biasanya lebih ekstrem karena network effects, token supply, dan teknologi berkembang sangat cepat.'],
    gold:['Aset yang memberi eksposur terhadap emas atau instrumen yang mengikuti harga emas.','Lore emas berakar pada perannya sebagai aset langka dan penyimpan nilai lintas generasi, lalu berevolusi ke bentuk ETF dan token agar lebih mudah diperdagangkan.'],
    bond:['Instrumen pendapatan tetap yang fokus pada arus kupon, kualitas kredit, dan sensitivitas terhadap suku bunga.','Lore obligasi adalah kontrak sederhana: investor meminjamkan modal dan menerima pembayaran sesuai syarat. Return biasanya lebih terukur dibanding saham, tetapi tetap sensitif terhadap inflasi, suku bunga, dan kredit.'],
    cash:['Kas atau instrumen setara kas yang mengutamakan likuiditas dan stabilitas nominal.','Lore kas bukan tentang mengejar upside terbesar. Fungsinya adalah optionality: menjaga daya beli jangka pendek, memenuhi kebutuhan, dan memberi dry powder ketika peluang baru muncul.']
  };
  window.MARKET_SYMBOLS=SYMBOLS;
  window.assetIntel=function(asset){
    const special=SPECIAL[asset.ticker];
    const base=CLASS_COPY[asset.cls]||['Aset investasi.','Setiap aset memiliki sejarah, struktur risiko, dan sumber return yang berbeda.'];
    return {summary:special?special.summary:`${asset.name} (${asset.ticker}) adalah ${base[0].charAt(0).toLowerCase()+base[0].slice(1)}`,lore:special?special.lore:base[1],marketSymbol:SYMBOLS[asset.ticker]||null};
  };
})();