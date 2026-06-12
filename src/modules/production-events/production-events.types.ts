export type ProductionShift = "morning" | "evening" | "night";

export interface ProductionEvent {
  id: string;
  lineId: string;
  lineCode: string;
  lineName: string;
  shift: ProductionShift;
  operatorName: string;
  plannedMinutes: number;
  goodUnits: number;
  scrapUnits: number;
  downtimeMinutes: number;
  downtimeReason: string | null;
  recordedAt: string;
}

export interface CreateProductionEventInput {
  lineId: string;
  shift: ProductionShift;
  operatorName: string;
  plannedMinutes: number;
  goodUnits: number;
  scrapUnits: number;
  downtimeMinutes: number;
  downtimeReason?: string | null;
}

export interface ProductionKpiSummary {
  loggedEvents: number;
  totalGoodUnits: number;
  totalScrapUnits: number;
  totalUnits: number;
  scrapRate: number;
  downtimeMinutes: number;
  plannedMinutes: number;
  availabilityRate: number;
  averageUnitsPerHour: number;
}
