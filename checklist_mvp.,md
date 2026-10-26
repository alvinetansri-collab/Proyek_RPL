# Checklist Seluruh Fitur MVP & Status Pengujian
## Sistem Monitoring Dokumen dan Status Kepemilikan Tanah

> **Status Akhir MVP**: **SELESAI 100% (READY FOR DEMO)**  
> **Status Seluruh Unit Test**: **ALL PASSED (63/63 Tests Lulus - 0 Failures)**  
> **Status Integrasi**: **UI React + Logika Bisnis Monorepo Shared + REST API & Penyimpanan Persisten Terhubung**

---

### 1. Checklist Fitur Inti MVP

| ID Fitur | Deskripsi Fitur | Lingkup MVP | Status Implementasi | Status Pengujian |
| :--- | :--- | :--- | :---: | :---: |
| **US-1 / Fitur 1** | **Pendaftaran Bidang Tanah Baru**<br>- Form input data fisik & legalitas tanah<br>- Validasi nomor sertifikat wajib & unik<br>- Validasi luas tanah $> 0\ \text{m}^2$<br>- Validasi seluruh field wajib (pemilik, alamat, desa, kecamatan) | Inti | **SELESAI** | **PASSED** (9 tests) |
| **US-2 / Fitur 1** | **Pencarian Cerdas & Filter Multi-Kriteria**<br>- Pencarian teks parsial & *case-insensitive* (sertifikat, pemilik, desa, kecamatan, kabupaten)<br>- Filter dropdown Jenis Hak Tanah (SHM, HGB, Hak Pakai, Girik/Adat)<br>- Filter status kelengkapan dokumen<br>- Tombol reset filter & penanganan data kosong | Inti | **SELESAI** | **PASSED** (10 tests) |
| **US-3 / Fitur 2** | **Evaluasi Otomatis Kelengkapan Dokumen**<br>- Aturan bisnis: $\ge 3$ berkas = `COMPLETE` (Hijau), $1-2$ berkas = `NEEDS_REVIEW` (Oranye), $0$ berkas = `INCOMPLETE` (Merah)<br>- Pemetaan lencana status, warna, dan deskripsi penjelasan | Inti | **SELESAI** | **PASSED** (8 tests) |
| **US-4 / Fitur 2** | **Linimasa Silsilah Riwayat Kepemilikan**<br>- Pengurutan kronologis terlama ke terbaru (Ascending)<br>- Pengurutan mutasi terakhir (Descending)<br>- Pencatatan mutasi hak baru (AJB, Waris, Hibah, dll.)<br>- Pembaruan pemilik terdaftar aktif secara otomatis<br>- Penanganan tanggal tidak valid secara aman | Inti | **SELESAI** | **PASSED** (8 tests) |
| **US-5 / Fitur 3** | **Manajemen Berkas Dokumen & Metrik Dashboard**<br>- Lampirkan berkas kepemilikan baru<br>- Validasi berkas & pencegahan nomor dokumen duplikat<br>- Re-evaluasi status kelengkapan otomatis secara real-time<br>- Pencabutan / penghapusan berkas dokumen<br>- Kalkulasi metrik agregat total & rasio kelengkapan (%) | Inti | **SELESAI** | **PASSED** (10 tests) |
| **Fitur 1 (Suite)** | **Pengujian Regresi Fitur 1 Asli** | Regresi | **SELESAI** | **PASSED** (9 tests) |
| **Fitur 2 (Suite)** | **Pengujian Regresi Fitur 2 Asli** | Regresi | **SELESAI** | **PASSED** (9 tests) |
| **Integrasi API** | **Backend REST API & Persistent Storage**<br>- Endpoint CRUD lengkap (`/api/lands`, `/documents`, `/histories`)<br>- Penyimpanan persisten file JSON (`data/lands.json`)<br>- Sinkronisasi LocalStorage di client saat offline | Inti | **SELESAI** | **PASSED** (Endpoint Verified) |
| **Fitur Demo** | **Alat Bantu Demonstrasi & UX**<br>- Toast feedback notifikasi real-time<br>- Dialog konfirmasi hapus data tanah<br>- Tombol Reset Demo Data bawaan<br>- Tombol Ekspor Data Rekapitulasi (JSON)<br>- Interaktivitas kartu dashboard untuk filter cepat | Pendukung | **SELESAI** | **PASSED** (Interaktif) |

---

### 2. Matriks Rincian Unit Testing (63 Tests - ALL PASSED)

Hasil eksekusi terminal perintah: `npm test`

