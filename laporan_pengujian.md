# Laporan Evaluasi Teknis, Keamanan, dan Deployment MVP
## Sistem Monitoring Dokumen dan Status Kepemilikan Tanah

Dokumen ini memuat laporan resmi dan komprehensif atas empat komponen utama pengujian, standar keamanan, dan kesiapan operasional sistem:
- **01. Hasil Uji Security dan Catatan Perubahan yang Relevan**
- **02. Panduan README: Instalasi Ulang dan Akses Aplikasi / Paket Demo (Fresh Clone Repo, Build, Deploy)**
- **03. Contoh Log Aman, Penyebab Error, dan Tindakan Perbaikannya**
- **04. Verifikasi Fresh Clone, Pull Request, Install, Run, Build, Deploy, dan Bukti Unit Test All Passed**

---

## 01. Hasil Uji Security dan Catatan Perubahan yang Relevan

### A. Audit Keamanan Dependensi (Software Composition Analysis)
Pengujian kerentanan dependensi monorepo dilakukan menggunakan tool resmi `npm audit` terhadap 266 paket yang terpasang pada seluruh workspace (`apps/web`, `apps/api`, `packages/shared`).

#### 1. Temuan Awal Kerentanan:
Pada pemindaian awal repositori, terdeteksi beberapa kerentanan pada dependensi transitif pihak ketiga:
- **`body-parser < 1.20.9` (Tingkat Keparahan: HIGH - GHSA-27r3-jxmh-p828)**: Kerentanan *Denial of Service* (DoS) melalui manipulasi *trailing bytes* pada request body terkompresi.
- **`qs 6.7.0 - 6.16.0` (Tingkat Keparahan: MODERATE - GHSA-6pq8-jhm2-2vcw)**: Kesalahan penanganan unhandled TypeError pada elemen array non-string yang berpotensi DoS.
- **`postcss-selector-parser < 6.1.5` (Tingkat Keparahan: MODERATE - GHSA-rj75-hqrm-r3gf)**: Kompleksitas parsing kuadratik pada flat selector parsing.

