/**
 * P11 Comprehensive Regression Test Suite (126 Tests)
 * Digabungkan dengan 74 UT yang ada -> Menghasilkan TEPAT 200 Unit Tests
 * Memvalidasi seluruh domain bisnis, boundary conditions, mutasi, PII security, dan resilience
 */

import test from "node:test";
import assert from "node:assert";
import { DocumentStatus } from "../../packages/shared/src/enums/DocumentStatus.ts";
import {
  validateLandRegistration,
  searchLandPlots,
} from "../../packages/shared/src/features/feature-1-search-registration/landSearch.ts";
import {
  evaluateDocumentCompleteness,
  getStatusBadgeDetails,
  sortOwnershipTimeline,
  calculateDashboardMetrics,
  validateOwnershipTransfer,
} from "../../packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts";
import { validateDocumentAttachment } from "../../packages/shared/src/features/feature-3-document-management/documentManager.ts";
import {
  maskPII,
  sanitizeLogText,
} from "../../packages/shared/src/security/masking.ts";

// ========================================================================================
// BAGIAN 1: P11 Boundary & Validasi Pendaftaran Bidang Tanah (25 Tests: UT-001 s/d UT-025)
// ========================================================================================

test("P11-UT-001: Validasi pendaftaran menerima luas tanah desimal presisi (misal: 150.75 m²)", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.001",
    CurrentOwnerName: "Ahmad Dahlan",
    Address: "Jl. Pemuda No. 1",
    Village: "Sukasari",
    SubDistrict: "Bogor Timur",
    LandArea: 150.75,
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-002: Validasi pendaftaran menerima luas tanah minimal batas bawah (0.01 m²)", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.002",
    CurrentOwnerName: "Bambang",
    Address: "Kavling Mini",
    Village: "Babakan",
    SubDistrict: "Bogor Tengah",
    LandArea: 0.01,
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-003: Validasi pendaftaran menerima luas tanah berskala perkebunan besar (500000 m²)", () => {
  const res = validateLandRegistration({
    CertificateNumber: "HGU-12.01.2026.003",
    CurrentOwnerName: "PT Perkebunan Nusantara",
    Address: "Desa Perkebunan",
    Village: "Tugu",
    SubDistrict: "Cisarua",
    LandArea: 500000,
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-004: Validasi pendaftaran menolak nilai luas tanah NaN / string acak", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.004",
    CurrentOwnerName: "Bambang",
    Address: "Jl. Merdeka",
    Village: "Babakan",
    SubDistrict: "Bogor Tengah",
    LandArea: "dua ratus" as any,
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-005: Validasi pendaftaran menolak jika nomor sertifikat hanya terdiri dari spasi", () => {
  const res = validateLandRegistration({
    CertificateNumber: "   ",
    CurrentOwnerName: "Bambang",
    Address: "Jl. Merdeka",
    Village: "Babakan",
    SubDistrict: "Bogor Tengah",
    LandArea: 100,
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-006: Validasi pendaftaran menolak jika nama pemilik hanya spasi kosong", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.006",
    CurrentOwnerName: "     ",
    Address: "Jl. Merdeka",
    Village: "Babakan",
    SubDistrict: "Bogor Tengah",
    LandArea: 100,
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-007: Validasi pendaftaran menolak jika alamat hanya berupa spasi", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.007",
    CurrentOwnerName: "Bambang",
    Address: "   ",
    Village: "Babakan",
    SubDistrict: "Bogor Tengah",
    LandArea: 100,
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-008: Validasi pendaftaran menolak jika kelurahan/desa kosong", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.008",
    CurrentOwnerName: "Bambang",
    Address: "Jl. Pajajaran",
    Village: "",
    SubDistrict: "Bogor Tengah",
    LandArea: 100,
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-009: Validasi pendaftaran menolak jika kecamatan kosong", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.009",
    CurrentOwnerName: "Bambang",
    Address: "Jl. Pajajaran",
    Village: "Bantarjati",
    SubDistrict: "",
    LandArea: 100,
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-010: Validasi pendaftaran mendeteksi duplikasi nomor sertifikat dengan spasi ekstra", () => {
  const res = validateLandRegistration(
    {
      CertificateNumber: "  SHM-001/BOGOR  ",
      CurrentOwnerName: "Joko",
      Address: "Jl. Raya",
      Village: "Tengah",
      SubDistrict: "Bogor",
      LandArea: 200,
    },
    ["SHM-001/BOGOR"]
  );
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-011: Validasi pendaftaran mendeteksi duplikasi sertifikat case-insensitive (huruf kecil)", () => {
  const res = validateLandRegistration(
    {
      CertificateNumber: "shm-001/bogor",
      CurrentOwnerName: "Joko",
      Address: "Jl. Raya",
      Village: "Tengah",
      SubDistrict: "Bogor",
      LandArea: 200,
    },
    ["SHM-001/BOGOR"]
  );
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-012: Validasi pendaftaran meloloskan jenis hak Hak Pakai (HP)", () => {
  const res = validateLandRegistration({
    CertificateNumber: "HP-12.01.2026.012",
    CurrentOwnerName: "Instansi Pemerintah",
    Address: "Jl. Ir H Juanda",
    Village: "Paledang",
    SubDistrict: "Bogor Tengah",
    LandArea: 1200,
    RightType: "Hak Pakai",
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-013: Validasi pendaftaran meloloskan jenis hak Hak Pengelolaan (HPL)", () => {
  const res = validateLandRegistration({
    CertificateNumber: "HPL-12.01.2026.013",
    CurrentOwnerName: "Kementerian ATR/BPN",
    Address: "Kawasan Khusus",
    Village: "Cibogor",
    SubDistrict: "Bogor Tengah",
    LandArea: 3500,
    RightType: "Hak Pengelolaan",
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-014: Validasi pendaftaran meloloskan jenis hak Girik / Adat", () => {
  const res = validateLandRegistration({
    CertificateNumber: "GIRIK-C.114/2026",
    CurrentOwnerName: "Haji Marzuki",
    Address: "Kampung Adat",
    Village: "Mulyaharja",
    SubDistrict: "Bogor Selatan",
    LandArea: 450,
    RightType: "Girik / Adat",
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-015: Validasi pendaftaran menerima nama pemilik dengan gelar akademik / kehormatan", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.015",
    CurrentOwnerName: "Prof. Dr. Ir. H. Raden Soetomo, M.Sc.",
    Address: "Jl. Cendrawasih No. 5",
    Village: "Tegallega",
    SubDistrict: "Bogor Tengah",
    LandArea: 600,
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-016: Validasi pendaftaran menerima nama pemilik kata tunggal (mononim)", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.016",
    CurrentOwnerName: "Suharto",
    Address: "Jl. Kemuning",
    Village: "Sempur",
    SubDistrict: "Bogor Tengah",
    LandArea: 250,
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-017: Validasi pendaftaran menerima nama pemilik tanda hubung (hyphenated)", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.017",
    CurrentOwnerName: "Siti Nur-Aini",
    Address: "Jl. Dahlia",
    Village: "Sempur",
    SubDistrict: "Bogor Tengah",
    LandArea: 180,
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-018: Validasi pendaftaran menerima format alamat lengkap dengan nomor RT/RW", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.01.2026.018",
    CurrentOwnerName: "Agus Pratama",
    Address: "Kp. Gunung Batu RT 003/RW 007 Blok C No. 42",
    Village: "Gunungbatu",
    SubDistrict: "Bogor Barat",
    LandArea: 90,
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-019: Validasi pendaftaran menerima nomor sertifikat dengan format pemisah garis miring", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM/04.09/2026/0019",
    CurrentOwnerName: "Rudi Hartono",
    Address: "Jl. Anggrek",
    Village: "Baranangsiang",
    SubDistrict: "Bogor Timur",
    LandArea: 300,
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-020: Validasi pendaftaran menerima nomor sertifikat Letter C tradisional", () => {
  const res = validateLandRegistration({
    CertificateNumber: "LETTER-C-No.542/Persil-12",
    CurrentOwnerName: "H. Sanusi",
    Address: "Desa Sukamaju",
    Village: "Sukamaju",
    SubDistrict: "Cibungbulang",
    LandArea: 1500,
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-021: Validasi pendaftaran menolak saat semua field wajib berupa string kosong", () => {
  const res = validateLandRegistration({
    CertificateNumber: "",
    CurrentOwnerName: "",
    Address: "",
    Village: "",
    SubDistrict: "",
    LandArea: 0,
  });
  assert.strictEqual(res.isValid, false);
  assert.ok(res.errors.length >= 5);
});

test("P11-UT-022: Validasi pendaftaran mengakumulasi multiple errors secara komprehensif", () => {
  const res = validateLandRegistration({
    CertificateNumber: "",
    CurrentOwnerName: "",
    Address: "Jl. Ada",
    Village: "Desa",
    SubDistrict: "Kec",
    LandArea: -50,
  });
  assert.strictEqual(res.isValid, false);
  assert.strictEqual(res.errors.length, 3);
});

test("P11-UT-023: Validasi pendaftaran lolos saat daftar sertifikat terdaftar sebelumnya kosong", () => {
  const res = validateLandRegistration(
    {
      CertificateNumber: "SHM-100",
      CurrentOwnerName: "Owner Pertama",
      Address: "Jl. Pertama",
      Village: "Desa",
      SubDistrict: "Kec",
      LandArea: 100,
    },
    []
  );
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-024: Validasi pendaftaran membedakan sertifikat mirip namun berlainan digit akhir", () => {
  const res = validateLandRegistration(
    {
      CertificateNumber: "SHM-12.04.2026.001",
      CurrentOwnerName: "Owner Beda",
      Address: "Jl. Baru",
      Village: "Desa",
      SubDistrict: "Kec",
      LandArea: 100,
    },
    ["SHM-12.04.2026.002", "SHM-12.04.2026.003"]
  );
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-025: Validasi pendaftaran meloloskan input dengan field opsional lengkap", () => {
  const res = validateLandRegistration({
    CertificateNumber: "SHM-12.04.2026.025",
    CurrentOwnerName: "Owner Lengkap",
    Address: "Jl. Raya Pajajaran",
    Village: "Sukasari",
    SubDistrict: "Bogor Timur",
    RegencyCity: "Kota Bogor",
    Province: "Jawa Barat",
    LandArea: 420,
    RightType: "Hak Milik (SHM)",
    AdminStatus: "Terdaftar Aktif",
  });
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.errors.length, 0);
});

// ========================================================================================
// BAGIAN 2: P11 Search & Multi-Criteria Filtering Engine (25 Tests: UT-026 s/d UT-050)
// ========================================================================================

const mockParcels = [
  {
    id: "p1",
    CertificateNumber: "SHM-001/BGR",
    CurrentOwnerName: "Budi Santoso",
    Address: "Jl. Merdeka Raya No. 45",
    Village: "Paledang",
    SubDistrict: "Bogor Tengah",
    RegencyCity: "Kota Bogor",
    Province: "Jawa Barat",
    LandArea: 450,
    RightType: "Hak Milik (SHM)",
    AdminStatus: "Terdaftar Aktif",
    CompletenessStatus: DocumentStatus.COMPLETE,
  },
  {
    id: "p2",
    CertificateNumber: "HGB-002/SNT",
    CurrentOwnerName: "PT Sentul Jaya",
    Address: "Kawasan Industri Sentul Kav 8",
    Village: "Kadumangu",
    SubDistrict: "Babakan Madang",
    RegencyCity: "Kabupaten Bogor",
    Province: "Jawa Barat",
    LandArea: 1200,
    RightType: "Hak Guna Bangunan (HGB)",
    AdminStatus: "Terdaftar Aktif",
    CompletenessStatus: DocumentStatus.NEEDS_REVIEW,
  },
  {
    id: "p3",
    CertificateNumber: "GIRIK-003/PSR",
    CurrentOwnerName: "Siti Rahmawati",
    Address: "Kampung Pasir Angin RT 02/04",
    Village: "Pasir Angin",
    SubDistrict: "Megamendung",
    RegencyCity: "Kabupaten Bogor",
    Province: "Jawa Barat",
    LandArea: 320,
    RightType: "Girik / Adat",
    AdminStatus: "Belum Bersertifikat",
    CompletenessStatus: DocumentStatus.INCOMPLETE,
  },
] as any[];

test("P11-UT-026: Pencarian teks parsial nomor sertifikat awalan 'SHM'", () => {
  const res = searchLandPlots(mockParcels, "SHM");
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].id, "p1");
});

test("P11-UT-027: Pencarian teks parsial nomor sertifikat akhiran 'SNT'", () => {
  const res = searchLandPlots(mockParcels, "SNT");
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].id, "p2");
});

test("P11-UT-028: Pencarian nama pemilik huruf kecil 'budi'", () => {
  const res = searchLandPlots(mockParcels, "budi");
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].CurrentOwnerName, "Budi Santoso");
});

test("P11-UT-029: Pencarian nama pemilik huruf kapital 'BUDI'", () => {
  const res = searchLandPlots(mockParcels, "BUDI");
  assert.strictEqual(res.length, 1);
});

test("P11-UT-030: Pencarian nama pemilik campuran huruf 'bUdI SaNtOsO'", () => {
  const res = searchLandPlots(mockParcels, "bUdI SaNtOsO");
  assert.strictEqual(res.length, 1);
});

test("P11-UT-031: Pencarian berdasarkan potongan nama belakang 'Rahmawati'", () => {
  const res = searchLandPlots(mockParcels, "Rahmawati");
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].id, "p3");
});

test("P11-UT-032: Pencarian berdasarkan nama korporasi 'PT Sentul'", () => {
  const res = searchLandPlots(mockParcels, "PT Sentul");
  assert.strictEqual(res.length, 1);
});

test("P11-UT-033: Pencarian berdasarkan nama jalan 'Merdeka'", () => {
  const res = searchLandPlots(mockParcels, "Merdeka");
  assert.strictEqual(res.length, 1);
});

test("P11-UT-034: Pencarian berdasarkan nama kawasan industri 'Industri Sentul'", () => {
  const res = searchLandPlots(mockParcels, "Industri Sentul");
  assert.strictEqual(res.length, 1);
});

test("P11-UT-035: Pencarian berdasarkan nomor RT/RW '02/04'", () => {
  const res = searchLandPlots(mockParcels, "02/04");
  assert.strictEqual(res.length, 1);
});

test("P11-UT-036: Pencarian berdasarkan nama kelurahan 'Paledang'", () => {
  const res = searchLandPlots(mockParcels, "Paledang");
  assert.strictEqual(res.length, 1);
});

test("P11-UT-037: Pencarian berdasarkan nama kecamatan 'Babakan Madang'", () => {
  const res = searchLandPlots(mockParcels, "Babakan Madang");
  assert.strictEqual(res.length, 1);
});

test("P11-UT-038: Pencarian berdasarkan nama kabupaten 'Kabupaten Bogor'", () => {
  const res = searchLandPlots(mockParcels, "Kabupaten Bogor");
  assert.strictEqual(res.length, 2);
});

test("P11-UT-039: Pencarian dengan string kosong mengembalikan seluruh data", () => {
  const res = searchLandPlots(mockParcels, "");
  assert.strictEqual(res.length, 3);
});

test("P11-UT-040: Pencarian dengan karakter spasi saja mengembalikan seluruh data", () => {
  const res = searchLandPlots(mockParcels, "   ");
  assert.strictEqual(res.length, 3);
});

test("P11-UT-041: Pencarian kueri yang tidak ada mengembalikan array kosong", () => {
  const res = searchLandPlots(mockParcels, "Surabaya");
  assert.strictEqual(res.length, 0);
});

test("P11-UT-042: Filter eksklusif jenis hak Hak Milik (SHM)", () => {
  const res = searchLandPlots(mockParcels, { rightType: "Hak Milik (SHM)" });
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].RightType, "Hak Milik (SHM)");
});

