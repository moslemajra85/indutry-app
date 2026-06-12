export type ProductionLineStatus = "running" | "paused" | "maintenance";

export interface ProductionLine {
  id: string;
  code: string;
  name: string;
  area: string;
  targetPerHour: number;
  status: ProductionLineStatus;
  createdAt: string;
}

export interface CreateProductionLineInput {
  code: string;
  name: string;
  area: string;
  targetPerHour: number;
  status: ProductionLineStatus;
}
