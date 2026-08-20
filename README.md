# Porsi

Satu halaman untuk membagi uang yang kamu punya ke beberapa porsi. Ketik
nominalnya, ketik persennya, dan nominal tiap bagian langsung terhitung sambil
pie chart-nya ikut bergerak.

Tanpa framework, tanpa build step, tanpa server. Buka `index.html`, selesai.

## Cara pakai

1. **Isi uang yang kamu punya** di kolom besar paling atas.
2. **Pilih asetnya** — klik logo di kiri tiap baris untuk membuka katalog:
   IDX Stock, US Stock, ETF & indeks, kripto, emas, obligasi, dan kas.
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

Kalau jumlahnya belum 100%, sisanya muncul sebagai potongan abu-abu "Belum
dibagi" dan lencana di kanan atas berubah warna. Lebih dari 100% juga ditandai.

Daftarnya **urut otomatis dari porsi terbesar ke terkecil**, begitu juga urutan
potongan di pie chart dan di file unduhan. Urutannya menyusul **seketika sambil
kamu mengetik**: begitu satu baris jadi 50% sementara yang lain 30%, baris itu
langsung naik — meluncur ke posisi barunya, bukan melompat.

Yang bergeser cuma tampilannya. Baris yang sedang kamu ketik tetap elemen yang
sama, jadi fokus dan posisi kursormu ikut naik bersamanya dan kamu bisa terus
mengetik tanpa terputus.

Setiap potongan pie menampilkan logo asetnya dan persennya, selama potongannya
cukup lebar (logo butuh ruang lebih dari angkanya, jadi ambangnya lebih tinggi).

## Menyimpan hasilnya

Panel **Simpan setup ini** di bawah mengunduh susunanmu sebagai **JPG** atau
**PDF**: kartu berisi total, pie chart, dan rincian tiap porsi lengkap dengan
logo, ticker, nominal, dan persennya. Kartunya mengikuti tema yang sedang
aktif, digambar ulang di canvas pada resolusi 2× supaya tetap tajam saat
dicetak atau dibagikan. PDF-nya satu halaman berisi gambar yang sama, jadi apa
yang kamu lihat persis itu yang tersimpan.

## Bahasa

Tombol pengaturan di kanan atas punya pilihan bahasa: **Bahasa Indonesia** dan
**English**. Seluruh antarmuka ikut berganti — termasuk lencana persen, keterangan
di bawah pie, katalog aset, dan teks di file unduhan.

Bahasa pertama dipilih dari setelan browsermu; kalau kamu menggantinya, pilihanmu
yang dipakai seterusnya. Nama perusahaan dan ticker tidak diterjemahkan. Yang
ikut berganti hanya nama instrumen yang memang berupa keterangan — "Kas /
Tabungan" jadi "Cash / Savings" — sementara nama resmi seperti "SBN Ritel
(ORI/SR/ST/SBR)" tetap apa adanya.

## Mata uang

Pengaturan yang sama menyediakan enam mata uang, lengkap dengan benderanya.
Pilihan ini mengubah simbol, pemisah ribuan, dan jumlah desimal —
**nominalnya tidak dikonversi**, karena aplikasi ini tidak memakai data kurs.

| | Simbol | Format | Desimal |
|---|---|---|---|
| Indonesia | `Rp` | `10.000.000` | 0 |
| Amerika Serikat | `$` | `10,000,000.00` | 2 |
| Zona Euro | `€` | `10.000.000,00` | 2 |
| Singapura | `S$` | `10,000,000.00` | 2 |
| Swiss | `CHF` | `10'000'000.00` | 2 |
| Jepang | `¥` | `10,000,000` | 0 |

Pemisah ribuan dan desimalnya dibaca dari `Intl`, bukan ditulis tangan — jadi
kolom nominalnya mengerti `10'000'000.50` saat mata uangnya Swiss dan
`10.000.000,50` saat Euro. Angka yang ditulis dengan tanda baca mata uang lain
tetap terbaca, tidak diam-diam dianggap nol.

## Menjalankan

```bash
open index.html            # cukup itu

python3 -m http.server 8000   # kalau lebih suka lewat server statis
```

Deploy ke hosting statis mana pun tanpa langkah build.

## Struktur

```
index.html               kerangka halaman
assets/css/font.css      Bricolage Grotesque, tertanam sebagai data URI
assets/css/styles.css    seluruh style, tema gelap & terang
assets/js/i18n.js        teks antarmuka, Indonesia & Inggris
assets/js/marks.js       path logo aset (simple-icons + glyph buatan sendiri)
assets/js/assets.js      katalog aset: ticker, nama, kelas
assets/js/export.js      penggambar kartu di canvas → JPG / PDF
assets/js/app.js         state, perhitungan, pie chart, pengaturan, bendera
assets/fonts/            lisensi font
```

Isian tersimpan di `localStorage` browser ini saja dan tidak dikirim ke mana
pun. Tombol **Hapus semua & mulai lagi** ada di pengaturan.

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