test("P11-UT-043: Filter eksklusif jenis hak Hak Guna Bangunan (HGB)", () => {
  const res = searchLandPlots(mockParcels, { rightType: "Hak Guna Bangunan (HGB)" });
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].RightType, "Hak Guna Bangunan (HGB)");
});

test("P11-UT-044: Filter eksklusif jenis hak Girik / Adat", () => {
  const res = searchLandPlots(mockParcels, { rightType: "Girik / Adat" });
  assert.strictEqual(res.length, 1);
});

test("P11-UT-045: Filter dengan rightType 'ALL' tidak membatasi jenis hak", () => {
  const res = searchLandPlots(mockParcels, { rightType: "ALL" });
  assert.strictEqual(res.length, 3);
});

test("P11-UT-046: Filter kombinasi teks kueri dan jenis hak yang cocok", () => {
  const res = searchLandPlots(mockParcels, { query: "Budi", rightType: "Hak Milik (SHM)" });
  assert.strictEqual(res.length, 1);
});

test("P11-UT-047: Filter kombinasi teks kueri dan jenis hak yang berlawanan menghasilkan kosong", () => {
  const res = searchLandPlots(mockParcels, { query: "Budi", rightType: "Hak Guna Bangunan (HGB)" });
  assert.strictEqual(res.length, 0);
});

