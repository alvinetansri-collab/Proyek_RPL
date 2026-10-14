import test from "node:test";
import assert from "node:assert";
import { DocumentStatus } from "../packages/shared/src/enums/DocumentStatus.ts";
import {
  evaluateDocumentCompleteness,
  getStatusBadgeDetails,
} from "../packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts";

test("US-3: Bidang tanah dengan 3 dokumen atau lebih dievaluasi sebagai COMPLETE", () => {
  const threeDocs = [
    { documentType: "Sertifikat Hak Milik" },
    { documentType: "Akta Jual Beli" },
    { documentType: "SPPT PBB" },
  ];
  assert.strictEqual(evaluateDocumentCompleteness(threeDocs), DocumentStatus.COMPLETE);

  const fourDocs = [...threeDocs, { documentType: "Surat Ukur" }];
  assert.strictEqual(evaluateDocumentCompleteness(fourDocs), DocumentStatus.COMPLETE);
});

test("US-3: Bidang tanah dengan 2 dokumen dievaluasi sebagai NEEDS_REVIEW", () => {
  const twoDocs = [{ documentType: "Sertifikat HGB" }, { documentType: "AJB" }];
  assert.strictEqual(evaluateDocumentCompleteness(twoDocs), DocumentStatus.NEEDS_REVIEW);
});

test("US-3: Bidang tanah dengan 1 dokumen dievaluasi sebagai NEEDS_REVIEW", () => {
  const oneDoc = [{ documentType: "Girik Asli" }];
  assert.strictEqual(evaluateDocumentCompleteness(oneDoc), DocumentStatus.NEEDS_REVIEW);
});

test("US-3: Bidang tanah tanpa dokumen (0 berkas) dievaluasi sebagai INCOMPLETE", () => {
  assert.strictEqual(evaluateDocumentCompleteness([]), DocumentStatus.INCOMPLETE);
});

test("US-3: Pemetaan lencana status COMPLETE menghasilkan label 'Lengkap' dan warna hijau", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.COMPLETE);
  assert.strictEqual(badge.label, "Lengkap");
  assert.strictEqual(badge.colorName, "green");
  assert.ok(badge.badgeClass.includes("text-green-800"));
  assert.ok(badge.badgeClass.includes("bg-green-100"));
});

test("US-3: Pemetaan lencana status NEEDS_REVIEW menghasilkan label 'Perlu Diperiksa' dan warna oranye", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.NEEDS_REVIEW);
  assert.strictEqual(badge.label, "Perlu Diperiksa");
  assert.strictEqual(badge.colorName, "orange");
  assert.ok(badge.badgeClass.includes("text-orange-800"));
  assert.ok(badge.badgeClass.includes("bg-orange-100"));
});

test("US-3: Pemetaan lencana status INCOMPLETE menghasilkan label 'Belum Lengkap' dan warna merah", () => {
  const badge = getStatusBadgeDetails(DocumentStatus.INCOMPLETE);
  assert.strictEqual(badge.label, "Belum Lengkap");
  assert.strictEqual(badge.colorName, "red");
  assert.ok(badge.badgeClass.includes("text-red-800"));
  assert.ok(badge.badgeClass.includes("bg-red-100"));
});

test("US-3: Setiap status kelengkapan memiliki deskripsi penjelasan yang informatif", () => {
  const completeBadge = getStatusBadgeDetails(DocumentStatus.COMPLETE);
  const reviewBadge = getStatusBadgeDetails(DocumentStatus.NEEDS_REVIEW);
  const incompleteBadge = getStatusBadgeDetails(DocumentStatus.INCOMPLETE);

  assert.ok(completeBadge.description.length > 10);
  assert.ok(reviewBadge.description.length > 10);
  assert.ok(incompleteBadge.description.length > 10);
});
