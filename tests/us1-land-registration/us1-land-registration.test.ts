import test from "node:test";
import assert from "node:assert";
import { validateLandRegistration } from "../../packages/shared/src/features/feature-1-search-registration/landSearch.ts";

test("US-1: Pendaftaran bidang tanah baru berhasil jika seluruh field wajib valid", () => {
  const input = {
    CertificateNumber: "SHM-12.04.2024.101",
    CurrentOwnerName: "Hendra Gunawan",
    Address: "Jl. Sudirman No. 12",
    Village: "Paledang",
    SubDistrict: "Bogor Tengah",
    RegencyCity: "Kota Bogor",
    Province: "Jawa Barat",
    LandArea: 350,
    RightType: "Hak Milik (SHM)",
    AdminStatus: "Terdaftar Aktif",
  };
  const result = validateLandRegistration(input, ["SHM-001/LAMA"]);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test("US-1: Menolak pendaftaran jika nomor sertifikat kosong", () => {
  const input = {
    CertificateNumber: "",
    CurrentOwnerName: "Budi",
    Address: "Jl. Mawar",
    Village: "Sukasari",
    SubDistrict: "Bogor Timur",
    LandArea: 200,
  };
  const result = validateLandRegistration(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("Nomor sertifikat tidak boleh kosong")));
});

test("US-1: Menolak pendaftaran jika nama pemilik kosong", () => {
  const input = {
    CertificateNumber: "SHM-002",
    CurrentOwnerName: "",
    Address: "Jl. Mawar",
    Village: "Sukasari",
    SubDistrict: "Bogor Timur",
    LandArea: 200,
  };
  const result = validateLandRegistration(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("Nama pemilik tidak boleh kosong")));
});

test("US-1: Menolak pendaftaran jika alamat bidang tanah kosong", () => {
  const input = {
    CertificateNumber: "SHM-003",
    CurrentOwnerName: "Budi",
    Address: "   ",
    Village: "Sukasari",
    SubDistrict: "Bogor Timur",
    LandArea: 200,
  };
  const result = validateLandRegistration(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("Alamat bidang tanah wajib diisi")));
});

test("US-1: Menolak pendaftaran jika desa / kelurahan kosong", () => {
  const input = {
    CertificateNumber: "SHM-004",
    CurrentOwnerName: "Budi",
    Address: "Jl. Mawar",
    Village: "",
    SubDistrict: "Bogor Timur",
    LandArea: 200,
  };
  const result = validateLandRegistration(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("Desa / Kelurahan wajib diisi")));
});

test("US-1: Menolak pendaftaran jika kecamatan kosong", () => {
  const input = {
    CertificateNumber: "SHM-005",
    CurrentOwnerName: "Budi",
    Address: "Jl. Mawar",
    Village: "Sukasari",
    SubDistrict: "",
    LandArea: 200,
  };
  const result = validateLandRegistration(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("Kecamatan wajib diisi")));
});

test("US-1: Menolak pendaftaran jika luas tanah bernilai 0", () => {
  const input = {
    CertificateNumber: "SHM-006",
    CurrentOwnerName: "Budi",
    Address: "Jl. Mawar",
    Village: "Sukasari",
    SubDistrict: "Bogor Timur",
    LandArea: 0,
  };
  const result = validateLandRegistration(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("angka positif")));
});

test("US-1: Menolak pendaftaran jika luas tanah bernilai negatif", () => {
  const input = {
    CertificateNumber: "SHM-007",
    CurrentOwnerName: "Budi",
    Address: "Jl. Mawar",
    Village: "Sukasari",
    SubDistrict: "Bogor Timur",
    LandArea: -120,
  };
  const result = validateLandRegistration(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("angka positif")));
});

test("US-1: Mencegah duplikasi nomor sertifikat yang sudah terdaftar dalam sistem", () => {
  const input = {
    CertificateNumber: "SHM-12.04.2023.001",
    CurrentOwnerName: "Pemilik Baru",
    Address: "Jl. Baru",
    Village: "Desa Baru",
    SubDistrict: "Kecamatan Baru",
    LandArea: 300,
  };
  const existing = ["SHM-12.04.2023.001", "HGB-04.09.2021.089"];
  const result = validateLandRegistration(input, existing);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("sudah terdaftar dalam sistem")));
});

