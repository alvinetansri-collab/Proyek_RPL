import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { Land, DashboardResponse } from "@land-document-tracker/shared";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const mapLandToShared = (item: any): Land => ({
  Id: item.id,
  NomorSertifikat: item.nomorSertifikat,
  Alamat: item.alamat,
  DesaKelurahan: item.desaKelurahan,
  Kecamatan: item.kecamatan,
  KabupatenKota: item.kabupatenKota,
  Provinsi: item.provinsi,
  LuasTanah: item.luasTanah,
  JenisHak: item.jenisHak,
  StatusAdministrasi: item.statusAdministrasi,
  StatusKelengkapan: item.statusKelengkapan,
  CreatedAt: item.createdAt.toISOString()
});

app.get("/api/dashboard", async (req, res) => {
  try {
    const totalLand = await prisma.land.count();
    const totalCompleteDocuments = await prisma.land.count({ where: { statusKelengkapan: "Lengkap" } });
    const totalIncompleteDocuments = await prisma.land.count({ where: { statusKelengkapan: "Belum Lengkap" } });
    const totalNeedReview = await prisma.land.count({ where: { statusKelengkapan: "Perlu Diperiksa" } });
    const recentLandsRaw = await prisma.land.findMany({ take: 5, orderBy: { createdAt: "desc" } });

    const response: DashboardResponse = {
      TotalLand: totalLand,
      TotalCompleteDocuments: totalCompleteDocuments,
      TotalIncompleteDocuments: totalIncompleteDocuments,
      TotalNeedReview: totalNeedReview,
      RecentLands: recentLandsRaw.map(mapLandToShared)
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ Error: "Gagal mengambil data dashboard" });
  }
});

app.get("/api/lands", async (req, res) => {
  const { search, kecamatan, kabupatenKota } = req.query;
  try {
    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { nomorSertifikat: { contains: search as string } },
        { alamat: { contains: search as string } }
      ];
    }
    if (kecamatan) whereClause.kecamatan = { contains: kecamatan as string };
    if (kabupatenKota) whereClause.kabupatenKota = { contains: kabupatenKota as string };

    const lands = await prisma.land.findMany({ where: whereClause, orderBy: { createdAt: "desc" } });
    res.json(lands.map(mapLandToShared));
  } catch (error) {
    res.status(500).json({ Error: "Gagal mengambil daftar tanah" });
  }
});

app.post("/api/lands", async (req, res) => {
  try {
    const newLand = await prisma.land.create({
      data: {
        nomorSertifikat: req.body.NomorSertifikat,
        alamat: req.body.Alamat,
        desaKelurahan: req.body.DesaKelurahan,
        kecamatan: req.body.Kecamatan,
        kabupatenKota: req.body.KabupatenKota,
        provinsi: req.body.Provinsi,
        luasTanah: parseFloat(req.body.LuasTanah),
        jenisHak: req.body.JenisHak,
        statusAdministrasi: req.body.StatusAdministrasi,
        statusKelengkapan: req.body.StatusKelengkapan || "Belum Lengkap"
      }
    });
    res.status(201).json(mapLandToShared(newLand));
  } catch (error) {
    res.status(400).json({ Error: "Gagal membuat data tanah baru" });
  }
});

app.get("/api/lands/:Id", async (req, res) => {
  try {
    const land = await prisma.land.findUnique({
      where: { id: req.params.Id },
      include: { owners: true, documents: true, histories: true }
    });
    if (!land) return res.status(404).json({ Error: "Tanah tidak ditemukan" });
    res.json(land);
  } catch (error) {
    res.status(500).json({ Error: "Gagal mengambil detail tanah" });
  }
});

app.delete("/api/lands/:Id", async (req, res) => {
  try {
    await prisma.land.delete({ where: { id: req.params.Id } });
    res.json({ Message: "Data tanah berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ Error: "Gagal menghapus data tanah" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});