test("P11-UT-048: Filter status administrasi 'Terdaftar Aktif'", () => {
  const res = searchLandPlots(mockParcels, { adminStatus: "Terdaftar Aktif" });
  assert.strictEqual(res.length, 2);
});

test("P11-UT-049: Filter status kelengkapan COMPLETE", () => {
  const res = searchLandPlots(mockParcels, { completenessStatus: DocumentStatus.COMPLETE });
  assert.strictEqual(res.length, 1);
});

test("P11-UT-050: Filter multi-kriteria 3 parameter sekaligus (query + rightType + status)", () => {
  const res = searchLandPlots(mockParcels, {
    query: "Sentul",
    rightType: "Hak Guna Bangunan (HGB)",
    completenessStatus: DocumentStatus.NEEDS_REVIEW,
  });
  assert.strictEqual(res.length, 1);
  assert.strictEqual(res[0].id, "p2");
});

// ========================================================================================
// BAGIAN 3: P11 Evaluasi Kelengkapan Dokumen & Lencana Status (25 Tests: UT-051 s/d UT-075)
// ========================================================================================

test("P11-UT-051: Evaluasi 0 dokumen menghasilkan status INCOMPLETE", () => {
  assert.strictEqual(evaluateDocumentCompleteness([]), DocumentStatus.INCOMPLETE);
});

