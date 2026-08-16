# Rebalance — perencana portofolio

Situs statis untuk merencanakan *rebalancing* portofolio: pilih aset (saham
Indonesia, saham Amerika, ETF indeks, emas, obligasi, kripto), tentukan target
alokasi, masukkan dana baru yang mau diinvestasikan, lalu lihat berapa yang
harus dibeli atau dijual — plus pelacakan nilai portofolio dari waktu ke waktu.

Tanpa framework, tanpa build step, tanpa server. Buka `index.html` di browser
dan langsung jalan.

## Isi

Tiga halaman, dinavigasi lewat sidebar kiri (`#/portofolio`, `#/stock`,
`#/crypto`):

**Portofolio** — halaman utama.

- Dua diagram donat berdampingan: alokasi **sekarang** dan **setelah rebalance**,
  memakai urutan segmen dan warna yang sama supaya bisa dibandingkan langsung.
- Bisa dilihat *per aset* atau *per kelas aset*.
- Grafik simpangan (drift) dua arah: mana yang kelebihan bobot, mana yang kurang.
- Tabel aset yang bisa diedit: nilai sekarang, harga per unit (opsional), target %.
- Tabel rencana eksekusi: aksi Beli/Jual/Tahan, nominal rupiah, perkiraan lot
  atau unit, nilai dan bobot setelahnya.
- Pelacakan: simpan snapshot, lihat grafik pertumbuhan, ekspor/impor JSON.

**Stock** — katalog bluechip BEI, bluechip Amerika, ETF indeks, emas, obligasi
dan kas. Ada pencarian dan filter per kelas.

**Crypto** — koin utama, stablecoin, dan emas berbentuk token.

Sepuluh aset ditandai **Aset utama**: S&P 500, BTC, USDT, XAUT, GOLD, HYPE, SOL,
ETH, NVDA, dan GOOGL.

## Dua metode rebalance

| Metode | Cara kerja |
|---|---|
| **Tanpa jual** (default) | Hanya dana baru yang dibagi, diarahkan ke aset yang bobotnya paling jauh di bawah target. Tidak ada penjualan, jadi tidak ada pajak/fee jual dan tidak realisasi rugi. |
| **Rebalance penuh** | Menghitung selisih ke target persis: yang kelebihan dijual, hasilnya plus dana baru dipakai membeli yang kurang. |

**Toleransi drift** hanya penanda status — ia menandai aset yang simpangannya
melewati batas dan mengubah ringkasan jadi "Perlu rebalance". Ia tidak mengubah
angka pada rencana; rencana selalu menuju target persis.

Aset dalam USD dikonversi ke rupiah memakai **kurs USD** di kanan atas, dan
kursnya bisa diubah sendiri.

## Yang perlu diketahui

**Tidak ada data harga pasar.** Situs ini tidak terhubung ke bursa atau API
harga mana pun. Semua angka — nilai aset, harga per unit, kurs USD — diisi
manual. Kolom harga hanya dipakai untuk memperkirakan jumlah lot/unit pada
rencana eksekusi, dan boleh dikosongkan.

**Data tersimpan di browser.** Semuanya ada di `localStorage` perangkat itu
saja; tidak dikirim ke mana pun. Hapus data browser = data hilang, jadi pakai
**Ekspor JSON** kalau mau cadangan atau pindah perangkat.

**Bukan nasihat investasi.** Ini kalkulator alokasi. Daftar aset disusun sebagai
titik awal, bukan rekomendasi beli.

## Menjalankan

```bash
# cukup buka filenya
open index.html

# atau lewat server statis kalau mau
python3 -m http.server 8000
```

Deploy ke hosting statis apa pun (GitHub Pages, Vercel, Netlify, Cloudflare
Pages) — cukup unggah isi repo apa adanya, tidak ada langkah build.

## Struktur

```
index.html                 kerangka halaman
assets/css/styles.css      seluruh style, token tema terang & gelap
assets/js/data.js          pustaka aset, kelas aset, racikan siap pakai
assets/js/brandmarks.js    path logo merek (dari simple-icons)
assets/js/logos.js         perakit logo: merek → glyph custom → monogram
assets/js/charts.js        donat, batang simpangan, grafik garis (SVG murni)
assets/js/app.js           state, perhitungan, render, router
```

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
