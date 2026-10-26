# Panduan Menjalankan Aplikasi (HowToRun.md)
## Sistem Monitoring Dokumen dan Status Kepemilikan Tanah (MVP Final)

Dokumen ini berisi petunjuk lengkap instalasi, kompilasi build, eksekusi seluruh pengujian (unit testing), serta panduan langkah demi langkah menjalankan demonstrasi aplikasi.

---

### 1. Prasyarat Sistem

Pastikan perangkat Anda telah terpasang:
- **Node.js**: Versi `18.x`, `20.x`, atau `22.x/24.x` (Direkomendasikan Node.js LTS).
- **npm**: Versi `9.x` atau lebih baru.
- **Sistem Operasi**: Windows, macOS, atau Linux.
- **Web Browser**: Google Chrome, Microsoft Edge, Mozilla Firefox, atau Safari versi modern.

Untuk memverifikasi instalasi di terminal / PowerShell:
```bash
node -v
npm -v
```

---

### 2. Struktur Proyek Monorepo

```text
proyek-rpl/
├── apps/
│   ├── web/                     # Frontend UI (React 18 + Vite + Tailwind CSS)
│   │   ├── src/
│   │   │   ├── App.tsx          # Antarmuka utama terintegrasi
│   │   │   └── main.tsx
│   │   └── package.json
│   └── api/                     # Backend API (Node.js + Express + Persistent JSON Storage)
│       ├── src/
│       │   ├── index.ts         # REST API server & router endpoints
│       │   └── logic.ts         # Logika validasi dan aturan bisnis backend
│       ├── data/
│       │   └── lands.json       # Penyimpanan data persisten lokal
│       └── package.json
├── packages/
│   └── shared/                  # Domain Models, Enums, & Core Business Logic
│       ├── src/
│       │   ├── enums/DocumentStatus.ts
│       │   ├── models/LandPlot.ts, Document.ts, Owner.ts, OwnershipHistory.ts
│       │   ├── features/
│       │   │   ├── feature-1-search-registration/landSearch.ts
│       │   │   ├── feature-2-completeness-timeline/completenessEvaluator.ts
│       │   │   └── feature-3-document-management/documentManager.ts
│       │   └── index.ts
│       └── package.json
├── tests/                       # Seluruh Folder Unit Test (63 Tests - All Passed)
│   ├── feature-1-search-registration/
│   ├── feature-2-completeness-timeline/
│   ├── us1-land-registration/
│   ├── us2-land-search-filter/
│   ├── us3-document-completeness/
│   ├── us4-ownership-timeline/
│   └── us5-document-management-metrics/
├── package.json                 # Skrip automasi root
├── HowToRun.md                  # Petunjuk ini
└── checklist_mvp.md             # Matriks checklist fitur & status pengujian
```

---

### 3. Instalasi Dependensi & Build

Jalankan perintah berikut di folder akar proyek (`c:\Users\hp5cd\Documents\proyek rpl`):

#### A. Instalasi Dependensi Seluruh Workspace
```bash
npm install
```
*(Pada sistem Windows PowerShell jika ada pembatasan script execution, gunakan `npm.cmd install`)*

#### B. Build Seluruh Paket (Shared, API, dan Web)
```bash
npm run build
```
Perintah ini akan mengompilasi `@proyek-rpl/shared`, `apps/api`, dan mem-bundle `apps/web` (Vite) untuk memastikan tidak ada kesalahan tipe TypeScript.

---

### 4. Menjalankan Unit Test (Wajib All Passed)

Seluruh logika bisnis proyek diuji menggunakan Node.js native test runner.

#### A. Menjalankan Semua Unit Test Sekaligus (63 Test Cases)
```bash
npm test
```
*Hasil yang diharapkan:*
```text
ℹ tests 63
ℹ suites 0
ℹ pass 63
ℹ fail 0
ℹ duration_ms ~400ms
```

#### B. Menjalankan Unit Test Berdasarkan Modul Tertentu
- **Fitur 1 (Registrasi & Pencarian)**: `npm run test:feat1`
- **Fitur 2 (Kelengkapan & Linimasa)**: `npm run test:feat2`
- **US-1 (Pendaftaran Tanah & Validasi Sertifikat)**: `npm run test:us1`
- **US-2 (Pencarian Dinamis & Filter Multi-Kriteria)**: `npm run test:us2`
- **US-3 (Evaluasi Status Dokumen & Lencana Warna)**: `npm run test:us3`
- **US-4 (Linimasa Silsilah & Mutasi Hak)**: `npm run test:us4`
- **US-5 (Manajemen Dokumen & Metrik Dashboard)**: `npm run test:us5`