```text
> test
> node --test tests/**/*.test.ts

✔ Fitur 1 - Pencarian: Berhasil mencari berdasarkan nomor sertifikat secara parsial
✔ Fitur 1 - Pencarian: Berhasil mencari berdasarkan nama pemilik (case-insensitive)
✔ Fitur 1 - Pencarian: Berhasil mencari berdasarkan wilayah kecamatan / kabupaten
✔ Fitur 1 - Pencarian: Mengembalikan array kosong jika kueri pencarian tidak cocok
✔ Fitur 1 - Pencarian: Filter kombinasi teks pencarian dan jenis hak tanah
✔ Fitur 1 - Validasi: Lolos validasi saat data pendaftaran tanah lengkap dan benar
✔ Fitur 1 - Validasi: Menolak pendaftaran jika nomor sertifikat kosong
✔ Fitur 1 - Validasi: Menolak pendaftaran jika nomor sertifikat sudah ada (duplikat)
✔ Fitur 1 - Validasi: Menolak pendaftaran jika luas tanah <= 0 atau tidak valid
✔ Fitur 2 - Evaluasi: Menghasilkan status COMPLETE jika terdapat minimal 3 dokumen
✔ Fitur 2 - Evaluasi: Menghasilkan status NEEDS_REVIEW jika terdapat 1 atau 2 dokumen
✔ Fitur 2 - Evaluasi: Menghasilkan status INCOMPLETE jika belum ada dokumen yang dicatat
✔ Fitur 2 - Standar Lencana Warna: Status COMPLETE menggunakan label 'Lengkap' dan warna hijau
✔ Fitur 2 - Standar Lencana Warna: Status NEEDS_REVIEW menggunakan label 'Perlu Diperiksa' dan warna oranye
✔ Fitur 2 - Standar Lencana Warna: Status INCOMPLETE menggunakan label 'Belum Lengkap' dan warna merah
✔ Fitur 2 - Linimasa Riwayat: Mengurutkan silsilah perpindahan hak tanah secara kronologis (ascending)
✔ Fitur 2 - Linimasa Riwayat: Mengurutkan silsilah perpindahan hak tanah dari yang terbaru (descending)
✔ Fitur 2 - Metrik Dashboard: Menghitung akumulasi statistik ringkasan dan rasio kelengkapan
✔ US-1: Pendaftaran bidang tanah baru berhasil jika seluruh field wajib valid
✔ US-1: Menolak pendaftaran jika nomor sertifikat kosong
✔ US-1: Menolak pendaftaran jika nama pemilik kosong
✔ US-1: Menolak pendaftaran jika alamat bidang tanah kosong
✔ US-1: Menolak pendaftaran jika desa / kelurahan kosong
✔ US-1: Menolak pendaftaran jika kecamatan kosong
✔ US-1: Menolak pendaftaran jika luas tanah bernilai 0
✔ US-1: Menolak pendaftaran jika luas tanah bernilai negatif
✔ US-1: Mencegah duplikasi nomor sertifikat yang sudah terdaftar dalam sistem
✔ US-2: Berhasil mencari berdasarkan nomor sertifikat secara parsial
✔ US-2: Berhasil mencari berdasarkan nama pemilik secara case-insensitive
✔ US-2: Berhasil mencari berdasarkan nama desa / kelurahan
✔ US-2: Berhasil mencari berdasarkan nama kecamatan
✔ US-2: Berhasil mencari berdasarkan nama kabupaten/kota
✔ US-2: Filter jenis hak tanah Hak Milik (SHM) secara eksklusif
✔ US-2: Filter jenis hak tanah Hak Guna Bangunan (HGB)
✔ US-2: Filter jenis hak tanah Girik / Adat
✔ US-2: Filter berdasarkan status kelengkapan dokumen COMPLETE
✔ US-2: Kueri yang tidak cocok menghasilkan array kosong tanpa runtime error
✔ US-3: Bidang tanah dengan 3 dokumen atau lebih dievaluasi sebagai COMPLETE
✔ US-3: Bidang tanah dengan 2 dokumen dievaluasi sebagai NEEDS_REVIEW
✔ US-3: Bidang tanah dengan 1 dokumen dievaluasi sebagai NEEDS_REVIEW
✔ US-3: Bidang tanah tanpa dokumen (0 berkas) dievaluasi sebagai INCOMPLETE
✔ US-3: Pemetaan lencana status COMPLETE menghasilkan label 'Lengkap' dan warna hijau
✔ US-3: Pemetaan lencana status NEEDS_REVIEW menghasilkan label 'Perlu Diperiksa' dan warna oranye
✔ US-3: Pemetaan lencana status INCOMPLETE menghasilkan label 'Belum Lengkap' dan warna merah
✔ US-3: Setiap status kelengkapan memiliki deskripsi penjelasan yang informatif
✔ US-4: Mengurutkan linimasa silsilah mutasi tanah secara kronologis (ascending: terlama ke terbaru)
✔ US-4: Mengurutkan linimasa silsilah mutasi tanah dari yang terbaru (descending: terbaru ke terlama)
✔ US-4: Menangani array linimasa riwayat yang kosong tanpa error
✔ US-4: Menangani entri riwayat dengan tanggal tidak valid secara aman tanpa melempar exception
✔ US-4: Data riwayat kepemilikan memelihara rantai transfer dari pemilik sebelumnya ke pemilik baru
✔ US-4: Validasi mutasi kepemilikan menolak jika nama pemilik baru kosong
✔ US-4: Validasi mutasi menolak jika nama pemilik baru identik dengan pemilik saat ini
✔ US-4: Eksekusi recordOwnershipTransfer memperbarui CurrentOwnerName dan menambahkan catatan mutasi ke riwayat
✔ US-5: Validasi penambahan berkas dokumen baru berhasil saat data lengkap
✔ US-5: Menolak penambahan dokumen jika jenis dokumen kosong
✔ US-5: Menolak penambahan dokumen jika nomor dokumen kosong
✔ US-5: Menolak duplikasi nomor dokumen pada bidang tanah yang sama
✔ US-5: Menolak penambahan dokumen jika format tanggal terbit tidak valid
✔ US-5: Melampirkan dokumen ke tanah kosong otomatis mengubah status dari INCOMPLETE menjadi NEEDS_REVIEW
✔ US-5: Melampirkan dokumen ke-3 otomatis meningkatkan status dari NEEDS_REVIEW menjadi COMPLETE
✔ US-5: Mencabut dokumen dapat menurunkan status kelengkapan secara otomatis (COMPLETE menjadi NEEDS_REVIEW)
✔ US-5: Kalkulasi metrik agregat dashboard menghitung jumlah total tanah dan per kategori status secara presisi
✔ US-5: Kalkulasi persentase kelengkapan dashboard (completeness rate) tepat

==================================================
TOTAL UJI: 63 | LULUS: 63 | GAGAL: 0 | STATUS: ALL PASSED
==================================================
```

