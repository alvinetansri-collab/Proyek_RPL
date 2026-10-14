import React, { useEffect, useState } from "react";

interface LandItem {
  Id: string;
  CertificateNumber: string;
  Address: string;
  Village: string;
  SubDistrict: string;
  RegencyCity: string;
  Province: string;
  LandArea: number;
  RightType: string;
  AdminStatus: string;
  CompletenessStatus: "COMPLETE" | "NEEDS_REVIEW" | "INCOMPLETE";
  CurrentOwnerName: string;
  CreatedAt: string;
  owners?: Array<{
    name: string;
    nationalId: string;
    phoneNumber: string;
    address: string;
  }>;
  documents?: Array<{
    id: string;
    documentType: string;
    documentNumber: string;
    documentDate: string;
  }>;
  histories?: Array<{
    id: string;
    transferDate: string;
    transferType: string;
    previousOwnerName?: string;
    newOwnerName?: string;
  }>;
}

// Data awal sebagai fallback jika backend belum aktif
const initialMockLands: LandItem[] = [
  {
    Id: "land-001",
    CertificateNumber: "SHM-12.04.2023.001",
    Address: "Jl. Merdeka Raya No. 45",
    Village: "Sukasari",
    SubDistrict: "Bogor Timur",
    RegencyCity: "Kota Bogor",
    Province: "Jawa Barat",
    LandArea: 450,
    RightType: "Hak Milik (SHM)",
    AdminStatus: "Terdaftar Aktif",
    CompletenessStatus: "COMPLETE",
    CurrentOwnerName: "Budi Santoso",
    CreatedAt: new Date().toISOString(),
    owners: [
      {
        name: "Budi Santoso",
        nationalId: "3271012345670001",
        phoneNumber: "081234567890",
        address: "Jl. Merdeka Raya No. 45, Bogor",
      },
    ],
    documents: [
      {
        id: "doc-1",
        documentType: "Sertifikat Hak Milik",
        documentNumber: "SHM/001/BOGOR",
        documentDate: "2020-03-15",
      },
      {
        id: "doc-2",
        documentType: "Akta Jual Beli (AJB)",
        documentNumber: "AJB-12/PPAT/2020",
        documentDate: "2020-02-10",
      },
      {
        id: "doc-3",
        documentType: "Surat Pemberitahuan Pajak Terhutang (SPPT PBB)",
        documentNumber: "PBB-2023-99881",
        documentDate: "2023-01-05",
      },
    ],
    histories: [
      {
        id: "hist-1",
        transferDate: "2020-02-10",
        transferType: "Jual Beli",
        previousOwnerName: "Ahmad Dahlan",
        newOwnerName: "Budi Santoso",
      },
    ],
  },
  {
    Id: "land-002",
    CertificateNumber: "HGB-04.09.2021.089",
    Address: "Kawasan Industri Sentul Kav. 8",
    Village: "Kadumangu",
    SubDistrict: "Babakan Madang",
    RegencyCity: "Kabupaten Bogor",
    Province: "Jawa Barat",
    LandArea: 1200,
    RightType: "Hak Guna Bangunan (HGB)",
    AdminStatus: "Proses Perpanjangan",
    CompletenessStatus: "NEEDS_REVIEW",
    CurrentOwnerName: "PT Sentul Jaya Abadi",
    CreatedAt: new Date().toISOString(),
    owners: [
      {
        name: "PT Sentul Jaya Abadi",
        nationalId: "010023456012000",
        phoneNumber: "021-87901234",
        address: "Kav. 8 Sentul, Bogor",
      },
    ],
    documents: [
      {
        id: "doc-4",
        documentType: "Sertifikat HGB",
        documentNumber: "HGB-89/BBN",
        documentDate: "2015-06-20",
      },
    ],
    histories: [],
  },
  {
    Id: "land-003",
    CertificateNumber: "GIRIK-09.2018.114",
    Address: "Kampung Pasir Angin RT 02/04",
    Village: "Cipayung",
    SubDistrict: "Megamendung",
    RegencyCity: "Kabupaten Bogor",
    Province: "Jawa Barat",
    LandArea: 320,
    RightType: "Girik / Adat",
    AdminStatus: "Belum Bersertifikat",
    CompletenessStatus: "INCOMPLETE",
    CurrentOwnerName: "Siti Rahmawati",
    CreatedAt: new Date().toISOString(),
    owners: [
      {
        name: "Siti Rahmawati",
        nationalId: "3201124508910003",
        phoneNumber: "085712345678",
        address: "Kp. Pasir Angin RT 02/04, Megamendung",
      },
    ],
    documents: [],
    histories: [
      {
        id: "hist-2",
        transferDate: "2018-08-14",
        transferType: "Waris",
        previousOwnerName: "Alm. H. Ridwan",
        newOwnerName: "Siti Rahmawati",
      },
    ],
  },
];

