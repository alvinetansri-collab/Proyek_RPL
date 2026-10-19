import test from "node:test";
import assert from "node:assert";
import { DocumentStatus } from "../../packages/shared/src/enums/DocumentStatus.ts";
import {
  evaluateDocumentCompleteness,
  getStatusBadgeDetails,
  sortOwnershipTimeline,
  calculateDashboardMetrics,
} from "../../packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts";

test("Fitur 2 - Evaluasi: Menghasilkan status COMPLETE jika terdapat minimal 3 dokumen", () => {
  const docs = [
    { documentType: "Sertifikat Hak Milik" },
    { documentType: "Akta Jual Beli" },
    { documentType: "SPPT PBB" },
  ];
  const status = evaluateDocumentCompleteness(docs);
  assert.strictEqual(status, DocumentStatus.COMPLETE);
});

test("Fitur 2 - Evaluasi: Menghasilkan status NEEDS_REVIEW jika terdapat 1 atau 2 dokumen", () => {
  const oneDoc = [{ documentType: "Sertifikat HGB" }];
  const twoDocs = [{ documentType: "Sertifikat HGB" }, { documentType: "AJB" }];

  assert.strictEqual(evaluateDocumentCompleteness(oneDoc), DocumentStatus.NEEDS_REVIEW);
  assert.strictEqual(evaluateDocumentCompleteness(twoDocs), DocumentStatus.NEEDS_REVIEW);
});

test("Fitur 2 - Evaluasi: Menghasilkan status INCOMPLETE jika belum ada dokumen yang dicatat", () => {
  assert.strictEqual(evaluateDocumentCompleteness([]), DocumentStatus.INCOMPLETE);
});

test("Fitur 2 - Standar Lencana Warna: Status COMPLETE menggunakan label 'Lengkap' dan warna hijau", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.COMPLETE);
  assert.strictEqual(badge.label, "Lengkap");
  assert.strictEqual(badge.colorName, "green");
  assert.ok(badge.badgeClass.includes("text-green-800"));
});

test("Fitur 2 - Standar Lencana Warna: Status NEEDS_REVIEW menggunakan label 'Perlu Diperiksa' dan warna oranye", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.NEEDS_REVIEW);
  assert.strictEqual(badge.label, "Perlu Diperiksa");
  assert.strictEqual(badge.colorName, "orange");
  assert.ok(badge.badgeClass.includes("text-orange-800"));
});

test("Fitur 2 - Standar Lencana Warna: Status INCOMPLETE menggunakan label 'Belum Lengkap' dan warna merah", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.INCOMPLETE);
  assert.strictEqual(badge.label, "Belum Lengkap");
  assert.strictEqual(badge.colorName, "red");
  assert.ok(badge.badgeClass.includes("text-red-800"));
});

test("Fitur 2 - Linimasa Riwayat: Mengurutkan silsilah perpindahan hak tanah secara kronologis (ascending)", () => {
  const histories = [
    { id: "h3", transferDate: "2023-05-10", transferType: "Hibah" },
    { id: "h1", transferDate: "2015-01-20", transferType: "Jual Beli" },
    { id: "h2", transferDate: "2019-11-04", transferType: "Waris" },
  ];

  const sorted = sortOwnershipTimeline(histories, "asc");
  assert.strictEqual(sorted[0].id, "h1");
  assert.strictEqual(sorted[1].id, "h2");
  assert.strictEqual(sorted[2].id, "h3");
});

test("Fitur 2 - Linimasa Riwayat: Mengurutkan silsilah perpindahan hak tanah dari yang terbaru (descending)", () => {
  const histories = [
    { id: "h1", transferDate: "2015-01-20", transferType: "Jual Beli" },
    { id: "h3", transferDate: "2023-05-10", transferType: "Hibah" },
  ];

  const sorted = sortOwnershipTimeline(histories, "desc");
  assert.strictEqual(sorted[0].id, "h3");
  assert.strictEqual(sorted[1].id, "h1");
});

test("Fitur 2 - Metrik Dashboard: Menghitung akumulasi statistik ringkasan dan rasio kelengkapan", () => {
  const lands = [
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.COMPLETE },
    { CompletenessStatus: DocumentStatus.NEEDS_REVIEW },
    { CompletenessStatus: DocumentStatus.INCOMPLETE },
  ];

  const metrics = calculateDashboardMetrics(lands);
  assert.strictEqual(metrics.total, 4);
  assert.strictEqual(metrics.complete, 2);
  assert.strictEqual(metrics.needsReview, 1);
  assert.strictEqual(metrics.incomplete, 1);
  assert.strictEqual(metrics.completenessRate, 50); // 2 dari 4 = 50%
});

