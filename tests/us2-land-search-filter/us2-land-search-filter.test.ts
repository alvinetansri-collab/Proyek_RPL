import test from "node:test";
import assert from "node:assert";
import { searchLandPlots } from "../../packages/shared/src/features/feature-1-search-registration/landSearch.ts";
import type { LandPlot } from "../../packages/shared/src/models/LandPlot.ts";

const mockLands: Array<LandPlot & { CurrentOwnerName: string; CompletenessStatus?: string }> = [
  {
    Id: "1",
    CertificateNumber: "SHM-12.04.2023.001",
    Address: "Jl. Merdeka Raya No. 45",
    Village: "Sukasari",
    SubDistrict: "Bogor Timur",
    RegencyCity: "Kota Bogor",
    Province: "Jawa Barat",
    LandArea: 450,
    RightType: "Hak Milik (SHM)",
    AdminStatus: "Terdaftar Aktif",
    CompletenessStatus: "COMPLETE",
    CurrentOwnerName: "Budi Santoso",
    CreatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    Id: "2",
    CertificateNumber: "HGB-04.09.2021.089",
    Address: "Kawasan Industri Sentul Kav. 8",
    Village: "Kadumangu",
    SubDistrict: "Babakan Madang",
    RegencyCity: "Kabupaten Bogor",
    Province: "Jawa Barat",
    LandArea: 1200,
    RightType: "Hak Guna Bangunan (HGB)",
    AdminStatus: "Proses Perpanjangan",
    CompletenessStatus: "NEEDS_REVIEW",
    CurrentOwnerName: "PT Sentul Jaya Abadi",
    CreatedAt: "2021-09-04T00:00:00.000Z",
  },
  {
    Id: "3",
    CertificateNumber: "GIRIK-09.2018.114",
    Address: "Kampung Pasir Angin RT 02/04",
    Village: "Cipayung",
    SubDistrict: "Megamendung",
    RegencyCity: "Kabupaten Bogor",
    Province: "Jawa Barat",
    LandArea: 320,
    RightType: "Girik / Adat",
    AdminStatus: "Belum Bersertifikat",
    CompletenessStatus: "INCOMPLETE",
    CurrentOwnerName: "Siti Rahmawati",
    CreatedAt: "2018-09-01T00:00:00.000Z",
  },
];

test("US-2: Berhasil mencari berdasarkan nomor sertifikat secara parsial", () => {
  const result = searchLandPlots(mockLands, "SHM-12");
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].CertificateNumber, "SHM-12.04.2023.001");
});

test("US-2: Berhasil mencari berdasarkan nama pemilik secara case-insensitive", () => {
  const result = searchLandPlots(mockLands, "budi santoso");
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].CurrentOwnerName, "Budi Santoso");
});

test("US-2: Berhasil mencari berdasarkan nama desa / kelurahan", () => {
  const result = searchLandPlots(mockLands, "Kadumangu");
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].Id, "2");
});

test("US-2: Berhasil mencari berdasarkan nama kecamatan", () => {
  const result = searchLandPlots(mockLands, "Megamendung");
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].Id, "3");
});

test("US-2: Berhasil mencari berdasarkan nama kabupaten/kota", () => {
  const result = searchLandPlots(mockLands, "Kabupaten Bogor");
  assert.strictEqual(result.length, 2);
});

test("US-2: Filter jenis hak tanah Hak Milik (SHM) secara eksklusif", () => {
  const result = searchLandPlots(mockLands, { rightType: "Hak Milik (SHM)" });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].RightType, "Hak Milik (SHM)");
});

test("US-2: Filter jenis hak tanah Hak Guna Bangunan (HGB)", () => {
  const result = searchLandPlots(mockLands, { rightType: "Hak Guna Bangunan (HGB)" });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].RightType, "Hak Guna Bangunan (HGB)");
});

test("US-2: Filter jenis hak tanah Girik / Adat", () => {
  const result = searchLandPlots(mockLands, { rightType: "Girik / Adat" });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].RightType, "Girik / Adat");
});

test("US-2: Filter berdasarkan status kelengkapan dokumen COMPLETE", () => {
  const result = searchLandPlots(mockLands, { completenessStatus: "COMPLETE" });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].Id, "1");
});

test("US-2: Kueri yang tidak cocok menghasilkan array kosong tanpa runtime error", () => {
  const result = searchLandPlots(mockLands, "Surabaya");
  assert.strictEqual(result.length, 0);
});
