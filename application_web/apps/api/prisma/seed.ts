import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.ownershipHistory.deleteMany();
  await prisma.document.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.land.deleteMany();

  const land = await prisma.land.create({
    data: {
      nomorSertifikat: "SHM-12345/Mampang",
      alamat: "Jl. Warung Jati Barat No. 12",
      desaKelurahan: "Mampang Prapatan",
      kecamatan: "Mampang Prapatan",
      kabupatenKota: "Jakarta Selatan",
      provinsi: "DKI Jakarta",
      luasTanah: 250,
      jenisHak: "Hak Milik",
      statusAdministrasi: "Terdaftar",
      statusKelengkapan: "Lengkap",
      owners: {
        create: {
          namaPemilik: "Budi Santoso",
          nik: "3171012345670001",
          alamat: "Jl. Warung Jati Barat No. 12",
          nomorTelepon: "081234567890",
          statusPemilikSaatIni: true
        }
      },
      documents: {
        create: [
          {
            jenisDokumen: "Sertifikat",
            nomorDokumen: "CERT-98765",
            tanggalDokumen: "2010-05-12",
            pemilikTerkait: "Budi Santoso"
          },
          {
            jenisDokumen: "Akta Jual Beli",
            nomorDokumen: "AJB-456",
            tanggalDokumen: "2010-04-10",
            pemilikTerkait: "Budi Santoso"
          }
        ]
      },
      histories: {
        create: {
          pemilikSebelumnya: "Ahmad Yani",
          pemilikBaru: "Budi Santoso",
          tanggalPerubahan: "2010-05-15",
          jenisPeralihan: "Jual Beli",
          dokumenPendukung: "AJB-456"
        }
      }
    }
  });

  console.log("Seed data created successfully for land ID:", land.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });