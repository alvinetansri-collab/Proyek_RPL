import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.ownershipHistoryModel.deleteMany();
    await prisma.documentModel.deleteMany();
    await prisma.ownerModel.deleteMany();
    await prisma.landPlotModel.deleteMany();
    
    const land = await prisma.landPlotModel.create({
        data: {
            certificateNumber: "CERT-001/2023",
            address: "Jl. Merdeka No. 45",
            village: "Sukasari",
            subDistrict: "Bogor Timur",
            regencyCity: "Bogor",
            province: "Jawa Barat",
            landArea: 500.5,
            rightType: "Hak Milik",
            adminStatus: "Terdaftar",
        },
    });
    
    const owner = await prisma.ownerModel.create({
        data: {
            landPlotId: land.id,
            name: "Budi Santoso",
            nationalId: "3271012345670001",
            address: "Jl. Merdeka No. 45, Bogor",
            phoneNumber: "081234567890",
            isCurrentOwner: true,
        },
    });
    
    await prisma.documentModel.create({
        data: {
            landPlotId: land.id,
            ownerId: owner.id,
            documentType: "Sertifikat",
            documentNumber: "SHM-998877",
            documentDate: new Date("2020-01-15"),
        },
    });
    
    console.log("Seed data berhasil dimasukkan.");
}

main()
.catch((e) => {
    console.error(e);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});