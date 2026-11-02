# Sistem Monitoring Dokumen dan Status Kepemilikan Tanah

[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-63%2F63%20PASSED-brightgreen.svg)](https://github.com/alvinetansri-collab/Proyek_RPL)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-blue.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-4.5-646cff.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey.svg)](https://expressjs.com/)
[![Security Audit](https://img.shields.io/badge/Security%20Audit-Zero%20High%20Vulnerabilities-success.svg)](./SECURITY.md)

Platform terintegrasi untuk pencatatan bidang tanah, verifikasi dan evaluasi kelengkapan berkas fisik/digital secara otomatis, pelacakan linimasa mutasi silsilah kepemilikan, dan pencegahan sengketa agraria melalui validasi anti-duplikasi sertifikat.

---

## 📹 Video Demonstrasi Aplikasi
Video demonstrasi interaktif seluruh alur sistem monitoring tanah (MVP) tersedia langsung di dalam repositori:
- **Berkas Video**: [`demo.mp4`](./demo.mp4) (Resolusi HD 720p, 52.8 MB)

---

## 📑 Daftar Isi
1. [Deskripsi & Latar Belakang Masalah](#deskripsi--latar-belakang-masalah)
2. [Profil Pengguna & Manfaat](#profil-pengguna--manfaat)
3. [Fitur Inti MVP (5 User Stories)](#fitur-inti-mvp-5-user-stories)
4. [Arsitektur Monorepo](#arsitektur-monorepo)
5. [Panduan Instalasi Ulang (Fresh Clone Repo)](#panduan-instalasi-ulang-fresh-clone-repo)
6. [Cara Menjalankan & Mengakses Aplikasi](#cara-menjalankan--mengakses-aplikasi)
7. [Menjalankan Unit Test (Wajib All Passed)](#menjalankan-unit-test-wajib-all-passed)
8. [Panduan Build & Deploy Production Preview](#panduan-build--deploy-production-preview)
9. [Dokumentasi REST API Endpoints](#dokumentasi-rest-api-endpoints)
10. [Keamanan & Logging Aman](#keamanan--logging-aman)

---

## Deskripsi & Latar Belakang Masalah

Kepemilikan bidang tanah sering menjadi sumber perselisihan di masyarakat, terutama saat transaksi jual-beli, pembagian warisan, maupun pemenuhan kebutuhan administrasi pertanahan. Sengketa sering kali dipicu oleh:
1. Ketidakpastian riwayat peralihan hak (mutasi tanah) yang tidak tercatat runut.
2. Dokumen kepemilikan fisik yang tercecer atau tidak diketahui kelengkapannya.
3. Duplikasi klaim kepemilikan akibat ketiadaan sistem verifikasi nomor sertifikat terpusat.

**Tujuan Aplikasi:**  
Aplikasi ini bukan untuk menentukan keabsahan hukum formal sertifikat, melainkan menyediakan sarana operasional cerdas untuk mengelola arsip kepemilikan tanah, mengevaluasi kelengkapan dokumen pendukung secara otomatis, dan menyajikan linimasa silsilah perpindahan hak tanah secara transparan dan kronologis.

---

## Profil Pengguna & Manfaat

### Target Pengguna:
- **Petugas Pencatatan / Arsiparis Pertanahan**: Mendaftarkan tanah baru dan melampirkan berkas fisik.
- **Verifikator / Analis Dokumen**: Memeriksa status kelengkapan dokumen tanah secara instan.
- **Notaris / PPAT / Petugas Mutasi**: Mencatat peralihan hak kepemilikan (AJB, Waris, Hibah) dan memantau linimasa kepemilikan.
- **Pemilik Tanah / Keluarga**: Mengetahui silsilah kepemilikan dan status kelengkapan berkas aset tanah mereka.

### Manfaat Utama:
- **Pencegahan Duplikasi**: Menolak sertifikat ganda dengan validasi anti-duplikasi saat pendaftaran.
- **Evaluasi Otomatis**: Standar lencana status (Lengkap / Perlu Diperiksa / Belum Lengkap) dengan indikator visual.
- **Linimasa Riwayat Terpadu**: Silsilah mutasi dapat diurutkan secara kronologis (Ascending / Descending).
- **Dashboard Ringkasan Real-Time**: Metrik statistik dan persentase kelengkapan seluruh berkas secara terpadu.
- **Resiliensi Operasional**: Mendukung mode Fullstack (API + Database Persisten JSON) dan mode Standalone (LocalStorage) saat offline.

---

## Fitur Inti MVP (5 User Stories)

| User Story | Modul & Implementasi | Kriteria Penerimaan (Acceptance Criteria) |
| :--- | :--- | :--- |
| **US-1: Pendaftaran Bidang Tanah Baru** | `packages/shared/src/features/feature-1-search-registration/landSearch.ts` | Form input data fisik & legalitas tanah. Menolak jika field wajib kosong (*CertificateNumber, OwnerName, Address, Village, SubDistrict*). Luas tanah wajib $> 0\ \text{m}^2$. Mencegah duplikasi nomor sertifikat yang sudah terdaftar. |
| **US-2: Pencarian Cerdas & Filter Multi-Kriteria** | `packages/shared/src/features/feature-1-search-registration/landSearch.ts` | Pencarian teks parsial & *case-insensitive* berdasarkan nomor sertifikat, nama pemilik, alamat, desa, kecamatan, kabupaten. Filter dropdown Jenis Hak (SHM, HGB, Girik/Adat) dan Filter Status Kelengkapan Dokumen. Tombol Reset Filter & penanganan data kosong. |
| **US-3: Evaluasi Otomatis Kelengkapan Dokumen** | `packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts` | Aturan bisnis berbasis kuantitas berkas: $\ge 3$ dokumen = `COMPLETE` (Lengkap - Hijau), $1-2$ dokumen = `NEEDS_REVIEW` (Perlu Diperiksa - Oranye), $0$ dokumen = `INCOMPLETE` (Belum Lengkap - Merah). Pemetaan lencana Tailwind dan deskripsi ramah pengguna. |
| **US-4: Linimasa Silsilah Mutasi Kepemilikan** | `packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts` | Linimasa silsilah kepemilikan dapat diurutkan secara kronologis terlama ke terbaru (Ascending) maupun mutasi terbaru (Descending). Form pencatatan mutasi hak baru (AJB, Waris, Hibah) yang otomatis memperbarui pemegang hak aktif saat ini. |
| **US-5: Manajemen Berkas & Metrik Dashboard** | `packages/shared/src/features/feature-3-document-management/documentManager.ts` | Form pelampiran dokumen kepemilikan baru ke bidang tanah. Validasi format berkas & pencegahan nomor dokumen ganda pada satu tanah. Pencabutan dokumen yang otomatis menurunkan status kelengkapan. Kalkulasi metrik agregat dan rasio kelengkapan dashboard (%). |

---

## Arsitektur Monorepo

```text
proyek-rpl/
├── apps/
│   ├── web/                     # Frontend UI (React 18 + Vite + Tailwind CSS)
│   │   ├── src/
│   │   │   ├── App.tsx          # Antarmuka terintegrasi seluruh fitur US-1 s/d US-5
│   │   │   └── main.tsx
│   │   └── package.json
│   └── api/                     # Backend REST API (Node.js + Express + Persistent JSON)
│       ├── src/
│       │   ├── index.ts         # REST API server, security logging, router endpoints
│       │   └── logic.ts         # Validasi domain dan aturan bisnis server
│       ├── data/
│       │   └── lands.json       # Database persisten file JSON
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
├── tests/                       # 7 Folder Unit Test Suites (63 Tests - All Passed)
│   ├── feature-1-search-registration/
│   ├── feature-2-completeness-timeline/
│   ├── us1-land-registration/
│   ├── us2-land-search-filter/
│   ├── us3-document-completeness/
│   ├── us4-ownership-timeline/
│   └── us5-document-management-metrics/
├── demo.mp4                     # Rekaman video demonstrasi MVP (52.8 MB)
├── checklist_mvp.md             # Matriks checklist fitur dan status pengujian
├── HowToRun.md                  # Panduan skenario demonstrasi interaktif
├── SECURITY.md                  # Laporan uji keamanan, logging aman & troubleshooting
└── package.json                 # Skrip automasi workspace monorepo
```

---

## Panduan Instalasi Ulang (Fresh Clone Repo)

Berikut adalah panduan langkah-demi-langkah melakukan instalasi dari awal (*fresh clone*) di komputer bersih:

### 1. Prasyarat Sistem
- **Git**: Terpasang di perangkat.
- **Node.js**: Versi `18.x`, `20.x`, atau `22.x/24.x` (LTS direkomendasikan).
- **npm**: Versi `9.x` atau lebih baru.

### 2. Kloning Repositori Bersih (Fresh Clone)
Buka Terminal / PowerShell / Command Prompt:
```bash
git clone https://github.com/alvinetansri-collab/Proyek_RPL.git
cd Proyek_RPL
```

### 3. Instalasi Dependensi Monorepo
Jalankan instalasi paket di root proyek:
```bash
npm install
```
*(Catatan Windows: Jika eksekusi script dibatasi oleh execution policy, gunakan `npm.cmd install`)*

### 4. Kompilasi Build Seluruh Modul
Kompilasi paket `@proyek-rpl/shared`, `apps/api`, dan `apps/web`:
```bash
npm run build
```
Pastikan seluruh paket berhasil dikompilasi tanpa error (`exit code 0`).

### 5. Jalankan Pengujian Unit Test
Verifikasi keandalan kode dengan menjalankan 63 unit test:
```bash
npm test
```
Seluruh 63 pengujian wajib berstatus **All Passed (0 failed)**.

---

## Cara Menjalankan & Mengakses Aplikasi

Aplikasi memiliki dua opsi eksekusi:

### Opsi A: Menjalankan Fullstack (Web + API Server) — *Direkomendasikan*
Buka 2 jendela terminal:

**Terminal 1 (Backend API Port 5000):**
```bash
npm run dev:api
```
*Backend aktif di `http://localhost:5000` dengan data tersimpan di `apps/api/data/lands.json`.*

**Terminal 2 (Frontend Web Port 3000):**
```bash
npm run dev:web
```
*Buka browser Anda dan akses: **`http://localhost:3000/`**.*  
Indikator di pojok kanan atas header akan menampilkan badge hijau menyala: **"Backend API Terhubung (Port 5000)"**.

### Opsi B: Menjalankan Mode Standalone Frontend (Penyimpanan Lokal Aktif)
Jika tidak ingin menyalakan backend API:
```bash
npm run dev:web
```
Akses `http://localhost:3000/`. Aplikasi secara cerdas beralih ke **Mode Standalone (Penyimpanan Lokal Aktif via LocalStorage)**. Semua fitur tambah tanah, lampir dokumen, mutasi hak, dan pencarian tetap berjalan 100% lancar dan tersimpan di browser.

---

## Menjalankan Unit Test (Wajib All Passed)

Pengujian dibangun menggunakan *native test runner* Node.js tanpa dependensi pihak ketiga yang berat:

```bash
# Menjalankan seluruh 63 unit test (7 test suites)
npm test

# Menjalankan spesifik per-user story
npm run test:us1     # Registrasi bidang tanah & validasi sertifikat
npm run test:us2     # Pencarian dinamis & filter multi-kriteria
npm run test:us3     # Evaluasi status kelengkapan dokumen
npm run test:us4     # Linimasa silsilah mutasi tanah
npm run test:us5     # Manajemen berkas dokumen & metrik dashboard

# Menjalankan modul fitur asli
npm run test:feat1   # Fitur 1 asli
npm run test:feat2   # Fitur 2 asli
```

**Hasil Pengujian:**
```text
ℹ tests 63
ℹ suites 0
ℹ pass 63
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms ~300ms
```

---

## Panduan Build & Deploy Production Preview

Untuk menguji build versi produksi (*production bundle*) sebelum dideploy ke server hosting:

1. **Build Monorepo untuk Produksi:**
   ```bash
   npm run build
   ```

2. **Jalankan Server Production API:**
   ```bash
   npm run start:api
   ```
   *Menjalankan bundle `apps/api/dist/index.js` di port 5000.*

3. **Jalankan Production Preview Frontend:**
   ```bash
   npm run preview:web
   ```
   *Vite preview akan melayani file teroptimasi di `apps/web/dist` pada `http://localhost:4173` atau `http://localhost:3000`.*

---

## Dokumentasi REST API Endpoints

Server Backend API Express beroperasi di `http://localhost:5000`:

| Method | Endpoint | Deskripsi | Status Code |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Health check status server, storage mode, dan jumlah data | `200 OK` |
| `GET` | `/api/lands` | Mengambil data tanah dengan filter query `search`, `rightType`, `completenessStatus` | `200 OK` |
| `POST` | `/api/lands` | Mendaftarkan bidang tanah baru dengan validasi field & sertifikat unik | `201 Created` / `400 Bad Request` |
| `GET` | `/api/lands/:id/detail` | Mengambil detail lengkap satu bidang tanah beserta dokumen dan linimasa | `200 OK` / `404 Not Found` |
| `POST` | `/api/lands/:id/documents` | Melampirkan berkas dokumen baru & re-evaluasi status otomatis | `201 Created` / `400 Bad Request` |
| `DELETE` | `/api/lands/:id/documents/:docId` | Mencabut berkas dokumen & re-evaluasi status otomatis | `200 OK` / `404 Not Found` |
| `POST` | `/api/lands/:id/histories` | Mencatat mutasi kepemilikan tanah & memperbarui pemilik aktif | `201 Created` / `400 Bad Request` |
| `DELETE` | `/api/lands/:id` | Menghapus bidang tanah dari sistem secara permanen | `200 OK` / `404 Not Found` |

---

## Keamanan & Logging Aman

Untuk rincian lengkap mengenai hasil uji keamanan, sanitasi PII (*Personally Identifiable Information*), serta studi kasus penanganan error, silakan membaca dokumen:
👉 **[`SECURITY.md`](./SECURITY.md)**

### Ringkasan Praktik Keamanan:
1. **Audit Dependensi**: Dependensi telah diaudit (`npm audit`), kerentanan High pada `body-parser` dan `qs` telah diperbaiki.
2. **Perlindungan Data Sensitif (PII Masking)**: NIK (16 digit) dan nomor telepon secara otomatis disamarkan dalam log audit:
   - NIK Asli: `3271012345670001` $\rightarrow$ Log: `3271********0001`
   - Telepon Asli: `081234567890` $\rightarrow$ Log: `0812****90`
3. **Pencegahan Kebocoran Stack Trace**: Respons error ke pengguna hanya mengembalikan pesan yang aman dan ramah pengguna tanpa membocorkan struktur internal server atau database.
4. **Validasi Anti-Duplikasi & Input**: Seluruh input divalidasi ganda (*defense-in-depth*) baik di sisi client maupun server.
