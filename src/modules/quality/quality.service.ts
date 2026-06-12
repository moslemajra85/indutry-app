import { QualityRepository } from "./quality.repository";
import type {
  CreateQualityInspectionInput,
  QualityInspection,
  QualitySummary,
} from "./quality.types";

export interface QualityRepositoryPort {
  listRecent(limit?: number): Promise<QualityInspection[]>;
  create(input: CreateQualityInspectionInput): Promise<QualityInspection>;
  getSummary(): Promise<QualitySummary>;
}

export class QualityService {
  constructor(private readonly repository: QualityRepositoryPort = new QualityRepository()) {}

  listRecentInspections(): Promise<QualityInspection[]> {
    return this.repository.listRecent(20);
  }

  createInspection(input: CreateQualityInspectionInput): Promise<QualityInspection> {
    return this.repository.create({
      ...input,
      inspectorName: input.inspectorName.trim(),
      notes: input.notes?.trim() || null,
    });
  }

  getSummary(): Promise<QualitySummary> {
    return this.repository.getSummary();
  }
}
