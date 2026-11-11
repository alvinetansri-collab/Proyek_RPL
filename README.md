# Sistem Monitoring Dokumen dan Status Kepemilikan Tanah

[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-74%2F74%20PASSED-brightgreen.svg)](https://github.com/alvinetansri-collab/Proyek_RPL)
[![Pull Request](https://img.shields.io/badge/Pull%20Request-%231%20OPEN-brightgreen.svg)](https://github.com/alvinetansri-collab/Proyek_RPL/pull/1)
[![Node.js Version](https://img.shields.io/badge/Node.js-%3E%3D22.18.0-blue.svg)](https://nodejs.org/)
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
8. [Panduan Build & Deploy (Preview Lokal vs Hosting Remote)](#panduan-build--deploy-preview-lokal-vs-hosting-remote)
9. [Dokumentasi REST API Endpoints](#dokumentasi-rest-api-endpoints)
10. [Keamanan, Logging Aman, & Batasan MVP](#keamanan-logging-aman--batasan-mvp)

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
| **US-1: Pendaftaran Bidang Tanah Baru** | [`packages/shared/src/features/feature-1-search-registration/landSearch.ts`](./packages/shared/src/features/feature-1-search-registration/landSearch.ts) | Form input data fisik & legalitas tanah. Menolak jika field wajib kosong (*CertificateNumber, OwnerName, Address, Village, SubDistrict*). Luas tanah wajib $> 0\ \text{m}^2$. Mencegah duplikasi nomor sertifikat yang sudah terdaftar. |
| **US-2: Pencarian Cerdas & Filter Multi-Kriteria** | [`packages/shared/src/features/feature-1-search-registration/landSearch.ts`](./packages/shared/src/features/feature-1-search-registration/landSearch.ts) | Pencarian teks parsial & *case-insensitive* berdasarkan nomor sertifikat, nama pemilik, alamat, desa, kecamatan, kabupaten. Filter dropdown Jenis Hak (SHM, HGB, Girik/Adat) dan Filter Status Kelengkapan Dokumen. Tombol Reset Filter & penanganan data kosong. |
| **US-3: Evaluasi Otomatis Kelengkapan Dokumen** | [`packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts`](./packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts) | Aturan bisnis berbasis kuantitas berkas: $\ge 3$ dokumen = `COMPLETE` (Lengkap - Hijau), $1-2$ dokumen = `NEEDS_REVIEW` (Perlu Diperiksa - Oranye), $0$ dokumen = `INCOMPLETE` (Belum Lengkap - Merah). Pemetaan lencana Tailwind dan deskripsi ramah pengguna. |
| **US-4: Linimasa Silsilah Mutasi Kepemilikan** | [`packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts`](./packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts) | Linimasa silsilah kepemilikan dapat diurutkan secara kronologis terlama ke terbaru (Ascending) maupun mutasi terbaru (Descending). Form pencatatan mutasi hak baru (AJB, Waris, Hibah) yang otomatis memperbarui pemegang hak aktif saat ini. |
| **US-5: Manajemen Berkas & Metrik Dashboard** | [`packages/shared/src/features/feature-3-document-management/documentManager.ts`](./packages/shared/src/features/feature-3-document-management/documentManager.ts) | Form pelampiran dokumen kepemilikan baru ke bidang tanah. Validasi format berkas & pencegahan nomor dokumen ganda pada satu tanah. Pencabutan dokumen yang otomatis menurunkan status kelengkapan. Kalkulasi metrik agregat dan rasio kelengkapan dashboard (%). |

---

## Arsitektur Monorepo

```text
proyek-rpl/
├── apps/
│   ├── web/                     # Frontend UI (React 18 + Vite + Tailwind CSS)
│   │   ├── src/
│   │   │   ├── App.tsx          # Antarmuka terintegrasi seluruh fitur US-1 s/d US-5
│   │   │   ├── main.tsx
│   │   │   └── vite-env.d.ts    # Deklarasi tipe environment VITE_API_URL
│   │   ├── .env.example         # Template konfigurasi URL Backend
│   │   └── package.json
│   └── api/                     # Backend REST API (Node.js + Express + Persistent JSON)
│       ├── src/
│       │   ├── index.ts         # REST API server, CORS whitelist, router endpoints
│       │   ├── security.ts      # Sanitasi PII masking & atomic file persistence
│       │   └── logic.ts         # Validasi domain dan aturan bisnis server
│       ├── data/
│       │   └── lands.json       # Database persisten file JSON
│       └── package.json
├── packages/
│   └── shared/                  # Domain Models, Enums, Masking, & Core Business Logic
│       ├── src/
│       │   ├── enums/DocumentStatus.ts
│       │   ├── models/LandPlot.ts, Document.ts, Owner.ts, OwnershipHistory.ts
│       │   ├── security/masking.ts
│       │   ├── features/
│       │   │   ├── feature-1-search-registration/landSearch.ts
│       │   │   ├── feature-2-completeness-timeline/completenessEvaluator.ts
│       │   │   └── feature-3-document-management/documentManager.ts
│       │   └── index.ts
│       └── package.json
├── tests/                       # 8 Folder Unit Test Suites (74 Tests - All Passed)
│   ├── feature-1-search-registration/
│   ├── feature-2-completeness-timeline/
│   ├── security-audit/          # Uji PII masking, safe logging, dan atomisitas disk
│   ├── us1-land-registration/
│   ├── us2-land-search-filter/
│   ├── us3-document-completeness/
│   ├── us4-ownership-timeline/
│   └── us5-document-management-metrics/
├── demo.mp4                     # Rekaman video demonstrasi MVP (52.8 MB)
├── checklist_mvp.md             # Matriks checklist fitur dan status pengujian
├── HowToRun.md                  # Panduan skenario demonstrasi interaktif
├── SECURITY.md                  # Laporan uji keamanan, logging aman & batasan arsitektur
├── laporan_pengujian.md         # Laporan evaluasi 4 poin resmi pengujian & deployment
└── package.json                 # Skrip automasi workspace monorepo
```

---

## Panduan Instalasi Ulang (Fresh Clone Repo)

Berikut adalah panduan langkah-demi-langkah melakukan instalasi dari awal (*fresh clone*) di komputer bersih:

### 1. Prasyarat Sistem
- **Git**: Versi 2.x atau lebih baru.
- **Node.js**: **Versi `>= 22.18.0` (Rekomendasi: Node.js 22 LTS seperti v22.18.0+ atau Node.js 24)**.  
  > [!IMPORTANT]
  > **Catatan Kompatibilitas Node.js**: Skrip `npm test` mengeksekusi `node --test tests/**/*.test.ts` langsung pada berkas TypeScript tanpa loader pihak ketiga (`ts-node` / `tsx`), menggunakan kapabilitas bawaan *Native TypeScript Type Stripping* tanpa flag tambahan (`unflagged`). Pada lini Node.js 22, fitur tanpa flag ini secara resmi didukung mulai versi **v22.18.0+** (pada v22.6.0 - v22.17.0 masih memerlukan flag `--experimental-strip-types`), serta telah aktif secara default pada Node.js 24+. Jika Anda menggunakan Node.js 18 atau 20, runner pengujian memerlukan loader pihak ketiga.
- **npm**: Versi `9.x` atau lebih baru.

### 2. Kloning Repositori Bersih (Fresh Clone)
Buka Terminal / PowerShell / Command Prompt:
```bash
git clone https://github.com/alvinetansri-collab/Proyek_RPL.git
cd Proyek_RPL
```

### 3. Pembuatan Cabang & Verifikasi Pull Request Aktual
Untuk menguji dalam cabang terisolasi atau memeriksa Pull Request resmi:
```bash
git checkout -b test/verify-fresh-clone
```
*Tautan Pull Request Resmi & Terverifikasi di GitHub:*  
👉 **[Pull Request #1: test/verify-fresh-clone into main](https://github.com/alvinetansri-collab/Proyek_RPL/pull/1)**  
*(Status: Terbuka/Open, lolos seluruh pengujian unit test dan kompilasi build)*

### 4. Instalasi Dependensi Monorepo
Jalankan instalasi paket di root proyek:
```bash
npm install
```
*(Catatan Windows: Jika eksekusi script dibatasi oleh execution policy, gunakan `npm.cmd install`)*

### 5. Kompilasi Build Seluruh Modul
Kompilasi paket monorepo:
```bash
npm run build
```
Rincian proses kompilasi:
- `packages/shared`: Mengeksekusi `tsc --noEmit` untuk memvalidasi tipe TypeScript seluruh modul tanpa menghasilkan folder `dist/` (karena modul ini dikonsumsi langsung oleh workspace).
- `apps/api`: Mengompilasi TypeScript ke artefak CommonJS di folder `apps/api/dist/`.
- `apps/web`: Mengompilasi TypeScript dan mem-bundling aset web Vite teroptimasi ke folder `apps/web/dist/`.

Pastikan seluruh paket berhasil dikompilasi tanpa error (`exit code 0`).

### 6. Jalankan Pengujian Unit Test
Verifikasi keandalan kode dengan menjalankan 74 unit test:
```bash
npm test
```
Seluruh 74 pengujian wajib berstatus **All Passed (0 failed, 0 skipped)**.

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
Indikator di pojok kanan atas header akan menampilkan badge hijau: **"Backend API Terhubung (Port 5000)"**.

### Opsi B: Menjalankan Mode Standalone Frontend (Penyimpanan Lokal Aktif)
Jika tidak ingin menyalakan backend API:
```bash
npm run dev:web
```
Akses `http://localhost:3000/`. Aplikasi secara otomatis beralih ke **Mode Standalone (Penyimpanan Lokal Aktif via LocalStorage)**. Semua fitur tambah tanah, lampir dokumen, mutasi hak, dan pencarian tetap berjalan normal dan tersimpan di browser.

---

## Menjalankan Unit Test (Wajib All Passed)

Pengujian dibangun menggunakan *native test runner* bawaan Node.js:

```bash
# Menjalankan seluruh 74 unit test (8 test suites)
npm test

# Menjalankan spesifik per-user story
npm run test:us1     # Registrasi bidang tanah & validasi sertifikat
npm run test:us2     # Pencarian dinamis & filter multi-kriteria
npm run test:us3     # Evaluasi status kelengkapan dokumen
npm run test:us4     # Linimasa silsilah mutasi tanah
npm run test:us5     # Manajemen berkas dokumen & metrik dashboard

# Menjalankan modul fitur asli & audit keamanan
npm run test:feat1   # Fitur 1 asli
npm run test:feat2   # Fitur 2 asli
```

**Hasil Pengujian Terverifikasi:**
```text
ℹ tests 74
ℹ suites 0
ℹ pass 74
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms ~490ms
```

---

## Panduan Build & Deploy (Preview Lokal vs Hosting Remote)

Repositori ini membedakan secara transparan antara pengujian build lokal (*Local Production Preview*) dan panduan deployment ke hosting jarak jauh (*Remote Cloud Deployment*):

### 1. Local Production Preview (Simulasi Lingkungan Produksi Lokal)
Digunakan untuk memvalidasi bundle hasil build sebelum di-deploy ke server:
1. **Build Monorepo:**
   ```bash
   npm run build
   ```
2. **Jalankan Server API Produksi:**
   ```bash
   npm run start:api
   ```
   *Menjalankan bundle `apps/api/dist/index.js` di port 5000.*
3. **Jalankan Vite Preview Frontend:**
   ```bash
   npm run preview:web
   ```
   *Vite preview melayani file teroptimasi di `apps/web/dist` pada `http://localhost:4173`.*

---

### 2. Panduan Remote Cloud Deployment

Jika Anda ingin mendeploy sistem ke server hosting publik (Vercel, Netlify, Docker, atau VPS):

#### A. Konfigurasi Endpoint Backend Dinamis:
Frontend tidak meng-hardcode alamat server. Sebelum melakukan build frontend, tentukan URL Backend melalui file `.env` di direktori `apps/web`:
```bash
# Contoh pada apps/web/.env (lihat apps/web/.env.example)
VITE_API_URL=https://api-landtracker.domain-anda.com/api
```
Saat dijalankan di hosting publik, browser pengguna akan menghubungi endpoint API remote tersebut.

#### B. Deployment Backend (Node.js Container / VPS / Railway):
1. Pastikan port `5000` (atau `PORT` dari environment) dibuka.
2. Tentukan domain frontend yang diizinkan pada variabel lingkungan `CORS_ORIGIN`:
   ```bash
   CORS_ORIGIN=https://landtracker.domain-anda.com
   ```
3. Jalankan server melalui `npm run start:api`.

#### C. Deployment Frontend (Vercel / Netlify / Nginx):
1. Jalankan build: `npm run build:web`.
2. Arahkan direktori publik / publish directory ke folder **`apps/web/dist`**.
3. Pastikan rewrite SPA aktif (`/* -> /index.html`).

---

## Dokumentasi REST API Endpoints

Server Backend API Express beroperasi di `http://localhost:5000`:

| Method | Endpoint | Deskripsi | Status Code |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Health check status server, storage mode, dan jumlah data | `200 OK` |
| `GET` | `/api/lands` | Mengambil data tanah dengan filter query `search`, `rightType`, `completenessStatus` | `200 OK` |
| `POST` | `/api/lands` | Mendaftarkan bidang tanah baru dengan validasi field & sertifikat unik | `201 Created` / `400 Bad Request` / `500 Error` |
| `GET` | `/api/lands/:id/detail` | Mengambil detail lengkap satu bidang tanah beserta dokumen dan linimasa | `200 OK` / `404 Not Found` |
| `POST` | `/api/lands/:id/documents` | Melampirkan berkas dokumen baru & re-evaluasi status otomatis | `201 Created` / `400 Bad Request` / `500 Error` |
| `DELETE` | `/api/lands/:id/documents/:docId` | Mencabut berkas dokumen & re-evaluasi status otomatis | `200 OK` / `404 Not Found` / `500 Error` |
| `POST` | `/api/lands/:id/histories` | Mencatat mutasi kepemilikan tanah & memperbarui pemilik aktif | `201 Created` / `400 Bad Request` / `500 Error` |
| `DELETE` | `/api/lands/:id` | Menghapus bidang tanah dari sistem secara permanen | `200 OK` / `404 Not Found` / `500 Error` |
| `POST` | `/api/reset-demo` | Mengembalikan database disk ke data mock demo awal | `200 OK` / `500 Error` |

---

## Keamanan, Logging Aman, & Batasan MVP

Untuk rincian lengkap mengenai hasil audit keamanan, format log tersanitasi, serta analisis perbaikan error, silakan membaca dokumen:
👉 **[`SECURITY.md`](./SECURITY.md)** dan **[`laporan_pengujian.md`](./laporan_pengujian.md)**

### Ringkasan Praktik Keamanan & Transparansi Batasan:
1. **Audit Dependensi Produksi**: Dependensi runtime produksi (`body-parser`, `qs`, `express`, `cors`) bersih dari kerentanan (*0 vulnerabilities*) terverifikasi per 11 November 2026 melalui `npm audit --omit=dev`.
2. **Pemindaian Riwayat Git (Secret Scan)**: Seluruh riwayat commit Git dari awal proyek hingga commit terkini telah dipindai secara otomatis; terbukti **0 token/secret produksi**. Kredensial yang ada hanyalah password mock/dummy untuk kontainer lokal (`rootpassword` di `docker-compose.yml` & `.env.example`).
3. **Perlindungan Data Sensitif (PII Masking Komprehensif)**: NIK (16 digit), nomor seluler, maupun telepon kabel PSTN lokal/interlokal secara otomatis disamarkan dalam log audit:
   - NIK Asli: `3271012345670001` $\rightarrow$ Log: `3271********0001`
   - Telepon Seluler: `081234567890` $\rightarrow$ Log: `0812****90`
   - Telepon Internasional: `+62 812-3456-7890` $\rightarrow$ Log: `+62812****90`
   - Telepon Kabel PSTN: `021-87901234` atau `0251-8321234` atau `(021) 1234567` $\rightarrow$ Log: `021****34` / `(021)****67`
4. **Sanitasi Path Internal Multi-Format & Pencegahan Log Injection (CWE-117)**: Logger Express menyensor seluruh varian path internal sistem (Windows backslash `C:\...`, forward-slash `C:/...`, File URI `file:///...`, UNC `\\?\...`, dan POSIX `/opt`, `/root`, `/var`, `/data` diganti menjadi `[INTERNAL_PATH]`) serta menyaring karakter baris baru (`\r`, `\n`) guna mencegah serangan Log Forging/CRLF Injection.
5. **Penanganan Error Terpusat (Centralized Error Handler)**: Seluruh unhandled error pada pipeline Express (termasuk penolakan CORS origin dan error sintaks JSON malformed) ditangkap oleh middleware error terpusat yang selalu mengembalikan respons JSON tersanitasi (HTTP 403 Forbidden untuk CORS, HTTP 400 Bad Request untuk JSON error, HTTP 500 untuk server error) tanpa membocorkan stack trace internal ke klien.
6. **Penyimpanan Atomik & Rollback State**: Penyimpanan ke berkas disk menggunakan berkas sementara lalu `renameSync` untuk mencegah korupsi data. Jika operasi disk gagal, server me-rollback state in-memory dan mengembalikan status HTTP 500.
7. **CORS Origin Whitelist Terbatas**: Menggunakan whitelist origin ketat (`localhost:3000`, `localhost:4173`, `localhost:5173`) dengan dukungan dinamis konfigurasi `process.env.CORS_ORIGIN`.
8. **Batasan Arsitektural MVP (Transparansi)**:
   - Sistem saat ini merupakan prototipe MVP tanpa modul autentikasi sesi pengguna (login/session/JWT) dan tanpa Role-Based Access Control (RBAC).
   - Seluruh endpoint mutasi terbuka untuk kebutuhan pengujian demo lokal.
   - Pembedaan peran (SuperAdmin, BPN Verifikator, Notaris) dan enkripsi at-rest tercatat sebagai backlog pengembangan tahap lanjut.