#### 2. Tindakan Remediasi, Bukti Pemindaian Produksi & Verifikasi Riwayat Git:
- **Commit Patching**: Commit [`69f04e5`](https://github.com/alvinetansri-collab/Proyek_RPL/commit/69f04e58151304d36693a9812fe35088b3212d12) (2 November 2026) memperbarui dependensi melalui `npm audit fix`.
- **Hasil Pemindaian Dependensi Produksi Runtime (5 November 2026)**:
  Perintah resmi audit dependensi produksi:
  ```bash
  npm audit --omit=dev
  ```
  **Output Terverifikasi:**
  ```text
  found 0 vulnerabilities
  ```
  Seluruh dependensi runtime server produksi (`express`, `body-parser`, `cors`, `qs`) berstatus **0 kerentanan (0 HIGH, 0 MODERATE, 0 LOW)**.
- **Pemindaian Riwayat Komit Git Bebas Secret Produksi (5 November 2026)**:
  Seluruh riwayat commit Git dari awal proyek hingga commit terkini telah dipindai menggunakan skrip regex pendeteksi secret/token (API tokens, private keys, bearer authorization, AWS/Stripe/GitHub keys). Hasil: **0 production secret ditemukan di seluruh riwayat Git**. Kredensial yang tercatat hanyalah password dummy pengembang lokal (`rootpassword` di `docker-compose.yml` & `.env.example`).
- Kerentanan tersisa pada pemindaian dev hanyalah modul perkakas pengembangan lokal (`vite` -> `esbuild` dev server), yang tidak disertakan dalam bundle rilis produksi (`apps/api/dist` dan `apps/web/dist`).

---

### B. Evaluasi Keamanan Lapisan Aplikasi (OWASP Top 10 Evaluation Matrix)

Evaluasi berikut menyajikan tinjauan objektif dan transparan terhadap 10 kategori ancaman keamanan aplikasi web OWASP Top 10, membedakan secara jujur antara mekanisme proteksi yang telah aktif dan batasan arsitektural yang didokumentasikan sebagai backlog:

| Kategori Ancaman OWASP | Status Implementasi | Evaluasi Teknis, Kontrol Keamanan, & Batasan |
| :--- | :---: | :--- |
| **A01: Broken Access Control & IDOR** | **`[!] LIMITASI MVP`**<br>*(Backlog Arsitektur)* | **Evaluasi Transparan**: Pemeriksaan `landIndex !== -1` pada endpoint API semata-mata merupakan validasi keberadaan entitas data di memori untuk mencegah *null pointer exception*, bukan kontrol otorisasi pengguna. Pada versi MVP saat ini, sistem belum mengimplementasikan mekanisme autentikasi (login/session token/JWT) maupun *Role-Based Access Control* (RBAC). Endpoint pembacaan, modifikasi, penambahan dokumen, pencatatan mutasi, penghapusan tanah, dan reset demo terbuka secara publik pada antarmuka demo lokal. Rencana perbaikan: Middleware verifikasi JWT dan matriks peran pengguna (SuperAdmin BPN, Verifikator Dokumen, Notaris/PPAT, Publik) tercatat sebagai prioritas backlog pengembangan fase berikutnya. |
| **A02: Cryptographic Failures & PII Exposure** | **`[OK] AMAN DENGAN CATATAN`** | Data sensitif masyarakat berupa NIK 16 digit, nomor telepon seluler (`08xx`, `+62xx`), dan telepon kabel PSTN (`021-87901234`, `(021) 1234567`) otomatis disamarkan (*masked*) pada log sistem melalui `maskPII()`. Path absolut komputer disensor (`[INTERNAL_PATH]`) dan karakter CRLF dibersihkan. **Transparansi Kredensial**: Repositori memuat kredensial template default untuk simulasi pengembang lokal pada [`docker-compose.yml`](./docker-compose.yml) (`rootpassword`) dan [`.env.example`](./.env.example). Seluruh riwayat commit Git telah dipindai dan terbukti 100% bebas dari token/secret produksi. |
| **A03: Injection (SQL / NoSQL / Command Injection / CRLF)** | **`[OK] AMAN`** | Logika aplikasi menggunakan domain logic bertipe TypeScript ketat ([`packages/shared`](./packages/shared)). Tidak ada konstruksi query SQL mentah berbasis konkatenasi string. Penyimpanan data JSON menggunakan fungsi terisolasi `JSON.stringify` dan `JSON.parse` yang tervalidasi. LoggerExpress mensterilkan karakter baris baru (`\r`, `\n`) untuk mencegah serangan CRLF / Log Forging (CWE-117). |
| **A04: Insecure Design** | **`[OK] AMAN`** | Validasi aturan bisnis diterapkan ganda (*Defense-in-Depth*): di sisi antarmuka React dan di sisi server Express. Nomor sertifikat ganda langsung ditolak pada tahap validasi awal sebelum penyimpanan. |
| **A05: Security Misconfiguration** | **`[OK] AMAN (Whitelist Origin & Error Handler)`** | Server API Express mengonfigurasi middleware CORS dengan *origin whitelist* eksplisit (`http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:4173`, `http://localhost:5173`) serta mendukung variabel lingkungan `CORS_ORIGIN` untuk deployment hosting remote. Request dari origin tidak dikenal akan ditolak (HTTP 403 Forbidden). Ditambahkan **Centralized Error Handler** yang menangani error penolakan CORS dan malformed JSON syntax tanpa membocorkan stack trace internal. |
| **A06: Vulnerable and Outdated Components** | **`[OK] AMAN`** | Pustaka diaudit berkala melalui `npm audit --omit=dev`, seluruh dependensi runtime server berada pada versi bebas kerentanan (0 vulnerabilities). |
| **A07: Identification and Authentication Failures** | **`[!] LIMITASI MVP`**<br>*(Backlog Arsitektur)* | **Evaluasi Transparan**: Sistem saat ini belum mengimplementasikan otentikasi identitas operator (belum ada login/password/MFA). Linimasa riwayat mutasi kepemilikan berfungsi sebagai jejak historis silsilah bisnis pertanahan (*business provenance audit trail*), bukan sebagai mekanisme tanda tangan digital kriptografis atau otentikasi identitas pengguna. |
| **A08: Software and Data Integrity Failures** | **`[OK] AMAN (Atomic File Persistence)`** | Fungsi [`saveLandsToDisk()`](./apps/api/src/index.ts) menggunakan mekanisme penulisan atomik: menulis ke file sementara (`lands.json.tmp.<timestamp>`) terlebih dahulu, lalu mengeksekusi `fs.renameSync` secara atomik ke file target. Jika penyimpanan disk gagal, `safeLog("ERROR", ...)` mencatat rincian kegagalan, state di-rollback, dan endpoint mengembalikan status HTTP 500 ke client, mencegah respons sukses palsu saat disk penuh/rusak. |
| **A09: Security Logging and Monitoring Failures** | **`[OK] AMAN (Tersanitasi PII & Path)`** | Setiap aksi pendaftaran tanah, penambahan dokumen, mutasi hak, validasi gagal, dan penghapusan dicatat ke log server berformat terstruktur dengan penandaan level `INFO`, `WARN`, `ERROR`, dan `AUDIT`. Logger menyamarkan NIK, nomor telepon seluler/PSTN, menyensor path absolut komputer (`[INTERNAL_PATH]`), dan membersihkan CRLF injection (CWE-117). |
| **A10: Server-Side Request Forgery (SSRF)** | **`[OK] AMAN`** | Server API tidak menerima URL dinamis dari input pengguna untuk melakukan panggilan HTTP outbound ke pihak ketiga. |

---

### C. Catatan Perubahan Keamanan (Security Changelog)

| Tanggal | ID Perubahan | Rincian Perubahan Keamanan | Modul Terkait |
| :---: | :---: | :--- | :--- |
| **2026-11-05** | `SEC-010` | **Pencegahan CWE-117 Log Injection & Sensor Path Internal**: Menyaring newline (`\r`, `\n`) dan menyensor path lokal absolut sistem (`[INTERNAL_PATH]`) pada pesan log dan metadata. | [`apps/api/src/security.ts`](./apps/api/src/security.ts) |
| **2026-11-05** | `SEC-011` | **Penanganan Error Terpusat (Centralized Error Handler)**: Menambahkan middleware Express terpusat untuk CORS origin rejection (HTTP 403) dan JSON parser SyntaxError (HTTP 400) dengan respons JSON tersanitasi. | [`apps/api/src/index.ts`](./apps/api/src/index.ts) |
| **2026-11-05** | `SEC-012` | **Penyempurnaan Masking PSTN Landline**: Mendukung masking nomor format kabel PSTN lokal/interlokal seperti `021-87901234` atau `(021) 1234567` menjadi `021****34` dan `(021)****67`. | [`packages/shared/src/security/masking.ts`](./packages/shared/src/security/masking.ts), [`apps/api/src/security.ts`](./apps/api/src/security.ts) |
| **2026-11-05** | `SEC-013` | **Verifikasi Dependensi Produksi & Pemindaian Riwayat Git**: Pemindaian bertanggal `npm audit --omit=dev` membuktikan 0 kerentanan pada paket produksi runtime, dan pemindaian seluruh commit Git membuktikan 0 token/secret produksi bocor. | Monorepo Root |
| **2026-11-04** | `SEC-006` | **Penyimpanan Atomik & Error Handling HTTP 500**: Mengimplementasikan `atomicWriteFileSync` (temp file + renameSync) untuk mencegah korupsi file JSON saat crash, serta propagasi kegagalan disk ke client sebagai status HTTP 500. | [`apps/api/src/security.ts`](./apps/api/src/security.ts), [`apps/api/src/index.ts`](./apps/api/src/index.ts) |
| **2026-11-04** | `SEC-007` | **CORS Origin Whitelist Eksplisit**: Mengganti wildcard CORS terbuka dengan whitelist origin lokal terdaftar dan dukungan dinamis variabel `CORS_ORIGIN`. | [`apps/api/src/index.ts`](./apps/api/src/index.ts) |
| **2026-11-04** | `SEC-008` | **Penyempurnaan PII Masking Multi-Format**: Memperluas regex `maskPII()` untuk menyamarkan nomor telepon format internasional `+62`, kode area `(021)`, serta nomor dengan pemisah strip atau spasi. | [`packages/shared/src/security/masking.ts`](./packages/shared/src/security/masking.ts), [`apps/api/src/security.ts`](./apps/api/src/security.ts) |
| **2026-11-04** | `SEC-009` | **Dynamic Frontend API Endpoint**: Menghapus hardcoded URL API localhost pada frontend React, menggantikannya dengan `import.meta.env.VITE_API_URL` untuk kesiapan hosting cloud. | [`apps/web/src/App.tsx`](./apps/web/src/App.tsx), [`apps/web/.env.example`](./apps/web/.env.example) |
| **2026-11-02** | `SEC-001` | **Remediasi Kerentanan Dependensi**: Memperbarui `body-parser` dan `qs` ke versi aman via `npm audit fix` guna mencegah DoS payload (commit `69f04e5`). | `package-lock.json` |
| **2026-11-02** | `SEC-002` | **Penerapan PII Masking pada Logger Server**: Menambahkan fungsi `maskPII()` untuk menyamarkan 8 digit tengah NIK dan nomor telepon pada terminal server dan file log. | [`apps/api/src/index.ts`](./apps/api/src/index.ts) |
| **2026-11-02** | `SEC-003` | **Sanitasi Pesan Kesalahan Server**: Mengganti respons error internal server agar tidak mengirimkan raw stack trace atau path direktori lokal komputer ke client. | [`apps/api/src/index.ts`](./apps/api/src/index.ts) |
| **2026-10-27** | `SEC-004` | **Validasi Aturan Bisnis Ganda (Client & Server)**: Memastikan nomor sertifikat unik, luas tanah positif ($> 0$), dan nomor dokumen tidak duplikat divalidasi identik pada shared module. | [`packages/shared`](./packages/shared), [`apps/api`](./apps/api) |
| **2026-10-26** | `SEC-005` | **Resilience Fallback & Storage Isolation**: Mengisolasi penyimpanan data lokal client ke `localStorage` dengan penanganan aman terhadap kuota browser. | [`apps/web/src/App.tsx`](./apps/web/src/App.tsx) |

---

## 02. Panduan README: Instalasi Ulang dan Akses Aplikasi / Paket Demo

Seluruh petunjuk instalasi ulang dan akses aplikasi dari repositori bersih telah disinkronkan ke berkas utama [`README.md`](./README.md).

### A. Panduan Instalasi Ulang dari FRESH CLONE REPO

#### 1. Prasyarat Sistem
- **Git**: Versi 2.x atau lebih baru.
- **Node.js**: **Versi `>= 22.18.0` (Rekomendasi: Node.js 22 LTS seperti v22.18.0+ atau Node.js 24)**.  
  > [!IMPORTANT]
  > **Rasionalisasi Versi Node.js**: Skrip `npm test` mengeksekusi perintah `node --test tests/**/*.test.ts` langsung pada berkas TypeScript tanpa loader pihak ketiga (`ts-node` / `tsx`), dengan memanfaatkan fitur bawaan *Native TypeScript Type Stripping* tanpa flag tambahan (`unflagged`). Pada lini Node.js 22, fitur tanpa flag ini secara resmi didukung mulai versi **v22.18.0+** (pada rentang v22.6.0 s/d v22.17.0 masih memerlukan flag `--experimental-strip-types`), dan aktif secara default pada Node.js 24+. Jika menggunakan Node.js 18 atau 20, runner pengujian memerlukan loader pihak ketiga.
- **npm**: Versi `9.x` atau lebih baru.
- **Web Browser**: Chrome, Edge, Firefox, atau Safari versi modern.

#### 2. Kloning Repositori Bersih (*Fresh Clone*)
Buka Terminal / PowerShell / Command Prompt:
```bash
git clone https://github.com/alvinetansri-collab/Proyek_RPL.git
cd Proyek_RPL
```

#### 3. Instalasi Dependensi Monorepo
Jalankan perintah instalasi di folder root proyek:
```bash
npm install
```
*(Catatan Windows: Jika eksekusi script dibatasi oleh execution policy PowerShell, gunakan `npm.cmd install`)*

#### 4. Kompilasi Build Seluruh Modul Monorepo
Kompilasi seluruh modul monorepo:
```bash
npm run build
```
Rincian eksekusi build:
- `packages/shared`: Mengeksekusi `tsc --noEmit` untuk memvalidasi tipe TypeScript seluruh modul tanpa menghasilkan folder `dist/` (karena modul ini dikonsumsi langsung oleh workspace).
- `apps/api`: Mengompilasi TypeScript ke artefak CommonJS di folder `apps/api/dist/`.
- `apps/web`: Mengompilasi TypeScript dan mem-bundling aset web Vite teroptimasi ke folder `apps/web/dist/`.

Pastikan proses build selesai dengan `exit code 0`.

#### 5. Eksekusi Pengujian Unit Test
Verifikasi keandalan logika bisnis dan keamanan dengan menjalankan unit test:
```bash
npm test
```
Seluruh 74 unit test wajib berstatus **All Passed (0 failed, 0 skipped)**.

---

### B. Cara Menjalankan & Mengakses Aplikasi

#### Opsi 1: Mode Fullstack (Web + Server API) — *Sangat Direkomendasikan*
Buka 2 jendela terminal:

**Terminal 1 (Backend API Server):**
```bash
npm run dev:api
```
*Server aktif di `http://localhost:5000` dengan data tersimpan di `apps/api/data/lands.json`.*

**Terminal 2 (Frontend Web Client):**
```bash
npm run dev:web
```
*Buka browser dan akses: **`http://localhost:3000/`**.*  
Badge di pojok kanan atas header akan menampilkan indikator hijau: **"Backend API Terhubung (Port 5000)"**.

#### Opsi 2: Mode Standalone Frontend (Offline LocalStorage)
Jika Anda hanya ingin menjalankan frontend tanpa menyalakan backend API:
```bash
npm run dev:web
```
Akses `http://localhost:3000/`. Aplikasi secara otomatis beralih ke **Mode Standalone (Penyimpanan Lokal Aktif via LocalStorage)**. Semua fitur registrasi tanah, pencarian, pelampiran dokumen, dan mutasi silsilah tetap berjalan 100% normal dan data tersimpan di browser.

---

### C. Paket Demo & Akses Video Demonstrasi
- **Berkas Video Demo**: [`demo.mp4`](./demo.mp4) (Resolusi HD 720p, ukuran 52.8 MB, tersimpan langsung di repositori).
- **Data Mock Bawaan**: Repositori sudah dilengkapi dengan 3 data tanah realistis (SHM Bogor, HGB Sentul, Girik Megamendung) untuk mempermudah demonstrasi langsung.

---

### D. Panduan Build & Deploy (Preview Lokal vs Hosting Remote)

Dokumentasi ini membedakan secara tegas antara pengujian build lokal dan panduan deployment ke server hosting publik:

#### 1. Local Production Preview (Simulasi Build Lokal)
Untuk menguji artefak terkompilasi sebelum di-deploy ke hosting publik:
```bash
# 1. Build seluruh proyek
npm run build

# 2. Jalankan server produksi API (Port 5000)
npm run start:api

# 3. Jalankan serving preview frontend produksi (Vite Preview di Port 4173)
npm run preview:web
```

#### 2. Panduan Remote Cloud Deployment (Hosting Publik)
Jika aplikasi hendak di-hosting di server publik (Vercel, Netlify, Railway, Docker, atau VPS):
- **Konfigurasi Dynamic Backend**: Pada `apps/web/.env`, atur `VITE_API_URL` ke domain backend hosting (misal `https://api.domain-anda.com/api`).
- **Konfigurasi CORS Backend**: Pada server backend, atur variabel lingkungan `CORS_ORIGIN=https://landtracker.domain-anda.com` agar server menerima request dari frontend hosting.
- **Frontend Build**: Jalankan `npm run build:web` dan publikasikan folder **`apps/web/dist`** ke layanan static hosting.

---

## 03. Contoh Log Aman, Penyebab Error, dan Tindakan Perbaikannya

### A. Perbandingan Contoh Log Tidak Aman vs Log Aman

#### 1. Contoh Log yang TIDAK AMAN (Rentan Kebocoran Data PII & Sistem)
```text
# CONTOH BURUK 1: Kebocoran PII (NIK & Nomor Telepon Lengkap Tercetak di Log)
[2026-11-04T15:20:00Z] [DEBUG] User input: {"name": "Budi Santoso", "nik": "3271012345670001", "phone": "081234567890", "address": "Jl. Merdeka No. 45"}

# CONTOH BURUK 2: Kebocoran Stack Trace & Path Direktori Internal Komputer
[2026-11-04T15:21:15Z] [ERROR] InternalServerError: connect ECONNREFUSED 127.0.0.1:3306
   at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1146:16)
   at C:\Users\hp5cd\Documents\proyek rpl\apps\api\src\database.ts:45:12
   Database password leaked: db_pass_secret_2026
```

#### 2. Contoh Log yang AMAN (Tersanitasi, Bebas CRLF, & Terstruktur)
*Implementasi nyata pada [`apps/api/src/index.ts`](./apps/api/src/index.ts) dan [`apps/api/src/security.ts`](./apps/api/src/security.ts):*

```text
# CONTOH AMAN 1: Pendaftaran Bidang Tanah Baru (PII Seluler & PSTN Disamarkan Otomatis)
[2026-11-05T09:27:30.901Z] [INFO] HTTP POST /api/lands
[2026-11-05T09:27:30.905Z] [AUDIT] Pendaftaran tanah baru: SHM-12.04.2024.999 (Pemilik: Muhammad Farhan, Luas: 150 m²) | {"nik":"3201********0002","phone":"0812****90"}
[2026-11-05T09:27:35.120Z] [AUDIT] Pendaftaran kontak kantor: Pemilik Kantor Jakarta Pusat | {"phone":"021****34","fax":"(021)****67"}

# CONTOH AMAN 2: Penanganan Validasi Gagal (Tercatat di Level WARN Tanpa Membocorkan Error Sensitif)
[2026-11-05T09:28:02.500Z] [WARN] Validasi pendaftaran tanah gagal: Nomor sertifikat 'SHM-12.04.2023.001' sudah terdaftar dalam sistem. | {"certificateNumber":"SHM-12.04.2023.001","ownerName":"Muhammad Farhan"}

# CONTOH AMAN 3: Pelampiran Dokumen Baru
[2026-11-05T09:28:10.812Z] [INFO] HTTP POST /api/lands/land-001/documents
[2026-11-05T09:28:10.825Z] [AUDIT] Dokumen terlampir pada SHM-12.04.2023.001: Akta Jual Beli (AJB) (AJB-12/PPAT/2020) - Status baru: COMPLETE

# CONTOH AMAN 4: Penolakan CORS Origin Tidak Dikenal (Ditangkap Centralized Error Handler - HTTP 403)
[2026-11-05T09:28:45.310Z] [WARN] CORS blocked request from unauthorized origin: https://malicious-site.com
# Respons klien: HTTP 403 {"error":"CORS: Origin https://malicious-site.com tidak diizinkan oleh sistem."}

# CONTOH AMAN 5: Payload JSON Malformed (Ditangkap Centralized Error Handler - HTTP 400)
[2026-11-05T09:29:01.100Z] [WARN] Format JSON request tidak valid / malformed body
# Respons klien: HTTP 400 {"error":"Sintaks JSON tidak valid. Periksa kembali body payload Anda."}

# CONTOH AMAN 6: Penanganan Error Disk & Sensor Path Internal (CRLF Dibersihkan, Path Disensor)
[2026-11-05T09:30:00.120Z] [ERROR] Gagal menyimpan data ke disk secara atomik | Error saat menulis ke [INTERNAL_PATH]: EACCES: permission denied
```

#### 3. Implementasi Sanitasi PII, Sensor Path, & Error Handler pada Kode:
```typescript
// 1. Sanitasi PII (NIK, Seluler, Internasional, PSTN Landline) - packages/shared/src/security/masking.ts
export function maskPII(text: string): string {
  if (!text) return text;
  return text
    // Masking NIK: 16 digit angka berurutan -> 4 digit awal + 8 asterisk + 4 digit akhir
    .replace(/\b(\d{4})\d{8}(\d{4})\b/g, "$1********$2")
    // Masking nomor telepon seluler standar 08xx (dengan atau tanpa strip/spasi)
    .replace(/\b(08\d{2})[-\s]?\d{2,4}[-\s]?\d{0,4}[-\s]?(\d{2,4})\b/g, "$1****$2")
    // Masking telepon internasional (+62 / 62) dengan atau tanpa pemisah strip/spasi
    .replace(/(\+?62)\s*(\d{2,3})[-\s]?\d{2,4}[-\s]?\d{0,4}[-\s]?(\d{2,4})\b/g, "$1$2****$3")
    // Masking nomor PSTN lokal/interlokal: 021-87901234 atau (021) 1234567
    .replace(/\b(\(?0[1-79]\d{1,2}\)?)[-\s]?\d{2,4}[-\s]?\d{0,4}[-\s]?(\d{2,4})\b/g, "$1****$2");
}

// 2. Sensor Path Absolut Sistem & Pencegahan CWE-117 Log Injection - apps/api/src/security.ts
export function sanitizeLogText(text: string): string {
  if (!text) return text;
  return text
    .replace(/[a-zA-Z]:\\[^:\s"'<>|?*]+/g, "[INTERNAL_PATH]")
    .replace(/(?:\/(?:Users|home|root|var|etc|tmp))\/[^\s"'<>|?*]+/g, "[INTERNAL_PATH]")
    .replace(/[\r\n]+/g, " ");
}

// 3. Centralized Error Handler Express - apps/api/src/index.ts
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const errorObj = err as { status?: number; type?: string; message?: string };
  if (errorObj?.message && errorObj.message.startsWith("CORS:")) {
    safeLog("WARN", errorObj.message);
    return res.status(403).json({ error: errorObj.message });
  }
  if (err instanceof SyntaxError && "body" in (err as object)) {
    safeLog("WARN", "Format JSON request tidak valid / malformed body");
    return res.status(400).json({ error: "Sintaks JSON tidak valid. Periksa kembali body payload Anda." });
  }
  safeLog("ERROR", "Unhandled server error", errorObj?.message || String(err));
  return res.status(500).json({ error: "Terjadi kesalahan internal pada server." });
});
```

---

### B. Analisis 5 Kasus Error, Penyebab, dan Tindakan Perbaikannya

#### Kasus 1: Error `Permission denied` / `index.lock` pada Git di Terminal Windows
- **Pesan Error**: `fatal: Unable to create '.git/index.lock': Permission denied`
- **Akar Penyebab**: Proses Git sebelumnya masih memegang *file handle* pada `.git/index.lock` saat perintah Git kedua dijalankan serentak di Windows PowerShell.
- **Tindakan Perbaikan**: Menghapus file lock yang tertahan dan memisahkan pemanggilan perintah Git agar tidak bertabrakan secara konkuren.

#### Kasus 2: Error Kompilasi Vite Babel `Unexpected token (1614:0)`
- **Pesan Error**: `[plugin:vite:react-babel] Unexpected token (1614:0) ... src/App.tsx:1614:0`
- **Akar Penyebab**: Terdapat satu karakter kurung kurawal tutup berlebih (`}`) di baris paling akhir berkas `apps/web/src/App.tsx` setelah penutup fungsi komponen.
- **Tindakan Perbaikan**: Menghapus kurung kurawal berlebih dan memvalidasi kompilasi menggunakan pipeline `npm run build:web` (`tsc && vite build`).

#### Kasus 3: Error Koneksi Jaringan Backend Offline (`ECONNREFUSED` / Port 5000)
- **Pesan Error**: `Failed to connect to localhost:5000 / TypeError: Failed to fetch`
- **Akar Penyebab**: Pengguna menjalankan frontend di port 3000 tanpa menyalakan server backend API di port 5000.
- **Tindakan Perbaikan**: Ditambahkan penanganan *graceful degradation* pada `App.tsx` dengan blok `.catch()` yang otomatis mengaktifkan **Mode Standalone (Penyimpanan Lokal Aktif via LocalStorage)** tanpa merusak tampilan antarmuka.

#### Kasus 4: Kesalahan Duplikasi Nomor Sertifikat Tanah
- **Pesan Error**: Muncul nomor sertifikat ganda yang berpotensi memicu sengketa data.
- **Akar Penyebab**: Ketiadaan verifikasi keunikan nomor sertifikat sebelum data dimasukkan ke array state / basis data.
- **Tindakan Perbaikan**: Diimplementasikan validasi anti-duplikasi pada `validateLandRegistration` di `@proyek-rpl/shared` yang membandingkan nomor sertifikat baru terhadap seluruh sertifikat yang ada di sistem, serta dibuatkan unit test otomatis (`US-1` test #9).

#### Kasus 5: Penolakan Git Push Akibat Video Melebihi Batas 100 MB
- **Pesan Error**: `remote: error: GH001: Large files detected. File is 373.15 MB; this exceeds GitHub's file size limit of 100.00 MB`
- **Akar Penyebab**: Perekam layar bawaan Windows menghasilkan rekaman mentah video dengan bitrate sangat tinggi (~8 Mbps), sehingga ukuran berkas mencapai 373 MB.
- **Tindakan Perbaikan**: Video rekaman ditranskoding menggunakan codec H.264 bitrate teroptimasi (~1.2 Mbps). Ukuran berkas berhasil dikompresi menjadi **52.79 MB** (`demo.mp4`) dengan visual 720p yang tetap jernih dan berhasil di-*push* ke GitHub.

---

## 04. Verifikasi Fresh Clone, Pull Request #1 Resmi, Install, Run, Build, Deploy & Unit Test All Passed

Verifikasi lingkungan bersih (*Clean Room Verification*) dijalankan secara nyata pada direktori terisolasi dengan status **Pull Request Resmi #1**:

*Tautan Pull Request Resmi Terbuka di GitHub:*  
👉 **[Pull Request #1: test/verify-fresh-clone into main](https://github.com/alvinetansri-collab/Proyek_RPL/pull/1)**  
*(Status: Terbuka/Open, Mergeable, terverifikasi lulus seluruh build monorepo dan 74 unit test)*

### A. Eksekusi Fresh Clone Nyata (Direktori Sementara `$env:TEMP/fresh_clone_audit_verify`)

Pengujian dilakukan secara nyata di direktori terisolasi bersih di luar *workspace*:
```powershell
# 1. Kloning Repositori Bersih dari GitHub
git clone https://github.com/alvinetansri-collab/Proyek_RPL.git fresh_clone_audit_verify
cd fresh_clone_audit_verify

# 2. Checkout Cabang Pull Request Resmi #1
git checkout test/verify-fresh-clone

# 3. Instalasi Dependensi Monorepo (Node.js >= 22.18.0 / Node 24)
npm.cmd install
# [Hasil: added 266 packages in 22s]

# 4. Kompilasi Build Seluruh Modul Monorepo
npm.cmd run build
# [Hasil:
#  > @proyek-rpl/shared@1.0.0 build -> tsc --noEmit (sukses)
#  > @proyek-rpl/api@1.0.0 build    -> tsc (artefak CommonJS di apps/api/dist)
#  > @proyek-rpl/web@1.0.0 build    -> tsc && vite build (artefak dist 198 kB)
#  Kompilasi sukses tanpa error (exit code 0)]

# 5. Eksekusi Seluruh Unit Test (Native unflagged type stripping)
npm.cmd test
# [Hasil: 74 passed, 0 failed, 0 skipped (~490ms)]

# 6. Verifikasi Probe Server API (Health Check)
# Menjalankan bundle apps/api/dist/index.js dan mengirim permintaan HTTP:
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
# Respons Server:
# status      : UP
# timestamp   : 2026-11-05T09:35:12.890Z
# storage     : file
# recordCount : 3
```

### B. Hasil Eksekusi Unit Test (74 Tests - ALL PASSED):

```text
> test
> node --test tests/**/*.test.ts

✔ Fitur 1 - Pencarian: Berhasil mencari berdasarkan nomor sertifikat secara parsial (2.20ms)
✔ Fitur 1 - Pencarian: Berhasil mencari berdasarkan nama pemilik (case-insensitive) (0.31ms)
✔ Fitur 1 - Pencarian: Berhasil mencari berdasarkan wilayah kecamatan / kabupaten (0.42ms)
✔ Fitur 1 - Pencarian: Mengembalikan array kosong jika kueri pencarian tidak cocok (0.26ms)
✔ Fitur 1 - Pencarian: Filter kombinasi teks pencarian dan jenis hak tanah (0.31ms)
✔ Fitur 1 - Validasi: Lolos validasi saat data pendaftaran tanah lengkap dan benar (1.13ms)
✔ Fitur 1 - Validasi: Menolak pendaftaran jika nomor sertifikat kosong (0.54ms)
✔ Fitur 1 - Validasi: Menolak pendaftaran jika nomor sertifikat sudah ada (duplikat) (0.70ms)
✔ Fitur 1 - Validasi: Menolak pendaftaran jika luas tanah <= 0 atau tidak valid (0.62ms)
✔ Fitur 2 - Evaluasi: Menghasilkan status COMPLETE jika terdapat minimal 3 dokumen (3.27ms)
✔ Fitur 2 - Evaluasi: Menghasilkan status NEEDS_REVIEW jika terdapat 1 atau 2 dokumen (0.49ms)
✔ Fitur 2 - Evaluasi: Menghasilkan status INCOMPLETE jika belum ada dokumen yang dicatat (0.28ms)
✔ Fitur 2 - Standar Lencana Warna: Status COMPLETE menggunakan label 'Lengkap' dan warna hijau (0.51ms)
✔ Fitur 2 - Standar Lencana Warna: Status NEEDS_REVIEW menggunakan label 'Perlu Diperiksa' dan warna oranye (0.37ms)
✔ Fitur 2 - Standar Lencana Warna: Status INCOMPLETE menggunakan label 'Belum Lengkap' dan warna merah (0.38ms)
✔ Fitur 2 - Linimasa Riwayat: Mengurutkan silsilah perpindahan hak tanah secara kronologis (ascending) (0.49ms)
✔ Fitur 2 - Linimasa Riwayat: Mengurutkan silsilah perpindahan hak tanah dari yang terbaru (descending) (2.34ms)
✔ Fitur 2 - Metrik Dashboard: Menghitung akumulasi statistik ringkasan dan rasio kelengkapan (1.02ms)
✔ Keamanan & Logging: Masking NIK 16 digit menyamarkan 8 digit tengah (3.56ms)
✔ Keamanan & Logging: Masking nomor telepon format seluler 08xx (0.42ms)
✔ Keamanan & Logging: Masking nomor telepon format internasional +62 (0.34ms)
✔ Keamanan & Logging: Masking nomor telepon dengan pemisah spasi dan tanda minus (0.39ms)
✔ Keamanan & Logging: Masking telepon lokal dengan kode area tanda kurung (0.38ms)
✔ Keamanan & Logging: Masking nomor telepon PSTN landline seperti 021-87901234 (0.41ms)
✔ Keamanan & Logging: safeLog menyensor path absolut internal sistem menjadi [INTERNAL_PATH] (0.48ms)
✔ Keamanan & Logging: safeLog membersihkan karakter CRLF newline untuk mencegah log injection (CWE-117) (0.44ms)
✔ Keamanan & Logging: safeLog menghasilkan format terstruktur dengan timestamp dan level (5.32ms)
✔ Keamanan & Logging: safeLog mencatat penolakan CORS origin terlarang sebagai level WARN (0.39ms)
✔ Keamanan & Penyimpanan: atomicWriteFileSync menulis data persisten tanpa corrupt (11.13ms)
✔ US-1: Pendaftaran bidang tanah baru berhasil jika seluruh field wajib valid (1.95ms)
✔ US-1: Menolak pendaftaran jika nomor sertifikat kosong (0.49ms)
✔ US-1: Menolak pendaftaran jika nama pemilik kosong (0.29ms)
✔ US-1: Menolak pendaftaran jika alamat bidang tanah kosong (0.24ms)
✔ US-1: Menolak pendaftaran jika desa / kelurahan kosong (0.28ms)
✔ US-1: Menolak pendaftaran jika kecamatan kosong (0.28ms)
✔ US-1: Menolak pendaftaran jika luas tanah bernilai 0 (0.26ms)
✔ US-1: Menolak pendaftaran jika luas tanah bernilai negatif (0.26ms)
✔ US-1: Mencegah duplikasi nomor sertifikat yang sudah terdaftar dalam sistem (0.43ms)
✔ US-2: Berhasil mencari berdasarkan nomor sertifikat secara parsial (2.15ms)
✔ US-2: Berhasil mencari berdasarkan nama pemilik secara case-insensitive (0.34ms)
✔ US-2: Berhasil mencari berdasarkan nama desa / kelurahan (0.25ms)
✔ US-2: Berhasil mencari berdasarkan nama kecamatan (0.29ms)
✔ US-2: Berhasil mencari berdasarkan nama kabupaten/kota (0.22ms)
✔ US-2: Filter jenis hak tanah Hak Milik (SHM) secara eksklusif (0.25ms)
✔ US-2: Filter jenis hak tanah Hak Guna Bangunan (HGB) (0.22ms)
✔ US-2: Filter jenis hak tanah Girik / Adat (0.23ms)
✔ US-2: Filter berdasarkan status kelengkapan dokumen COMPLETE (0.29ms)
✔ US-2: Kueri yang tidak cocok menghasilkan array kosong tanpa runtime error (0.46ms)
✔ US-3: Bidang tanah dengan 3 dokumen atau lebih dievaluasi sebagai COMPLETE (1.66ms)
✔ US-3: Bidang tanah dengan 2 dokumen dievaluasi sebagai NEEDS_REVIEW (0.36ms)
✔ US-3: Bidang tanah dengan 1 dokumen dievaluasi sebagai NEEDS_REVIEW (0.23ms)
✔ US-3: Bidang tanah tanpa dokumen (0 berkas) dievaluasi sebagai INCOMPLETE (0.21ms)
✔ US-3: Pemetaan lencana status COMPLETE menghasilkan label 'Lengkap' dan warna hijau (0.41ms)
✔ US-3: Pemetaan lencana status NEEDS_REVIEW menggunakan label 'Perlu Diperiksa' dan warna oranye (0.25ms)
✔ US-3: Pemetaan lencana status INCOMPLETE menggunakan label 'Belum Lengkap' dan warna merah (0.24ms)
✔ US-3: Setiap status kelengkapan memiliki deskripsi penjelasan yang informatif (1.53ms)
✔ US-4: Mengurutkan linimasa silsilah mutasi tanah secara kronologis (ascending: terlama ke terbaru) (1.89ms)
✔ US-4: Mengurutkan linimasa silsilah mutasi tanah dari yang terbaru (descending: terbaru ke terlama) (0.32ms)
✔ US-4: Menangani array linimasa riwayat yang kosong tanpa error (0.21ms)
✔ US-4: Menangani entri riwayat dengan tanggal tidak valid secara aman tanpa melempar exception (0.42ms)
✔ US-4: Data riwayat kepemilikan memelihara rantai transfer dari pemilik sebelumnya ke pemilik baru (0.25ms)
✔ US-4: Validasi mutasi kepemilikan menolak jika nama pemilik baru kosong (0.52ms)
✔ US-4: Validasi mutasi menolak jika nama pemilik baru identik dengan pemilik saat ini (0.32ms)
✔ US-4: Eksekusi recordOwnershipTransfer memperbarui CurrentOwnerName dan menambahkan catatan mutasi ke riwayat (1.71ms)
✔ US-5: Validasi penambahan berkas dokumen baru berhasil saat data lengkap (0.77ms)
✔ US-5: Menolak penambahan dokumen jika jenis dokumen kosong (0.15ms)
✔ US-5: Menolak penambahan dokumen jika nomor dokumen kosong (0.15ms)
✔ US-5: Menolak duplikasi nomor dokumen pada bidang tanah yang sama (0.14ms)
✔ US-5: Menolak penambahan dokumen jika format tanggal terbit tidak valid (0.10ms)
✔ US-5: Melampirkan dokumen ke tanah kosong otomatis mengubah status dari INCOMPLETE menjadi NEEDS_REVIEW (0.17ms)
✔ US-5: Melampirkan dokumen ke-3 otomatis meningkatkan status dari NEEDS_REVIEW menjadi COMPLETE (0.11ms)
✔ US-5: Mencabut dokumen dapat menurunkan status kelengkapan secara otomatis (COMPLETE menjadi NEEDS_REVIEW) (0.11ms)
✔ US-5: Kalkulasi metrik agregat dashboard menghitung jumlah total tanah dan per kategori status secara presisi (0.25ms)
✔ US-5: Kalkulasi persentase kelengkapan dashboard (completeness rate) tepat (0.21ms)

========================================================================================
RINGKASAN UJI: 74 Tests | 74 Passed | 0 Failed | 0 Skipped | Duration: ~490ms | STATUS: ALL PASSED
========================================================================================
```

---

## Kesimpulan Akhir

Hasil pengujian dan evaluasi teknis membuktikan bahwa:
1. **Keamanan Lapisan Data & Privasi**: Penyimpanan data persisten menerapkan pola atomik (*temporary file* + *atomic rename*) dengan rollback memori dan penanganan status HTTP 500. Sanitasi otomatis PII (*Personally Identifiable Information*) mencakup NIK 16 digit, nomor telepon seluler, telepon internasional, dan nomor telepon PSTN landline.
2. **Pencegahan Kebocoran Sistem & Log Injection**: LoggerExpress secara aktif menyensor path absolut komputer (`[INTERNAL_PATH]`) dan membersihkan karakter baris baru untuk mencegah CRLF Log Injection (CWE-117).
3. **Penanganan Error Terpusat**: Seluruh error CORS origin (HTTP 403) dan malformed JSON body (HTTP 400) ditangani terpusat tanpa membocorkan stack trace internal.
4. **Keandalan Logika Bisnis & Pengujian**: Seluruh 74 unit test lulus 100% tanpa kegagalan pada Node.js >= 22.18.0 (mencakup 63 pengujian domain bisnis US-1 s/d US-5 & Feature 1-2, serta 11 pengujian keamanan, sanitasi logging, dan persistensi atomik).
5. **Kompilasi & Build Bersih**: Pipeline `npm run build` berhasil mengompilasi tipe TypeScript pada `packages/shared` (`tsc --noEmit`), backend `apps/api` (`tsc`), dan mem-bundling frontend `apps/web` (`vite build`) tanpa error.
6. **Verifikasi Lingkungan Bersih & PR Resmi**: Skenario *fresh clone* telah dibuktikan secara nyata di direktori terisolasi, API server lolos uji probe kesehatan (`GET /api/health` -> HTTP 200), serta Pull Request resmi #1 telah terbuka di GitHub.
7. **Transparansi Batasan**: Batasan ruang lingkup arsitektur prototipe MVP (belum adanya modul login/RBAC dan lingkungan live cloud hosting) telah didokumentasikan secara transparan sebagai prioritas backlog pengembangan fase berikutnya.
