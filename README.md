# Pustaka Cersil

Aplikasi web untuk menjelajah dan membaca novel cerita silat (cersil) langsung di peramban. Data novel diambil dari folder Google Drive publik, lalu ditampilkan sebagai buku yang bisa dibalik halamannya.

## Fitur

- **Pengantar**: terowongan buku berputar dengan narasi singkat sejarah cersil. Gulir, geser, atau tekan ↓ untuk maju.
- **Koleksi**: sampul novel melayang dalam ruang 3D.
- **Tampilan Grid**: semua judul dengan pencarian judul/pengarang dan penanda progres baca.
- **Semesta Cerita**: mosaik sampul yang bisa diseret.
- **Pembaca buku**: dua halaman di desktop, satu halaman di ponsel, efek balik halaman, pilihan bagian/jilid, ukuran huruf, dan posisi baca terakhir tersimpan otomatis.

## Struktur data di Google Drive

Folder sumber: https://drive.google.com/drive/folders/1-EMcpVgJpofRhz2WisJIww04hodY_uKt

```
Dataset Cersil/
└── KARYA_DJATILAKSANA/              → kategori pengarang ("Djatilaksana")
    ├── 1. Sawer Wulung_Ejaan Lama/  → satu buku ("Sawer Wulung", edisi Ejaan Lama)
    │   ├── sawer-wulung-01.pdf      → Jilid 1
    │   └── sawer-wulung-02.pdf      → Jilid 2
    └── Judul Lepas.pdf              → buku satu jilid
```

- Urutan buku mengikuti nomor di depan nama folder, dan urutan jilid mengikuti nomor di nama file (urutan alami: 2 sebelum 10).
- Gambar (JPG/PNG) di dalam folder buku dipakai sebagai sampul.
- PDF berbasis teks ditata ulang menjadi halaman buku. PDF hasil scan (atau di atas 8 MB) ditampilkan sebagai gambar halaman aslinya.
- Format lain yang dibaca: Google Docs, DOCX, TXT, MD, HTML.

## Deploy ke Vercel

1. Buat API key di [Google Cloud Console](https://console.cloud.google.com/apis/credentials) dan aktifkan **Google Drive API** untuk proyeknya. Batasi key itu ke Google Drive API saja.
2. Di [Vercel](https://vercel.com/new), impor repo `ronnyMakhuddin/cersil`. Framework terdeteksi otomatis sebagai Vite.
3. Tambahkan Environment Variable `GOOGLE_API_KEY` berisi key tadi (opsional `DRIVE_FOLDER_ID`).
4. Deploy. Tanpa `GOOGLE_API_KEY`, aplikasi tetap jalan dalam **mode contoh** dengan tiga cerita pendek orisinal.

Folder Drive harus dibagikan sebagai "Siapa saja yang memiliki link dapat melihat".

## Pengembangan lokal

```bash
npm install
npm run dev          # hanya frontend (mode contoh)
npx vercel dev       # frontend + fungsi /api dengan GOOGLE_API_KEY dari .env
```

## Struktur kode

- `api/novels.js` — daftar novel dari Drive (cache CDN 10 menit).
- `api/chapter.js` — isi satu bagian sebagai daftar paragraf (cache 1 hari).
- `api/file.js` — proksi gambar sampul.
- `src/tunnel.js` — animasi terowongan buku (Canvas 2D).
- `src/reader.js` — pemecah halaman dan pembaca buku.
- `docs/design-spec.md` — spesifikasi desain UI.
