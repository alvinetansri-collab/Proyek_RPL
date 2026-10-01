import { DocumentStatus } from "../enums/DocumentStatus";

export interface Land {
  Id: string;
  NomorSertifikat: string;
  Alamat: string;
  DesaKelurahan: string;
  Kecamatan: string;
  KabupatenKota: string;
  Provinsi: string;
  LuasTanah: number;
  JenisHak: string;
  StatusAdministrasi: string;
  StatusKelengkapan: DocumentStatus;
  CreatedAt: string;
}