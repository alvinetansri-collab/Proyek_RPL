import test from "node:test";
import assert from "node:assert";
import { DocumentStatus } from "../packages/shared/src/enums/DocumentStatus.ts";
import { calculateDashboardMetrics } from "../packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts";
import {
  validateDocumentAttachment,
  attachDocumentToLand,
} from "../packages/shared/src/features/feature-3-document-management/documentManager.ts";

test("US-5: Validasi penambahan berkas dokumen baru berhasil saat data lengkap", () => {
  const input = {
    documentType: "Akta Jual Beli (AJB)",
    documentNumber: "AJB-01/PPAT/2024",
    documentDate: "2024-05-15",
  };
  const result = validateDocumentAttachment(input, []);
  assert.strictEqual(result.isValid, true);
  assert.strictEqual(result.errors.length, 0);
});

test("US-5: Menolak penambahan dokumen jika jenis dokumen kosong", () => {
  const input = {
    documentType: "",
    documentNumber: "AJB-01/PPAT/2024",
    documentDate: "2024-05-15",
  };
  const result = validateDocumentAttachment(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("Jenis dokumen wajib dipilih")));
});

test("US-5: Menolak penambahan dokumen jika nomor dokumen kosong", () => {
  const input = {
    documentType: "Sertifikat Hak Milik",
    documentNumber: "   ",
    documentDate: "2024-05-15",
  };
  const result = validateDocumentAttachment(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("Nomor dokumen tidak boleh kosong")));
});

test("US-5: Menolak duplikasi nomor dokumen pada bidang tanah yang sama", () => {
  const input = {
    documentType: "Sertifikat Hak Milik",
    documentNumber: "SHM-998877",
    documentDate: "2024-05-15",
  };
  const existingDocs = [{ documentNumber: "SHM-998877" }];
  const result = validateDocumentAttachment(input, existingDocs);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("sudah pernah dilampirkan pada tanah ini")));
});

test("US-5: Menolak penambahan dokumen jika format tanggal terbit tidak valid", () => {
  const input = {
    documentType: "Sertifikat Hak Milik",
    documentNumber: "SHM-001",
    documentDate: "TANGGAL-SALAH",
  };
  const result = validateDocumentAttachment(input);
  assert.strictEqual(result.isValid, false);
  assert.ok(result.errors.some((e) => e.includes("Format tanggal")));
});

test("US-5: Melampirkan dokumen ke tanah kosong otomatis mengubah status dari INCOMPLETE menjadi NEEDS_REVIEW", () => {
  const land = {
    Id: "land-101",
    documents: [],
    CompletenessStatus: DocumentStatus.INCOMPLETE,
  };

  const { updatedLand, newStatus } = attachDocumentToLand(land, {
    documentType: "Girik",
    documentNumber: "GRK-01",
    documentDate: "2020-01-01",
  });

  assert.strictEqual(updatedLand.documents.length, 1);
  assert.strictEqual(newStatus, DocumentStatus.NEEDS_REVIEW);
  assert.strictEqual(updatedLand.CompletenessStatus, DocumentStatus.NEEDS_REVIEW);
});

test("US-5: Melampirkan dokumen ke-3 otomatis meningkatkan status dari NEEDS_REVIEW menjadi COMPLETE", () => {
  const landWith2Docs = {
    Id: "land-102",
    documents: [
      { id: "d1", documentType: "SHM", documentNumber: "SHM-1", documentDate: "2020-01-01" },
      { id: "d2", documentType: "AJB", documentNumber: "AJB-1", documentDate: "2020-02-01" },
    ],
    CompletenessStatus: DocumentStatus.NEEDS_REVIEW,
  };

  const { updatedLand, newStatus } = attachDocumentToLand(landWith2Docs, {
    documentType: "SPPT PBB",
    documentNumber: "PBB-2023",
    documentDate: "2023-01-01",
  });

  assert.strictEqual(updatedLand.documents.length, 3);
  assert.strictEqual(newStatus, DocumentStatus.COMPLETE);
  assert.strictEqual(updatedLand.CompletenessStatus, DocumentStatus.COMPLETE);
});

test("US-5: Kalkulasi metrik agregat dashboard menghitung jumlah total tanah dan per kategori status secara presisi", () => {
  const mockLands = [
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.NEEDS_REVIEW },
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
  ];

  const metrics = calculateDashboardMetrics(mockLands);
  assert.strictEqual(metrics.total, 4);
  assert.strictEqual(metrics.complete, 2);
  assert.strictEqual(metrics.needsReview, 1);
  assert.strictEqual(metrics.incomplete, 1);
});

test("US-5: Kalkulasi persentase kelengkapan dashboard (completeness rate) tepat", () => {
  const lands = [
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.NEEDS_REVIEW },
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
  ];
  const metrics = calculateDashboardMetrics(lands);
  // 1 dari 4 = 25%
  assert.strictEqual(metrics.completenessRate, 25);
});
