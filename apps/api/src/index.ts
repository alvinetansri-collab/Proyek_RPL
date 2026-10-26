import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import {
  DocumentStatus,
  evaluateDocumentCompleteness,
  validateLandRegistration,
  validateDocumentAttachment,
  validateOwnershipTransfer,
} from "./logic";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Path file penyimpanan persisten JSON lokal
const dataDir = path.join(__dirname, "../data");
const dataFilePath = path.join(dataDir, "lands.json");

export interface LandRecord {
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
const defaultMockLands: LandRecord[] = [
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

// Inisialisasi penyimpanan file JSON persisten
function loadLandsFromDisk(): LandRecord[] {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify(defaultMockLands, null, 2), "utf-8");
      return defaultMockLands;
    }
    const raw = fs.readFileSync(dataFilePath, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaultMockLands;
  } catch (err) {
    console.error("[API Storage] Error membaca file data, fallback ke default mock:", err);
    return defaultMockLands;
  }
}

function saveLandsToDisk(lands: LandRecord[]): void {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(lands, null, 2), "utf-8");
  } catch (err) {
    console.error("[API Storage] Gagal menyimpan data ke disk:", err);
  }
}

let landsStore: LandRecord[] = loadLandsFromDisk();

// 1. Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "OK",
    service: "Sistem Monitoring Dokumen & Status Kepemilikan Tanah API",
    version: "1.0.0-final",
    storageMode: "Persistent File Store (JSON)",
    recordCount: landsStore.length,
    timestamp: new Date().toISOString(),
  });
});

