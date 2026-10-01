import React, { useState, useEffect } from "react";
import { DashboardResponse, Land } from "@land-document-tracker/shared";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "lands">("dashboard");
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [lands, setLands] = useState<Land[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLand, setSelectedLand] = useState<any | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newNomorSertifikat, setNewNomorSertifikat] = useState("");
  const [newAlamat, setNewAlamat] = useState("");
  const [newDesa, setNewDesa] = useState("");
  const [newKecamatan, setNewKecamatan] = useState("");
  const [newKabupaten, setNewKabupaten] = useState("");
  const [newProvinsi, setNewProvinsi] = useState("");
  const [newLuas, setNewLuas] = useState("");

  useEffect(() => {
    fetchDashboard();
    fetchLands();
  }, []);

  const fetchDashboard = async () => {
    const res = await fetch("http://localhost:5000/api/dashboard");
    const data = await res.json();
    setDashboard(data);
  };

  const fetchLands = async (query = "") => {
    const url = query ? `http://localhost:5000/api/lands?search=${query}` : "http://localhost:5000/api/lands";
    const res = await fetch(url);
    const data = await res.json();
    setLands(data);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLands(searchQuery);
  };

  const handleCreateLand = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("http://localhost:5000/api/lands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        NomorSertifikat: newNomorSertifikat,
        Alamat: newAlamat,
        DesaKelurahan: newDesa,
        Kecamatan: newKecamatan,
        KabupatenKota: newKabupaten,
        Provinsi: newProvinsi,
        LuasTanah: newLuas,
        JenisHak: "Hak Milik",
        StatusAdministrasi: "Terdaftar",
        StatusKelengkapan: "Belum Lengkap"
      })
    });
    setShowAddModal(false);
    fetchDashboard();
    fetchLands();
  };

  const handleSelectLand = async (id: string) => {
    const res = await fetch(`http://localhost:5000/api/lands/${id}`);
    const data = await res.json();
    setSelectedLand(data);
  };

  const handleDeleteLand = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus data tanah ini?")) return;
    await fetch(`http://localhost:5000/api/lands/${id}`, { method: "DELETE" });
    setSelectedLand(null);
    fetchDashboard();
    fetchLands();
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <nav className="bg-emerald-700 text-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Monitoring Dokumen & Status Kepemilikan Tanah</h1>
          <div className="space-x-4">
            <button
              onClick={() => { setActiveTab("dashboard"); setSelectedLand(null); }}
              className={`px-3 py-2 rounded ${activeTab === "dashboard" ? "bg-emerald-800" : "hover:bg-emerald-600"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => { setActiveTab("lands"); setSelectedLand(null); }}
              className={`px-3 py-2 rounded ${activeTab === "lands" ? "bg-emerald-800" : "hover:bg-emerald-600"}`}
            >
              Data Bidang Tanah[cite: 1]
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {selectedLand ? (
          <div className="bg-white p-6 rounded-lg shadow space-y-6">
            <button onClick={() => setSelectedLand(null)} className="text-emerald-700 font-semibold">&larr; Kembali</button>
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Detail Tanah: {selectedLand.nomorSertifikat}</h2>
              <button onClick={() => handleDeleteLand(selectedLand.id)} className="bg-red-600 text-white px-4 py-2 rounded">Hapus Tanah</button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded">
              <div><strong>Alamat:</strong> {selectedLand.alamat}, {selectedLand.desaKelurahan}</div>
              <div><strong>Kecamatan / Kota:</strong> {selectedLand.kecamatan}, {selectedLand.kabupatenKota}</div>
              <div><strong>Luas Tanah:</strong> {selectedLand.luasTanah} m²</div>
              <div><strong>Status Kelengkapan:</strong> <span className="px-2 py-1 rounded bg-blue-100 text-blue-800">{selectedLand.statusKelengkapan}</span>[cite: 1]</div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Data Pemilik[cite: 1]</h3>
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Nama Pemilik</th>
                    <th className="border p-2">NIK</th>
                    <th className="border p-2">Alamat</th>
                    <th className="border p-2">No Telepon</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLand.owners?.map((o: any) => (
                    <tr key={o.id}>
                      <td className="border p-2">{o.namaPemilik}</td>
                      <td className="border p-2">{o.nik}</td>
                      <td className="border p-2">{o.alamat}</td>
                      <td className="border p-2">{o.nomorTelepon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Dokumen Tanah[cite: 1]</h3>
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Jenis Dokumen</th>
                    <th className="border p-2">Nomor Dokumen</th>
                    <th className="border p-2">Tanggal</th>
                    <th className="border p-2">Pemilik Terkait</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLand.documents?.map((d: any) => (
                    <tr key={d.id}>
                      <td className="border p-2">{d.jenisDokumen}</td>
                      <td className="border p-2">{d.nomorDokumen}</td>
                      <td className="border p-2">{d.tanggalDokumen}</td>
                      <td className="border p-2">{d.pemilikTerkait}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "dashboard" ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard Ringkasan</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded shadow border-l-4 border-emerald-500">
                <p className="text-gray-500">Total Bidang Tanah</p>
                <p className="text-3xl font-bold">{dashboard?.TotalLand || 0}</p>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-green-500">
                <p className="text-gray-500">Dokumen Lengkap[cite: 1]</p>
                <p className="text-3xl font-bold">{dashboard?.TotalCompleteDocuments || 0}</p>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
                <p className="text-gray-500">Dokumen Belum Lengkap[cite: 1]</p>
                <p className="text-3xl font-bold">{dashboard?.TotalIncompleteDocuments || 0}</p>
              </div>
              <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
                <p className="text-gray-500">Perlu Diperiksa[cite: 1]</p>
                <p className="text-3xl font-bold">{dashboard?.TotalNeedReview || 0}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded shadow">
              <h3 className="text-lg font-semibold mb-4">Tanah Terbaru Ditambahkan</h3>
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Nomor Sertifikat[cite: 1]</th>
                    <th className="border p-2">Alamat[cite: 1]</th>
                    <th className="border p-2">Kabupaten/Kota[cite: 1]</th>
                    <th className="border p-2">Status Kelengkapan[cite: 1]</th>
                    <th className="border p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard?.RecentLands?.map((l) => (
                    <tr key={l.Id}>
                      <td className="border p-2">{l.NomorSertifikat}</td>
                      <td className="border p-2">{l.Alamat}</td>
                      <td className="border p-2">{l.KabupatenKota}</td>
                      <td className="border p-2">{l.StatusKelengkapan}</td>
                      <td className="border p-2 text-center">
                        <button onClick={() => handleSelectLand(l.Id)} className="text-emerald-700 font-semibold hover:underline">Detail</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Daftar Bidang Tanah</h2>
              <button onClick={() => setShowAddModal(true)} className="bg-emerald-700 text-white px-4 py-2 rounded">Tambah Tanah Baru</button>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Cari berdasarkan nomor sertifikat atau alamat...[cite: 1]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border p-2 rounded flex-grow"
              />
              <button type="submit" className="bg-gray-800 text-white px-4 py-2 rounded">Cari</button>
            </form>

            <div className="bg-white p-6 rounded shadow">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2">Nomor Sertifikat[cite: 1]</th>
                    <th className="border p-2">Alamat[cite: 1]</th>
                    <th className="border p-2">Kecamatan[cite: 1]</th>
                    <th className="border p-2">Kabupaten/Kota[cite: 1]</th>
                    <th className="border p-2">Luas (m²)[cite: 1]</th>
                    <th className="border p-2">Kelengkapan[cite: 1]</th>
                    <th className="border p-2">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {lands.map((l) => (
                    <tr key={l.Id}>
                      <td className="border p-2">{l.NomorSertifikat}</td>
                      <td className="border p-2">{l.Alamat}</td>
                      <td className="border p-2">{l.Kecamatan}</td>
                      <td className="border p-2">{l.KabupatenKota}</td>
                      <td className="border p-2">{l.LuasTanah}</td>
                      <td className="border p-2">{l.StatusKelengkapan}</td>
                      <td className="border p-2 text-center">
                        <button onClick={() => handleSelectLand(l.Id)} className="text-emerald-700 font-semibold hover:underline">Lihat Detail</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {showAddModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                <div className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4">
                  <h3 className="text-xl font-bold">Tambah Bidang Tanah Baru</h3>
                  <form onSubmit={handleCreateLand} className="space-y-3">
                    <input type="text" placeholder="Nomor Sertifikat[cite: 1]" value={newNomorSertifikat} onChange={e => setNewNomorSertifikat(e.target.value)} className="border p-2 w-full rounded" required />
                    <input type="text" placeholder="Alamat[cite: 1]" value={newAlamat} onChange={e => setNewAlamat(e.target.value)} className="border p-2 w-full rounded" required />
                    <input type="text" placeholder="Desa/Kelurahan[cite: 1]" value={newDesa} onChange={e => setNewDesa(e.target.value)} className="border p-2 w-full rounded" required />
                    <input type="text" placeholder="Kecamatan[cite: 1]" value={newKecamatan} onChange={e => setNewKecamatan(e.target.value)} className="border p-2 w-full rounded" required />
                    <input type="text" placeholder="Kabupaten/Kota[cite: 1]" value={newKabupaten} onChange={e => setNewKabupaten(e.target.value)} className="border p-2 w-full rounded" required />
                    <input type="text" placeholder="Provinsi[cite: 1]" value={newProvinsi} onChange={e => setNewProvinsi(e.target.value)} className="border p-2 w-full rounded" required />
                    <input type="number" placeholder="Luas Tanah (m²)[cite: 1]" value={newLuas} onChange={e => setNewLuas(e.target.value)} className="border p-2 w-full rounded" required />
                    <div className="flex justify-end gap-2 pt-2">
                      <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-300 rounded">Batal</button>
                      <button type="submit" className="px-4 py-2 bg-emerald-700 text-white rounded">Simpan</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}