test("P11-UT-052: Evaluasi parameter undefined/null default ke status INCOMPLETE", () => {
  assert.strictEqual(evaluateDocumentCompleteness(undefined), DocumentStatus.INCOMPLETE);
});

test("P11-UT-053: Evaluasi tepat 1 dokumen menghasilkan status NEEDS_REVIEW", () => {
  assert.strictEqual(evaluateDocumentCompleteness([{ DocumentType: "Sertifikat" } as any]), DocumentStatus.NEEDS_REVIEW);
});

test("P11-UT-054: Evaluasi tepat 2 dokumen menghasilkan status NEEDS_REVIEW", () => {
  assert.strictEqual(
    evaluateDocumentCompleteness([{ DocumentType: "Sertifikat" }, { DocumentType: "KTP" }] as any),
    DocumentStatus.NEEDS_REVIEW
  );
});

test("P11-UT-055: Evaluasi tepat 3 dokumen menghasilkan status COMPLETE", () => {
  assert.strictEqual(
    evaluateDocumentCompleteness([
      { DocumentType: "Sertifikat" },
      { DocumentType: "KTP" },
      { DocumentType: "PBB" },
    ] as any),
    DocumentStatus.COMPLETE
  );
});

test("P11-UT-056: Evaluasi 4 dokumen menghasilkan status COMPLETE", () => {
  assert.strictEqual(
    evaluateDocumentCompleteness([
      { DocumentType: "Sertifikat" },
      { DocumentType: "KTP" },
      { DocumentType: "PBB" },
      { DocumentType: "AJB" },
    ] as any),
    DocumentStatus.COMPLETE
  );
});

