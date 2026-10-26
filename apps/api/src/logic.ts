export enum DocumentStatus {
  COMPLETE = "COMPLETE",
  NEEDS_REVIEW = "NEEDS_REVIEW",
  INCOMPLETE = "INCOMPLETE",
}

export function evaluateDocumentCompleteness(documents: Array<{ documentType?: string }> = []): DocumentStatus {
  const count = documents.length;
  if (count >= 3) return DocumentStatus.COMPLETE;
  if (count > 0) return DocumentStatus.NEEDS_REVIEW;
  return DocumentStatus.INCOMPLETE;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateLandRegistration(
  input: {
    CertificateNumber?: string;
    CurrentOwnerName?: string;
    Address?: string;
    Village?: string;
    SubDistrict?: string;
    LandArea?: number;
  },
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

export function validateDocumentAttachment(
  input: { documentType?: string; documentNumber?: string; documentDate?: string },
  existingDocuments: Array<{ documentNumber?: string }> = []
): ValidationResult {
  const errors: string[] = [];

  if (!input.documentType || input.documentType.trim() === "") {
    errors.push("Jenis dokumen wajib dipilih.");
  }

  if (!input.documentNumber || input.documentNumber.trim() === "") {
    errors.push("Nomor dokumen tidak boleh kosong.");
  } else {
    const isDuplicate = existingDocuments.some(
      (doc) => (doc.documentNumber || "").trim().toLowerCase() === input.documentNumber?.trim().toLowerCase()
    );
    if (isDuplicate) {
      errors.push(`Nomor dokumen '${input.documentNumber}' sudah pernah dilampirkan pada tanah ini.`);
    }
  }

  if (!input.documentDate || input.documentDate.trim() === "") {
    errors.push("Tanggal terbit dokumen wajib diisi.");
  } else {
    const parsed = new Date(input.documentDate);
    if (isNaN(parsed.getTime())) {
      errors.push("Format tanggal dokumen tidak valid.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateOwnershipTransfer(
  input: { transferType?: string; transferDate?: string; newOwnerName?: string },
  currentOwnerName?: string
): ValidationResult {
  const errors: string[] = [];

  if (!input.transferType || input.transferType.trim() === "") {
    errors.push("Jenis mutasi / peralihan hak wajib dipilih.");
  }

  if (!input.newOwnerName || input.newOwnerName.trim() === "") {
    errors.push("Nama pemilik baru wajib diisi.");
  } else if (
    currentOwnerName &&
    input.newOwnerName.trim().toLowerCase() === currentOwnerName.trim().toLowerCase()
  ) {
    errors.push("Nama pemilik baru tidak boleh sama dengan pemilik terdaftar saat ini.");
  }

  if (!input.transferDate || input.transferDate.trim() === "") {
    errors.push("Tanggal mutasi wajib diisi.");
  } else {
    const parsed = new Date(input.transferDate);
    if (isNaN(parsed.getTime())) {
      errors.push("Format tanggal mutasi tidak valid.");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

