/**
 * Sanitasi & Masking PII (Personally Identifiable Information)
 * Menyamarkan NIK (16 digit) dan nomor telepon (lokal, internasional, kode area, dengan pemisah strip/spasi)
 */
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
