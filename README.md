# Porsi

Satu halaman untuk membagi uang yang kamu punya ke beberapa porsi. Ketik
nominalnya, ketik persennya, dan nominal tiap bagian langsung terhitung sambil
pie chart-nya ikut bergerak.

Tanpa framework, tanpa build step, tanpa server. Buka `index.html`, selesai.

## Melihat strategi

Halaman `strategies.html` dapat dibuka dari ikon grafik di sidebar, tepat di
atas **Kurs** dan **Assets**. Pilih salah satu dari lima strategi preset untuk melihat
komposisi, grafik gabungan aset berbobot, dan perubahan nilainya dalam persen.
Dropdown menyediakan **1H, 1D, 1W, 1M, 1Y, 5Y, 10Y, MAX**.
Grafik membandingkan garis strategi yang lebih tebal dengan garis berwarna
masing-masing aset. Sumbu persen di kanan dan legenda di atas grafik selalu
menampilkan skala serta return terakhir tanpa perlu menyentuh grafik.
Klik sebuah garis, tombol legenda, atau seluruh kartu aset untuk menyorot seri
tersebut. Tombol panah dalam kotak membuka halaman detail aset. Label berwarna
di tepi kanan grafik mengikuti persentase seri aktif pada titik yang ditunjuk.
Strategi **Dividen Play** dan **Pension Fund Indo** memakai instrumen yang
tercatat di Indonesia; tautan riset dan batasan risiko ada di kartu komposisi.

Grafik dimulai dari indeks 100. Tiap aset dibeli menurut bobot awal strategi,
lalu dibiarkan bergerak tanpa rebalancing. Persentase di halaman ini adalah
**total return historis** untuk rentang tanggal yang tertera, bukan CAGR atau
hasil akun pengguna. Data berasal dari Yahoo Finance melalui `api/market.js`;
adjusted close dipakai bila tersedia. MAX dibatasi 10 tahun, dan periode yang
tidak memiliki histori bersama ditampilkan sebagai tidak tersedia. Timeframe
pendek juga bisa tidak tersedia di luar jam ketika semua pasar terkait aktif.
Halaman ini membutuhkan API tersebut saat dijalankan; membuka file langsung
dari disk hanya cocok untuk alat alokasi utama.

## Cara pakai

1. **Isi uang yang kamu punya** di kolom besar paling atas.
2. **Pilih asetnya** — klik logo di kiri tiap baris untuk membuka katalog: saham
   Indonesia, saham Amerika, ETF & indeks, kripto, emas, obligasi, dan kas.
   Tiap aset punya ticker, nama lengkap, dan logonya. Mau nama sendiri
   (misal "Dana darurat")? Ada tombol **Pakai nama sendiri**, atau ketik
   langsung di kolom namanya.
3. **Atur porsinya** dalam persen. Setiap baris menampilkan nominalnya sendiri
   dan langsung tergambar sebagai potongan pie.
4. **Hapus** dengan tombol ✕ di ujung baris. Porsinya ikut terhapus — jatahnya
   tidak dibagikan diam-diam ke baris lain, melainkan jadi sisa "Belum dibagi"
   yang kamu tempatkan sendiri.
5. Tombol bantunya:
   - **Tambah porsi** — bagian baru dapat jatah rata, yang lama menyusut
     proporsional, jadi totalnya tetap 100%.
   - **Bagi rata** — semua porsi disamakan.
   - **Paskan 100%** — porsi yang ada diskalakan supaya jumlahnya pas 100%.
   - **Clear** — kosongkan semua porsi aktif tanpa mengubah nominal dan preferensi.

Kalau jumlahnya belum 100%, sisanya muncul sebagai potongan abu-abu "Belum
dibagi" dan lencana di kanan atas berubah warna. Lebih dari 100% juga ditandai.

Daftarnya **urut otomatis dari porsi terbesar ke terkecil**, begitu juga urutan
potongan di pie chart dan di file unduhan. Urutannya baru disusun ulang saat
angkanya selesai diketik, bukan tiap ketukan tombol — jadi barisnya tidak
melompat di bawah kursormu.

Setiap potongan pie menampilkan logo asetnya dan persennya, selama potongannya
cukup lebar (logo butuh ruang lebih dari angkanya, jadi ambangnya lebih tinggi).

## Menyimpan hasilnya

Panel **Simpan setup ini** di bawah mengunduh susunanmu sebagai **JPG** atau
**PDF**: kartu berisi total, pie chart, dan rincian tiap porsi lengkap dengan
logo, ticker, nominal, dan persennya. Kartunya mengikuti tema yang sedang
aktif, digambar ulang di canvas pada resolusi 2× supaya tetap tajam saat
dicetak atau dibagikan. PDF-nya satu halaman berisi gambar yang sama, jadi apa
yang kamu lihat persis itu yang tersimpan.

Di **Settings → Profil kartu**, kamu bisa menulis nama, memilih salah satu
avatar, atau mengunggah foto sendiri. Nama dan avatar muncul di kartu JPG dan
PDF. Foto dipotong persegi, diperkecil sebelum disimpan, dan tetap berada di
`localStorage` browser ini. Mengganti avatar tidak mengubah alokasi portofolio.

