import test from "node:test";
import assert from "node:assert";
import { searchLandPlots, validateLandRegistration } from "../packages/shared/src/utils/landSearch.ts";
import type { LandPlot } from "../packages/shared/src/models/LandPlot.ts";

const sampleLands: Array<LandPlot & { CurrentOwnerName: string }> = [
  {
    Id: "land-1",
    CertificateNumber: "SHM-12.04.2023.001",
    Address: "Jl. Merdeka Raya No. 45",
    Village: "Sukasari",
    SubDistrict: "Bogor Timur",
    RegencyCity: "Kota Bogor",
    Province: "Jawa Barat",
    LandArea: 450,
    RightType: "Hak Milik",
    AdminStatus: "Terdaftar",
    CurrentOwnerName: "Budi Santoso",
    CreatedAt: "2023-01-01T00:00:00.000Z",
  },
  {
    Id: "land-2",
    CertificateNumber: "HGB-04.09.2021.089",
    Address: "Kawasan Industri Sentul Kav. 8",
    Village: "Kadumangu",
    SubDistrict: "Babakan Madang",
    RegencyCity: "Kabupaten Bogor",
    Province: "Jawa Barat",
    LandArea: 1200,
    RightType: "Hak Guna Bangunan",
    AdminStatus: "Terdaftar",
    CurrentOwnerName: "PT Sentul Jaya Abadi",
    CreatedAt: "2021-09-04T00:00:00.000Z",
  },
  {
    Id: "land-3",
    CertificateNumber: "GIRIK-09.2018.114",
    Address: "Kampung Pasir Angin RT 02/04",
    Village: "Cipayung",
    SubDistrict: "Megamendung",
    RegencyCity: "Kabupaten Bogor",
    Province: "Jawa Barat",
    LandArea: 320,
    RightType: "Girik / Adat",
    AdminStatus: "Belum Bersertifikat",
    CurrentOwnerName: "Siti Rahmawati",
    CreatedAt: "2018-09-01T00:00:00.000Z",
  },
];

test("Fitur 1 - Pencarian: Berhasil mencari berdasarkan nomor sertifikat secara parsial", () => {
  const result = searchLandPlots(sampleLands, "SHM-12");
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].CertificateNumber, "SHM-12.04.2023.001");
});

test("Fitur 1 - Pencarian: Berhasil mencari berdasarkan nama pemilik (case-insensitive)", () => {
  const result = searchLandPlots(sampleLands, "siti rahmawati");
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].CurrentOwnerName, "Siti Rahmawati");
});

test("Fitur 1 - Pencarian: Berhasil mencari berdasarkan wilayah kecamatan / kabupaten", () => {
  const result = searchLandPlots(sampleLands, "Kabupaten Bogor");
  assert.strictEqual(result.length, 2);
  const certs = result.map((r) => r.CertificateNumber);
  assert.ok(certs.includes("HGB-04.09.2021.089"));
  assert.ok(certs.includes("GIRIK-09.2018.114"));
});

test("Fitur 1 - Pencarian: Mengembalikan array kosong jika kueri pencarian tidak cocok", () => {
  const result = searchLandPlots(sampleLands, "Jakarta Pusat");
  assert.strictEqual(result.length, 0);
});

test("Fitur 1 - Pencarian: Filter kombinasi teks pencarian dan jenis hak tanah", () => {
  const result = searchLandPlots(sampleLands, {
    query: "Bogor",
    rightType: "Hak Milik",
  });
  assert.strictEqual(result.length, 1);
  assert.strictEqual(result[0].RightType, "Hak Milik");
});

test("Fitur 1 - Validasi: Lolos validasi saat data pendaftaran tanah lengkap dan benar", () => {
  const validInput = {
    CertificateNumber: "SHM-2024-999",
    CurrentOwnerName: "Hendra Wijaya",
    Address: "Jl. Pajajaran No. 10",
    Village: "Bantarjati",
    SubDistrict: "Bogor Utara",
    RegencyCity: "Kota Bogor",
    Province: "Jawa Barat",
    LandArea: 250,
    RightType: "Hak Milik",
    AdminStatus: "Terdaftar",
  };
  const validation = validateLandRegistration(validInput, ["SHM-12.04.2023.001"]);
  assert.strictEqual(validation.isValid, true);
  assert.strictEqual(validation.errors.length, 0);
});

test("Fitur 1 - Validasi: Menolak pendaftaran jika nomor sertifikat kosong", () => {
  const invalidInput = {
    CertificateNumber: "",
    CurrentOwnerName: "Hendra Wijaya",
    Address: "Jl. Pajajaran No. 10",
    Village: "Bantarjati",
    SubDistrict: "Bogor Utara",
    LandArea: 250,
  };
  const validation = validateLandRegistration(invalidInput);
  assert.strictEqual(validation.isValid, false);
  assert.ok(validation.errors.some((err) => err.includes("Nomor sertifikat tidak boleh kosong")));
});

test("Fitur 1 - Validasi: Menolak pendaftaran jika nomor sertifikat sudah ada (duplikat)", () => {
  const duplicateInput = {
    CertificateNumber: "SHM-12.04.2023.001",
    CurrentOwnerName: "Orang Lain",
    Address: "Jl. Lain No. 99",
    Village: "Lain",
    SubDistrict: "Lain",
    LandArea: 100,
  };
  const validation = validateLandRegistration(duplicateInput, ["SHM-12.04.2023.001"]);
  assert.strictEqual(validation.isValid, false);
  assert.ok(validation.errors.some((err) => err.includes("sudah terdaftar")));
});

test("Fitur 1 - Validasi: Menolak pendaftaran jika luas tanah <= 0 atau tidak valid", () => {
  const invalidAreaInput = {
    CertificateNumber: "SHM-2024-001",
    CurrentOwnerName: "Hendra Wijaya",
    Address: "Jl. Pajajaran",
    Village: "Bantarjati",
    SubDistrict: "Bogor Utara",
    LandArea: -50,
  };
  const validation = validateLandRegistration(invalidAreaInput);
  assert.strictEqual(validation.isValid, false);
  assert.ok(validation.errors.some((err) => err.includes("angka positif")));
});