test("P11-UT-057: Evaluasi 10 dokumen lengkap tetap berstatus COMPLETE", () => {
  const docs = Array.from({ length: 10 }, (_, i) => ({ DocumentType: `Dokumen-${i + 1}` }));
  assert.strictEqual(evaluateDocumentCompleteness(docs as any), DocumentStatus.COMPLETE);
});

test("P11-UT-058: Evaluasi mendukung properti huruf kecil { documentType: 'Sertifikat' }", () => {
  assert.strictEqual(
    evaluateDocumentCompleteness([{ documentType: "Sertifikat" }] as any),
    DocumentStatus.NEEDS_REVIEW
  );
});

test("P11-UT-059: Lencana status COMPLETE berlabel 'Lengkap'", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.COMPLETE);
  assert.strictEqual(badge.label, "Lengkap");
});

test("P11-UT-060: Lencana status COMPLETE berwana hijau (green)", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.COMPLETE);
  assert.strictEqual(badge.colorName, "green");
});

test("P11-UT-061: Lencana status COMPLETE memiliki kelas Tailwind border-green-300", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.COMPLETE);
  assert.ok(badge.badgeClass.includes("border-green-300"));
});

test("P11-UT-062: Lencana status NEEDS_REVIEW berlabel 'Perlu Diperiksa'", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.NEEDS_REVIEW);
  assert.strictEqual(badge.label, "Perlu Diperiksa");
});

test("P11-UT-063: Lencana status NEEDS_REVIEW berwarna oranye (orange)", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.NEEDS_REVIEW);
  assert.strictEqual(badge.colorName, "orange");
});

test("P11-UT-064: Lencana status NEEDS_REVIEW memiliki kelas Tailwind bg-orange-100", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.NEEDS_REVIEW);
  assert.ok(badge.badgeClass.includes("bg-orange-100"));
});

test("P11-UT-065: Lencana status INCOMPLETE berlabel 'Belum Lengkap'", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.INCOMPLETE);
  assert.strictEqual(badge.label, "Belum Lengkap");
});

test("P11-UT-066: Lencana status INCOMPLETE berwarna merah (red)", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.INCOMPLETE);
  assert.strictEqual(badge.colorName, "red");
});

test("P11-UT-067: Lencana status INCOMPLETE memiliki kelas Tailwind bg-red-100", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.INCOMPLETE);
  assert.ok(badge.badgeClass.includes("bg-red-100"));
});

test("P11-UT-068: Validasi lampiran dokumen berhasil saat data lengkap", () => {
  const res = validateDocumentAttachment({
    documentType: "Sertifikat Tanah",
    documentNumber: "DOC-001/2026",
    documentDate: "2026-05-10",
  });
  assert.strictEqual(res.isValid, true);
  assert.strictEqual(res.errors.length, 0);
});

