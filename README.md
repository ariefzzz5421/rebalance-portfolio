# Rebalance — perencana portofolio

Situs statis untuk merencanakan *rebalancing* portofolio: pilih aset (saham
Indonesia, saham Amerika, ETF indeks, emas, obligasi, kripto), tentukan target
alokasi, masukkan dana baru yang mau diinvestasikan, lalu lihat berapa yang
harus dibeli atau dijual — plus pelacakan nilai portofolio dari waktu ke waktu.

Tanpa framework dan tanpa build step. Buka `index.html` langsung juga jalan;
jalankan servernya kalau mau harga pasar terisi sendiri.

```bash
node server/index.js      # lalu buka http://localhost:8787
```

## Isi

Tiga halaman, dinavigasi lewat rel ikon di kiri (`#/portofolio`, `#/stock`,
`#/crypto`) — namanya muncul saat kursor menyentuh ikonnya:

**Portofolio** — halaman utama.

- **Bagi dana baru**: masukkan nominal, lalu wajib pilih aset penerimanya.
  Begitu dipilih, dananya langsung dibagi rata dan hasilnya tergambar di
  diagram. Isi 1 juta lalu pilih BTC, USDT, XAUT dan S&P 500 → masing-masing
  250 ribu. Nominal per aset bisa diubah manual kalau tidak mau rata.
- Dua diagram donat berdampingan: alokasi **sekarang** dan **setelah rebalance**,
  memakai urutan segmen dan warna yang sama supaya bisa dibandingkan langsung.
- Bisa dilihat *per aset* atau *per kelas aset*.
- Grafik simpangan (drift) dua arah: mana yang kelebihan bobot, mana yang kurang.
- Tabel aset yang bisa diedit: unit, harga per unit, nilai sekarang, target %.
- Tabel rencana eksekusi: aksi Beli/Jual/Tahan, nominal rupiah, perkiraan lot
  atau unit, nilai dan bobot setelahnya.
- Pelacakan: simpan snapshot, lihat grafik pertumbuhan, ekspor/impor JSON, dan
  **unduh laporan PDF** berisi ringkasan, diagram donat vektor, dan kedua tabel.

**Stock** — katalog bluechip BEI, bluechip Amerika, ETF indeks, emas, obligasi
dan kas. Ada pencarian dan filter per kelas.

**Crypto** — koin utama, stablecoin, dan emas berbentuk token.

Sepuluh aset ditandai **Aset utama**: S&P 500, BTC, USDT, XAUT, GOLD, HYPE, SOL,
ETH, NVDA, dan GOOGL.

## Tiga metode rebalance

| Metode | Cara kerja |
|---|---|
| **Bagi ke aset pilihan** (default) | Kamu yang menentukan aset penerimanya; dana dibagi rata ke situ (atau sesuai nominal yang kamu ketik per aset). |
| **Tanpa jual** | Hanya dana baru yang dibagi, diarahkan otomatis ke aset yang bobotnya paling jauh di bawah target. Tidak ada penjualan, jadi tidak ada pajak/fee jual dan tidak realisasi rugi. |
| **Rebalance penuh** | Menghitung selisih ke target persis: yang kelebihan dijual, hasilnya plus dana baru dipakai membeli yang kurang. |

**Toleransi drift** hanya penanda status — ia menandai aset yang simpangannya
melewati batas dan mengubah ringkasan jadi "Perlu rebalance". Ia tidak mengubah
angka pada rencana; rencana selalu menuju target persis.

Aset dalam USD dikonversi ke rupiah memakai **kurs USD** di kanan atas, dan
kursnya bisa diubah sendiri.

## Harga pasar

Yahoo Finance tidak mengirim header CORS, jadi browser tidak bisa memanggilnya
langsung. `server/index.js` yang melakukannya: ia memetakan ticker aplikasi ke
simbol Yahoo (`BBCA` → `BBCA.JK`, `BTC` → `BTC-USD`, `SPX` → `^GSPC`),
menyimpannya di cache 60 detik, lalu menyajikannya di `/api/prices`. Server yang
sama juga menyajikan situsnya.

```bash
node server/index.js
curl 'http://localhost:8787/api/health'                        # cek koneksi upstream
curl 'http://localhost:8787/api/prices?tickers=BTC,NVDA,BBCA'  # lihat isinya
```

Kurs USD/IDR ikut diambil (`IDR=X`) dan harga emas dihitung dari futures emas
(`GC=F`) dibagi 31,1035 gram lalu dikali kurs — itu harga **spot**, belum
termasuk premi dealer seperti Antam.

