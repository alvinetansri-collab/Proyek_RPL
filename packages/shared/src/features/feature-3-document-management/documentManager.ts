import { DocumentStatus } from "../../enums/DocumentStatus.ts";
import { evaluateDocumentCompleteness } from "../feature-2-completeness-timeline/completenessEvaluator.ts";
import type { Document } from "../../models/Document.ts";
import type { LandPlot } from "../../models/LandPlot.ts";

export interface NewDocumentInput {
  documentType: string;
  documentNumber: string;
  documentDate: string;
  ownerId?: string | null;
}

export interface DocumentValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * US-5: Validasi Penambahan Berkas Dokumen ke Bidang Tanah
 * - Memastikan jenis dokumen, nomor dokumen, dan tanggal dokumen terisi
 * - Mencegah nomor dokumen yang sama dalam satu bidang tanah (duplikasi berkas)
 */
export function validateDocumentAttachment(
  input: Partial<NewDocumentInput>,
  existingDocuments: Array<{ documentNumber?: string; DocumentNumber?: string }> = []
): DocumentValidationResult {
  const errors: string[] = [];

  if (!input.documentType || input.documentType.trim() === "") {
    errors.push("Jenis dokumen wajib dipilih.");
  }

  if (!input.documentNumber || input.documentNumber.trim() === "") {
    errors.push("Nomor dokumen tidak boleh kosong.");
  } else {
    const isDuplicate = existingDocuments.some((doc) => {
      const existingNum = (doc.documentNumber || doc.DocumentNumber || "").trim().toLowerCase();
      return existingNum === input.documentNumber?.trim().toLowerCase();
    });
    if (isDuplicate) {
      errors.push(`Nomor dokumen '${input.documentNumber}' sudah pernah dilampirkan pada tanah ini.`);
    }
  }

  if (!input.documentDate || input.documentDate.trim() === "") {
    errors.push("Tanggal terbit dokumen wajib diisi.");
  } else {
    const parsedDate = new Date(input.documentDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push("Format tanggal dokumen tidak valid.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * US-5: Melampirkan Dokumen ke Bidang Tanah dan Memperbarui Status Kelengkapan Otomatis
 */
export function attachDocumentToLand<
  T extends {
    documents?: Array<{ id: string; documentType: string; documentNumber: string; documentDate: string }>;
    CompletenessStatus?: DocumentStatus;
  }
>(
  land: T,
  newDoc: NewDocumentInput
): { updatedLand: T; newStatus: DocumentStatus } {
  const currentDocs = land.documents || [];
  const createdDoc = {
    id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    documentType: newDoc.documentType.trim(),
    documentNumber: newDoc.documentNumber.trim(),
    documentDate: newDoc.documentDate.trim(),
  };

  const updatedDocs = [...currentDocs, createdDoc];
  const newStatus = evaluateDocumentCompleteness(updatedDocs);

  const updatedLand: T = {
    ...land,
    documents: updatedDocs,
    CompletenessStatus: newStatus,
  };

  return {
    updatedLand,
    newStatus,
  };
}

/**
 * US-5: Menghapus / Mencabut Berkas Dokumen dari Bidang Tanah dan Memperbarui Status Otomatis
 */
export function detachDocumentFromLand<
  T extends {
    documents?: Array<{ id: string; documentType: string; documentNumber: string; documentDate: string }>;
    CompletenessStatus?: DocumentStatus;
  }
>(
  land: T,
  documentId: string
): { updatedLand: T; newStatus: DocumentStatus } {
  const currentDocs = land.documents || [];
  const updatedDocs = currentDocs.filter((doc) => doc.id !== documentId);
  const newStatus = evaluateDocumentCompleteness(updatedDocs);

  const updatedLand: T = {
    ...land,
    documents: updatedDocs,
    CompletenessStatus: newStatus,
  };

  return {
    updatedLand,
    newStatus,
  };
}
