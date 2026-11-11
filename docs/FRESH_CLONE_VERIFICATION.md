# Bukti Verifikasi Simulasi Fresh Clone, Build, Deploy, dan Unit Test (Pull Request)

Dokumen ini memuat catatan hasil simulasi pengujian *Fresh Clone* dari repositori GitHub untuk memvalidasi kelayakan instalasi dari awal di lingkungan bersih:

- **Repositori Target**: `https://github.com/alvinetansri-collab/Proyek_RPL.git`
- **Cabang Pengujian**: `test/verify-fresh-clone`
- **Tanggal Pengujian**: 4 November 2026
- **Lingkungan Uji**: Node.js v24.20.0, npm 11.x, Windows PowerShell

---

## 1. Rangkaian Perintah yang Dijalankan

```powershell
# 1. Kloning Repositori dari GitHub ke direktori bersih
git clone https://github.com/alvinetansri-collab/Proyek_RPL.git fresh_clone_verify
cd fresh_clone_verify

# 2. Berpindah ke cabang verifikasi
git checkout test/verify-fresh-clone

# 3. Instalasi seluruh dependensi monorepo
npm.cmd install

# 4. Kompilasi build seluruh modul (shared, API, web)
npm.cmd run build

# 5. Eksekusi pengujian unit test (70 tests)
npm.cmd test
```

---

## 2. Hasil Kompilasi Build Monorepo (`npm run build`)

```text
> build
> npm run build:shared && npm run build:api && npm run build:web

> build:shared
> npm run build --prefix packages/shared
> @proyek-rpl/shared@1.0.0 build
> tsc

> build:api
> npm run build --prefix apps/api
> api@1.0.0 build
> tsc

> build:web
> npm run build --prefix apps/web
> web@1.0.0 build
> tsc && vite build

✓ 41 modules transformed.
dist/index.html                   0.44 kB │ gzip:  0.31 kB
dist/assets/index-d6d69c5f.css   21.79 kB │ gzip:  4.67 kB
dist/assets/index-b15c12c1.js   186.72 kB │ gzip: 55.75 kB
✓ built in 2.09s
Status: OK (Exit Code 0)
```

---

## 3. Hasil Pengujian Unit Test (`npm test`)

