# Porsi

Satu halaman untuk membagi uang yang kamu punya ke beberapa porsi. Ketik
nominalnya, ketik persennya, dan nominal tiap bagian langsung terhitung sambil
pie chart-nya ikut bergerak.

Tanpa framework, tanpa build step, tanpa server. Buka `index.html`, selesai.

## Cara pakai

1. **Isi uang yang kamu punya** di kolom besar paling atas.
2. **Atur porsinya** dalam persen. Setiap baris menampilkan nominalnya sendiri
   dan langsung tergambar sebagai potongan pie.
3. Tombol bantunya:
   - **Tambah porsi** — bagian baru dapat jatah rata, yang lama menyusut
     proporsional, jadi totalnya tetap 100%.
   - **Bagi rata** — semua porsi disamakan.
   - **Paskan 100%** — porsi yang ada diskalakan supaya jumlahnya pas 100%.

Kalau jumlahnya belum 100%, sisanya muncul sebagai potongan abu-abu "Belum
dibagi" dan lencana di kanan atas berubah warna. Lebih dari 100% juga ditandai.

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

## Warna

Potongan pie memakai palet kategorikal yang sudah lolos ambang keterbacaan buta
warna (ΔE OKLab antar-slot bersebelahan) di tema gelap maupun terang, diuji
terhadap permukaan kartu yang dipakai di sini. Warna mengikuti porsinya, bukan
urutannya — menambah atau menghapus baris tidak mengecat ulang yang lain.
Persennya ditulis langsung di atas potongan yang cukup lebar, dan daftar di
sebelahnya memuat setiap angka, jadi tidak ada nilai yang hanya bisa dibaca
lewat warna. Animasi mati sendiri kalau sistem menyalakan *reduce motion*.
