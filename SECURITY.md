# Laporan Hasil Uji Keamanan, Logging Aman, dan Batasan Sistem (SECURITY.md)
## Sistem Monitoring Dokumen dan Status Kepemilikan Tanah

Dokumen ini memuat laporan resmi mengenai:
1. **Hasil Uji Keamanan (Security Audit)** dan catatan perubahan keamanan yang relevan (*Security Changelog*).
2. **Evaluasi Matriks OWASP Top 10 & Transparansi Batasan Prototipe MVP**.
3. **Standar Logging Aman vs Log Tidak Aman** beserta implementasi sanitasi data pribadi (PII).
4. **Analisis Penyebab Error dan Tindakan Perbaikannya** (*Troubleshooting Case Studies*).
5. **Bukti Verifikasi Fresh Clone, Pull Request, Install, Run, Build, dan Deploy** dengan status **Unit Test All Passed (70/70)**.

---

## 1. Hasil Uji Keamanan (Security Audit) & Catatan Perubahan

### A. Audit Dependensi Paket (Software Composition Analysis)
Pengujian keamanan dependensi monorepo dilakukan menggunakan tool resmi `npm audit` terhadap seluruh 270 paket yang terpasang di monorepo (`apps/web`, `apps/api`, `packages/shared`).

#### 1. Temuan Awal Kerentanan:
Pada pemindaian awal repositori, ditemukan kerentanan pada pustaka transitif dari dependensi lama:
- **`body-parser < 1.20.9` (Tingkat Keparahan: HIGH - GHSA-27r3-jxmh-p828)**: Kerentanan *Denial of Service* (DoS) melalui trailing bytes pada compressed body payload.
- **`qs 6.7.0 - 6.16.0` (Tingkat Keparahan: MODERATE - GHSA-6pq8-jhm2-2vcw)**: Kesalahan penanganan unhandled TypeError pada array format yang berpotensi DoS.
- **`postcss-selector-parser < 6.1.5` (Tingkat Keparahan: MODERATE - GHSA-rj75-hqrm-r3gf)**: Kompleksitas parsing kuadratik pada flat selector parsing.

