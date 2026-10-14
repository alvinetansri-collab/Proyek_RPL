export interface OwnershipHistory {
    Id: string;
    LandPlotId: string;
    PreviousOwnerId: string | null;
    NewOwnerId: string | null;
    TransferDate: string;
    TransferType: string;
    SupportingDocumentId: string | null;
    CreatedAt: string;
}