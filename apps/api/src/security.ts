import fs from "fs";
import path from "path";

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
 * 1. Masking PII (NIK dan nomor telepon seluler, internasional, dan PSTN landline)
 * 2. Mencegah kebocoran struktur direktori lokal / internal file paths:
 *    - Windows absolute paths (C:\... dan C:/...)
 *    - Windows UNC & extended paths (\\?\C:\... dan \\server\share\...)
 *    - File URIs (file:///C:/... dan file:///home/...)
 *    - POSIX absolute paths (/home/..., /root/..., /opt/..., /var/..., /data/..., dll.)
 *    - Stack trace frame line/column suffix (:line:col)
 * 3. Mencegah Log Injection / CRLF Injection (CWE-117) dengan menghapus karakter baris baru
 */
export function sanitizeLogText(text: string): string {
  if (!text) return text;
  return maskPII(text)
    // 1. File URIs: file:///C:/... atau file:///home/...
    .replace(/file:\/\/\/(?:[A-Za-z]:[/\\]|[^\s"'`<>|]+[/\\])[^\s"'`<>|)]*/gi, "[INTERNAL_PATH]")
    // 2. Windows UNC & extended length: \\?\C:\... atau \\server\share\...
    .replace(/\\\\(?:\?|\.)\\[A-Za-z]:[/\\][^\s"'`<>|)]*/g, "[INTERNAL_PATH]")
    .replace(/\\\\[a-zA-Z0-9_.-]+\\[a-zA-Z0-9_.$~-]+\\[^\s"'`<>|)]*/g, "[INTERNAL_PATH]")
    // 3. Windows paths (backslashes maupun forward slashes) dengan drive letter: C:\... atau C:/...
    .replace(/[A-Za-z]:[/\\](?:[^/:*?"'<>|\r\n\t]+[/\\])*[^/:*?"'<>|\r\n\t\s)]*/g, "[INTERNAL_PATH]")
    // 4. POSIX absolute paths
    .replace(/(?:\/(?:Users|home|root|var|etc|usr|opt|srv|tmp|app|data|mnt|workspace|proyek[a-zA-Z0-9_-]*|bin|sbin))[^\s"'`<>|)*]+/g, "[INTERNAL_PATH]")
    // 5. Bersihkan sisa line/column numbers setelah [INTERNAL_PATH] (misal [INTERNAL_PATH]:45:12 -> [INTERNAL_PATH])
    .replace(/\[INTERNAL_PATH\](?::\d+)+/g, "[INTERNAL_PATH]")
    // 6. Mencegah CRLF Log Injection (CWE-117)
    .replace(/[\r\n]+/g, " ");
}

/**
 * Logger Aman (Security Logging)
 * Mencegah kebocoran PII, path direktori server, dan injeksi karakter baris baru pada log aplikasi
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
      let raw: string;
      if (meta instanceof Error) {
        raw = meta.message;
      } else if (typeof meta === "string") {
        raw = meta;
      } else {
        raw = JSON.stringify(meta);
      }
      sanitizedMeta = " | " + sanitizeLogText(raw);
    } catch {
      sanitizedMeta = " | [Metadata omitted]";
    }
  }
  const cleanMessage = sanitizeLogText(message);
  const logLine = `[${timestamp}] [${level}] ${cleanMessage}${sanitizedMeta}`;
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