Kalau backend tidak jalan, situsnya tetap berfungsi penuh: pil di kanan atas
berubah jadi "Harga manual" dan semua kolom harga kembali diisi tangan. Harga
yang kamu ketik sendiri tidak akan ditimpa harga live.

**Nilai aset**: isi **Nilai sekarang** langsung, atau isi **Unit** dan biarkan
nilainya dihitung dari unit × harga. Cara kedua yang membuat harga live ikut
menggerakkan total portofoliomu.

> Yahoo Finance adalah endpoint tidak resmi tanpa jaminan ketersediaan, dan
> cakupannya tidak merata — token yang lebih baru seperti HYPE dan XAUT bisa
> saja tidak ada. Ticker yang tidak ketemu dilaporkan di `missing` dan kolom
> harganya tetap manual. Endpoint ini juga tidak bisa dijangkau dari sandbox
> tempat kode ini ditulis, jadi jalur suksesnya diuji memakai tiruan berbentuk
> respons Yahoo (`YAHOO_BASE` bisa diarahkan ke server lain untuk itu);
> verifikasi terhadap Yahoo sungguhan perlu dilakukan di mesinmu lewat
> `/api/health`.

**Data tersimpan di browser.** Semuanya ada di `localStorage` perangkat itu
saja; tidak dikirim ke mana pun. Hapus data browser = data hilang, jadi pakai
**Ekspor JSON** kalau mau cadangan atau pindah perangkat.

**Bukan nasihat investasi.** Ini kalkulator alokasi. Daftar aset disusun sebagai
titik awal, bukan rekomendasi beli.

## Menjalankan

```bash
# lengkap dengan harga pasar (butuh Node 18+)
node server/index.js          # http://localhost:8787
PORT=3000 node server/index.js

# tanpa harga pasar — semua fitur lain tetap jalan
open index.html
```

Untuk hosting statis (GitHub Pages, Vercel, Netlify, Cloudflare Pages) cukup
unggah isi repo apa adanya, tanpa langkah build — hanya fitur harga live yang
tidak ikut, karena itu butuh proses server.

## Struktur

```
index.html                 kerangka halaman
assets/css/styles.css      seluruh style, token tema terang & gelap
assets/js/data.js          pustaka aset, kelas aset, racikan siap pakai
assets/js/brandmarks.js    path logo merek (dari simple-icons)
assets/js/logos.js         perakit logo: merek → glyph custom → monogram
assets/js/charts.js        donat, batang simpangan, grafik garis (SVG murni)
assets/js/pdf.js           penulis PDF: teks, tabel, donat vektor
assets/js/prices.js        klien harga ke backend
assets/js/app.js           state, perhitungan, render, router
server/index.js            server statis + proxy harga Yahoo Finance
server/symbols.js          peta ticker aplikasi → simbol Yahoo
```

PDF-nya ditulis sendiri, tanpa library: operator gambar PDF 1.4, dua font
Helvetica bawaan, dan donat yang benar-benar vektor (busur lingkaran didekati
kurva bézier kubik), jadi tetap tajam saat di-zoom maupun dicetak.

Perhitungan alokasi ada di `compute()` pada `app.js`; sisanya hanya menampilkan
hasilnya.

## Warna dan aksesibilitas

Palet kategorikal diambil dari palet dataviz yang sudah divalidasi: urutan slot
warnanya lolos ambang keterbacaan buta warna (ΔE OKLab pada pasangan
bersebelahan) di tema terang maupun gelap, diuji terhadap permukaan kartu yang
dipakai di sini (`#fcfcfb` dan `#1a1a19`). Warna mengikuti asetnya, bukan
urutannya — mengubah urutan atau menyaring daftar tidak mengecat ulang aset yang
tersisa. Setiap diagram punya tooltip pada hover maupun fokus keyboard, dan
setiap angka juga tersedia dalam bentuk tabel (tombol **Tabel** di kartu
diagram), jadi tidak ada nilai yang hanya bisa dibaca lewat warna atau hover.
Animasi dimatikan otomatis kalau sistem menyalakan *reduce motion*.

## Logo

Logo merek diambil dari [simple-icons](https://simple-icons.org) v16.28.0 yang
dirilis di bawah CC0 1.0; path-nya disalin apa adanya ke `brandmarks.js`. Aset
tanpa logo di sana memakai glyph buatan sendiri (S&P 500, emas batangan,
Hyperliquid) atau petak monogram dua huruf. Nama dan logo merek adalah milik
pemiliknya masing-masing dan dipakai di sini hanya untuk menandai aset.