## Mata uang

Settings menyediakan **IDR, USD, CNY, SGD, dan CHF**. Pilihan ini mengubah
simbol dan format tampilan; **nominal portofolio tidak dikonversi**.
Halaman `currencies.html` menampilkan grafik riwayat nilai IDR, CNY, SGD,
dan CHF dalam USD. Data pasangan USD/mata uang dari API pasar dibalik untuk
menampilkan nilai 1 unit mata uang dalam USD. USD/USD selalu 1.
Grafik kurs ini membutuhkan API ketika dijalankan dan tidak digunakan untuk
mengonversi nilai portofolio.

| | Simbol | Format | Desimal |
|---|---|---|---|
| Indonesia | `Rp` | `10.000.000` | 0 |
| Amerika Serikat | `$` | `10,000,000.00` | 2 |

## Menjalankan

```bash
open index.html            # cukup itu

python3 -m http.server 8000   # kalau lebih suka lewat server statis
```

Alat alokasi bisa dibuka sebagai file statis. Grafik aset, strategi, dan kurs
memerlukan endpoint `api/market.js` pada hosting yang mendukung fungsi Node.

## Struktur

```
index.html               kerangka halaman
assets/css/font.css      Bricolage Grotesque, tertanam sebagai data URI
assets/css/styles.css    seluruh style, tema gelap & terang
assets/js/marks.js       path logo aset (simple-icons + glyph buatan sendiri)
assets/js/assets.js      katalog aset: ticker, nama, kelas
assets/js/export.js      penggambar kartu di canvas → JPG / PDF
assets/js/app.js         state, perhitungan, pie chart, pengaturan
assets/fonts/            lisensi font
```

Isian tersimpan di `localStorage` browser ini saja dan tidak dikirim ke mana
pun. Halaman pengaturan berisi pilihan mata uang, bahasa, dan profil kartu.
Tombol tema berada di sidebar.

Ikon strategi memakai [Lucide](https://lucide.dev/icons/) (ISC); salinan
lisensinya ada di `assets/icons/LUCIDE-LICENSE.txt`. Ilustrasi avatar dibuat
khusus untuk Porsi; file SVG sumber dan PNG tampilannya ada di `assets/avatars/`.

## Tipografi

Seluruh antarmuka memakai **Bricolage Grotesque** karya Atelier Triay — display
grotesque bersumbu variabel (200–800), dirilis di bawah SIL Open Font License
1.1 (lihat `assets/fonts/`). Subset latin-nya ditanam sebagai data URI di
`font.css` supaya tipografinya tetap utuh walau halaman dibuka langsung dari
disk, di mana browser menolak memuat berkas font terpisah.

## Logo

Semua logo di sini berasal dari sumber yang lisensinya jelas dan boleh
didistribusikan ulang:

| Sumber | Lisensi | Aset |
|---|---|---|
| [simple-icons](https://simple-icons.org) v16.28.0 | CC0 1.0 | AAPL, NVDA, GOOGL, META, TSLA, AVGO, V, UNVR, GOTO, BTC, ETH, SOL, USDT, BNB, XRP, DOGE |
| [web3icons](https://github.com/0xa3k5/web3icons) v4.0.54 | MIT | XAUT, HYPE |
| [SVG Logos](https://github.com/gilbarbara/logos) v1.2.13 | CC0 1.0 | MSFT (berwarna penuh) |
| Digambar untuk proyek ini | — | glyph kelas aset + S&P 500, emas, kas, obligasi |

**Yang tidak ada logo resminya.** Untuk 24 aset sisanya — bank-bank BEI seperti
BBCA dan BBRI, lalu AMZN, JPM, dan produk seperti VOO, QQQ, SBN, RDPU —
tidak ada logo berlisensi terbuka yang tersedia. Logo mereka adalah merek
dagang tanpa lisensi redistribusi, jadi menyalinnya dari situs masing-masing
bukan pilihan yang bisa dipertanggungjawabkan untuk repo publik. Sebagai
gantinya, tiap aset memakai **glyph kelasnya** — gedung untuk saham, tumpukan
lapisan untuk ETF, koin untuk kripto, batangan untuk emas, sertifikat untuk
obligasi, dompet untuk kas — diwarnai dengan warna merek asetnya. Jadi tiap
potongan tetap menunjukkan jenis asetnya, bukan sekadar dua huruf.

Nama dan logo merek adalah milik pemiliknya masing-masing dan dipakai di sini
hanya untuk menandai aset.

## Warna

Potongan pie memakai palet kategorikal yang sudah lolos ambang keterbacaan buta
warna (ΔE OKLab antar-slot bersebelahan) di tema gelap maupun terang, diuji
terhadap permukaan kartu yang dipakai di sini. Warna mengikuti porsinya, bukan
urutannya — menambah atau menghapus baris tidak mengecat ulang yang lain.
Persennya ditulis langsung di atas potongan yang cukup lebar, dan daftar di
sebelahnya memuat setiap angka, jadi tidak ada nilai yang hanya bisa dibaca
lewat warna. Animasi mati sendiri kalau sistem menyalakan *reduce motion*.
