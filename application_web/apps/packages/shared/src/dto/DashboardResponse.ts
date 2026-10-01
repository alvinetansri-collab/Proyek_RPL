import { Land } from "../models/Land";

export interface DashboardResponse {
  TotalLand: number;
  TotalCompleteDocuments: number;
  TotalIncompleteDocuments: number;
  TotalNeedReview: number;
  RecentLands: Land[];
}