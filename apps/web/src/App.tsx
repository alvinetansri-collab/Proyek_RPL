import React, { useEffect, useState } from "react";
import {
  DocumentStatus,
  getStatusBadgeDetails,
  sortOwnershipTimeline,
  calculateDashboardMetrics,
  searchLandPlots,
  validateLandRegistration,
  validateDocumentAttachment,
  attachDocumentToLand,
  detachDocumentFromLand,
  validateOwnershipTransfer,
  recordOwnershipTransfer,
} from "@proyek-rpl/shared";

const API_BASE = "http://localhost:5000/api";
const STORAGE_KEY = "proyek_rpl_lands_data_final";

export interface LandItem {
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
  CompletenessStatus: DocumentStatus;
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

// Data awal simulasi untuk MVP
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
    CompletenessStatus: DocumentStatus.COMPLETE,
    CurrentOwnerName: "Budi Santoso",
    CreatedAt: "2023-01-15T08:00:00.000Z",
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
        documentType: "SPPT PBB Terverifikasi",
        documentNumber: "PBB-2023-99881",
        documentDate: "2023-01-05",
      },
    ],
    histories: [
      {
        id: "hist-1",
        transferDate: "2015-05-12",
        transferType: "Waris Keluarga",
        previousOwnerName: "Alm. Soetomo",
        newOwnerName: "Ahmad Dahlan",
      },
      {
        id: "hist-2",
        transferDate: "2020-02-10",
        transferType: "Akta Jual Beli (AJB)",
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
    CompletenessStatus: DocumentStatus.NEEDS_REVIEW,
    CurrentOwnerName: "PT Sentul Jaya Abadi",
    CreatedAt: "2021-09-04T09:30:00.000Z",
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
    histories: [
      {
        id: "hist-3",
        transferDate: "2015-06-20",
        transferType: "Pemberian Hak Baru",
        previousOwnerName: "Pemerintah Daerah",
        newOwnerName: "PT Sentul Jaya Abadi",
      },
    ],
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
    CompletenessStatus: DocumentStatus.INCOMPLETE,
    CurrentOwnerName: "Siti Rahmawati",
    CreatedAt: "2018-09-01T10:15:00.000Z",
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
        id: "hist-4",
        transferDate: "2018-08-14",
        transferType: "Waris Tradisional",
        previousOwnerName: "Alm. H. Ridwan",
        newOwnerName: "Siti Rahmawati",
      },
    ],
  },
];