#### 2. Tindakan Remediasi & Bukti Commit:
Dilakukan proses patching keamanan otomatis pada commit [`69f04e5`](https://github.com/alvinetansri-collab/Proyek_RPL/commit/69f04e58151304d36693a9812fe35088b3212d12) (2 November 2026):
```bash
npm audit fix
```
Hasil:
- Dependensi runtime produksi (`body-parser`, `qs`, `express`) berhasil diperbarui ke versi patched yang aman.
- **Status Runtime Produksi**: **0 Kerentanan Tingkat HIGH pada Dependensi Produksi Runtime**.
- Kerentanan tersisa berada pada modul pengembangan lokal (`ts-node-dev` / `esbuild dev-server`), yang tidak disertakan dalam bundle rilis produksi (`apps/api/dist` dan `apps/web/dist`).

---

### B. Evaluasi Keamanan Lapisan Aplikasi (OWASP Top 10 Evaluation Matrix)

Tabel berikut menyajikan evaluasi jujur dan transparan terhadap 10 kategori risiko keamanan aplikasi web OWASP Top 10, membedakan antara proteksi yang telah aktif dan batasan arsitektural yang direncanakan pada backlog fase berikutnya:

| Kategori Ancaman OWASP | Status Implementasi | Evaluasi Teknis, Kontrol Keamanan, & Batasan |
| :--- | :---: | :--- |
| **A01: Broken Access Control & IDOR** | **`[!] LIMITASI MVP`**<br>*(Backlog Arsitektur)* | **Evaluasi Transparan**: Pemeriksaan `landIndex !== -1` pada endpoint API semata-mata merupakan pengecekan eksistensi data dalam memori untuk mencegah error *null pointer*. API saat ini belum memiliki otentikasi login pengguna, token sesi, atau *Role-Based Access Control* (RBAC). Endpoint mutasi, penghapusan tanah, dan reset demo terbuka untuk pengujian demo. Pemisahan hak akses (SuperAdmin BPN, Verifikator Dokumen, Notaris, Publik) tercatat sebagai prioritas backlog pengembangan fase berikutnya. |
| **A02: Cryptographic Failures & PII Exposure** | **`[OK] AMAN DENGAN CATATAN`** | Data sensitif masyarakat berupa NIK 16 digit dan berbagai format nomor telepon (lokal, internasional, kode area) otomatis disamarkan (*masked*) pada log audit. **Catatan Kredensial**: Repositori memuat kredensial contoh untuk kebutuhan *local development* pada [`docker-compose.yml`](./docker-compose.yml) (`rootpassword`) dan [`.env.example`](./.env.example). Berkas `.env` produksi yang sesungguhnya diabaikan oleh `.gitignore` dan tidak ada secret produksi yang bocor. |
| **A03: Injection (SQL / NoSQL / Command Injection)** | **`[OK] AMAN`** | Logika aplikasi menggunakan domain logic bertipe TypeScript ketat ([`packages/shared`](./packages/shared)). Tidak ada konstruksi query SQL mentah berbasis konkatenasi string. Penyimpanan data JSON menggunakan fungsi terisolasi `JSON.stringify` dan `JSON.parse` yang tervalidasi. |
| **A04: Insecure Design** | **`[OK] AMAN`** | Validasi aturan bisnis diterapkan ganda (*Defense-in-Depth*): di sisi antarmuka React dan di sisi server Express. Nomor sertifikat ganda langsung ditolak pada tahap validasi awal sebelum persistensi ke disk. |
| **A05: Security Misconfiguration** | **`[OK] AMAN (Whitelist Origin)`** | Server API Express mengonfigurasi middleware CORS dengan *origin whitelist* eksplisit (`http://localhost:3000`, `http://127.0.0.1:3000`, `http://localhost:4173`, `http://localhost:5173`) serta mendukung variabel lingkungan `CORS_ORIGIN` untuk deployment hosting. Request dari origin tidak dikenal akan ditolak. Error handler tidak membocorkan stack trace internal. |
| **A06: Vulnerable and Outdated Components** | **`[OK] AMAN`** | Pustaka diaudit berkala melalui `npm audit`, seluruh dependensi runtime server berada pada versi bebas kerentanan HIGH. |
| **A07: Identification and Authentication Failures** | **`[!] LIMITASI MVP`**<br>*(Backlog Arsitektur)* | **Evaluasi Transparan**: Sistem saat ini tidak memiliki autentikasi identitas operator (belum ada login/password/JWT). Rantai linimasa mutasi kepemilikan berfungsi sebagai jejak historis silsilah bisnis pertanahan (*business provenance audit trail*), bukan sebagai tanda tangan digital kriptografis atau bukti autentikasi identitas pengguna. |
| **A08: Software and Data Integrity Failures** | **`[OK] AMAN (Atomic File Persistence)`** | Fungsi [`saveLandsToDisk()`](./apps/api/src/index.ts) menggunakan mekanisme penulisan atomik: menulis ke file sementara (`lands.json.tmp.<timestamp>`) terlebih dahulu, lalu mengeksekusi `fs.renameSync` secara atomik ke file target. Jika penyimpanan gagal, safeLog mencatat error dan endpoint mengembalikan status HTTP 500 beserta rollback memori, mencegah respons sukses palsu saat disk penuh/rusak. |
| **A09: Security Logging and Monitoring Failures** | **`[OK] AMAN (Tersanitasi PII)`** | Setiap aksi mutasi, penambahan dokumen, validasi gagal, dan penghapusan dicatat ke log server berformat terstruktur dengan penandaan level `INFO`, `WARN`, `ERROR`, dan `AUDIT` dengan PII tersanitasi. |
| **A10: Server-Side Request Forgery (SSRF)** | **`[OK] AMAN`** | Server API tidak menerima URL dinamis dari input pengguna untuk melakukan panggilan HTTP outbound ke pihak ketiga. |

---

### C. Catatan Perubahan Keamanan (Security Changelog)

| Tanggal | ID Perubahan | Rincian Perubahan Keamanan | Modul Terkait |
| :---: | :---: | :--- | :--- |
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

## 2. Contoh Log Aman vs Log Tidak Aman

### A. Contoh Log yang TIDAK AMAN (Rentan Kebocoran Data PII & Sistem)

```text
# CONTOH BURUK 1: Kebocoran PII (NIK & Nomor Telepon Lengkap Tercetak di Log)
[2026-11-04T15:20:00Z] [DEBUG] User input: {"name": "Budi Santoso", "nik": "3271012345670001", "phone": "081234567890", "address": "Jl. Merdeka No. 45"}

# CONTOH BURUK 2: Kebocoran Stack Trace & Path Direktori Internal Komputer
[2026-11-04T15:21:15Z] [ERROR] InternalServerError: connect ECONNREFUSED 127.0.0.1:3306
   at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1146:16)
   at C:\Users\hp5cd\Documents\proyek rpl\apps\api\src\database.ts:45:12
   Database password leaked: db_pass_secret_2026
```

> **Mengapa Berbahaya?**  
> 1. Log sering diarsip atau diteruskan ke agregator pemantauan (Datadog, CloudWatch, ELK). Siapa pun yang memiliki akses ke log dapat mencuri data NIK masyarakat untuk penyalahgunaan pinjaman daring atau pemalsuan identitas.  
> 2. Membocorkan *file system path* lokal memudahkan pihak luar memetakan arsitektur server internal.

---

### B. Contoh Log yang AMAN (Tersanitasi & Terstruktur)
*Implementasi nyata pada [`apps/api/src/index.ts`](./apps/api/src/index.ts) dan [`apps/api/src/security.ts`](./apps/api/src/security.ts):*

```text
# CONTOH AMAN 1: Pendaftaran Bidang Tanah Baru (PII Metadata Disamarkan Otomatis)
[2026-11-04T15:27:30.901Z] [INFO] HTTP POST /api/lands
[2026-11-04T15:27:30.905Z] [AUDIT] Pendaftaran tanah baru: SHM-12.04.2024.999 (Pemilik: Muhammad Farhan, Luas: 150 m²) | {"nik":"3201********0002","phone":"0812****90"}

# CONTOH AMAN 2: Penanganan Validasi Gagal (Tercatat di Level WARN Tanpa Membocorkan Error Sensitif)
[2026-11-04T15:28:02.500Z] [WARN] Validasi pendaftaran tanah gagal: Nomor sertifikat 'SHM-12.04.2023.001' sudah terdaftar dalam sistem. | {"certificateNumber":"SHM-12.04.2023.001","ownerName":"Muhammad Farhan"}

# CONTOH AMAN 3: Pelampiran Dokumen Baru
[2026-11-04T15:28:10.812Z] [INFO] HTTP POST /api/lands/land-001/documents
[2026-11-04T15:28:10.825Z] [AUDIT] Dokumen terlampir pada SHM-12.04.2023.001: Akta Jual Beli (AJB) (AJB-12/PPAT/2020) - Status baru: COMPLETE

# CONTOH AMAN 4: Pencatatan Mutasi Peralihan Hak
[2026-11-04T15:29:14.330Z] [INFO] HTTP POST /api/lands/land-001/histories
[2026-11-04T15:29:14.348Z] [AUDIT] Mutasi hak tanah SHM-12.04.2023.001: dari Budi Santoso ke Hj. Nurhayati (Akta Jual Beli (AJB))

# CONTOH AMAN 5: Penanganan Error Penyimpanan Disk (Tersanitasi & Terstruktur)
[2026-11-04T15:30:00.120Z] [ERROR] Gagal menyimpan data ke disk secara atomik | EACCES: permission denied
```

---

### C. Implementasi Sanitasi PII & Penulisan Atomik pada Kode

```typescript
// Implementasi pada packages/shared/src/security/masking.ts
export function maskPII(text: string): string {
  if (!text) return text;
  return text
    // Masking NIK: 16 digit angka berurutan -> 4 digit awal + 8 asterisk + 4 digit akhir
    .replace(/\b(\d{4})\d{8}(\d{4})\b/g, "$1********$2")
    // Masking nomor telepon seluler standar 08xx (dengan atau tanpa strip/spasi)
    .replace(/\b(08\d{2})[-\s]?\d{2,4}[-\s]?\d{0,4}[-\s]?(\d{2,4})\b/g, "$1****$2")
    // Masking telepon internasional (+62 / 62) dengan atau tanpa pemisah strip/spasi
    .replace(/(\+?62)\s*(\d{2,3})[-\s]?\d{2,4}[-\s]?\d{0,4}[-\s]?(\d{2,4})\b/g, "$1$2****$3")
    // Masking telepon lokal dengan kode area misal (021)
    .replace(/(\(\d{3,4}\))\s*\d{2,4}[-\s]?(\d{2,4})\b/g, "$1****$2");
}

// Implementasi penulisan atomik pada apps/api/src/security.ts
export function atomicWriteFileSync(filePath: string, content: string): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tempFilePath = `${filePath}.tmp.${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    fs.writeFileSync(tempFilePath, content, "utf-8");
    fs.renameSync(tempFilePath, filePath);
    return true;
  } catch (err) {
    safeLog("ERROR", "Gagal menyimpan berkas secara atomik", err instanceof Error ? err.message : String(err));
    return false;
  }
}
```

---

## 3. Analisis 5 Kasus Error, Penyebab, dan Tindakan Perbaikannya

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

## 4. Bukti Verifikasi Pull Request, Build, dan 70 Unit Test All Passed

Simulasi pengujian lingkungan bersih (*Clean Room Simulation*) diverifikasi melalui cabang Pull Request terisolasi:

```powershell
# 1. Kloning Repositori Bersih dari GitHub
git clone https://github.com/alvinetansri-collab/Proyek_RPL.git fresh_clone_verify
cd fresh_clone_verify

