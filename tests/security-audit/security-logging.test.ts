import test from "node:test";
import assert from "node:assert";
import fs from "fs";
import path from "path";
import os from "os";
import { maskPII } from "../../packages/shared/src/security/masking.ts";
import { safeLog, atomicWriteFileSync } from "../../apps/api/src/security.ts";

test("Keamanan & Logging: Masking NIK 16 digit menyamarkan 8 digit tengah", () => {
  const nik = "3201123456780001";
  const masked = maskPII(`NIK pemilik tanah: ${nik}`);
  assert.strictEqual(masked.includes("3201********0001"), true);
  assert.strictEqual(masked.includes("12345678"), false);
});

test("Keamanan & Logging: Masking nomor telepon format seluler 08xx", () => {
  const phone = "081234567890";
  const masked = maskPII(`Kontak: ${phone}`);
  assert.strictEqual(masked.includes("345678"), false);
  assert.strictEqual(masked.includes("0812****90"), true);
});

test("Keamanan & Logging: Masking nomor telepon format internasional +62", () => {
  const phone = "+6281234567890";
  const masked = maskPII(`Telepon internasional: ${phone}`);
  assert.strictEqual(masked.includes("345678"), false);
  assert.strictEqual(masked.includes("+62812****90"), true);
});

test("Keamanan & Logging: Masking nomor telepon dengan pemisah spasi dan tanda minus", () => {
  const phone = "+62 812-3456-7890";
  const masked = maskPII(`Panggilan: ${phone}`);
  assert.strictEqual(masked.includes("3456"), false);
  assert.strictEqual(masked.includes("+62812****90"), true);
});

test("Keamanan & Logging: Masking telepon lokal dengan kode area tanda kurung", () => {
  const phone = "(021) 1234567";
  const masked = maskPII(`Kantor: ${phone}`);
  assert.strictEqual(masked.includes("1234"), false);
  assert.strictEqual(masked.includes("(021)****567"), true);
});

test("Keamanan & Logging: safeLog menghasilkan format terstruktur dengan timestamp dan level", () => {
  const output = safeLog("AUDIT", "Pendaftaran tanah baru: SHM-12.04.2024.999", {
    nik: "3201999988880002",
    phone: "081234567890",
  });

  assert.strictEqual(output.includes("[AUDIT]"), true);
  assert.strictEqual(output.includes("SHM-12.04.2024.999"), true);
  // Pastikan NIK dan nomor telepon di metadata tersanitasi
  assert.strictEqual(output.includes("99998888"), false);
  assert.strictEqual(output.includes("3201********0002"), true);
  assert.strictEqual(output.includes("0812****90"), true);
});

test("Keamanan & Penyimpanan: atomicWriteFileSync menulis data persisten tanpa corrupt", () => {
  const tmpDir = path.join(os.tmpdir(), `proyek_rpl_test_${Date.now()}`);
  const targetFile = path.join(tmpDir, "lands_atomic_test.json");
  const testPayload = JSON.stringify([{ id: "test-1", title: "Validasi Atomisitas" }], null, 2);

  try {
    const success = atomicWriteFileSync(targetFile, testPayload);
    assert.strictEqual(success, true);
    assert.strictEqual(fs.existsSync(targetFile), true);

    const readBack = fs.readFileSync(targetFile, "utf-8");
    assert.strictEqual(readBack, testPayload);
  } finally {
    if (fs.existsSync(targetFile)) {
      fs.unlinkSync(targetFile);
    }
    if (fs.existsSync(tmpDir)) {
      fs.rmdirSync(tmpDir);
    }
  }
});
