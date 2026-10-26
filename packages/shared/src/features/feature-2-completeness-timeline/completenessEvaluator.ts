import { DocumentStatus } from "../../enums/DocumentStatus.ts";
import type { Document } from "../../models/Document.ts";

export interface StatusBadgeDetails {
  status: DocumentStatus;
  label: string;
  badgeClass: string;
  colorName: "green" | "orange" | "red";
  description: string;
}

export interface DashboardMetrics {
  total: number;
  complete: number;
  needsReview: number;
  incomplete: number;
  completenessRate: number; // Persentase kelengkapan
}

/**
 * Fitur 2: Evaluasi Otomatis Kelengkapan Dokumen Tanah
 * - COMPLETE: Memiliki minimal 3 dokumen wajib tercatat
 * - NEEDS_REVIEW: Memiliki 1 - 2 dokumen (belum lengkap atau butuh verifikasi berkas tambahan)
 * - INCOMPLETE: Belum ada dokumen sama sekali yang tercatat
 */
export function evaluateDocumentCompleteness(
  documents: Array<Pick<Document, "DocumentType"> | { documentType: string }> = []
): DocumentStatus {
  const docCount = documents.length;

  if (docCount >= 3) {
    return DocumentStatus.COMPLETE;
  }
  if (docCount > 0) {
    return DocumentStatus.NEEDS_REVIEW;
  }
  return DocumentStatus.INCOMPLETE;
}

/**
 * Fitur 2: Pemetaan Standar Warna Lencana & Label Status Sesuai Spesifikasi P3
 * - COMPLETE -> Hijau
 * - NEEDS_REVIEW -> Oranye
 * - INCOMPLETE -> Merah
 */
export function getStatusBadgeDetails(status: DocumentStatus): StatusBadgeDetails {
  switch (status) {
    case DocumentStatus.COMPLETE:
      return {
        status: DocumentStatus.COMPLETE,
        label: "Lengkap",
        badgeClass: "bg-green-100 text-green-800 border-green-300",
        colorName: "green",
        description: "Seluruh berkas dokumen wajib telah lengkap dan terdata di sistem.",
      };
    case DocumentStatus.NEEDS_REVIEW:
      return {
        status: DocumentStatus.NEEDS_REVIEW,
        label: "Perlu Diperiksa",
        badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
        colorName: "orange",
        description: "Sebagian dokumen sudah ada, namun masih membutuhkan berkas pendukung tambahan.",
      };
    case DocumentStatus.INCOMPLETE:
    default:
      return {
        status: DocumentStatus.INCOMPLETE,
        label: "Belum Lengkap",
        badgeClass: "bg-red-100 text-red-800 border-red-300",
        colorName: "red",
        description: "Belum ada dokumen kepemilikan yang terlampir.",
      };
  }
}

/**
 * Fitur 2: Pengurutan & Pelacakan Linimasa Silsilah Kepemilikan Tanah
 */
export function sortOwnershipTimeline<T extends { transferDate?: string; TransferDate?: string }>(
  histories: T[],
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...histories].sort((a, b) => {
    const dateA = new Date(a.transferDate || a.TransferDate || "").getTime();
    const dateB = new Date(b.transferDate || b.TransferDate || "").getTime();

    if (isNaN(dateA) || isNaN(dateB)) return 0;
    return direction === "asc" ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Fitur 2: Perhitungan Metrik Statistik Dashboard Ringkasan
 */
export function calculateDashboardMetrics(
  items: Array<{ CompletenessStatus?: DocumentStatus | string }>
): DashboardMetrics {
  const total = items.length;
  let complete = 0;
  let needsReview = 0;
  let incomplete = 0;

  for (const item of items) {
    if (item.CompletenessStatus === DocumentStatus.COMPLETE) {
      complete++;
    } else if (item.CompletenessStatus === DocumentStatus.NEEDS_REVIEW) {
      needsReview++;
    } else {
      incomplete++;
    }
  }

  const completenessRate = total > 0 ? Math.round((complete / total) * 100) : 0;

  return {
    total,
    complete,
    needsReview,
    incomplete,
    completenessRate,
  };
}

export interface OwnershipTransferInput {
  transferType: string;
  transferDate: string;
  newOwnerName: string;
  newOwnerNik?: string;
  newOwnerPhone?: string;
  newOwnerAddress?: string;
  note?: string;
}

export interface OwnershipTransferValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * US-4: Validasi Pencatatan Peralihan Hak / Mutasi Kepemilikan Tanah
 */
export function validateOwnershipTransfer(
  input: Partial<OwnershipTransferInput>,
  currentOwnerName?: string
): OwnershipTransferValidationResult {
  const errors: string[] = [];

  if (!input.transferType || input.transferType.trim() === "") {
    errors.push("Jenis mutasi / peralihan hak wajib dipilih.");
  }

  if (!input.newOwnerName || input.newOwnerName.trim() === "") {
    errors.push("Nama pemilik baru wajib diisi.");
  } else if (
    currentOwnerName &&
    input.newOwnerName.trim().toLowerCase() === currentOwnerName.trim().toLowerCase()
  ) {
    errors.push("Nama pemilik baru tidak boleh sama dengan pemilik terdaftar saat ini.");
  }

  if (!input.transferDate || input.transferDate.trim() === "") {
    errors.push("Tanggal mutasi wajib diisi.");
  } else {
    const parsed = new Date(input.transferDate);
    if (isNaN(parsed.getTime())) {
      errors.push("Format tanggal mutasi tidak valid.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * US-4: Melakukan Mutasi Kepemilikan Tanah dan Menambahkan Entri Linimasa Riwayat
 */
export function recordOwnershipTransfer<
  T extends {
    CurrentOwnerName?: string;
    owners?: Array<{ name: string; nationalId?: string; phoneNumber?: string; address?: string }>;
    histories?: Array<{
      id: string;
      transferDate: string;
      transferType: string;
      previousOwnerName?: string;
      newOwnerName?: string;
    }>;
  }
>(
  land: T,
  input: OwnershipTransferInput
): {
  updatedLand: T;
  newHistoryEntry: {
    id: string;
    transferDate: string;
    transferType: string;
    previousOwnerName: string;
    newOwnerName: string;
  };
} {
  const previousOwner = land.CurrentOwnerName || "Pendaftaran Awal";
  const newHistoryEntry = {
    id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    transferDate: input.transferDate.trim(),
    transferType: input.transferType.trim(),
    previousOwnerName: previousOwner,
    newOwnerName: input.newOwnerName.trim(),
  };

  const currentHistories = land.histories || [];
  const updatedHistories = [...currentHistories, newHistoryEntry];

  const newOwnerObj = {
    name: input.newOwnerName.trim(),
    nationalId:
      input.newOwnerNik?.trim() ||
      "3201" + Math.floor(100000000000 + Math.random() * 900000000000),
    phoneNumber:
      input.newOwnerPhone?.trim() ||
      "0812" + Math.floor(10000000 + Math.random() * 90000000),
    address: input.newOwnerAddress?.trim() || "Sesuai domisili baru",
  };

  const updatedLand: T = {
    ...land,
    CurrentOwnerName: input.newOwnerName.trim(),
    owners: [newOwnerObj, ...(land.owners || [])],
    histories: updatedHistories,
  };

  return {
    updatedLand,
    newHistoryEntry,
  };
}

