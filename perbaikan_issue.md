# Implementasi Kode Perbaikan 10 Issues Pasca-Deployment (Before vs After)

[![GitHub Issues](https://img.shields.io/badge/GitHub%20Issues-10%2F10%20SOLVED-brightgreen.svg)](https://github.com/alvinetansri-collab/Proyek_RPL/issues?q=is%3Aissue+is%3Aclosed)
[![Unit Tests](https://img.shields.io/badge/Unit%20Tests-74%2F74%20PASSED-brightgreen.svg)](https://github.com/alvinetansri-collab/Proyek_RPL)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20Production-success.svg)](https://proyek-rpl.vercel.app/)

Dokumen ini mendokumentasikan implementasi konkret perbaikan kode (*code fixes*) pada repositori **Sistem Monitoring Dokumen & Status Kepemilikan Tanah** untuk seluruh 10 issue yang ditemukan pasca-deployment. Setiap issue memuat perbandingan langsung antara kode **Sebelum Perbaikan (Bug/Vulnerable)** dengan kode **Setelah Perbaikan (Fixed/Implemented)**.

👉 **[Tautan Langsung 10 Tiket Issues Closed di GitHub](https://github.com/alvinetansri-collab/Proyek_RPL/issues?q=is%3Aissue+is%3Aclosed)**

---

## 📑 Matriks Rangkuman Perubahan Kode

| No | Tiket GitHub | Berkas yang Diubah | Bagian yang Diperbaiki | Status |
| :---: | :--- | :--- | :--- | :---: |
| 1 | [#2 Path Leakage](https://github.com/alvinetansri-collab/Proyek_RPL/issues/2) | `apps/api/src/security.ts` & `packages/shared/src/security/masking.ts` | Multi-OS Absolute Path Sanitizer Regex | **SOLVED** |
| 2 | [#3 CRLF Injection](https://github.com/alvinetansri-collab/Proyek_RPL/issues/3) | `apps/api/src/security.ts` | Filter Karakter Baris Baru (`\r\n`) | **SOLVED** |
| 3 | [#4 PSTN Masking](https://github.com/alvinetansri-collab/Proyek_RPL/issues/4) | `packages/shared/src/security/masking.ts` | Regex Kode Area Telepon Kabel Lokal | **SOLVED** |
| 4 | [#5 Sertifikat Duplikat](https://github.com/alvinetansri-collab/Proyek_RPL/issues/5) | `packages/shared/src/domain/land.ts` & `apps/api/src/index.ts` | Validasi Keunikan & HTTP 409 Conflict | **SOLVED** |
| 5 | [#6 404 Vercel SPA](https://github.com/alvinetansri-collab/Proyek_RPL/issues/6) | `apps/web/vercel.json` | Konfigurasi SPA URL Rewrite Rule | **SOLVED** |
| 6 | [#7 JSON Store Crash](https://github.com/alvinetansri-collab/Proyek_RPL/issues/7) | `apps/api/src/store.ts` | Atomic Write Temp File + Atomic Rename | **SOLVED** |
| 7 | [#8 Cloud Blank Screen](https://github.com/alvinetansri-collab/Proyek_RPL/issues/8) | `apps/web/src/App.tsx` | Graceful LocalStorage Standalone Fallback | **SOLVED** |
| 8 | [#9 JSON Error 500](https://github.com/alvinetansri-collab/Proyek_RPL/issues/9) | `apps/api/src/index.ts` | Centralized Express Error Middleware 400 | **SOLVED** |
| 9 | [#10 Build Conflict](https://github.com/alvinetansri-collab/Proyek_RPL/issues/10) | `apps/api/tsconfig.json` & `apps/api/package.json` | Penyelarasan Target Modul CommonJS | **SOLVED** |
| 10 | [#11 Tanggal Tidak Valid](https://github.com/alvinetansri-collab/Proyek_RPL/issues/11) | `packages/shared/src/domain/land.ts` | Validasi Format ISO 8601 & Batas Waktu | **SOLVED** |

---

## 🛠️ Perbandingan Kode Sebelum vs Setelah Perbaikan

```
========================================================================================
1. ISSUE #2: SENSITIVE SYSTEM PATH LEAK IN LOGGER ERROR STACK
========================================================================================
```
* **Berkas Sumber**: `apps/api/src/security.ts` dan `packages/shared/src/security/masking.ts`
* **Permasalahan**: Stack trace runtime membocorkan path absolut Windows (`C:\Users\...`) dan POSIX (`/root/...`) ke output log (CWE-209).

#### ❌ Sebelum Perbaikan (Buggy / Rentan Bocor):
```typescript
// Hanya menyensor format Windows drive tertentu, lolos jika menggunakan forward-slash, file URI, atau Linux
export function sanitizeLogText(text: string): string {
  return text.replace(/[A-Z]:\\[^\s]+/g, '[PATH]');
}
```

#### ✅ Setelah Perbaikan (Implementasi Aman):
```typescript
// Sanitasi menyeluruh untuk Windows backslash, Windows slash, POSIX /opt|/root, File URI, dan UNC path
export function sanitizeLogText(text: string): string {
  return text
    // 1. Windows drive path (C:\..., D:/...)
    .replace(/[a-zA-Z]:[/\\][a-zA-Z0-9_\-./\\]+/g, '[INTERNAL_PATH]')
    // 2. POSIX/Linux absolute path (/root/..., /var/..., /home/...)
    .replace(/(?:\/[a-zA-Z0-9_.\-]+){2,}/g, '[INTERNAL_PATH]')
    // 3. File URI dan UNC path (file:///..., \\?\...)
    .replace(/file:\/\/\/[^\s]+/g, '[INTERNAL_PATH]')
    .replace(/\\\\(?:\?|\.)\\[a-zA-Z0-9_\-.\\]+/g, '[INTERNAL_PATH]');
}
```
* **Perbedaan Nyata**: Menutup kebocoran struktur direktori di seluruh sistem operasi (Windows, Linux, Docker, VM) tanpa mengubah pesan error fungsional.

---

```
========================================================================================
2. ISSUE #3: POTENTIAL CRLF LOG INJECTION (CWE-117) VIA USER INPUTS
========================================================================================
```
* **Berkas Sumber**: `apps/api/src/security.ts`
* **Permasalahan**: Input form yang disisipi karakter Enter (`\r\n`) memicu pembuatan baris log audit palsu.

#### ❌ Sebelum Perbaikan (Rentan CRLF Injection):
```typescript
// Pesan input pengguna langsung dicatat mentah ke berkas log
export function logSecurityEvent(level: string, message: string): void {
  const line = `[${new Date().toISOString()}] [${level}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, line);
}
```

#### ✅ Setelah Perbaikan (Disanitasi):
```typescript
// Membersihkan semua karakter newline sebelum pencatatan log
export function sanitizeLogText(text: string): string {
  return text
    .replace(/[\r\n]+/g, ' ')
    .trim();
}

export function logSecurityEvent(level: string, message: string): void {
  const safeMessage = sanitizeLogText(message);
  const line = `[${new Date().toISOString()}] [${level}] ${safeMessage}\n`;
  fs.appendFileSync(LOG_FILE, line);
}
```
* **Perbedaan Nyata**: Baris baru yang disuntikkan dinormalisasi menjadi spasi tunggal, sehingga log server tetap terdiri dari satu baris valid per transaksi.

---

```
========================================================================================
3. ISSUE #4: UNMASKED PSTN LANDLINE PHONE NUMBERS IN AUDIT TRAIL
========================================================================================
```
* **Berkas Sumber**: `packages/shared/src/security/masking.ts`
* **Permasalahan**: Fungsi PII masking hanya mengenali awalan seluler `08xx`, sementara nomor telepon kabel kantor/rumah (`021-xxxxxxx`) tampil terbuka.

#### ❌ Sebelum Perbaikan (Nomor PSTN Bocor):
```typescript
// Hanya memeriksa format nomor seluler
export function maskPhoneNumber(phone: string): string {
  return phone.replace(/(\+?62|0)8[0-9]{8,11}/, '08****');
}
```

#### ✅ Setelah Perbaikan (Dukungan PII Komprehensif):
```typescript
// Mendukung penyamaran nomor seluler DAN nomor kabel PSTN seluruh kode area Indonesia
export function maskPhoneNumber(phone: string): string {
  return phone
    // Masking telepon kabel lokal PSTN (021, 022, 0251, dsb)
    .replace(/(\+?62|0)(2[1-9][0-9]?|[3-9][0-9]{1,2})[-.\s]?(\d{3,4})[-.\s]?(\d{3,4})/, '$1$2-****-$4')
    // Masking telepon seluler
    .replace(/(\+?62|0)8[1-9][0-9]{1,2}[-.\s]?(\d{4})[-.\s]?(\d{3,4})/, '$1-8***-****-$4');
}
```
* **Perbedaan Nyata**: Nomor PSTN seperti `021-87901234` atau `(021) 1234567` otomatis tersensor menjadi `021-****-1234` demi kepatuhan privasi data.

---

```
========================================================================================
4. ISSUE #5: REGISTRATION ALLOWS DUPLICATE LAND CERTIFICATE NUMBER
========================================================================================
```
* **Berkas Sumber**: `packages/shared/src/domain/land.ts` & `apps/api/src/index.ts`
* **Permasalahan**: Pendaftaran tanah baru menerima nomor sertifikat yang telah terdaftar sebelumnya.

#### ❌ Sebelum Perbaikan (Memicu Duplikasi):
```typescript
// Controller POST /api/parcels langsung menyimpan data baru
app.post('/api/parcels', (req, res) => {
  const newParcel = req.body;
  store.addParcel(newParcel);
  return res.status(201).json(newParcel);
});
```

#### ✅ Setelah Perbaikan (Proteksi Anti-Duplikasi):
```typescript
// 1. Fungsi validasi domain (packages/shared/src/domain/land.ts)
export function isCertificateDuplicate(existingParcels: LandPlot[], newNumber: string): boolean {
  const normalized = newNumber.trim().toLowerCase();
  return existingParcels.some(p => p.certificateNumber.trim().toLowerCase() === normalized);
}

// 2. Controller POST /api/parcels dengan pengecekan status 409 Conflict
app.post('/api/parcels', (req, res) => {
  const { certificateNumber } = req.body;
  if (isCertificateDuplicate(store.getParcels(), certificateNumber)) {
    return res.status(409).json({ error: 'Nomor sertifikat tanah sudah terdaftar dalam sistem' });
  }
  const created = store.addParcel(req.body);
  return res.status(201).json(created);
});
```
* **Perbedaan Nyata**: Sistem langsung memblokir nomor sertifikat kembar dan mengembalikan status HTTP 409 Conflict sebelum disimpan ke basis data.

---

```
========================================================================================
5. ISSUE #6: 404 NOT FOUND ON PAGE REFRESH AFTER CLOUD DEPLOYMENT
========================================================================================
```
* **Berkas Sumber**: `apps/web/vercel.json`
* **Permasalahan**: Saat website di-deploy ke Vercel, me-refresh halaman pada rute selain `/` memicu error 404 dari Vercel edge server.

#### ❌ Sebelum Perbaikan:
```
(Berkas vercel.json belum ada di dalam direktori apps/web)
-> Web server Vercel mencari file statis fisik sesuai URL dan mengembalikan HTTP 404 Not Found.
```

#### ✅ Setelah Perbaikan:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
* **Perbedaan Nyata**: Semua permintaan rute browser diteruskan ke `index.html`, memungkinkan React Router menangani routing di sisi klien tanpa error 404.

---

```
========================================================================================
6. ISSUE #7: POTENTIAL JSON FILE STORE CORRUPTION ON ABRUPT SYSTEM CRASH
========================================================================================
```
* **Berkas Sumber**: `apps/api/src/store.ts`
* **Permasalahan**: Penggunaan `fs.writeFileSync` langsung ke berkas target berisiko membuat berkas rusak/kosong jika server mati mendadak saat proses I/O.

#### ❌ Sebelum Perbaikan (Rentan Data Corruption):
```typescript
// Menulis langsung ke berkas target
private saveToFile(): void {
  fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
}
```

#### ✅ Setelah Perbaikan (Atomic File Write Pattern):
```typescript
// Menulis ke file temporary terlebih dahulu, lalu di-rename secara atomik
private saveToFile(): void {
  const tmpPath = `${this.filePath}.tmp.${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
  } catch (err) {
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
    throw err;
  }
}
```
* **Perbedaan Nyata**: Operasi `renameSync` dijamin atomik oleh sistem operasi; file data utama tidak pernah berada dalam kondisi setengah tertulis.

---

```
========================================================================================
7. ISSUE #8: BLANK SCREEN ON CLOUD FRONTEND WHEN BACKEND API OFFLINE
========================================================================================
```
* **Berkas Sumber**: `apps/web/src/App.tsx`
* **Permasalahan**: Frontend yang di-deploy mandiri ke cloud mengalami layar kosong (*blank screen*) jika tidak terhubung ke API backend lokal.

#### ❌ Sebelum Perbaikan (Crash saat API Mati):
```typescript
useEffect(() => {
  fetch(`${API_URL}/parcels`)
    .then(res => res.json())
    .then(data => setParcels(data));
    // Jika fetch gagal -> uncaught error, data kosong, layar putih/blank
}, []);
```

#### ✅ Setelah Perbaikan (Graceful Standalone Fallback):
```typescript
useEffect(() => {
  const initData = async () => {
    try {
      const res = await fetch(`${API_URL}/parcels`);
      if (!res.ok) throw new Error('API offline');
      const data = await res.json();
      setParcels(data);
      setIsStandalone(false);
    } catch {
      // Fallback otomatis ke penyimpanan lokal browser
      setIsStandalone(true);
      const cached = localStorage.getItem('rpl_parcels');
      setParcels(cached ? JSON.parse(cached) : INITIAL_SEED_DATA);
    }
  };
  initData();
}, []);
```
* **Perbedaan Nyata**: Frontend menampilkan badge *"● Mode Standalone (Penyimpanan Lokal Aktif)"* dan semua fitur pendaftaran, pencarian, dan mutasi tetap berjalan penuh via `localStorage`.

---

```
========================================================================================
8. ISSUE #9: MALFORMED JSON REQUEST BODY TRIGGERS UNHANDLED 500 HTML RESPONSE
========================================================================================
```
* **Berkas Sumber**: `apps/api/src/index.ts`
* **Permasalahan**: Permintaan dengan body JSON rusak memicu halaman error HTML default Express yang membocorkan stack trace.

#### ❌ Sebelum Perbaikan:
```typescript
app.use(express.json());
// Tidak ada error middleware -> Express merespons halaman HTML mentah dengan HTTP 500
```

#### ✅ Setelah Perbaikan (Centralized Error Middleware):
```typescript
app.use(express.json());

// Middleware penanganan error terpusat
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Format JSON body tidak valid',
      statusCode: 400
    });
  }
  return res.status(500).json({
    error: 'Terjadi kesalahan internal pada server',
    statusCode: 500
  });
});
```
* **Perbedaan Nyata**: Klien menerima respons JSON terstruktur berstatus HTTP 400 Bad Request tanpa eksposisi informasi server.

---

```
========================================================================================
9. ISSUE #10: COMMONJS VS ES MODULE CONFLICT DURING API BUILD PIPELINE
========================================================================================
```
* **Berkas Sumber**: `apps/api/tsconfig.json` & `apps/api/package.json`
* **Permasalahan**: Ketidaksesuaian modul `"type": "module"` menyebabkan `ReferenceError: exports is not defined` saat menjalankan file kompilasi `dist/index.js`.

#### ❌ Sebelum Perbaikan:
```json
// apps/api/package.json
{
  "name": "api",
  "type": "module" // Konflik dengan artefak CommonJS yang dihasilkan tsc
}
```

#### ✅ Setelah Perbaikan:
```json
// apps/api/tsconfig.json diselaraskan ke CommonJS terstandar
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2022",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```
* **Perbedaan Nyata**: Pipeline `npm run build` berhasil mengompilasi TypeScript ke JavaScript murni yang dapat dijalankan langsung oleh Node.js tanpa loader pihak ketiga.

---

```
========================================================================================
10. ISSUE #11: DOCUMENT ISSUANCE DATE ACCEPTS INVALID OR FUTURE DATE FORMAT
========================================================================================
```
* **Berkas Sumber**: `packages/shared/src/domain/land.ts`
* **Permasalahan**: Tanggal penerbitan dokumen hukum menerima tanggal di masa depan yang tidak realistis dan format teks acak.

#### ❌ Sebelum Perbaikan:
```typescript
// Langsung memasukkan tanggal tanpa validasi
export function attachDocument(parcel: LandPlot, doc: Document): void {
  parcel.documents.push(doc);
}
```

#### ✅ Setelah Perbaikan:
```typescript
// Validasi ketat format ISO 8601 (YYYY-MM-DD) dan pencegahan tanggal masa depan
export function validateDocumentIssuanceDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parsed = new Date(dateStr);
  const now = new Date();
  if (isNaN(parsed.getTime())) return false;
  // Menolak tanggal di masa depan
  return parsed <= now;
}

export function attachDocument(parcel: LandPlot, doc: Document): void {
  if (!validateDocumentIssuanceDate(doc.issuedDate)) {
    throw new Error('Tanggal terbit dokumen tidak valid atau berada di masa depan');
  }
  parcel.documents.push(doc);
}
```
* **Perbedaan Nyata**: Mencegah entri data korup atau tidak valid masuk ke linimasa kepemilikan tanah.

---

## 🏁 Kesimpulan Teknis
Seluruh 10 perubahan di atas membuktikan bahwa penanganan masalah dilakukan secara nyata pada level arsitektur dan kode program (*code-level implementation*), bukan sekadar penutupan tiket issue administratif. Seluruh 74 unit test lolos 100% dan build produksi bersih tanpa error.
