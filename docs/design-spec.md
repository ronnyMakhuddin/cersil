# Spesifikasi Desain UI — Web Cersil

Dibedah dari rekaman layar referensi (pengalaman web imersif bertema arsip naskah kuno: terowongan buku berputar, grid buku melayang 3D, pembaca buku dua halaman). Struktur interaksinya dipakai sebagai acuan, sedangkan tema visual, teks, dan aset dibuat orisinal untuk cerita silat.

## 1. Karakter & Gaya Desain (UI Style)

- **Gaya:** *Immersive Storytelling / Dark Museum Experience*. Layar penuh, tanpa header klasik, konten mengambang di atas latar bertekstur.
- **Kesan:** sunyi, megah, seperti memasuki perpustakaan kuno. Fokus pada objek (buku) dan satu kalimat besar di tengah layar.
- **Tema cersil:** kertas tua (parchment), tinta hitam, aksen merah cinnabar (stempel/cap giok), emas kusam.
- **Target:** pembaca novel silat di desktop dan ponsel, mode baca panjang.

## 2. Palet Warna & Token (HEX & Tailwind)

| Token | HEX | Tailwind terdekat | Pemakaian |
|---|---|---|---|
| `--bg` | `#1F1D1A` | `stone-900` | Latar utama gelap (ruang koleksi & pembaca) |
| `--bg-dots` | `#3A3631` | `stone-700` | Pola titik/kotak kecil di latar |
| `--surface` | `#2A2723` | `stone-800` | Kartu, panel, pill nonaktif gelap |
| `--parchment` | `#E9DCC0` | `amber-100` | Halaman buku, pill terang |
| `--parchment-dark` | `#C9B48A` | `amber-300` | Tepi halaman, bayangan kertas |
| `--accent` | `#E8B48A` | `orange-200` | Tombol utama (Scroll, Kembali, Jelajahi) — peach seperti referensi |
| `--accent-strong` | `#B23A2B` | `red-700` | Cinnabar: border pill aktif, cap, angka bab |
| `--gold` | `#C8A15A` | `yellow-600` | Ornamen, garis tipis |
| `--ink` | `#1B1A17` | `stone-950` | Teks pada kertas |
| `--text` | `#F5EFE3` | `stone-50` | Teks besar di atas latar |
| `--muted` | `#A39A8A` | `stone-400` | Caption, placeholder |
| `--border` | `rgba(255,255,255,.12)` | `white/10` | Garis pemisah |

## 3. Tipografi & Hierarki

- **Display / narasi besar:** *Cormorant Garamond* (serif) 600, 34–56px (`clamp(1.9rem, 4.2vw, 3.4rem)`), line-height 1.12, rata tengah, bayangan teks halus. Referensi memakai sans geometris; untuk cersil diganti serif klasik.
- **Judul buku & bab:** *Cormorant Garamond* 700, 24–32px.
- **UI / label / tombol:** *Plus Jakarta Sans* 500–600, 13–15px.
- **Isi bacaan:** *Literata* 400, 18px, line-height 1.75, maks. 62 karakter per baris.
- **Penomoran halaman:** serif, angka atas 18px / bawah 18px dengan garis miring (format `1 / 576`), kiri bawah.

## 4. Struktur Layout & Navigasi

- **Kanvas layar penuh** (100vw × 100dvh), tanpa scroll halaman; navigasi digerakkan oleh scroll/swipe (scroll-jacking bertahap).
- **Navigasi bab kiri bawah:** 4 pill bertumpuk vertikal — `1 • Pengantar`, `2 • Koleksi`, `3 • Tampilan Grid`, `4 • Semesta Cerita`. Pill aktif: border cinnabar 2px + teks cinnabar.
- **Progress bar vertikal** di sisi kiri (lebar 6px, tinggi ±45vh, rounded-full, thumb putih bulat).
- **Tombol tutup (X)** bulat 40px di kanan atas, latar putih 20% blur.
- **Tombol aksi tengah bawah:** pill peach (`Kembali`, `Jelajahi koleksi`).
- **Mobile:** pill navigasi menjadi baris horizontal di bawah, progress bar menjadi horizontal di atas, buku tampil satu halaman.

## 5. Bedah Komponen Detail

1. **Intro — Terowongan Buku:** cincin-cincin konsentris dari punggung buku (warna kertas/kayu) yang berputar dan "mendekat" saat discroll; satu paragraf narasi besar di tengah berganti per langkah scroll (fade + scale). Indikator "Gulir untuk menjelajah" berupa lingkaran peach 96px berisi ikon mouse.
2. **Akhir intro:** pusat terowongan membuka menjadi lingkaran gelap besar dengan tombol pill `Jelajahi koleksi`.
3. **Koleksi 3D:** sampul novel melayang di ruang 3D (perspective 1200px), rotasi acak ringan, latar gelap berpola titik. Hover = maju & terang; klik = buka buku.
4. **Pembaca Buku:** buku terbuka dua halaman kertas tua di tengah, efek balik halaman 3D (rotateY), tombol bulat kiri/kanan 40px (putih, ikon chevron), penomoran `n / total` kiri bawah, pill `Kembali` tengah bawah.
5. **Tampilan Grid:** grid rapat sampul (gap 12px), kartu terpilih membesar dengan caption bar gelap di bawah berisi judul & pengarang.
6. **Semesta Cerita:** mosaik ratusan potongan sampul kecil; ketuk satu untuk memperbesar.

## 6. Detail Visual & Interaksi

- **Radius:** pill `rounded-full`; kartu sampul `rounded-sm` (2–4px) agar terasa seperti buku fisik; panel `rounded-2xl`.
- **Bayangan:** buku `0 30px 60px -20px rgba(0,0,0,.7)`; halaman memakai gradien tepi lipatan (`linear-gradient(90deg, rgba(0,0,0,.18), transparent 8%)`).
- **Transisi:** 600–900ms `cubic-bezier(.2,.7,.1,1)`; teks narasi fade+blur; balik halaman 700ms.
- **Loading:** skeleton sampul berdenyut warna `--surface`.
- **Ikon:** Lucide (garis 1.75px).

## 7. Design System Blueprint (Untuk Webapp Builder)

```
TEMA: Imersif, layar penuh, latar gelap #1F1D1A berpola titik #3A3631; objek utama = buku kertas tua #E9DCC0 bertinta #1B1A17.
AKSEN: tombol peach #E8B48A (pill rounded-full, teks #1B1A17); status aktif cinnabar #B23A2B; ornamen emas #C8A15A.
FONT: Cormorant Garamond (display/judul), Plus Jakarta Sans (UI), Literata (isi bacaan 18px/1.75).
NAVIGASI: 4 pill bab kiri-bawah + progress bar vertikal kiri + tombol X kanan-atas + pill aksi tengah-bawah. Navigasi utama = scroll/swipe/keyboard.
LAYAR: (1) Intro terowongan buku berputar + narasi per langkah, (2) Koleksi 3D sampul melayang, (3) Grid sampul + pencarian, (4) Mosaik semesta, (5) Pembaca buku dua halaman dengan efek balik halaman dan penomoran n/total.
GERAK: transisi 600–900ms cubic-bezier(.2,.7,.1,1); hover sampul translateZ + brightness; teks narasi fade+scale.
MOBILE: satu halaman per layar, pill jadi baris horizontal, swipe kiri/kanan untuk balik halaman.
IKON: Lucide.
```
