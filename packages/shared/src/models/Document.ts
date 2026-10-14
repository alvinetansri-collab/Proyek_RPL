export interface Document {
    Id: string;
    LandPlotId: string;
    OwnerId: string | null;
    DocumentType: string;
    DocumentNumber: string;
    DocumentDate: string;
    CreatedAt: string;
}