---

### 5. Cara Menjalankan Aplikasi

Aplikasi dirancang tangguh (*resilient*), dapat dijalankan dalam mode **Fullstack (Web + API)** maupun mode **Standalone Frontend**:

#### Opsi 1: Menjalankan Fullstack (Sangat Direkomendasikan untuk Demonstrasi)
Buka 2 jendela terminal:

**Terminal 1 (Backend API Port 5000):**
```bash
npm run dev:api
```
*(Server backend akan aktif di `http://localhost:5000` dengan penyimpanan persisten di `apps/api/data/lands.json`)*.  
Anda dapat memeriksa status server melalui: `http://localhost:5000/api/health`.

**Terminal 2 (Frontend Web Port 3000):**
```bash
npm run dev:web
```
*(Buka browser Anda dan akses: `http://localhost:3000/`)*.  
Badge di pojok kanan atas header akan menampilkan: **"Backend API Terhubung (Port 5000)"** dengan indikator hijau berkedip.

#### Opsi 2: Menjalankan Frontend Saja (Mode Standalone)
Jika Anda hanya ingin mendemonstrasikan frontend:
```bash
npm run dev:web
```
Akses `http://localhost:3000/`. Aplikasi secara otomatis mendeteksi ketiadaan backend dan mengaktifkan **Mode Standalone (Penyimpanan Lokal Aktif via LocalStorage)**. Semua operasi tambah tanah, lampir dokumen, mutasi hak, dan filter tetap berjalan 100% lancar dan tersimpan di browser!

---

### 6. Panduan Alur Skenario Demonstrasi (Demo Walkthrough)

Ikuti langkah-langkah di bawah ini untuk menunjukkan seluruh fungsionalitas MVP kepada penguji/dosen:

#### Skenario 1: Dashboard & Ringkasan Metrik (US-3 & US-5)
1. Buka `http://localhost:3000/`.
2. Perhatikan 4 kartu metrik di bagian atas:
   - **Total Bidang Tanah**
   - **Dokumen Lengkap** (Status hijau $\ge 3$ berkas)
   - **Perlu Diperiksa** (Status oranye $1 - 2$ berkas)
   - **Belum Lengkap** (Status merah $0$ berkas)
3. **Interaktivitas Kartu**: Klik kartu "Dokumen Lengkap" -> tabel otomatis terfilter hanya menampilkan tanah dengan status lengkap. Klik "Total Bidang Tanah" untuk mereset tampilan.

#### Skenario 2: Pendaftaran Bidang Tanah Baru (US-1)
1. Klik tombol hijau **"➕ Tambah Bidang Tanah"**.
2. **Uji Validasi Error**:
   - Biarkan form kosong lalu klik "Simpan Pendaftaran".
   - Sistem akan menampilkan daftar validasi merah (nomor sertifikat wajib, nama wajib, alamat wajib, luas tanah harus $> 0$).
   - Masukkan nomor sertifikat yang sudah ada (misal: `SHM-12.04.2023.001`), sistem menolak dengan pesan duplikasi sertifikat.
3. **Pendaftaran Sukses**:
   - No. Sertifikat: `SHM-99.2024.777`
   - Nama Pemilik: `Drs. Hermawan Susanto`
   - Luas: `350`
   - Jenis Hak: `Hak Milik (SHM)`
   - Alamat: `Jl. Pajajaran Indah No. 88`
   - Desa: `Baranangsiang`, Kecamatan: `Bogor Timur`
   - Klik **Simpan Pendaftaran**.
4. Muncul notifikasi toast hijau di pojok kanan bawah. Bidang tanah baru langsung masuk ke baris teratas dengan status awal **"Belum Lengkap"** (0 berkas).

