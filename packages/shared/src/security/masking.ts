/**
 * Sanitasi & Masking PII (Personally Identifiable Information)
 * Menyamarkan NIK (16 digit) dan nomor telepon (seluler, internasional, kode area PSTN seperti 021-87901234, dengan pemisah strip/spasi)
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
    // Masking telepon lokal / PSTN dengan kode area dengan atau tanpa tanda kurung (misal: 021-87901234, (021) 1234567, 0251-8321234)
    .replace(/\b(\(?0[1-79]\d{1,2}\)?)[-\s]?\d{2,4}[-\s]?\d{0,4}[-\s]?(\d{2,4})\b/g, "$1****$2");
}

/**
 * Sanitasi Teks Log (Security Logging Sanitizer)
 * Menyamarkan data PII, menyensor path absolut internal sistem (Windows, POSIX, File URI, UNC),
 * dan mencegah CRLF Log Injection (CWE-117).
 */
export function sanitizeLogText(text: string): string {
  if (!text) return text;
  return maskPII(text)
    .replace(/file:\/\/\/(?:[A-Za-z]:[/\\]|[^\s"'`<>|]+[/\\])[^\s"'`<>|)]*/gi, "[INTERNAL_PATH]")
    .replace(/\\\\(?:\?|\.)\\[A-Za-z]:[/\\][^\s"'`<>|)]*/g, "[INTERNAL_PATH]")
    .replace(/\\\\[a-zA-Z0-9_.-]+\\[a-zA-Z0-9_.$~-]+\\[^\s"'`<>|)]*/g, "[INTERNAL_PATH]")
    .replace(/[A-Za-z]:[/\\](?:[^/:*?"'<>|\r\n\t]+[/\\])*[^/:*?"'<>|\r\n\t\s)]*/g, "[INTERNAL_PATH]")
    .replace(/(?:\/(?:Users|home|root|var|etc|usr|opt|srv|tmp|app|data|mnt|workspace|proyek[a-zA-Z0-9_-]*|bin|sbin))[^\s"'`<>|)*]+/g, "[INTERNAL_PATH]")
    .replace(/\[INTERNAL_PATH\](?::\d+)+/g, "[INTERNAL_PATH]")
    .replace(/[\r\n]+/g, " ");
}
