# Arsitektur & Spesifikasi Teknis: Sistem Monitoring Dokumen dan Status Kepemilikan Tanah

## 1. Stack Teknologi
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: Node.js + TypeScript + Express
- Database: MySQL (Dijalankan menggunakan Docker Compose)ORM: Prisma ORM
- Gaya API: REST API
- Monorepo: npm Workspaces dengan paket bersama (packages/shared)

## 2. Struktur Proyek (Monorepo)
land-document-tracker/
  apps/
    web/          # Aplikasi Frontend (React + Vite)
    api/          # Aplikasi Backend (Express REST API)
  packages/
    shared/       # Model data bersama, tipe TypeScript, enum, dan DTO
  docker-compose.yml
  .env.example
  README.md
 
## 3. Entitas Utama & Aturan Database

a. LandPlot (Bidang Tanah)
- Informasi geografis dan administratif bidang tanah (Nomor Sertifikat, Alamat, Desa/Kelurahan, Kecamatan, Kabupaten/Kota, Provinsi, Luas, Jenis Hak, dan Status Administrasi)

b. Owner (Pemilik)
- Data identitas subjek kepemilikan (Nama Pemilik, NIK, Alamat, No Telepon, dan Status Kepemilikan Aktif)

c. Document (Dokumen Tanah)
- Berkas pendukung seperti Sertifikat, Akta Jual Beli (AJB), Surat Waris, Surat Hibah, dll

d. OwnershipHistory (Riwayat Kepemilikan)
Catatan silsilah perpindahan hak atau transaksi dari pemilik lama ke pemilik baru beserta jenis peralihan dan tanggal perubahannya

## 4. Fitur Backend & Endpoint REST API
### Fitur Utama:
- CRUD LandPlot: Pengelolaan data master bidang tanah
- CRUD Owner: Pengelolaan data pemilik yang terikat pada bidang tanah
- CRUD Document: Pengelolaan arsip dokumen digital/fisik beserta validasi nomor dokumen
- CRUD OwnershipHistory: Pencatatan rantai peralihan kepemilikan historis
- Evaluasi Kelengkapan Otomatis: Sistem mengevaluasi status dokumen menjadi COMPLETE (Lengkap), INCOMPLETE (Belum Lengkap), atau NEEDS_REVIEW (Perlu Diperiksa)
- Pencarian Komprehensif: Filter cepat berdasarkan nomor sertifikat, nama pemilik, atau wilayah administratif (desa, kecamatan, kabupaten)

### Daftar Endpoint API:
- GET /api/lands - Daftar seluruh bidang tanah & pencarian
- POST /api/lands - Tambah bidang tanah baru
- GET /api/lands/:Id - Detail bidang tanah
- PUT /api/lands/:Id - Ubah data bidang tanah
- DELETE /api/lands/:Id - Hapus bidang tanah
- GET /api/lands/:LandPlotId/owners - Daftar pemilik tanah
- POST /api/lands/:LandPlotId/owners - Tambah data pemilik
- PUT /api/owners/:Id - Ubah data pemilik
- DELETE /api/owners/:Id - Hapus data pemilik
- GET /api/lands/:LandPlotId/documents - Daftar dokumen tanah
- POST /api/lands/:LandPlotId/documents - Tambah dokumen baru
- PUT /api/documents/:Id - Ubah data dokumen
- DELETE /api/documents/:Id - Hapus dokumen
- GET /api/lands/:LandPlotId/histories - Riwayat peralihan kepemilikan
- POST /api/lands/:LandPlotId/histories - Tambah catatan riwayat
- DELETE /api/histories/:Id - Hapus riwayat
- GET /api/lands/:LandPlotId/detail - Ringkasan lengkap (detail, pemilik, dokumen, riwayat, dan status kelengkapan)

## 5. Halaman Frontend & Antarmuka Pengguna (UI)
- Bahasa: Sepenuhnya menggunakan Bahasa Indonesia untuk seluruh label, tombol, pesan validasi, dan status
- Halaman Utama / Dashboard Pencarian: Kolom pencarian cepat berdasarkan nomor sertifikat, nama pemilik, atau alamat, disertai daftar kartu/tabel ringkas
- Manajemen Tanah: Formulir input data fisik bidang tanah dan navigasi cepat ke panel detail
- Manajemen Pemilik & Dokumen: Antarmuka berbasis tabel dan modal form untuk mencatat detail pemilik serta jenis dokumen (Sertifikat, AJB, Surat Waris, Hibah, dll)
- Tampilan Detail & Riwayat Tanah: Halaman komprehensif yang memuat profil tanah, pemilik saat ini, daftar dokumen, silsilah linimasa riwayat peralihan, serta lencana status kelengkapan
- Standar Warna Lencana Status:
   - Lengkap (COMPLETE): Hijau
   - Perlu Diperiksa (NEEDS_REVIEW): Oranye
   - Belum Lengkap (INCOMPLETE): Merah
   
## 6. Paket Bersama (packages/shared)
Berisi definisi antarmuka TypeScript terpusat (LandPlot, Owner, Document, OwnershipHistory, DocumentStatus, dsb.) yang diimpor langsung oleh apps/web dan apps/api guna menghindari duplikasi kode serta menjaga konsistensi tipe data secara ketat