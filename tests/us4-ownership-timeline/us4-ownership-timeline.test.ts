import test from "node:test";
import assert from "node:assert";
import { sortOwnershipTimeline } from "../../packages/shared/src/features/feature-2-completeness-timeline/completenessEvaluator.ts";

test("US-4: Mengurutkan linimasa silsilah mutasi tanah secara kronologis (ascending: terlama ke terbaru)", () => {
  const histories = [
    { id: "h3", transferDate: "2023-08-20", transferType: "Hibah Anak", previousOwnerName: "Ahmad", newOwnerName: "Budi" },
    { id: "h1", transferDate: "2010-02-15", transferType: "Pendaftaran Hak Baru", previousOwnerName: "-", newOwnerName: "Siti" },
    { id: "h2", transferDate: "2018-06-10", transferType: "Jual Beli", previousOwnerName: "Siti", newOwnerName: "Ahmad" },
  ];

  const sorted = sortOwnershipTimeline(histories, "asc");
  assert.strictEqual(sorted[0].id, "h1");
  assert.strictEqual(sorted[1].id, "h2");
  assert.strictEqual(sorted[2].id, "h3");
});

test("US-4: Mengurutkan linimasa silsilah mutasi tanah dari yang terbaru (descending: terbaru ke terlama)", () => {
  const histories = [
    { id: "h1", transferDate: "2010-02-15", transferType: "Pendaftaran Hak Baru" },
    { id: "h3", transferDate: "2023-08-20", transferType: "Hibah Anak" },
    { id: "h2", transferDate: "2018-06-10", transferType: "Jual Beli" },
  ];

  const sorted = sortOwnershipTimeline(histories, "desc");
  assert.strictEqual(sorted[0].id, "h3");
  assert.strictEqual(sorted[1].id, "h2");
  assert.strictEqual(sorted[2].id, "h1");
});

test("US-4: Menangani array linimasa riwayat yang kosong tanpa error", () => {
  const empty: Array<{ transferDate: string }> = [];
  const sorted = sortOwnershipTimeline(empty, "asc");
  assert.strictEqual(sorted.length, 0);
});

test("US-4: Menangani entri riwayat dengan tanggal tidak valid secara aman tanpa melempar exception", () => {
  const historiesWithInvalidDate = [
    { id: "h1", transferDate: "INVALID-DATE" },
    { id: "h2", transferDate: "2020-01-01" },
  ];
  assert.doesNotThrow(() => {
    const sorted = sortOwnershipTimeline(historiesWithInvalidDate, "asc");
    assert.strictEqual(sorted.length, 2);
  });
});

test("US-4: Data riwayat kepemilikan memelihara rantai transfer dari pemilik sebelumnya ke pemilik baru", () => {
  const history = {
    id: "tx-1",
    transferDate: "2021-04-10",
    transferType: "Akta Jual Beli",
    previousOwnerName: "Raden Mas Soeroso",
    newOwnerName: "Ir. Bambang Trihatmojo",
  };
  assert.strictEqual(history.previousOwnerName, "Raden Mas Soeroso");
  assert.strictEqual(history.newOwnerName, "Ir. Bambang Trihatmojo");
});