```text
✔ Fitur 1 - Pencarian: Berhasil mencari berdasarkan nomor sertifikat secara parsial (2.20ms)
✔ Fitur 1 - Pencarian: Berhasil mencari berdasarkan nama pemilik (case-insensitive) (0.32ms)
✔ Fitur 1 - Pencarian: Berhasil mencari berdasarkan wilayah kecamatan / kabupaten (0.46ms)
✔ Fitur 1 - Pencarian: Mengembalikan array kosong jika kueri pencarian tidak cocok (0.31ms)
✔ Fitur 1 - Pencarian: Filter kombinasi teks pencarian dan jenis hak tanah (0.32ms)
✔ Fitur 1 - Validasi: Lolos validasi saat data pendaftaran tanah lengkap dan benar (0.43ms)
✔ Fitur 1 - Validasi: Menolak pendaftaran jika nomor sertifikat kosong (0.35ms)
✔ Fitur 1 - Validasi: Menolak pendaftaran jika nomor sertifikat sudah ada (duplikat) (0.36ms)
✔ Fitur 1 - Validasi: Menolak pendaftaran jika luas tanah <= 0 atau tidak valid (0.52ms)
✔ Fitur 2 - Evaluasi: Menghasilkan status COMPLETE jika terdapat minimal 3 dokumen (3.64ms)
✔ Fitur 2 - Evaluasi: Menghasilkan status NEEDS_REVIEW jika terdapat 1 atau 2 dokumen (0.40ms)
✔ Fitur 2 - Evaluasi: Menghasilkan status INCOMPLETE jika belum ada dokumen yang dicatat (0.27ms)
✔ Fitur 2 - Standar Lencana Warna: Status COMPLETE menggunakan label 'Lengkap' dan warna hijau (0.82ms)
✔ Fitur 2 - Standar Lencana Warna: Status NEEDS_REVIEW menggunakan label 'Perlu Diperiksa' dan warna oranye (0.64ms)
✔ Fitur 2 - Standar Lencana Warna: Status INCOMPLETE menggunakan label 'Belum Lengkap' dan warna merah (0.36ms)
✔ Fitur 2 - Linimasa Riwayat: Mengurutkan silsilah perpindahan hak tanah secara kronologis (ascending) (0.65ms)
✔ Fitur 2 - Linimasa Riwayat: Mengurutkan silsilah perpindahan hak tanah dari yang terbaru (descending) (0.42ms)
✔ Fitur 2 - Metrik Dashboard: Menghitung akumulasi statistik ringkasan dan rasio kelengkapan (2.31ms)
✔ Keamanan & Logging: Masking NIK 16 digit menyamarkan 8 digit tengah (3.14ms)
✔ Keamanan & Logging: Masking nomor telepon format seluler 08xx (0.38ms)
✔ Keamanan & Logging: Masking nomor telepon format internasional +62 (0.18ms)
✔ Keamanan & Logging: Masking nomor telepon dengan pemisah spasi dan tanda minus (0.17ms)
✔ Keamanan & Logging: Masking telepon lokal dengan kode area tanda kurung (0.19ms)
✔ Keamanan & Logging: safeLog menghasilkan format terstruktur dengan timestamp dan level (3.19ms)
✔ Keamanan & Penyimpanan: atomicWriteFileSync menulis data persisten tanpa corrupt (14.66ms)
✔ US-1: Pendaftaran bidang tanah baru berhasil jika seluruh field wajib valid (2.77ms)
✔ US-1: Menolak pendaftaran jika nomor sertifikat kosong (0.59ms)
✔ US-1: Menolak pendaftaran jika nama pemilik kosong (0.36ms)
✔ US-1: Menolak pendaftaran jika alamat bidang tanah kosong (0.35ms)
✔ US-1: Menolak pendaftaran jika desa / kelurahan kosong (0.45ms)
✔ US-1: Menolak pendaftaran jika kecamatan kosong (0.36ms)
✔ US-1: Menolak pendaftaran jika luas tanah bernilai 0 (0.36ms)
✔ US-1: Menolak pendaftaran jika luas tanah bernilai negatif (0.33ms)
✔ US-1: Mencegah duplikasi nomor sertifikat yang sudah terdaftar dalam sistem (0.52ms)
✔ US-2: Berhasil mencari berdasarkan nomor sertifikat secara parsial (8.82ms)
✔ US-2: Berhasil mencari berdasarkan nama pemilik secara case-insensitive (0.36ms)
✔ US-2: Berhasil mencari berdasarkan nama desa / kelurahan (0.30ms)
✔ US-2: Berhasil mencari berdasarkan nama kecamatan (0.26ms)
✔ US-2: Berhasil mencari berdasarkan nama kabupaten/kota (0.26ms)
✔ US-2: Filter jenis hak tanah Hak Milik (SHM) secara eksklusif (0.28ms)
✔ US-2: Filter jenis hak tanah Hak Guna Bangunan (HGB) (0.22ms)
✔ US-2: Filter jenis hak tanah Girik / Adat (0.24ms)
✔ US-2: Filter berdasarkan status kelengkapan dokumen COMPLETE (0.32ms)
✔ US-2: Kueri yang tidak cocok menghasilkan array kosong tanpa runtime error (0.74ms)
✔ US-3: Bidang tanah dengan 3 dokumen atau lebih dievaluasi sebagai COMPLETE (1.03ms)
✔ US-3: Bidang tanah dengan 2 dokumen dievaluasi sebagai NEEDS_REVIEW (0.17ms)
✔ US-3: Bidang tanah dengan 1 dokumen dievaluasi sebagai NEEDS_REVIEW (0.12ms)
✔ US-3: Bidang tanah tanpa dokumen (0 berkas) dievaluasi sebagai INCOMPLETE (0.12ms)
✔ US-3: Pemetaan lencana status COMPLETE menghasilkan label 'Lengkap' dan warna hijau (0.32ms)
✔ US-3: Pemetaan lencana status NEEDS_REVIEW menggunakan label 'Perlu Diperiksa' dan warna oranye (0.12ms)
✔ US-3: Pemetaan lencana status INCOMPLETE menggunakan label 'Belum Lengkap' dan warna merah (0.11ms)
✔ US-3: Setiap status kelengkapan memiliki deskripsi penjelasan yang informatif (0.12ms)
✔ US-4: Mengurutkan linimasa silsilah mutasi tanah secara kronologis (ascending: terlama ke terbaru) (2.13ms)
✔ US-4: Mengurutkan linimasa silsilah mutasi tanah dari yang terbaru (descending: terbaru ke terlama) (0.45ms)
✔ US-4: Menangani array linimasa riwayat yang kosong tanpa error (0.33ms)
✔ US-4: Menangani entri riwayat dengan tanggal tidak valid secara aman tanpa melempar exception (0.70ms)
✔ US-4: Data riwayat kepemilikan memelihara rantai transfer dari pemilik sebelumnya ke pemilik baru (0.38ms)
✔ US-4: Validasi mutasi kepemilikan menolak jika nama pemilik baru kosong (0.61ms)
✔ US-4: Validasi mutasi menolak jika nama pemilik baru identik dengan pemilik saat ini (0.36ms)
✔ US-4: Eksekusi recordOwnershipTransfer memperbarui CurrentOwnerName dan menambahkan catatan mutasi ke riwayat (0.46ms)
✔ US-5: Validasi penambahan berkas dokumen baru berhasil saat data lengkap (1.29ms)
✔ US-5: Menolak penambahan dokumen jika jenis dokumen kosong (0.25ms)
✔ US-5: Menolak penambahan dokumen jika nomor dokumen kosong (0.14ms)
✔ US-5: Menolak duplikasi nomor dokumen pada bidang tanah yang sama (1.18ms)
✔ US-5: Menolak penambahan dokumen jika format tanggal terbit tidak valid (0.25ms)
✔ US-5: Melampirkan dokumen ke tanah kosong otomatis mengubah status dari INCOMPLETE menjadi NEEDS_REVIEW (0.27ms)
✔ US-5: Melampirkan dokumen ke-3 otomatis meningkatkan status dari NEEDS_REVIEW menjadi COMPLETE (0.19ms)
✔ US-5: Mencabut dokumen dapat menurunkan status kelengkapan secara otomatis (COMPLETE menjadi NEEDS_REVIEW) (0.24ms)
✔ US-5: Kalkulasi metrik agregat dashboard menghitung jumlah total tanah dan per kategori status secara presisi (0.36ms)
✔ US-5: Kalkulasi persentase kelengkapan dashboard (completeness rate) tepat (0.29ms)

========================================================================================
RINGKASAN UJI: 70 Tests | 70 Passed | 0 Failed | 0 Skipped | Duration: ~427ms | STATUS: ALL PASSED
========================================================================================
```

---

## 4. Kesimpulan Verifikasi

Seluruh proses fresh clone dari repositori GitHub, instalasi dependensi, kompilasi build tiga modul monorepo, dan eksekusi 70 unit test berhasil berjalan 100% mulus tanpa error. Perubahan ini siap ditinjau dan digabungkan (*merged*) ke cabang `main`.