// 2. GET /api/lands (Pencarian & Filter Multi-Kriteria)
app.get("/api/lands", (req, res) => {
  try {
    const { search, rightType, completenessStatus } = req.query;

    let filtered = [...landsStore];

    if (rightType && typeof rightType === "string" && rightType !== "ALL") {
      filtered = filtered.filter((l) => l.RightType === rightType);
    }

    if (completenessStatus && typeof completenessStatus === "string" && completenessStatus !== "ALL") {
      filtered = filtered.filter((l) => l.CompletenessStatus === completenessStatus);
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((l) => {
        return (
          l.CertificateNumber.toLowerCase().includes(q) ||
          l.CurrentOwnerName.toLowerCase().includes(q) ||
          l.Address.toLowerCase().includes(q) ||
          l.Village.toLowerCase().includes(q) ||
          l.SubDistrict.toLowerCase().includes(q) ||
          l.RegencyCity.toLowerCase().includes(q)
        );
      });
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data bidang tanah" });
  }
});

// 3. POST /api/lands (Pendaftaran Tanah Baru dengan Validasi)
app.post("/api/lands", (req, res) => {
  try {
    const {
      CertificateNumber,
      CurrentOwnerName,
      Address,
      Village,
      SubDistrict,
      RegencyCity,
      Province,
      LandArea,
      RightType,
      AdminStatus,
    } = req.body;

    const existingCerts = landsStore.map((l) => l.CertificateNumber);
    const validation = validateLandRegistration(
      {
        CertificateNumber,
        CurrentOwnerName,
        Address,
        Village,
        SubDistrict,
        LandArea: Number(LandArea),
      },
      existingCerts
    );

    if (!validation.isValid) {
      return res.status(400).json({
        error: "Validasi gagal",
        details: validation.errors,
      });
    }

    const newLand: LandRecord = {
      Id: `land-${Date.now()}`,
      CertificateNumber: CertificateNumber.trim(),
      Address: Address.trim(),
      Village: Village.trim(),
      SubDistrict: SubDistrict.trim(),
      RegencyCity: RegencyCity ? RegencyCity.trim() : "Kota Bogor",
      Province: Province ? Province.trim() : "Jawa Barat",
      LandArea: Number(LandArea),
      RightType: RightType || "Hak Milik (SHM)",
      AdminStatus: AdminStatus || "Terdaftar Aktif",
      CompletenessStatus: DocumentStatus.INCOMPLETE,
      CurrentOwnerName: CurrentOwnerName.trim(),
      CreatedAt: new Date().toISOString(),
      owners: [
        {
          name: CurrentOwnerName.trim(),
          nationalId: "3201" + Math.floor(100000000000 + Math.random() * 900000000000),
          phoneNumber: "08" + Math.floor(1000000000 + Math.random() * 9000000000),
          address: Address.trim(),
        },
      ],
      documents: [],
      histories: [
        {
          id: `hist-${Date.now()}`,
          transferDate: new Date().toISOString().split("T")[0],
          transferType: "Pendaftaran Hak Baru",
          previousOwnerName: "-",
          newOwnerName: CurrentOwnerName.trim(),
        },
      ],
    };

    landsStore = [newLand, ...landsStore];
    saveLandsToDisk(landsStore);

    res.status(201).json(newLand);
  } catch (error) {
    res.status(500).json({ error: "Gagal mendaftarkan bidang tanah baru" });
  }
});

// 4. GET /api/lands/:id/detail
app.get("/api/lands/:id/detail", (req, res) => {
  try {
    const { id } = req.params;
    const land = landsStore.find((l) => l.Id === id);
    if (!land) {
      return res.status(404).json({ error: "Bidang tanah tidak ditemukan" });
    }
    res.json(land);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil detail tanah" });
  }
});

// 5. POST /api/lands/:id/documents (Lampirkan Dokumen Baru)
app.post("/api/lands/:id/documents", (req, res) => {
  try {
    const { id } = req.params;
    const landIndex = landsStore.findIndex((l) => l.Id === id);
    if (landIndex === -1) {
      return res.status(404).json({ error: "Bidang tanah tidak ditemukan" });
    }

    const land = landsStore[landIndex];
    const { documentType, documentNumber, documentDate } = req.body;

    const validation = validateDocumentAttachment(
      { documentType, documentNumber, documentDate },
      land.documents || []
    );

    if (!validation.isValid) {
      return res.status(400).json({
        error: "Validasi dokumen gagal",
        details: validation.errors,
      });
    }

    const createdDoc = {
      id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      documentType: documentType.trim(),
      documentNumber: documentNumber.trim(),
      documentDate: documentDate.trim(),
    };

    const updatedDocs = [...(land.documents || []), createdDoc];
    const newStatus = evaluateDocumentCompleteness(updatedDocs);

    const updatedLand: LandRecord = {
      ...land,
      documents: updatedDocs,
      CompletenessStatus: newStatus,
    };

    landsStore[landIndex] = updatedLand;
    saveLandsToDisk(landsStore);

    res.status(201).json({
      message: "Dokumen berhasil dilampirkan",
      newStatus,
      updatedLand,
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal melampirkan berkas dokumen" });
  }
});

// 6. DELETE /api/lands/:id/documents/:docId (Cabut Dokumen)
app.delete("/api/lands/:id/documents/:docId", (req, res) => {
  try {
    const { id, docId } = req.params;
    const landIndex = landsStore.findIndex((l) => l.Id === id);
    if (landIndex === -1) {
      return res.status(404).json({ error: "Bidang tanah tidak ditemukan" });
    }

    const land = landsStore[landIndex];
    const updatedDocs = (land.documents || []).filter((doc) => doc.id !== docId);
    const newStatus = evaluateDocumentCompleteness(updatedDocs);

    const updatedLand: LandRecord = {
      ...land,
      documents: updatedDocs,
      CompletenessStatus: newStatus,
    };

    landsStore[landIndex] = updatedLand;
    saveLandsToDisk(landsStore);

    res.json({
      message: "Dokumen berhasil dicabut",
      newStatus,
      updatedLand,
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal mencabut dokumen" });
  }
});

// 7. POST /api/lands/:id/histories (Catat Peralihan Hak / Mutasi)
app.post("/api/lands/:id/histories", (req, res) => {
  try {
    const { id } = req.params;
    const landIndex = landsStore.findIndex((l) => l.Id === id);
    if (landIndex === -1) {
      return res.status(404).json({ error: "Bidang tanah tidak ditemukan" });
    }

    const land = landsStore[landIndex];
    const { transferType, transferDate, newOwnerName, newOwnerNik, newOwnerPhone, newOwnerAddress } = req.body;

    const validation = validateOwnershipTransfer(
      { transferType, transferDate, newOwnerName },
      land.CurrentOwnerName
    );

    if (!validation.isValid) {
      return res.status(400).json({
        error: "Validasi mutasi gagal",
        details: validation.errors,
      });
    }

    const previousOwner = land.CurrentOwnerName || "Pendaftaran Awal";
    const newHistoryEntry = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      transferDate: transferDate.trim(),
      transferType: transferType.trim(),
      previousOwnerName: previousOwner,
      newOwnerName: newOwnerName.trim(),
    };

    const newOwnerObj = {
      name: newOwnerName.trim(),
      nationalId:
        newOwnerNik?.trim() || "3201" + Math.floor(100000000000 + Math.random() * 900000000000),
      phoneNumber:
        newOwnerPhone?.trim() || "0812" + Math.floor(10000000 + Math.random() * 90000000),
      address: newOwnerAddress?.trim() || "Sesuai domisili baru",
    };

    const updatedLand: LandRecord = {
      ...land,
      CurrentOwnerName: newOwnerName.trim(),
      owners: [newOwnerObj, ...(land.owners || [])],
      histories: [...(land.histories || []), newHistoryEntry],
    };

    landsStore[landIndex] = updatedLand;
    saveLandsToDisk(landsStore);

    res.status(201).json({
      message: "Mutasi kepemilikan berhasil dicatat",
      newHistoryEntry,
      updatedLand,
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal mencatat mutasi kepemilikan" });
  }
});

// 8. DELETE /api/lands/:id (Hapus Bidang Tanah)
app.delete("/api/lands/:id", (req, res) => {
  try {
    const { id } = req.params;
    const landIndex = landsStore.findIndex((l) => l.Id === id);
    if (landIndex === -1) {
      return res.status(404).json({ error: "Bidang tanah tidak ditemukan" });
    }

    const deleted = landsStore.splice(landIndex, 1)[0];
    saveLandsToDisk(landsStore);

    res.json({
      message: "Bidang tanah berhasil dihapus",
      deletedLand: deleted,
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus bidang tanah" });
  }
});

// 9. POST /api/reset-demo (Kembalikan ke data awal demo)
app.post("/api/reset-demo", (_req, res) => {
  try {
    landsStore = JSON.parse(JSON.stringify(defaultMockLands));
    saveLandsToDisk(landsStore);
    res.json({
      message: "Data demo berhasil direset ke konfigurasi awal",
      total: landsStore.length,
      lands: landsStore,
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal mereset data demo" });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Server Backend API Proyek RPL Berjalan di Port ${PORT}`);
  console.log(`Mode Penyimpanan: Persistent JSON Storage (${dataFilePath})`);
  console.log(`Jumlah Data Terdaftar: ${landsStore.length} bidang tanah`);
  console.log(`Endpoint Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