export default function App() {
  const [allLands, setAllLands] = useState<LandItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback ignore
    }
    return initialMockLands;
  });

  const [displayedLands, setDisplayedLands] = useState<LandItem[]>(allLands);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRightType, setSelectedRightType] = useState("ALL");
  const [selectedCompleteness, setSelectedCompleteness] = useState("ALL");
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Modal State
  const [selectedLand, setSelectedLand] = useState<LandItem | null>(null);
  const [timelineDirection, setTimelineDirection] = useState<"asc" | "desc">("desc");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [landToDelete, setLandToDelete] = useState<LandItem | null>(null);

  // State Form Tambah Dokumen Baru (US-5)
  const [isDocFormOpen, setIsDocFormOpen] = useState(false);
  const [docType, setDocType] = useState("Sertifikat Hak Milik");
  const [docNumber, setDocNumber] = useState("");
  const [docDate, setDocDate] = useState(new Date().toISOString().split("T")[0]);
  const [docErrors, setDocErrors] = useState<string[]>([]);

  // State Form Mutasi Kepemilikan (US-4)
  const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
  const [transferType, setTransferType] = useState("Akta Jual Beli (AJB)");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerNik, setNewOwnerNik] = useState("");
  const [newOwnerPhone, setNewOwnerPhone] = useState("");
  const [newOwnerAddress, setNewOwnerAddress] = useState("");
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [transferErrors, setTransferErrors] = useState<string[]>([]);

  // Form Fields Tambah Tanah (US-1)
  const [formCertNumber, setFormCertNumber] = useState("");
  const [formOwnerName, setFormOwnerName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formVillage, setFormVillage] = useState("");
  const [formSubDistrict, setFormSubDistrict] = useState("");
  const [formRegency, setFormRegency] = useState("Kota Bogor");
  const [formProvince, setFormProvince] = useState("Jawa Barat");
  const [formLandArea, setFormLandArea] = useState<number>(150);
  const [formRightType, setFormRightType] = useState("Hak Milik (SHM)");
  const [formAdminStatus, setFormAdminStatus] = useState("Terdaftar Aktif");

  // Helper Toast
  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sinkronisasi data ke LocalStorage
  const persistLands = (lands: LandItem[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lands));
    } catch (err) {
      console.warn("Gagal menyimpan ke localStorage:", err);
    }
  };

  // US-2: Filter & Search handler
  const applyFilter = (
    query: string,
    rightType: string,
    completeness: string,
    dataset: LandItem[] = allLands
  ) => {
    const results = searchLandPlots(dataset, {
      query,
      rightType: rightType === "ALL" ? undefined : rightType,
      completenessStatus: completeness === "ALL" ? undefined : completeness,
    });
    setDisplayedLands(results as LandItem[]);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    applyFilter(val, selectedRightType, selectedCompleteness);
  };

  const handleRightTypeChange = (newType: string) => {
    setSelectedRightType(newType);
    applyFilter(searchQuery, newType, selectedCompleteness);
  };

  const handleCompletenessChange = (newStatus: string) => {
    setSelectedCompleteness(newStatus);
    applyFilter(searchQuery, selectedRightType, newStatus);
  };

  const handleResetFilter = () => {
    setSearchQuery("");
    setSelectedRightType("ALL");
    setSelectedCompleteness("ALL");
    setDisplayedLands(allLands);
  };

  // Cek backend API saat inisialisasi
  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/lands`)
      .then((res) => {
        if (!res.ok) throw new Error("Backend offline");
        return res.json();
      })
      .then((data: LandItem[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setAllLands(data);
          setDisplayedLands(data);
          persistLands(data);
          setIsBackendConnected(true);
        }
      })
      .catch(() => {
        setIsBackendConnected(false);
        // Tetap menggunakan data dari localStorage/mock
        setDisplayedLands(allLands);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // US-1: Submit Pendaftaran Tanah Baru dengan Validasi
  const handleCreateLand = async (e: React.FormEvent) => {
    e.preventDefault();

    const existingCerts = allLands.map((l) => l.CertificateNumber);
    const validation = validateLandRegistration(
      {
        CertificateNumber: formCertNumber,
        CurrentOwnerName: formOwnerName,
        Address: formAddress,
        Village: formVillage,
        SubDistrict: formSubDistrict,
        RegencyCity: formRegency,
        Province: formProvince,
        LandArea: Number(formLandArea),
        RightType: formRightType,
        AdminStatus: formAdminStatus,
      },
      existingCerts
    );

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    setIsSubmitting(true);

    const payload = {
      CertificateNumber: formCertNumber.trim(),
      CurrentOwnerName: formOwnerName.trim(),
      Address: formAddress.trim(),
      Village: formVillage.trim(),
      SubDistrict: formSubDistrict.trim(),
      RegencyCity: formRegency.trim(),
      Province: formProvince.trim(),
      LandArea: Number(formLandArea),
      RightType: formRightType,
      AdminStatus: formAdminStatus,
    };

    if (isBackendConnected) {
      try {
        const res = await fetch(`${API_BASE}/lands`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const created: LandItem = await res.json();
          const updated = [created, ...allLands];
          setAllLands(updated);
          persistLands(updated);
          applyFilter(searchQuery, selectedRightType, selectedCompleteness, updated);
          showToast(`Bidang tanah ${created.CertificateNumber} berhasil didaftarkan ke server!`);
          setIsAddModalOpen(false);
          resetCreateForm();
          return;
        }
      } catch {
        console.warn("Gagal menghubungi server, fallback ke mode lokal.");
      }
    }

    // Fallback simpan lokal
    const localNewLand: LandItem = {
      Id: `land-${Date.now()}`,
      CertificateNumber: formCertNumber.trim(),
      Address: formAddress.trim(),
      Village: formVillage.trim(),
      SubDistrict: formSubDistrict.trim(),
      RegencyCity: formRegency.trim(),
      Province: formProvince.trim(),
      LandArea: Number(formLandArea),
      RightType: formRightType,
      AdminStatus: formAdminStatus,
      CompletenessStatus: DocumentStatus.INCOMPLETE,
      CurrentOwnerName: formOwnerName.trim(),
      CreatedAt: new Date().toISOString(),
      owners: [
        {
          name: formOwnerName.trim(),
          nationalId: "3201" + Math.floor(100000000000 + Math.random() * 900000000000),
          phoneNumber: "08" + Math.floor(1000000000 + Math.random() * 9000000000),
          address: formAddress.trim(),
        },
      ],
      documents: [],
      histories: [
        {
          id: `hist-${Date.now()}`,
          transferDate: new Date().toISOString().split("T")[0],
          transferType: "Pendaftaran Hak Baru",
          previousOwnerName: "-",
          newOwnerName: formOwnerName.trim(),
        },
      ],
    };

    const updated = [localNewLand, ...allLands];
    setAllLands(updated);
    persistLands(updated);
    applyFilter(searchQuery, selectedRightType, selectedCompleteness, updated);
    setIsAddModalOpen(false);
    resetCreateForm();
    setIsSubmitting(false);
    showToast(`Bidang tanah ${localNewLand.CertificateNumber} berhasil didaftarkan (Penyimpanan Lokal)!`);
  };

  const resetCreateForm = () => {
    setFormCertNumber("");
    setFormOwnerName("");
    setFormAddress("");
    setFormVillage("");
    setFormSubDistrict("");
    setIsSubmitting(false);
  };

  // US-5: Melampirkan Dokumen Baru ke Bidang Tanah yang Dipilih
  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLand) return;

    const validation = validateDocumentAttachment(
      {
        documentType: docType,
        documentNumber: docNumber,
        documentDate: docDate,
      },
      selectedLand.documents || []
    );

    if (!validation.isValid) {
      setDocErrors(validation.errors);
      return;
    }

    setDocErrors([]);
    setIsSubmitting(true);

    if (isBackendConnected) {
      try {
        const res = await fetch(`${API_BASE}/lands/${selectedLand.Id}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentType: docType,
            documentNumber: docNumber,
            documentDate: docDate,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const updatedLand: LandItem = data.updatedLand;
          setSelectedLand(updatedLand);
          const updatedAllLands = allLands.map((item) => (item.Id === updatedLand.Id ? updatedLand : item));
          setAllLands(updatedAllLands);
          persistLands(updatedAllLands);
          applyFilter(searchQuery, selectedRightType, selectedCompleteness, updatedAllLands);
          setDocNumber("");
          setIsDocFormOpen(false);
          setIsSubmitting(false);
          showToast(`Dokumen '${docType}' (${docNumber}) berhasil dilampirkan!`);
          return;
        }
      } catch {
        console.warn("Gagal menghubungi server untuk lampir dokumen, beralih ke lokal.");
      }
    }

    // Fallback lokal
    const { updatedLand } = attachDocumentToLand(selectedLand, {
      documentType: docType,
      documentNumber: docNumber,
      documentDate: docDate,
    });

    setSelectedLand(updatedLand);
    const updatedAllLands = allLands.map((item) => (item.Id === updatedLand.Id ? updatedLand : item));
    setAllLands(updatedAllLands);
    persistLands(updatedAllLands);
    applyFilter(searchQuery, selectedRightType, selectedCompleteness, updatedAllLands);
    setDocNumber("");
    setIsDocFormOpen(false);
    setIsSubmitting(false);
    showToast(`Dokumen '${docType}' berhasil dilampirkan (Lokal)!`);
  };

  // US-5: Mencabut / Menghapus Berkas Dokumen
  const handleRemoveDocument = async (docId: string, docName: string) => {
    if (!selectedLand) return;
    if (!window.confirm(`Yakin ingin mencabut berkas "${docName}" dari tanah ini? Status kelengkapan akan dievaluasi ulang.`)) {
      return;
    }

    if (isBackendConnected) {
      try {
        const res = await fetch(`${API_BASE}/lands/${selectedLand.Id}/documents/${docId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          const data = await res.json();
          const updatedLand: LandItem = data.updatedLand;
          setSelectedLand(updatedLand);
          const updatedAll = allLands.map((item) => (item.Id === updatedLand.Id ? updatedLand : item));
          setAllLands(updatedAll);
          persistLands(updatedAll);
          applyFilter(searchQuery, selectedRightType, selectedCompleteness, updatedAll);
          showToast(`Berkas dokumen "${docName}" berhasil dicabut.`);
          return;
        }
      } catch {
        console.warn("Gagal menghubungi server untuk cabut dokumen.");
      }
    }

    // Fallback lokal
    const { updatedLand } = detachDocumentFromLand(selectedLand, docId);
    setSelectedLand(updatedLand);
    const updatedAll = allLands.map((item) => (item.Id === updatedLand.Id ? updatedLand : item));
    setAllLands(updatedAll);
    persistLands(updatedAll);
    applyFilter(searchQuery, selectedRightType, selectedCompleteness, updatedAll);
    showToast(`Berkas dokumen "${docName}" dicabut (Lokal).`);
  };

  // US-4: Mencatat Peralihan Hak / Mutasi Kepemilikan Baru
  const handleRecordTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLand) return;

    const validation = validateOwnershipTransfer(
      {
        transferType,
        transferDate,
        newOwnerName,
        newOwnerNik,
        newOwnerPhone,
        newOwnerAddress,
      },
      selectedLand.CurrentOwnerName
    );

    if (!validation.isValid) {
      setTransferErrors(validation.errors);
      return;
    }

    setTransferErrors([]);
    setIsSubmitting(true);

    if (isBackendConnected) {
      try {
        const res = await fetch(`${API_BASE}/lands/${selectedLand.Id}/histories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transferType,
            transferDate,
            newOwnerName,
            newOwnerNik,
            newOwnerPhone,
            newOwnerAddress,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const updatedLand: LandItem = data.updatedLand;
          setSelectedLand(updatedLand);
          const updatedAllLands = allLands.map((item) => (item.Id === updatedLand.Id ? updatedLand : item));
          setAllLands(updatedAllLands);
          persistLands(updatedAllLands);
          applyFilter(searchQuery, selectedRightType, selectedCompleteness, updatedAllLands);
          setIsTransferFormOpen(false);
          setNewOwnerName("");
          setNewOwnerNik("");
          setNewOwnerPhone("");
          setNewOwnerAddress("");
          setIsSubmitting(false);
          showToast(`Mutasi hak atas nama ${newOwnerName} berhasil dicatat di server!`);
          return;
        }
      } catch {
        console.warn("Gagal menghubungi server untuk mutasi.");
      }
    }

    // Fallback lokal
    const { updatedLand } = recordOwnershipTransfer(selectedLand, {
      transferType,
      transferDate,
      newOwnerName,
      newOwnerNik,
      newOwnerPhone,
      newOwnerAddress,
    });

    setSelectedLand(updatedLand);
    const updatedAllLands = allLands.map((item) => (item.Id === updatedLand.Id ? updatedLand : item));
    setAllLands(updatedAllLands);
    persistLands(updatedAllLands);
    applyFilter(searchQuery, selectedRightType, selectedCompleteness, updatedAllLands);
    setIsTransferFormOpen(false);
    setNewOwnerName("");
    setNewOwnerNik("");
    setNewOwnerPhone("");
    setNewOwnerAddress("");
    setIsSubmitting(false);
    showToast(`Mutasi hak atas nama ${newOwnerName} berhasil dicatat (Lokal)!`);
  };

  // Hapus Bidang Tanah
  const handleDeleteLand = async (land: LandItem) => {
    if (isBackendConnected) {
      try {
        const res = await fetch(`${API_BASE}/lands/${land.Id}`, { method: "DELETE" });
        if (res.ok) {
          const updated = allLands.filter((item) => item.Id !== land.Id);
          setAllLands(updated);
          persistLands(updated);
          applyFilter(searchQuery, selectedRightType, selectedCompleteness, updated);
          if (selectedLand?.Id === land.Id) setSelectedLand(null);
          setLandToDelete(null);
          showToast(`Bidang tanah ${land.CertificateNumber} berhasil dihapus dari sistem.`);
          return;
        }
      } catch {
        console.warn("Gagal menghubungi server untuk delete land.");
      }
    }

    // Fallback lokal
    const updated = allLands.filter((item) => item.Id !== land.Id);
    setAllLands(updated);
    persistLands(updated);
    applyFilter(searchQuery, selectedRightType, selectedCompleteness, updated);
    if (selectedLand?.Id === land.Id) setSelectedLand(null);
    setLandToDelete(null);
    showToast(`Bidang tanah ${land.CertificateNumber} berhasil dihapus (Lokal).`);
  };

  // Reset Demo Dataset
  const handleResetDemoData = async () => {
    if (!window.confirm("Kembalikan seluruh data bidang tanah ke konfigurasi awal bawaan demo?")) {
      return;
    }

    if (isBackendConnected) {
      try {
        const res = await fetch(`${API_BASE}/reset-demo`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          setAllLands(data.lands);
          persistLands(data.lands);
          applyFilter("", "ALL", "ALL", data.lands);
          setSearchQuery("");
          setSelectedRightType("ALL");
          setSelectedCompleteness("ALL");
          setSelectedLand(null);
          showToast("Data demo berhasil direset ke konfigurasi awal!");
          return;
        }
      } catch {
        console.warn("Gagal reset di server.");
      }
    }

    // Fallback lokal
    setAllLands(initialMockLands);
    persistLands(initialMockLands);
    applyFilter("", "ALL", "ALL", initialMockLands);
    setSearchQuery("");
    setSelectedRightType("ALL");
    setSelectedCompleteness("ALL");
    setSelectedLand(null);
    showToast("Data demo berhasil direset ke bawaan awal (Lokal)!");
  };

  // Ekspor Data JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allLands, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `rekap-tanah-mvp-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("File data rekapitulasi JSON berhasil diunduh.");
  };

  // Metrik Statistik Dashboard (US-5 & US-3)
  const metrics = calculateDashboardMetrics(allLands);

  // Linimasa riwayat tanah terpilih yang diurutkan (US-4)
  const sortedHistories = selectedLand?.histories
    ? sortOwnershipTimeline(selectedLand.histories, timelineDirection)
    : [];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold transition-all transform animate-bounce bg-white border-slate-300">
          <span className="text-xl">
            {toastMessage.type === "success" ? "✅" : toastMessage.type === "error" ? "❌" : "ℹ️"}
          </span>
          <span className="text-slate-800">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="bg-emerald-800 text-white shadow-md print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏛️</span>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                Sistem Monitoring Dokumen & Status Kepemilikan Tanah
              </h1>
            </div>
            <p className="text-xs md:text-sm text-emerald-200 mt-0.5">
              MVP Final • Pengelolaan Berkas Fisik, Evaluasi Otomatis Kelengkapan Dokumen, & Linimasa Kepemilikan
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-2 bg-emerald-900/80 border border-emerald-700 px-3 py-1.5 rounded-full text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isBackendConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                }`}
              />
              <span className="font-medium text-emerald-100">
                {isBackendConnected
                  ? "Backend API Terhubung (Port 5000)"
                  : "Mode Standalone (Penyimpanan Lokal Aktif)"}
              </span>
            </div>

            <button
              onClick={handleExportJSON}
              title="Ekspor Seluruh Data ke Format JSON"
              className="bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              📥 Ekspor JSON
            </button>

            <button
              onClick={handleResetDemoData}
              title="Kembalikan data ke awal untuk keperluan demo ulang"
              className="bg-emerald-900/90 hover:bg-emerald-950 border border-emerald-700 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-emerald-200 transition"
            >
              🔄 Reset Demo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* US-3 & US-5: Dashboard Ringkasan & Metrik Evaluasi */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => handleCompletenessChange("ALL")}
            className={`p-5 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer transition transform hover:-translate-y-0.5 ${
              selectedCompleteness === "ALL"
                ? "bg-slate-100 border-slate-400 ring-2 ring-slate-400"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bidang Tanah</p>
              <p className="text-3xl font-black text-slate-800 mt-1">{metrics.total}</p>
              <p className="text-[11px] text-slate-500 mt-1">Klik untuk tampilkan semua</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-xl font-bold">
              🗺️
            </div>
          </div>

          <div
            onClick={() => handleCompletenessChange(DocumentStatus.COMPLETE)}
            className={`p-5 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer transition transform hover:-translate-y-0.5 ${
              selectedCompleteness === DocumentStatus.COMPLETE
                ? "bg-green-50 border-green-500 ring-2 ring-green-500"
                : "bg-white border-green-200 hover:border-green-300"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wider">Dokumen Lengkap</p>
              <p className="text-3xl font-black text-green-700 mt-1">{metrics.complete}</p>
              <p className="text-[11px] text-green-600 mt-1">Rasio: {metrics.completenessRate}% lengkap</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-700 flex items-center justify-center text-xl font-bold">
              ✅
            </div>
          </div>

          <div
            onClick={() => handleCompletenessChange(DocumentStatus.NEEDS_REVIEW)}
            className={`p-5 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer transition transform hover:-translate-y-0.5 ${
              selectedCompleteness === DocumentStatus.NEEDS_REVIEW
                ? "bg-orange-50 border-orange-500 ring-2 ring-orange-500"
                : "bg-white border-orange-200 hover:border-orange-300"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wider">Perlu Diperiksa</p>
              <p className="text-3xl font-black text-orange-700 mt-1">{metrics.needsReview}</p>
              <p className="text-[11px] text-orange-600 mt-1">1 - 2 berkas terlampir</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center text-xl font-bold">
              ⚠️
            </div>
          </div>

          <div
            onClick={() => handleCompletenessChange(DocumentStatus.INCOMPLETE)}
            className={`p-5 rounded-xl border shadow-sm flex items-center justify-between cursor-pointer transition transform hover:-translate-y-0.5 ${
              selectedCompleteness === DocumentStatus.INCOMPLETE
                ? "bg-red-50 border-red-500 ring-2 ring-red-500"
                : "bg-white border-red-200 hover:border-red-300"
            }`}
          >
            <div>
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Belum Lengkap</p>
              <p className="text-3xl font-black text-red-700 mt-1">{metrics.incomplete}</p>
              <p className="text-[11px] text-red-600 mt-1">Belum ada berkas terlampir</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center text-xl font-bold">
              ❌
            </div>
          </div>
        </section>

        {/* US-2: Pencarian Cerdas & Filter Multi-Kriteria */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari berdasarkan No. Sertifikat, Pemilik, Alamat, Desa, atau Kecamatan..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            </div>

            <select
              value={selectedRightType}
              onChange={(e) => handleRightTypeChange(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">Semua Jenis Hak</option>
              <option value="Hak Milik (SHM)">Hak Milik (SHM)</option>
              <option value="Hak Guna Bangunan (HGB)">Hak Guna Bangunan (HGB)</option>
              <option value="Hak Pakai">Hak Pakai</option>
              <option value="Girik / Adat">Girik / Adat</option>
            </select>

            <select
              value={selectedCompleteness}
              onChange={(e) => handleCompletenessChange(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="ALL">Semua Status Berkas</option>
              <option value={DocumentStatus.COMPLETE}>Lengkap (≥ 3 Berkas)</option>
              <option value={DocumentStatus.NEEDS_REVIEW}>Perlu Diperiksa (1 - 2 Berkas)</option>
              <option value={DocumentStatus.INCOMPLETE}>Belum Lengkap (0 Berkas)</option>
            </select>

            {searchQuery || selectedRightType !== "ALL" || selectedCompleteness !== "ALL" ? (
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition whitespace-nowrap"
              >
                Reset Filter
              </button>
            ) : null}
          </div>

          <button
            onClick={() => {
              setValidationErrors([]);
              setIsAddModalOpen(true);
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-5 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <span>➕</span> Tambah Bidang Tanah
          </button>
        </section>

        {/* Tabel Data Bidang Tanah */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/50">
            <div>
              <h2 className="font-bold text-slate-800 text-base">Daftar Arsip & Monitoring Bidang Tanah</h2>
              <p className="text-xs text-slate-500">
                Pilih bidang tanah untuk melihat status dokumen, melampirkan berkas baru, mutasi hak, dan silsilah kepemilikan.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border">
                Menampilkan {displayedLands.length} dari {allLands.length} bidang
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-600">Memuat data bidang tanah...</p>
            </div>
          ) : displayedLands.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-4xl">🔎</span>
              <p className="text-slate-700 font-semibold mt-2">Tidak ada data bidang tanah yang cocok.</p>
              <p className="text-xs text-slate-400 mt-1">Coba gunakan kata kunci pencarian lain atau reset filter.</p>
              <button
                onClick={handleResetFilter}
                className="mt-4 px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold"
              >
                Tampilkan Semua Data
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs uppercase font-semibold border-b">
                    <th className="py-3 px-4">No. Sertifikat</th>
                    <th className="py-3 px-4">Pemilik Terdaftar</th>
                    <th className="py-3 px-4">Alamat & Wilayah</th>
                    <th className="py-3 px-4">Luas</th>
                    <th className="py-3 px-4">Jenis Hak</th>
                    <th className="py-3 px-4 text-center">Status Berkas</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {displayedLands.map((item) => {
                    const badge = getStatusBadgeDetails(item.CompletenessStatus);
                    return (
                      <tr key={item.Id} className="hover:bg-emerald-50/40 transition">
                        <td className="py-3 px-4 font-bold text-emerald-800">{item.CertificateNumber}</td>
                        <td className="py-3 px-4 font-medium text-slate-900">{item.CurrentOwnerName}</td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="block font-medium text-slate-900">{item.Address}</span>
                          <span className="text-xs text-slate-400">
                            {item.Village}, {item.SubDistrict}, {item.RegencyCity}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{item.LandArea} m²</td>
                        <td className="py-3 px-4 text-slate-700">
                          <span className="text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            {item.RightType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${badge.badgeClass}`}
                            title={badge.description}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedLand(item);
                                setIsDocFormOpen(false);
                                setIsTransferFormOpen(false);
                                setDocErrors([]);
                                setTransferErrors([]);
                              }}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold px-3 py-1.5 rounded-md text-xs border border-emerald-300 transition"
                            >
                              Lihat Detail
                            </button>
                            <button
                              onClick={() => setLandToDelete(item)}
                              title="Hapus Bidang Tanah"
                              className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold px-2 py-1.5 rounded-md text-xs border border-red-200 transition"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal Konfirmasi Hapus Bidang Tanah */}
      {landToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-lg font-bold">Konfirmasi Hapus Data Tanah</h3>
            </div>
            <p className="text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus bidang tanah dengan nomor sertifikat{" "}
              <strong>{landToDelete.CertificateNumber}</strong> atas nama{" "}
              <strong>{landToDelete.CurrentOwnerName}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setLandToDelete(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteLand(landToDelete)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Bidang Tanah, Dokumen (US-5) & Linimasa Riwayat (US-4) */}
      {selectedLand && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
            {/* Modal Header */}
            <div className="bg-emerald-800 text-white p-5 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold">Rincian Komprehensif Bidang Tanah</h3>
                <p className="text-xs text-emerald-200 font-mono mt-0.5">
                  Nomor Sertifikat: {selectedLand.CertificateNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedLand(null)}
                className="text-white hover:text-emerald-200 text-2xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1">
              {/* US-3: Status Kelengkapan & Administrasi */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status Kelengkapan Dokumen:
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    {(() => {
                      const badge = getStatusBadgeDetails(selectedLand.CompletenessStatus);
                      return (
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badge.badgeClass}`}>
                          {badge.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-slate-500 font-medium">
                      ({selectedLand.documents?.length || 0} berkas terlampir)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {getStatusBadgeDetails(selectedLand.CompletenessStatus).description}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status Administrasi:
                  </span>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedLand.AdminStatus}</p>
                </div>
              </div>

              {/* Data Fisik & Wilayah */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1.5 mb-3">
                  📍 Data Fisik & Wilayah
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Alamat:</span>
                    <p className="font-semibold text-slate-800">{selectedLand.Address}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Desa/Kelurahan:</span>
                    <p className="font-semibold text-slate-800">{selectedLand.Village}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Kecamatan:</span>
                    <p className="font-semibold text-slate-800">{selectedLand.SubDistrict}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Kabupaten/Kota:</span>
                    <p className="font-semibold text-slate-800">{selectedLand.RegencyCity}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Provinsi:</span>
                    <p className="font-semibold text-slate-800">{selectedLand.Province}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Luas Tanah:</span>
                    <p className="font-bold text-slate-800">{selectedLand.LandArea} m²</p>
                  </div>
                </div>
              </div>

              {/* Pemilik Saat Ini & Mutasi Hak */}
              <div>
                <div className="flex justify-between items-center border-b pb-1.5 mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    👤 Pemegang Hak Terdaftar Saat Ini
                  </h4>
                  <button
                    onClick={() => {
                      setIsTransferFormOpen(!isTransferFormOpen);
                      setTransferErrors([]);
                    }}
                    className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded font-semibold transition flex items-center gap-1"
                  >
                    {isTransferFormOpen ? "✕ Batal Mutasi" : "🔄 Catat Peralihan Hak / Mutasi"}
                  </button>
                </div>

                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-xs space-y-1">
                  <p>
                    <span className="text-slate-500">Nama Lengkap:</span>{" "}
                    <strong className="text-slate-900 text-sm">{selectedLand.CurrentOwnerName}</strong>
                  </p>
                  {selectedLand.owners && selectedLand.owners[0] && (
                    <>
                      <p>
                        <span className="text-slate-500">Nomor Induk Kependudukan (NIK):</span>{" "}
                        <span className="font-mono">{selectedLand.owners[0].nationalId}</span>
                      </p>
                      <p>
                        <span className="text-slate-500">Nomor Telepon:</span> {selectedLand.owners[0].phoneNumber}
                      </p>
                      <p>
                        <span className="text-slate-500">Alamat KTP:</span> {selectedLand.owners[0].address}
                      </p>
                    </>
                  )}
                </div>

                {/* Form Mutasi Peralihan Hak (US-4) */}
                {isTransferFormOpen && (
                  <form
                    onSubmit={handleRecordTransfer}
                    className="mt-3 p-4 bg-amber-50/60 rounded-xl border border-amber-300 text-xs space-y-3"
                  >
                    <p className="font-bold text-amber-900">Catat Peralihan Hak / Pemilik Baru (Mutasi Tanah)</p>
                    {transferErrors.length > 0 && (
                      <div className="p-2 bg-red-50 border border-red-300 text-red-700 rounded text-[11px]">
                        {transferErrors.map((err, i) => (
                          <div key={i}>{err}</div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Jenis Peralihan / Dasar Mutasi *</label>
                        <select
                          value={transferType}
                          onChange={(e) => setTransferType(e.target.value)}
                          className="w-full p-2 border rounded bg-white text-xs"
                        >
                          <option value="Akta Jual Beli (AJB)">Akta Jual Beli (AJB)</option>
                          <option value="Waris Keluarga">Waris Keluarga</option>
                          <option value="Hibah / Sumbangan">Hibah / Sumbangan</option>
                          <option value="Tukar Menukar">Tukar Menukar</option>
                          <option value="Lelang Eksekusi">Lelang Eksekusi</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Tanggal Peralihan *</label>
                        <input
                          type="date"
                          value={transferDate}
                          onChange={(e) => setTransferDate(e.target.value)}
                          className="w-full p-2 border rounded text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">Nama Pemilik Baru *</label>
                        <input
                          type="text"
                          placeholder="Nama lengkap sesuai KTP"
                          value={newOwnerName}
                          onChange={(e) => setNewOwnerName(e.target.value)}
                          className="w-full p-2 border rounded text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">NIK Pemilik Baru</label>
                        <input
                          type="text"
                          placeholder="Nomor KTP (16 digit)"
                          value={newOwnerNik}
                          onChange={(e) => setNewOwnerNik(e.target.value)}
                          className="w-full p-2 border rounded text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">Alamat Domisili Baru</label>
                      <input
                        type="text"
                        placeholder="Alamat lengkap pemilik baru"
                        value={newOwnerAddress}
                        onChange={(e) => setNewOwnerAddress(e.target.value)}
                        className="w-full p-2 border rounded text-xs bg-white"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsTransferFormOpen(false)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-1.5 rounded font-semibold text-xs transition"
                      >
                        {isSubmitting ? "Menyimpan..." : "Simpan Mutasi Kepemilikan"}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* US-5: Arsip Dokumen Terlampir & Form Lampirkan Dokumen Baru */}
              <div>
                <div className="flex justify-between items-center border-b pb-1.5 mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    📂 Dokumen Pendukung Fisik / Digital
                  </h4>
                  <button
                    onClick={() => {
                      setIsDocFormOpen(!isDocFormOpen);
                      setDocErrors([]);
                    }}
                    className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1 rounded font-semibold transition"
                  >
                    {isDocFormOpen ? "✕ Batal" : "➕ Lampirkan Dokumen Baru"}
                  </button>
                </div>

                {/* Formulir Input Dokumen Baru (US-5) */}
                {isDocFormOpen && (
                  <form
                    onSubmit={handleAddDocument}
                    className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-xs space-y-3 mb-3"
                  >
                    <p className="font-bold text-emerald-900">Lampirkan Berkas Kepemilikan Baru</p>
                    {docErrors.length > 0 && (
                      <div className="p-2 bg-red-50 border border-red-300 text-red-700 rounded text-[11px]">
                        {docErrors.map((err, i) => (
                          <div key={i}>{err}</div>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Jenis Dokumen *</label>
                        <select
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                          className="w-full p-2 border rounded bg-white text-xs"
                        >
                          <option value="Sertifikat Hak Milik">Sertifikat Hak Milik (SHM)</option>
                          <option value="Sertifikat HGB">Sertifikat HGB</option>
                          <option value="Akta Jual Beli (AJB)">Akta Jual Beli (AJB)</option>
                          <option value="Surat Keterangan Waris">Surat Keterangan Waris</option>
                          <option value="Surat Hibah">Surat Hibah</option>
                          <option value="SPPT PBB Terverifikasi">SPPT PBB Terverifikasi</option>
                          <option value="Warkah Tanah">Warkah Tanah</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Nomor Dokumen *</label>
                        <input
                          type="text"
                          placeholder="Contoh: AJB-45/PPAT/2024"
                          value={docNumber}
                          onChange={(e) => setDocNumber(e.target.value)}
                          className="w-full p-2 border rounded text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 font-medium mb-1">Tanggal Terbit *</label>
                        <input
                          type="date"
                          value={docDate}
                          onChange={(e) => setDocDate(e.target.value)}
                          className="w-full p-2 border rounded text-xs bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded font-semibold text-xs"
                      >
                        {isSubmitting ? "Menyimpan..." : "Simpan Berkas Dokumen"}
                      </button>
                    </div>
                  </form>
                )}

                {!selectedLand.documents || selectedLand.documents.length === 0 ? (
                  <div className="p-3 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs">
                    ⚠️ Belum ada dokumen kepemilikan yang dilampirkan untuk bidang tanah ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedLand.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{doc.documentType}</p>
                          <p className="text-slate-500 font-mono">No: {doc.documentNumber}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-medium">Tanggal: {doc.documentDate}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(doc.id, doc.documentType)}
                            title="Cabut berkas dokumen ini"
                            className="text-red-600 hover:text-red-800 font-semibold px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition"
                          >
                            Cabut
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* US-4: Linimasa Silsilah Riwayat Kepemilikan */}
              <div>
                <div className="flex justify-between items-center border-b pb-1.5 mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    ⏳ Silsilah Linimasa Riwayat Mutasi / Peralihan Hak
                  </h4>
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-slate-400">Urutkan:</span>
                    <button
                      onClick={() => setTimelineDirection("desc")}
                      className={`px-2 py-0.5 rounded ${
                        timelineDirection === "desc"
                          ? "bg-emerald-700 text-white font-bold"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Terbaru
                    </button>
                    <button
                      onClick={() => setTimelineDirection("asc")}
                      className={`px-2 py-0.5 rounded ${
                        timelineDirection === "asc"
                          ? "bg-emerald-700 text-white font-bold"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      Terlama
                    </button>
                  </div>
                </div>

                {sortedHistories.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg border">
                    Belum ada catatan mutasi riwayat kepemilikan sebelumnya.
                  </p>
                ) : (
                  <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-300">
                    {sortedHistories.map((h, idx) => (
                      <div
                        key={h.id || idx}
                        className="relative bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs"
                      >
                        <span className="absolute -left-6 top-3.5 w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" />
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-emerald-800">{h.transferType}</span>
                          <span className="text-slate-400 font-mono">{h.transferDate}</span>
                        </div>
                        <p className="text-slate-700 mt-1">
                          Dari: <strong>{h.previousOwnerName || "Pendaftaran Baru"}</strong> ➔ Ke:{" "}
                          <strong className="text-emerald-900">{h.newOwnerName}</strong>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 rounded-b-2xl border-t flex justify-end">
              <button
                onClick={() => setSelectedLand(null)}
                className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-xs font-semibold"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}

      {/* US-1: Modal Tambah Tanah Baru */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-800 text-white p-5 rounded-t-2xl flex justify-between items-center">
              <h3 className="text-lg font-bold">Pendaftaran Bidang Tanah Baru</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-white hover:text-emerald-200 text-2xl font-bold px-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLand} className="p-6 space-y-4 text-xs">
              {validationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-300 text-red-700 rounded-lg space-y-1">
                  <p className="font-bold">Periksa kesalahan input berikut:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Sertifikat / Bukti Hak *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SHM-12.04.2024.088"
                  value={formCertNumber}
                  onChange={(e) => setFormCertNumber(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Pemilik Terdaftar *</label>
                <input
                  type="text"
                  placeholder="Contoh: Muhammad Farhan"
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Luas Tanah (m²) *</label>
                  <input
                    type="number"
                    min={1}
                    value={formLandArea}
                    onChange={(e) => setFormLandArea(Number(e.target.value))}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Hak Tanah</label>
                  <select
                    value={formRightType}
                    onChange={(e) => setFormRightType(e.target.value)}
                    className="w-full p-2.5 border rounded-lg bg-white"
                  >
                    <option value="Hak Milik (SHM)">Hak Milik (SHM)</option>
                    <option value="Hak Guna Bangunan (HGB)">Hak Guna Bangunan (HGB)</option>
                    <option value="Hak Pakai">Hak Pakai</option>
                    <option value="Girik / Adat">Girik / Adat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Bidang Tanah *</label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Ahmad Yani No. 15"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Desa / Kelurahan *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tanah Sareal"
                    value={formVillage}
                    onChange={(e) => setFormVillage(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kecamatan *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Tanah Sareal"
                    value={formSubDistrict}
                    onChange={(e) => setFormSubDistrict(e.target.value)}
                    className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kabupaten / Kota</label>
                  <input
                    type="text"
                    value={formRegency}
                    onChange={(e) => setFormRegency(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provinsi</label>
                  <input
                    type="text"
                    value={formProvince}
                    onChange={(e) => setFormProvince(e.target.value)}
                    className="w-full p-2.5 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-sm"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Pendaftaran"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