export default function App() {
  const [lands, setLands] = useState<LandItem[]>(initialMockLands);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Modal detail dan form
  const [selectedLand, setSelectedLand] = useState<LandItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state tambah tanah baru
  const [formCertNumber, setFormCertNumber] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formVillage, setFormVillage] = useState("");
  const [formSubDistrict, setFormSubDistrict] = useState("");
  const [formRegency, setFormRegency] = useState("Kota Bogor");
  const [formProvince, setFormProvince] = useState("Jawa Barat");
  const [formLandArea, setFormLandArea] = useState<number>(100);
  const [formRightType, setFormRightType] = useState("Hak Milik");
  const [formAdminStatus, setFormAdminStatus] = useState("Terdaftar");

  // Fetch dari backend jika aktif
  const fetchLands = async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/lands?search=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setLands(data);
        setIsBackendConnected(true);
      } else {
        throw new Error("Respon server tidak valid");
      }
    } catch {
      setIsBackendConnected(false);
      // Fallback filter lokal
      if (query.trim() === "") {
        setLands(initialMockLands);
      } else {
        const lower = query.toLowerCase();
        const filtered = initialMockLands.filter(
          (l) =>
            l.CertificateNumber.toLowerCase().includes(lower) ||
            l.CurrentOwnerName.toLowerCase().includes(lower) ||
            l.Address.toLowerCase().includes(lower) ||
            l.Village.toLowerCase().includes(lower) ||
            l.SubDistrict.toLowerCase().includes(lower) ||
            l.RegencyCity.toLowerCase().includes(lower)
        );
        setLands(filtered);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLands();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLands(searchQuery);
  };

  const handleCreateLand = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: LandItem = {
      Id: `land-${Date.now()}`,
      CertificateNumber: formCertNumber,
      Address: formAddress,
      Village: formVillage,
      SubDistrict: formSubDistrict,
      RegencyCity: formRegency,
      Province: formProvince,
      LandArea: Number(formLandArea),
      RightType: formRightType,
      AdminStatus: formAdminStatus,
      CompletenessStatus: "INCOMPLETE",
      CurrentOwnerName: formOwnerName || "Belum ada pemilik",
      CreatedAt: new Date().toISOString(),
      owners: [
        {
          name: formOwnerName || "Pemilik Baru",
          nationalId: "-",
          phoneNumber: "-",
          address: formAddress,
        },
      ],
      documents: [],
      histories: [],
    };

    setLands([newEntry, ...lands]);
    setIsAddModalOpen(false);
    // Reset form
    setFormCertNumber("");
    setFormOwnerName("");
    setFormAddress("");
    setFormVillage("");
    setFormSubDistrict("");
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "COMPLETE":
        return "bg-green-100 text-green-800 border-green-300";
      case "NEEDS_REVIEW":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-red-100 text-red-800 border-red-300";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETE":
        return "Lengkap";
      case "NEEDS_REVIEW":
        return "Perlu Diperiksa";
      default:
        return "Belum Lengkap";
    }
  };

  // Statistik Ringkasan
  const totalTanah = lands.length;
  const countComplete = lands.filter((l) => l.CompletenessStatus === "COMPLETE").length;
  const countReview = lands.filter((l) => l.CompletenessStatus === "NEEDS_REVIEW").length;
  const countIncomplete = lands.filter((l) => l.CompletenessStatus === "INCOMPLETE").length;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-md py-4 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold">Proyek RPL: Monitoring Dokumen & Status Kepemilikan Tanah</h1>
            <p className="text-sm text-emerald-100">Kelola berkas sertifikat, riwayat peralihan hak, dan validasi kelengkapan</p>
          </div>
          <div className="text-xs px-3 py-1.5 rounded-full bg-emerald-800 border border-emerald-600 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isBackendConnected ? "bg-green-400" : "bg-yellow-400"}`}></span>
            <span>{isBackendConnected ? "API Terhubung" : "Mode Standalone (Demo)"}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Ringkasan Dashboard / Statistik */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Bidang Tanah</p>
              <p className="text-3xl font-extrabold text-gray-800 mt-1">{totalTanah}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl">
              🗺️
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-green-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Dokumen Lengkap</p>
              <p className="text-3xl font-extrabold text-green-700 mt-1">{countComplete}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-bold text-xl">
              ✅
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-orange-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide">Perlu Diperiksa</p>
              <p className="text-3xl font-extrabold text-orange-700 mt-1">{countReview}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-700 flex items-center justify-center font-bold text-xl">
              ⚠️
            </div>
          </div>
          <div className="bg-white p-5 rounded-lg border border-red-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Belum Lengkap</p>
              <p className="text-3xl font-extrabold text-red-700 mt-1">{countIncomplete}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-700 flex items-center justify-center font-bold text-xl">
              ❌
            </div>
          </div>
        </section>

        {/* Toolbar Pencarian & Tambah Data */}
        <section className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <form onSubmit={handleSearch} className="w-full md:w-2/3 flex gap-2">
            <input
              type="text"
              placeholder="Cari nomor sertifikat, pemilik, kelurahan, atau kecamatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-md text-sm font-semibold transition flex items-center gap-1 shrink-0"
            >
              Cari
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  fetchLands("");
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-md text-sm"
              >
                Reset
              </button>
            )}
          </form>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-md text-sm font-semibold transition flex items-center justify-center gap-2"
          >
            <span>+</span> Tambah Bidang Tanah
          </button>
        </section>

        {/* Tabel Data Tanah */}
        <section className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-800 text-base">Daftar Arsip & Monitoring Bidang Tanah</h2>
            <span className="text-xs text-gray-500 font-medium">Menampilkan {lands.length} bidang tanah</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Memuat data tanah...</div>
          ) : lands.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              Tidak ada data bidang tanah yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-xs uppercase font-semibold border-b">
                    <th className="py-3 px-4">No. Sertifikat</th>
                    <th className="py-3 px-4">Pemilik Terdaftar</th>
                    <th className="py-3 px-4">Lokasi Administratif</th>
                    <th className="py-3 px-4">Luas</th>
                    <th className="py-3 px-4">Hak Tanah</th>
                    <th className="py-3 px-4 text-center">Status Berkas</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                  {lands.map((item) => (
                    <tr key={item.Id} className="hover:bg-emerald-50/40 transition">
                      <td className="py-3.5 px-4 font-semibold text-emerald-800">
                        {item.CertificateNumber}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-900">{item.CurrentOwnerName}</td>
                      <td className="py-3.5 px-4 text-gray-600">
                        <span className="block text-gray-900 font-medium">{item.Address}</span>
                        <span className="text-xs text-gray-500">
                          {item.Village}, {item.SubDistrict}, {item.RegencyCity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">{item.LandArea} m²</td>
                      <td className="py-3.5 px-4 text-gray-700">
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                          {item.RightType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getBadgeColor(
                            item.CompletenessStatus
                          )}`}
                        >
                          {getStatusText(item.CompletenessStatus)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedLand(item)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-medium px-3 py-1.5 rounded text-xs border border-emerald-300 transition"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal Detail Bidang Tanah */}
      {selectedLand && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-700 text-white p-5 rounded-t-xl flex justify-between items-center sticky top-0">
              <div>
                <h3 className="text-lg font-bold">Detail Informasi Bidang Tanah</h3>
                <p className="text-xs text-emerald-100">{selectedLand.CertificateNumber}</p>
              </div>
              <button
                onClick={() => setSelectedLand(null)}
                className="text-white hover:text-gray-200 text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Header */}
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Status Kelengkapan:</span>
                  <div className="mt-1">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeColor(
                        selectedLand.CompletenessStatus
                      )}`}
                    >
                      {getStatusText(selectedLand.CompletenessStatus)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 uppercase font-semibold">Status Administrasi:</span>
                  <p className="text-sm font-semibold text-gray-800">{selectedLand.AdminStatus}</p>
                </div>
              </div>

              {/* Data Fisik */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 border-b pb-1 mb-3 flex items-center gap-1.5">
                  📍 Data Fisik & Wilayah
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Alamat:</span>
                    <p className="font-semibold text-gray-800">{selectedLand.Address}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Desa/Kelurahan:</span>
                    <p className="font-semibold text-gray-800">{selectedLand.Village}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Kecamatan:</span>
                    <p className="font-semibold text-gray-800">{selectedLand.SubDistrict}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Kabupaten/Kota:</span>
                    <p className="font-semibold text-gray-800">{selectedLand.RegencyCity}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Provinsi:</span>
                    <p className="font-semibold text-gray-800">{selectedLand.Province}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Luas Tanah:</span>
                    <p className="font-semibold text-gray-800">{selectedLand.LandArea} m²</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Jenis Hak:</span>
                    <p className="font-semibold text-gray-800">{selectedLand.RightType}</p>
                  </div>
                </div>
              </div>

              {/* Data Pemilik Saat Ini */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 border-b pb-1 mb-3 flex items-center gap-1.5">
                  👤 Pemilik Saat Ini
                </h4>
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs space-y-1">
                  <p>
                    <span className="text-gray-500">Nama:</span>{" "}
                    <strong className="text-gray-900">{selectedLand.CurrentOwnerName}</strong>
                  </p>
                  {selectedLand.owners && selectedLand.owners[0] && (
                    <>
                      <p>
                        <span className="text-gray-500">NIK:</span> {selectedLand.owners[0].nationalId}
                      </p>
                      <p>
                        <span className="text-gray-500">No. Telepon:</span> {selectedLand.owners[0].phoneNumber}
                      </p>
                      <p>
                        <span className="text-gray-500">Alamat KTP:</span> {selectedLand.owners[0].address}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Berkas Dokumen */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 border-b pb-1 mb-3 flex items-center gap-1.5">
                  📂 Dokumen Pendukung Terlampir
                </h4>
                {!selectedLand.documents || selectedLand.documents.length === 0 ? (
                  <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200">
                    Belum ada berkas dokumen digital/fisik yang dicatat untuk tanah ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedLand.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex justify-between items-center p-2.5 bg-gray-50 rounded border text-xs"
                      >
                        <div>
                          <p className="font-bold text-gray-800">{doc.documentType}</p>
                          <p className="text-gray-500">Nomor: {doc.documentNumber}</p>
                        </div>
                        <span className="text-gray-500">{doc.documentDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Riwayat Kepemilikan */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 border-b pb-1 mb-3 flex items-center gap-1.5">
                  ⏳ Linimasa Riwayat Peralihan Hak
                </h4>
                {!selectedLand.histories || selectedLand.histories.length === 0 ? (
                  <p className="text-xs text-gray-500 bg-gray-50 p-2.5 rounded border">
                    Belum ada riwayat mutasi/peralihan hak sebelumnya.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedLand.histories.map((h) => (
                      <div key={h.id} className="p-2.5 bg-gray-50 rounded border text-xs">
                        <div className="flex justify-between font-semibold text-gray-800">
                          <span>Jenis: {h.transferType}</span>
                          <span className="text-gray-500">{h.transferDate}</span>
                        </div>
                        <p className="text-gray-600 mt-1">
                          Dari: <strong>{h.previousOwnerName || "-"}</strong> ➔ Ke:{" "}
                          <strong>{h.newOwnerName || "-"}</strong>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-b-xl border-t flex justify-end">
              <button
                onClick={() => setSelectedLand(null)}
                className="bg-gray-700 hover:bg-gray-800 text-white px-5 py-2 rounded text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Tanah Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-700 text-white p-5 rounded-t-xl flex justify-between items-center">
              <h3 className="text-lg font-bold">Tambah Bidang Tanah Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white hover:text-gray-200 text-xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLand} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nomor Sertifikat / Registrasi *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: SHM-12.04.2023.999"
                  value={formCertNumber}
                  onChange={(e) => setFormCertNumber(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nama Pemilik Terdaftar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Rahmat Hidayat"
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Luas Tanah (m²) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formLandArea}
                    onChange={(e) => setFormLandArea(Number(e.target.value))}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Jenis Hak</label>
                  <select
                    value={formRightType}
                    onChange={(e) => setFormRightType(e.target.value)}
                    className="w-full p-2 border rounded bg-white"
                  >
                    <option value="Hak Milik">Hak Milik (SHM)</option>
                    <option value="Hak Guna Bangunan">Hak Guna Bangunan (HGB)</option>
                    <option value="Hak Pakai">Hak Pakai</option>
                    <option value="Girik / Adat">Girik / Adat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Alamat Bidang Tanah *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jl. Pahlawan No. 12"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Desa / Kelurahan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Babakan"
                    value={formVillage}
                    onChange={(e) => setFormVillage(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kecamatan *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Bogor Tengah"
                    value={formSubDistrict}
                    onChange={(e) => setFormSubDistrict(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Kabupaten / Kota</label>
                  <input
                    type="text"
                    value={formRegency}
                    onChange={(e) => setFormRegency(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}