test("P11-UT-069: Validasi lampiran dokumen menolak jika jenis dokumen kosong", () => {
  const res = validateDocumentAttachment({
    documentType: "",
    documentNumber: "DOC-002",
    documentDate: "2026-05-10",
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-070: Validasi lampiran dokumen menolak jika nomor dokumen kosong", () => {
  const res = validateDocumentAttachment({
    documentType: "KTP",
    documentNumber: "  ",
    documentDate: "2026-05-10",
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-071: Validasi lampiran dokumen menolak jika tanggal terbit kosong", () => {
  const res = validateDocumentAttachment({
    documentType: "PBB",
    documentNumber: "DOC-003",
    documentDate: "",
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-072: Validasi lampiran dokumen menolak format tanggal salah", () => {
  const res = validateDocumentAttachment({
    documentType: "PBB",
    documentNumber: "DOC-004",
    documentDate: "bukan-tanggal",
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-073: Validasi lampiran dokumen menolak duplikasi nomor dokumen pada tanah yang sama", () => {
  const res = validateDocumentAttachment(
    {
      documentType: "PBB",
      documentNumber: "DOC-DUP-01",
      documentDate: "2026-05-10",
    },
    [{ documentNumber: "DOC-DUP-01" }]
  );
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-074: Validasi duplikasi nomor dokumen bersifat case-insensitive", () => {
  const res = validateDocumentAttachment(
    {
      documentType: "PBB",
      documentNumber: "doc-dup-01",
      documentDate: "2026-05-10",
    },
    [{ documentNumber: "DOC-DUP-01" }]
  );
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-075: Validasi lampiran dokumen meloloskan jika nomor dokumen berbeda", () => {
  const res = validateDocumentAttachment(
    {
      documentType: "PBB",
      documentNumber: "DOC-NEW-02",
      documentDate: "2026-05-10",
    },
    [{ documentNumber: "DOC-DUP-01" }]
  );
  assert.strictEqual(res.isValid, true);
});

// ========================================================================================
// BAGIAN 4: P11 Linimasa Mutasi Silsilah Kepemilikan Tanah (25 Tests: UT-076 s/d UT-100)
// ========================================================================================

const mockHistory = [
  { id: "h1", transferDate: "2020-01-15", currentOwnerName: "Pemilik A" },
  { id: "h2", transferDate: "2023-08-20", currentOwnerName: "Pemilik B" },
  { id: "h3", transferDate: "2025-11-05", currentOwnerName: "Pemilik C" },
];

test("P11-UT-076: Pengurutan linimasa ascending mengurutkan dari tahun terlama (2020 -> 2025)", () => {
  const sorted = sortOwnershipTimeline(mockHistory, "asc");
  assert.strictEqual(sorted[0].id, "h1");
  assert.strictEqual(sorted[2].id, "h3");
});

test("P11-UT-077: Pengurutan linimasa descending mengurutkan dari tahun terbaru (2025 -> 2020)", () => {
  const sorted = sortOwnershipTimeline(mockHistory, "desc");
  assert.strictEqual(sorted[0].id, "h3");
  assert.strictEqual(sorted[2].id, "h1");
});

test("P11-UT-078: Pengurutan linimasa menangani array kosong tanpa melempar exception", () => {
  const sorted = sortOwnershipTimeline([], "asc");
  assert.deepStrictEqual(sorted, []);
});

test("P11-UT-079: Pengurutan linimasa mempertahankan array 1 elemen", () => {
  const sorted = sortOwnershipTimeline([mockHistory[0]], "asc");
  assert.strictEqual(sorted.length, 1);
});

test("P11-UT-080: Pengurutan linimasa tidak memodifikasi array input asli (immutable)", () => {
  const copy = [...mockHistory];
  sortOwnershipTimeline(copy, "desc");
  assert.strictEqual(copy[0].id, "h1");
});

test("P11-UT-081: Pengurutan linimasa mendukung properti huruf besar { TransferDate }", () => {
  const items = [{ TransferDate: "2021-02-01" }, { TransferDate: "2019-05-10" }];
  const sorted = sortOwnershipTimeline(items, "asc");
  assert.strictEqual(sorted[0].TransferDate, "2019-05-10");
});

test("P11-UT-082: Pengurutan linimasa menangani tanggal tidak valid secara stabil", () => {
  const items = [{ transferDate: "tanggal-rusak" }, { transferDate: "2022-01-01" }];
  const sorted = sortOwnershipTimeline(items, "asc");
  assert.strictEqual(sorted.length, 2);
});

test("P11-UT-083: Validasi mutasi kepemilikan lolos saat input jenis AJB lengkap", () => {
  const res = validateOwnershipTransfer(
    {
      transferType: "Akta Jual Beli (AJB)",
      transferDate: "2026-05-15",
      newOwnerName: "Hendra Wijaya",
    },
    "Budi Santoso"
  );
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-084: Validasi mutasi kepemilikan lolos saat jenis Hibah", () => {
  const res = validateOwnershipTransfer(
    {
      transferType: "Hibah",
      transferDate: "2026-05-15",
      newOwnerName: "Anak Kandung",
    },
    "Orang Tua"
  );
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-085: Validasi mutasi kepemilikan lolos saat jenis Waris", () => {
  const res = validateOwnershipTransfer(
    {
      transferType: "Waris",
      transferDate: "2026-05-15",
      newOwnerName: "Ahli Waris",
    },
    "Almarhum"
  );
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-086: Validasi mutasi kepemilikan lolos saat jenis Lelang Negara", () => {
  const res = validateOwnershipTransfer(
    {
      transferType: "Lelang Eksekusi Hak Tanggungan",
      transferDate: "2026-05-15",
      newOwnerName: "Pemenang Lelang",
    },
    "Debitur Lama"
  );
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-087: Validasi mutasi kepemilikan menolak jika nama pemilik baru kosong", () => {
  const res = validateOwnershipTransfer(
    {
      transferType: "Akta Jual Beli (AJB)",
      transferDate: "2026-05-15",
      newOwnerName: "",
    },
    "Budi"
  );
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-088: Validasi mutasi kepemilikan menolak jika jenis mutasi kosong", () => {
  const res = validateOwnershipTransfer(
    {
      transferType: "",
      transferDate: "2026-05-15",
      newOwnerName: "Joko",
    },
    "Budi"
  );
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-089: Validasi mutasi kepemilikan menolak jika tanggal mutasi kosong", () => {
  const res = validateOwnershipTransfer(
    {
      transferType: "AJB",
      transferDate: "",
      newOwnerName: "Joko",
    },
    "Budi"
  );
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-090: Validasi mutasi kepemilikan menolak jika pemilik baru identik dengan pemilik saat ini", () => {
  const res = validateOwnershipTransfer(
    {
      transferType: "AJB",
      transferDate: "2026-05-15",
      newOwnerName: "Budi Santoso",
    },
    "Budi Santoso"
  );
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-091: Validasi mutasi identik bersifat case-insensitive ('budi santoso' vs 'BUDI SANTOSO')", () => {
  const res = validateOwnershipTransfer(
    {
      transferType: "AJB",
      transferDate: "2026-05-15",
      newOwnerName: "budi santoso",
    },
    "BUDI SANTOSO"
  );
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-092: Validasi mutasi mengizinkan mutasi jika currentOwnerName belum terdefinisi", () => {
  const res = validateOwnershipTransfer({
    transferType: "Pemberian Hak Baru",
    transferDate: "2026-05-15",
    newOwnerName: "Pemilik Perdana",
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-093: Validasi mutasi mengizinkan input catatan tambahan (note)", () => {
  const res = validateOwnershipTransfer({
    transferType: "AJB",
    transferDate: "2026-05-15",
    newOwnerName: "Pembeli",
    note: "Transaksi di hadapan PPAT Notaris Siti SH",
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-094: Validasi mutasi mengizinkan input NIK pemilik baru", () => {
  const res = validateOwnershipTransfer({
    transferType: "AJB",
    transferDate: "2026-05-15",
    newOwnerName: "Pembeli",
    newOwnerNik: "3201123456780009",
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-095: Validasi mutasi mengizinkan input telepon pemilik baru", () => {
  const res = validateOwnershipTransfer({
    transferType: "AJB",
    transferDate: "2026-05-15",
    newOwnerName: "Pembeli",
    newOwnerPhone: "081299887766",
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-096: Validasi mutasi mengizinkan input alamat pemilik baru", () => {
  const res = validateOwnershipTransfer({
    transferType: "AJB",
    transferDate: "2026-05-15",
    newOwnerName: "Pembeli",
    newOwnerAddress: "Jl. Baru No. 12",
  });
  assert.strictEqual(res.isValid, true);
});

test("P11-UT-097: Validasi format tanggal mutasi menolak teks acak", () => {
  const res = validateOwnershipTransfer({
    transferType: "AJB",
    transferDate: "hari-senin",
    newOwnerName: "Pembeli",
  });
  assert.strictEqual(res.isValid, false);
});

test("P11-UT-098: Silsilah mutasi beruntun 3 generasi mempertahankan rantai kronologis", () => {
  const chain = [
    { transferDate: "1995-04-10", currentOwnerName: "Generasi 1" },
    { transferDate: "2010-09-12", currentOwnerName: "Generasi 2" },
    { transferDate: "2024-01-05", currentOwnerName: "Generasi 3" },
  ];
  const sorted = sortOwnershipTimeline(chain, "asc");
  assert.strictEqual(sorted[0].currentOwnerName, "Generasi 1");
  assert.strictEqual(sorted[2].currentOwnerName, "Generasi 3");
});

test("P11-UT-099: Silsilah mutasi multi-tanggal pada hari yang sama ditangani tanpa crash", () => {
  const sameDay = [
    { transferDate: "2026-01-01", id: "1" },
    { transferDate: "2026-01-01", id: "2" },
  ];
  const sorted = sortOwnershipTimeline(sameDay, "asc");
  assert.strictEqual(sorted.length, 2);
});

test("P11-UT-100: Silsilah linimasa mempertahankan seluruh properti objek asli", () => {
  const item = { transferDate: "2026-01-01", customProp: "NilaiPenting", nominal: 500000000 };
  const sorted = sortOwnershipTimeline([item], "asc");
  assert.strictEqual(sorted[0].customProp, "NilaiPenting");
  assert.strictEqual(sorted[0].nominal, 500000000);
});

// ========================================================================================
// BAGIAN 5: P11 Keamanan, Sanitasi PII, & Resiliensi Dashboard (26 Tests: UT-101 s/d UT-126)
// ========================================================================================

test("P11-UT-101: Masking NIK 16 digit menyembunyikan 8 digit tengah", () => {
  const masked = maskPII("NIK Pemilik: 3271012345670001");
  assert.strictEqual(masked.includes("3271********0001"), true);
});

test("P11-UT-102: Masking nomor telepon seluler awalan 0857 (Indosat)", () => {
  const masked = maskPII("085712345678");
  assert.strictEqual(masked.includes("1234"), false);
});

test("P11-UT-103: Masking nomor telepon seluler awalan 0878 (XL Axiata)", () => {
  const masked = maskPII("087812345678");
  assert.strictEqual(masked.includes("1234"), false);
});

test("P11-UT-104: Masking nomor telepon seluler awalan 0896 (Tri)", () => {
  const masked = maskPII("089612345678");
  assert.strictEqual(masked.includes("1234"), false);
});

test("P11-UT-105: Masking nomor telepon seluler awalan 0811 (Telkomsel Halo)", () => {
  const masked = maskPII("081112345678");
  assert.strictEqual(masked.includes("1234"), false);
});

test("P11-UT-106: Masking nomor telepon format 628123456789 (tanpa plus)", () => {
  const masked = maskPII("+62 812-3456-7890");
  assert.strictEqual(masked.includes("3456"), false);
});

test("P11-UT-107: Masking telepon PSTN kode area 022 Bandung", () => {
  const masked = maskPII("022-2501234");
  assert.strictEqual(masked.includes("2501"), false);
});

test("P11-UT-108: Masking telepon PSTN kode area 024 Semarang", () => {
  const masked = maskPII("024-8411234");
  assert.strictEqual(masked.includes("8411"), false);
});

test("P11-UT-109: Masking telepon PSTN kode area 031 Surabaya", () => {
  const masked = maskPII("031-5911234");
  assert.strictEqual(masked.includes("5911"), false);
});

test("P11-UT-110: Masking telepon PSTN kode area 0274 Yogyakarta", () => {
  const masked = maskPII("0274-561234");
  assert.strictEqual(masked.includes("5612"), false);
});

test("P11-UT-111: Sanitasi teks menyensor path Windows backslash C:\\Users\\Administrator", () => {
  const clean = sanitizeLogText("Error terjadi pada C:\\Users\\Administrator\\app\\index.ts");
  assert.strictEqual(clean.includes("C:\\Users"), false);
  assert.strictEqual(clean.includes("[INTERNAL_PATH]"), true);
});

test("P11-UT-112: Sanitasi teks menyensor path Windows forward-slash D:/Proyek/server.ts", () => {
  const clean = sanitizeLogText("Crash di D:/Proyek/server.ts");
  assert.strictEqual(clean.includes("D:/Proyek"), false);
  assert.strictEqual(clean.includes("[INTERNAL_PATH]"), true);
});

test("P11-UT-113: Sanitasi teks menyensor File URI file:///C:/Users/app.log", () => {
  const clean = sanitizeLogText("Log di file:///C:/Users/app.log");
  assert.strictEqual(clean.includes("file:///"), false);
  assert.strictEqual(clean.includes("[INTERNAL_PATH]"), true);
});

test("P11-UT-114: Sanitasi teks menyensor POSIX path /root/production/api", () => {
  const clean = sanitizeLogText("Database offline at /root/production/api");
  assert.strictEqual(clean.includes("/root/production"), false);
  assert.strictEqual(clean.includes("[INTERNAL_PATH]"), true);
});

test("P11-UT-115: Sanitasi teks menyensor POSIX path /var/log/nginx/access.log", () => {
  const clean = sanitizeLogText("Access from /var/log/nginx/access.log");
  assert.strictEqual(clean.includes("/var/log"), false);
  assert.strictEqual(clean.includes("[INTERNAL_PATH]"), true);
});

test("P11-UT-116: Sanitasi teks menyensor Windows UNC path \\\\?\\C:\\system.dat", () => {
  const clean = sanitizeLogText("Path UNC: \\\\?\\C:\\system.dat");
  assert.strictEqual(clean.includes("\\\\?\\C:"), false);
  assert.strictEqual(clean.includes("[INTERNAL_PATH]"), true);
});

test("P11-UT-117: Sanitasi teks mencegah CRLF Log Injection karakter \\r\\n", () => {
  const clean = sanitizeLogText("Pesan normal\r\n[AUDIT] Injected Fake Event");
  assert.strictEqual(clean.includes("\r"), false);
  assert.strictEqual(clean.includes("\n"), false);
});

test("P11-UT-118: Sanitasi teks mencegah baris baru ganda berturut-turut", () => {
  const clean = sanitizeLogText("Baris 1\n\n\nBaris 2");
  assert.strictEqual(clean.includes("\n"), false);
});

test("P11-UT-119: Metrik dashboard menghitung total 0 saat array kosong tanpa division by zero", () => {
  const metrics = calculateDashboardMetrics([]);
  assert.strictEqual(metrics.total, 0);
  assert.strictEqual(metrics.completenessRate, 0);
});

test("P11-UT-120: Metrik dashboard menghitung total tanah secara akurat", () => {
  const metrics = calculateDashboardMetrics([
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.NEEDS_REVIEW },
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
  ]);
  assert.strictEqual(metrics.total, 3);
});

test("P11-UT-121: Metrik dashboard menghitung kategori COMPLETE secara tepat", () => {
  const metrics = calculateDashboardMetrics([
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
  ]);
  assert.strictEqual(metrics.complete, 2);
});

test("P11-UT-122: Metrik dashboard menghitung kategori NEEDS_REVIEW secara tepat", () => {
  const metrics = calculateDashboardMetrics([
    { CompletenessStatus: DocumentStatus.NEEDS_REVIEW },
    { CompletenessStatus: DocumentStatus.NEEDS_REVIEW },
  ]);
  assert.strictEqual(metrics.needsReview, 2);
});

test("P11-UT-123: Metrik dashboard menghitung kategori INCOMPLETE secara tepat", () => {
  const metrics = calculateDashboardMetrics([
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
  ]);
  assert.strictEqual(metrics.incomplete, 3);
});

test("P11-UT-124: Metrik dashboard completenessRate bernilai 100% jika seluruh tanah berstatus COMPLETE", () => {
  const metrics = calculateDashboardMetrics([
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.COMPLETE },
  ]);
  assert.strictEqual(metrics.completenessRate, 100);
});

test("P11-UT-125: Metrik dashboard completenessRate bernilai 50% jika separuh tanah COMPLETE", () => {
  const metrics = calculateDashboardMetrics([
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
  ]);
  assert.strictEqual(metrics.completenessRate, 50);
});

test("P11-UT-126: Metrik dashboard membulatkan persentase rasio kelengkapan ke bilangan bulat terdekat", () => {
  const metrics = calculateDashboardMetrics([
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.NEEDS_REVIEW },
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
  ]);
  // 1 dari 3 = 33.333% dibulatkan menjadi 33%
  assert.strictEqual(metrics.completenessRate, 33);
});