#### Skenario 3: Pencarian Cerdas & Filter Multi-Kriteria (US-2)
1. Pada kotak pencarian, ketik nama pemilik: `budi`, sistem langsung menampilkan tanah milik Budi Santoso secara real-time.
2. Ketik nama kecamatan: `sentul` atau `megamendung`.
3. Gunakan filter dropdown **Jenis Hak** (misal: pilih `Hak Guna Bangunan (HGB)`).
4. Gunakan filter dropdown **Status Berkas** (misal: pilih `Perlu Diperiksa`).
5. Klik **"Reset Filter"** untuk mengembalikan semua data.

#### Skenario 4: Detail Tanah, Evaluasi Berkas, & Lampirkan Dokumen (US-3 & US-5)
1. Pada tanah yang baru didaftarkan (`SHM-99.2024.777`), klik **"Lihat Detail"**.
2. Status kelengkapan awal adalah **"Belum Lengkap"** (Merah).
3. Klik tombol **"➕ Lampirkan Dokumen Baru"**:
   - Pilih Jenis Dokumen: `Akta Jual Beli (AJB)`
   - No. Dokumen: `AJB-777/2024`
   - Tanggal: Hari ini
   - Klik **Simpan Berkas Dokumen**.
4. **Perhatikan Perubahan Real-time**:
   - Berkas ke-1 masuk -> status tanah otomatis naik menjadi **"Perlu Diperiksa"** (Oranye).
   - Metrik di dashboard langsung ter-update.
5. Lampirkan dokumen ke-2: `SPPT PBB Terverifikasi` (`PBB-2024-777`).
6. Lampirkan dokumen ke-3: `Sertifikat Hak Milik` (`SHM-ORIGINAL-777`).
   - Berkas ke-3 masuk -> status tanah otomatis naik menjadi **"Lengkap"** (Hijau).
7. **Pencabutan Berkas**: Klik tombol "Cabut" pada salah satu dokumen, status otomatis turun kembali ke **"Perlu Diperiksa"**.

#### Skenario 5: Linimasa Silsilah Riwayat & Catat Mutasi Tanah (US-4)
1. Pada jendela modal detail, gulir ke bagian **"Silsilah Linimasa Riwayat Mutasi"**.
2. Klik tombol **"Urutkan: Terlama / Terbaru"** untuk melihat perubahan urutan kronologis.
3. Klik tombol **"🔄 Catat Peralihan Hak / Mutasi"**:
   - Jenis Peralihan: `Akta Jual Beli (AJB)`
   - Nama Pemilik Baru: `Hj. Nurhayati`
   - NIK: `3271015509920005`
   - Tanggal: Hari ini
   - Alamat Domisili Baru: `Jl. Riau No. 12, Bandung`
   - Klik **Simpan Mutasi Kepemilikan**.
4. **Hasil**:
   - Nama pemegang hak terdaftar aktif langsung berubah menjadi `Hj. Nurhayati`.
   - Entri baru ditambahkan ke diagram linimasa: *"Dari: Drs. Hermawan Susanto ➔ Ke: Hj. Nurhayati"*.

#### Skenario 6: Fitur Ekspor Data & Reset Demo
1. Klik tombol **"📥 Ekspor JSON"** di header atas untuk mengunduh salinan berkas rekapitulasi data tanah dalam format JSON.
2. Jika ingin mengulangi demonstrasi dari kondisi bersih, klik **"🔄 Reset Demo"** di header atas. Seluruh data seketika kembali ke 3 sampel data demo standar.

---

### 7. Daftar Endpoint REST Backend API

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Status server, mode penyimpanan, dan jumlah data |
| `GET` | `/api/lands` | Daftar tanah dengan filter query `search`, `rightType`, `completenessStatus` |
| `POST` | `/api/lands` | Mendaftarkan bidang tanah baru dengan validasi |
| `GET` | `/api/lands/:id/detail` | Mendapatkan detail bidang tanah, dokumen, dan riwayat |
| `POST` | `/api/lands/:id/documents` | Menambahkan berkas dokumen dan re-evaluasi status |
| `DELETE` | `/api/lands/:id/documents/:docId` | Mencabut berkas dokumen dan re-evaluasi status |
| `POST` | `/api/lands/:id/histories` | Mencatat mutasi kepemilikan dan memperbarui pemilik aktif |
| `DELETE` | `/api/lands/:id` | Menghapus bidang tanah dari sistem |
| `POST` | `/api/reset-demo` | Mengembalikan data ke konfigurasi awal bawaan demo |

