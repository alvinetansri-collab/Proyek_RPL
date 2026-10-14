import { DocumentStatus } from "../enums/DocumentStatus.ts";

export interface LandPlot {
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
    CompletenessStatus?: DocumentStatus;
    CreatedAt: string;
}