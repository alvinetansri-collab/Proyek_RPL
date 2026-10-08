import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const evaluateCompleteness = (docCount: number): string => {
    if (docCount >= 3) return "COMPLETE";
    if (docCount > 0) return "NEEDS_REVIEW";
    return "INCOMPLETE";
};

app.get("/api/lands", async (req, res) => {
    try {
        const { search } = req.query;
        let whereClause = {};
        if (search && typeof search === "string") {
            whereClause = {
                OR: [
                    { certificateNumber: { contains: search } },
                    { address: { contains: search } },
                    { village: { contains: search } },
                    { subDistrict: { contains: search } },
                    { regencyCity: { contains: search } },
                    { owners: { some: { name: { contains: search } } } }
                ]
            };
        }
        
        const lands = await prisma.landPlotModel.findMany({
            where: whereClause,
            include: { documents: true, owners: { where: { isCurrentOwner: true } } },
            orderBy: { createdAt: "desc" }
        });
        
        const result = lands.map(land => ({
            Id: land.id,
            CertificateNumber: land.certificateNumber,
            Address: land.address,
            Village: land.village,
            SubDistrict: land.subDistrict,
            RegencyCity: land.regencyCity,
            Province: land.province,
            LandArea: land.landArea,
            RightType: land.rightType,
            AdminStatus: land.adminStatus,
            CompletenessStatus: evaluateCompleteness(land.documents.length),
            CurrentOwnerName: land.owners[0]?.name || "Belum ada pemilik",
            CreatedAt: land.createdAt.toISOString()
        }));
        
        res.json(result);
    
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data tanah" });
    }
});

app.post("/api/lands", async (req, res) => {
    try {
        const { CertificateNumber, Address, Village, SubDistrict, RegencyCity, Province, LandArea, RightType, AdminStatus } = req.body;
        const newLand = await prisma.landPlotModel.create({
            data: {
                certificateNumber: CertificateNumber,
                address: Address,
                village: Village,
                subDistrict: SubDistrict,
                regencyCity: RegencyCity,
                province: Province,
                landArea: Number(LandArea),
                rightType: RightType,
                adminStatus: AdminStatus
            }
        });
        res.status(201).json(newLand);
    } catch (error) {
        res.status(400).json({ error: "Gagal membuat bidang tanah" });
    }
});

app.get("/api/lands/:Id/detail", async (req, res) => {
    try {
        const { Id } = req.params;
        const land = await prisma.landPlotModel.findUnique({
            where: { id: Id },
            include: { owners: true, documents: true, histories: true }
        });
        
        if (!land) {
            return res.status(404).json({ error: "Bidang tanah tidak ditemukan" });
        }
        res.json({
            LandPlot: land,
            CompletenessStatus: evaluateCompleteness(land.documents.length)
        });
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil detail tanah" });
    }
});

app.listen(PORT, () => {
    console.log(`Server backend proyek-rpl berjalan di port ${PORT}`);
});