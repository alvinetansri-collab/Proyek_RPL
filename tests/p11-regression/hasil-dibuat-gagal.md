# Hasil Simulasi Pengujian P11 (200 Unit Tests: Passed vs Failed)

Dokumen ini mendokumentasikan hasil simulasi pipeline pengujian dan *build* pada branch **`v1.0_dev`** untuk membandingkan kondisi ketika seluruh **200 Unit Tests lulus (Hijau)** dan ketika terdapat **1 Unit Test yang sengaja dibuat gagal (Merah)**.

---

## 1. Sebelum Dibuat Gagal (All Passed — Hijau)
Pada kondisi ini, seluruh **200 Unit Tests** berjalan dan lulus 100% (`200 Passed | 0 Failed`), sehingga perintah `npm run build` otomatis dilanjutkan sampai selesai dan siap di-deploy ke lingkungan **Live**.

![Hasil Pengujian Sebelum Dibuat Gagal](./Sebelum%20dibuat%20gagal.png)

**Efek pada Pipeline:**
* `npm test` keluar dengan **exit code 0** (Semua 200 UT lulus).
* Proses **`npm run build`** otomatis dieksekusi hingga sukses.
* Deployment ke Vercel berjalan normal (*Live & Ready for Testing*).

---

## 2. Sesudah Dibuat Gagal (Simulasi Failed — Merah)
Pada kondisi ini, dilakukan simulasi kegagalan pada salah satu unit test (`P11-UT-011`) untuk melihat dampak kegagalan pengujian terhadap alur *build* dan *deployment*.

![Hasil Pengujian Sesudah Dibuat Gagal](./Sesudah%20dibuat%20gagal.png)

**Efek yang Terjadi saat Test Failed:**
1. **Pipeline Langsung Terhenti (*Halt on Failure*)**: `npm test` gagal (`fail: 1`) dan mengembalikan **exit code 1**.
2. **Auto-Build Dibatalkan (*Build Blocked*)**: Perintah lanjutan `npm run build` otomatis **tidak dijalankan** sama sekali.
3. **Auto-Deploy Dicegah**: Kode yang gagal test tidak akan pernah di-deploy ke server produksi.
4. **Aplikasi Live Tetap Aman**: Versi produksi yang sudah *live* tetap berjalan normal tanpa terdampak bug.