# 2. Pembuatan Cabang Pull Request
git checkout -b test/verify-fresh-clone

# 3. Instalasi Dependensi Monorepo
npm.cmd install

# 4. Kompilasi Build Seluruh Modul Monorepo
npm.cmd run build

# 5. Eksekusi Seluruh Unit Test (Wajib All Passed)
npm.cmd test
```

*Tautan Pull Request / Compare GitHub:*  
👉 [https://github.com/alvinetansri-collab/Proyek_RPL/compare/main...test/verify-fresh-clone](https://github.com/alvinetansri-collab/Proyek_RPL/compare/main...test/verify-fresh-clone)

### Hasil Eksekusi Unit Test (70 Tests - ALL PASSED):
```text
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
✔ Keamanan & Logging: safeLog menghasilkan format terstruktur dengan timestamp dan level (5.32ms)
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
RINGKASAN UJI: 70 Tests | 70 Passed | 0 Failed | 0 Skipped | Duration: ~445ms | STATUS: ALL PASSED
========================================================================================
```

---

## 5. Kesimpulan Evaluasi Keamanan

Berdasarkan hasil pengujian teknis:
1. **Keamanan Data Pribadi (PII)**: Sanitasi otomatis NIK dan nomor telepon berhasil mencegah kebocoran data pada log server.
2. **Integritas Penyimpanan Disk**: Mekanisme penulisan atomik melindungi basis data dari berkas korup jika terjadi interupsi.
3. **Keandalan Logika Domain**: 70 unit test lulus 100% tanpa kegagalan.
4. **Batasan Terukur**: Fitur autentikasi pengguna (login/RBAC) dan integrasi SSL/TLS pada server hosting telah didokumentasikan secara transparan sebagai rencana pengembangan pada tahap berikutnya.
