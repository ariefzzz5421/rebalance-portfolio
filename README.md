# Porsi

Satu halaman untuk membagi uang yang kamu punya ke beberapa porsi. Ketik
nominalnya, ketik persennya, dan nominal tiap bagian langsung terhitung sambil
pie chart-nya ikut bergerak.

Tanpa framework, tanpa build step, tanpa server. Buka `index.html`, selesai.

## Cara pakai

1. **Isi uang yang kamu punya** di kolom besar paling atas.
2. **Pilih asetnya** — klik logo di kiri tiap baris untuk membuka katalog: saham
   Indonesia, saham Amerika, ETF & indeks, kripto, emas, obligasi, dan kas.
   Tiap aset punya ticker, nama lengkap, dan logonya. Mau nama sendiri
   (misal "Dana darurat")? Ada tombol **Pakai nama sendiri**, atau ketik
   langsung di kolom namanya.
3. **Atur porsinya** dalam persen. Setiap baris menampilkan nominalnya sendiri
   dan langsung tergambar sebagai potongan pie.
4. Tombol bantunya:
   - **Tambah porsi** — bagian baru dapat jatah rata, yang lama menyusut
     proporsional, jadi totalnya tetap 100%.
   - **Bagi rata** — semua porsi disamakan.
   - **Paskan 100%** — porsi yang ada diskalakan supaya jumlahnya pas 100%.

Kalau jumlahnya belum 100%, sisanya muncul sebagai potongan abu-abu "Belum
dibagi" dan lencana di kanan atas berubah warna. Lebih dari 100% juga ditandai.

## Menyimpan hasilnya

Panel **Simpan setup ini** di bawah mengunduh susunanmu sebagai **JPG** atau
**PDF**: kartu berisi total, pie chart, dan rincian tiap porsi lengkap dengan
logo, ticker, nominal, dan persennya. Kartunya mengikuti tema yang sedang
aktif, digambar ulang di canvas pada resolusi 2× supaya tetap tajam saat
dicetak atau dibagikan. PDF-nya satu halaman berisi gambar yang sama, jadi apa
yang kamu lihat persis itu yang tersimpan.

## Mata uang

Tombol pengaturan di kanan atas menyediakan **IDR** dan **USD**, lengkap dengan
bendera negaranya. Pilihan ini mengubah simbol, pemisah ribuan, dan jumlah
desimal — **nominalnya tidak dikonversi**, karena aplikasi ini tidak memakai
data kurs.

| | Simbol | Format | Desimal |
|---|---|---|---|
| Indonesia | `Rp` | `10.000.000` | 0 |
| Amerika Serikat | `$` | `10,000,000.00` | 2 |

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
assets/js/marks.js       path logo aset (simple-icons + glyph buatan sendiri)
assets/js/assets.js      katalog aset: ticker, nama, kelas
assets/js/export.js      penggambar kartu di canvas → JPG / PDF
assets/js/app.js         state, perhitungan, pie chart, pengaturan
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

Logo merek diambil dari [simple-icons](https://simple-icons.org) v16.28.0 yang
dirilis di bawah CC0 1.0; path-nya disalin apa adanya. Aset yang tidak punya
logo di sana memakai glyph buatan sendiri (indeks, emas batangan, kas,
obligasi, Hyperliquid) atau petak monogram dua huruf — jadi bank-bank BEI dan
beberapa emiten AS tampil sebagai inisial, bukan logo resminya. Nama dan logo
merek adalah milik pemiliknya masing-masing dan dipakai di sini hanya untuk
menandai aset.

## Warna

Potongan pie memakai palet kategorikal yang sudah lolos ambang keterbacaan buta
warna (ΔE OKLab antar-slot bersebelahan) di tema gelap maupun terang, diuji
terhadap permukaan kartu yang dipakai di sini. Warna mengikuti porsinya, bukan
urutannya — menambah atau menghapus baris tidak mengecat ulang yang lain.
Persennya ditulis langsung di atas potongan yang cukup lebar, dan daftar di
sebelahnya memuat setiap angka, jadi tidak ada nilai yang hanya bisa dibaca
lewat warna. Animasi mati sendiri kalau sistem menyalakan *reduce motion*.
