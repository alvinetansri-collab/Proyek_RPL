import type { LandPlot } from "../../models/LandPlot.ts";

export interface LandSearchFilter {
  query?: string;
  rightType?: string;
  adminStatus?: string;
  completenessStatus?: string;
}

/**
 * Fitur 1: Pencarian Cerdas & Multi-Kriteria Data Bidang Tanah
 * Memungkinkan pencarian berdasarkan No. Sertifikat, Pemilik, Alamat, Desa, Kecamatan, dan Kabupaten
 */
export function searchLandPlots(
  lands: Array<LandPlot & { CurrentOwnerName?: string }>,
  filter: string | LandSearchFilter
): Array<LandPlot & { CurrentOwnerName?: string }> {
  const query = typeof filter === "string" ? filter.trim().toLowerCase() : (filter.query || "").trim().toLowerCase();
  const rightType = typeof filter === "object" ? filter.rightType : undefined;
  const adminStatus = typeof filter === "object" ? filter.adminStatus : undefined;
  const completenessStatus = typeof filter === "object" ? filter.completenessStatus : undefined;

  return lands.filter((land) => {
    // Filter jenis hak jika ditentukan
    if (rightType && rightType !== "ALL" && land.RightType !== rightType) {
      return false;
    }

    // Filter status administrasi jika ditentukan
    if (adminStatus && adminStatus !== "ALL" && land.AdminStatus !== adminStatus) {
      return false;
    }

    // Filter status kelengkapan jika ditentukan
    if (
      completenessStatus &&
      completenessStatus !== "ALL" &&
      (land as any).CompletenessStatus !== completenessStatus
    ) {
      return false;
    }

    // Filter teks pencarian jika ada
    if (!query) return true;

    const certMatch = land.CertificateNumber?.toLowerCase().includes(query) ?? false;
    const ownerMatch = land.CurrentOwnerName?.toLowerCase().includes(query) ?? false;
    const addressMatch = land.Address?.toLowerCase().includes(query) ?? false;
    const villageMatch = land.Village?.toLowerCase().includes(query) ?? false;
    const subDistrictMatch = land.SubDistrict?.toLowerCase().includes(query) ?? false;
    const regencyMatch = land.RegencyCity?.toLowerCase().includes(query) ?? false;

    return certMatch || ownerMatch || addressMatch || villageMatch || subDistrictMatch || regencyMatch;
  });
}

export interface LandRegistrationInput {
  CertificateNumber: string;
  CurrentOwnerName: string;
  Address: string;
  Village: string;
  SubDistrict: string;
  RegencyCity: string;
  Province: string;
  LandArea: number;
  RightType: string;
  AdminStatus: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Fitur 1: Validasi Pendaftaran Bidang Tanah Baru
 */
export function validateLandRegistration(
  input: Partial<LandRegistrationInput>,
  existingCertificates: string[] = []
): ValidationResult {
  const errors: string[] = [];

  if (!input.CertificateNumber || input.CertificateNumber.trim() === "") {
    errors.push("Nomor sertifikat tidak boleh kosong.");
  } else if (existingCertificates.includes(input.CertificateNumber.trim())) {
    errors.push(`Nomor sertifikat '${input.CertificateNumber}' sudah terdaftar dalam sistem.`);
  }

  if (!input.CurrentOwnerName || input.CurrentOwnerName.trim() === "") {
    errors.push("Nama pemilik tidak boleh kosong.");
  }

  if (!input.Address || input.Address.trim() === "") {
    errors.push("Alamat bidang tanah wajib diisi.");
  }

  if (!input.Village || input.Village.trim() === "") {
    errors.push("Desa / Kelurahan wajib diisi.");
  }

  if (!input.SubDistrict || input.SubDistrict.trim() === "") {
    errors.push("Kecamatan wajib diisi.");
  }

  if (input.LandArea === undefined || input.LandArea === null || isNaN(input.LandArea) || input.LandArea <= 0) {
    errors.push("Luas tanah harus berupa angka positif lebih dari 0.");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

