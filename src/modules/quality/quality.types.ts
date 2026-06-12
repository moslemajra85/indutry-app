export type QualitySeverity = "low" | "medium" | "high" | "critical";
export type QualityStatus = "passed" | "failed" | "blocked";

export interface QualityInspection {
  id: string;
  lineId: string;
  lineCode: string;
  lineName: string;
  inspectorName: string;
  sampleSize: number;
  defectCount: number;
  severity: QualitySeverity;
  status: QualityStatus;
  notes: string | null;
  createdAt: string;
}

export interface CreateQualityInspectionInput {
  lineId: string;
  inspectorName: string;
  sampleSize: number;
  defectCount: number;
  severity: QualitySeverity;
  status: QualityStatus;
  notes?: string | null;
}

export interface QualitySummary {
  totalInspections: number;
  failedInspections: number;
  blockedInspections: number;
  totalSamples: number;
  totalDefects: number;
  defectRate: number;
}
