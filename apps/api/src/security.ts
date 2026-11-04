import fs from "fs";
import path from "path";

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

/**
 * Logger Aman (Security Logging)
 * Mencegah kebocoran PII dan stack trace sensitif pada log aplikasi
 */
export function safeLog(
  level: "INFO" | "WARN" | "ERROR" | "AUDIT",
  message: string,
  meta?: any
): string {
  const timestamp = new Date().toISOString();
  let sanitizedMeta = "";
  if (meta !== undefined && meta !== null) {
    try {
      const raw = typeof meta === "string" ? meta : JSON.stringify(meta);
      sanitizedMeta = " | " + maskPII(raw);
    } catch {
      sanitizedMeta = " | [Metadata omitted]";
    }
  }
  const logLine = `[${timestamp}] [${level}] ${maskPII(message)}${sanitizedMeta}`;
  console.log(logLine);
  return logLine;
}

/**
 * Penyimpanan Berkas secara Atomik (Atomic File Persistence)
 * Menulis data ke file sementara (.tmp.<timestamp>), kemudian melakukan atomic rename ke file target.
 * Mencegah korupsi data jika proses terhenti di tengah penulisan.
 */
export function atomicWriteFileSync(filePath: string, content: string): boolean {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tempFilePath = `${filePath}.tmp.${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    fs.writeFileSync(tempFilePath, content, "utf-8");
    fs.renameSync(tempFilePath, filePath);
    return true;
  } catch (err) {
    safeLog("ERROR", "Gagal menyimpan berkas secara atomik", err instanceof Error ? err.message : String(err));
    return false;
  }
}