---

### 3. Matriks Acceptance Criteria (AC) vs Bukti Implementasi

| User Story | Kriteria Penerimaan (Acceptance Criteria) | Bukti Pengujian & Implementasi |
| :--- | :--- | :--- |
| **US-1: Registrasi Tanah** | 1. Sistem menolak pendaftaran jika ada field wajib kosong.<br>2. Luas tanah wajib berupa angka positif $> 0$.<br>3. Mencegah duplikasi nomor sertifikat. | Lulus pengujian `US-1: Menolak pendaftaran jika nomor sertifikat kosong` & `luas tanah bernilai negatif`. Form UI menampilkan alert merah interaktif. |
| **US-2: Pencarian & Filter** | 1. Pencarian teks mencakup nomor sertifikat, pemilik, dan wilayah.<br>2. Filter jenis hak tanah membatasi hasil secara akurat.<br>3. Pencarian tanpa kecocokan menampilkan empty state tanpa error. | Lulus 10 unit tests pada suite `US-2`. UI menampilkan empty state ramah pengguna dengan tombol *"Tampilkan Semua Data"*. |
| **US-3: Evaluasi Kelengkapan** | 1. $\ge 3$ dokumen dievaluasi `COMPLETE` (Hijau).<br>2. $1 - 2$ dokumen dievaluasi `NEEDS_REVIEW` (Oranye).<br>3. $0$ dokumen dievaluasi `INCOMPLETE` (Merah). | Lulus 8 unit tests pada suite `US-3`. Badge warna Tailwind (`bg-green-100`, `bg-orange-100`, `bg-red-100`) dirender di tabel dan modal. |
| **US-4: Linimasa Kepemilikan** | 1. Linimasa dapat diurutkan secara kronologis (Ascending & Descending).<br>2. Catatan mutasi baru memperbarui pemilik aktif tanah.<br>3. Menolak mutasi jika pemilik baru sama dengan pemilik aktif. | Lulus 8 unit tests pada suite `US-4`. Form mutasi di UI memperbarui state, database, dan linimasa secara otomatis. |
| **US-5: Dokumen & Metrik** | 1. Validasi berkas dokumen lengkap & tanggal valid.<br>2. Mencegah nomor dokumen yang sama pada satu bidang tanah.<br>3. Penambahan/pencabutan berkas seketika memperbarui status kelengkapan tanah dan kartu metrik dashboard. | Lulus 10 unit tests pada suite `US-5`. Penambahan dokumen ke-3 otomatis menaikkan status menjadi `COMPLETE`. |

---

### 4. Penanganan Kondisi Khusus (Edge Cases & Resilience)

1. **Input Tidak Valid (Form Validation)**:
   - Form pendaftaran tanah dan form dokumen melakukan validasi lokal dan server secara simultan. Jika terjadi kesalahan, pesan kesalahan spesifik per-field dimunculkan tanpa me-refresh halaman.
2. **Data Kosong (Empty States)**:
   - Jika pencarian menghasilkan 0 data, tabel menampilkan ikon pencarian dan tombol *"Tampilkan Semua Data"*.
   - Jika bidang tanah belum memiliki dokumen atau mutasi, modal menampilkan pesan informatif dengan instruksi melampirkan berkas pertama.
3. **Loading State**:
   - Terdapat spinner animasi saat data pertama kali dimuat dari backend API, serta status tombol *disabled* (`"Menyimpan..."`) saat transaksi sedang diproses untuk mencegah *double submit*.
4. **Resiliensi Kegagalan Server / Offline Mode**:
   - Jika server backend API (`localhost:5000`) tidak aktif, aplikasi secara otomatis beralih ke **Mode Standalone (Penyimpanan Lokal Aktif)** menggunakan `localStorage`. Data pengguna tidak akan hilang saat halaman di-refresh.
   - Indikator koneksi di header memberikan informasi transparan apakah sistem sedang terhubung ke API atau menggunakan penyimpanan lokal.
