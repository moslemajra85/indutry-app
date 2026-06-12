import type { OperationalAlert } from "../alerts/alerts.types";
import type { MaintenanceTicket } from "../maintenance/maintenance.types";
import type {
  ProductionEvent,
  ProductionKpiSummary,
} from "../production-events/production-events.types";
import type { ProductionLine } from "../production/production.types";
import type { QualityInspection, QualitySummary } from "../quality/quality.types";

export interface FactorySnapshot {
  productionLines: ProductionLine[];
  maintenanceTickets: MaintenanceTicket[];
  productionEvents: ProductionEvent[];
  productionKpis: ProductionKpiSummary;
  qualityInspections: QualityInspection[];
  qualitySummary: QualitySummary;
  alerts: OperationalAlert[];
}

export interface AiInsight {
  provider: "ollama" | "deterministic";
  model: string;
  summary: string;
  generatedAt: string;
}

export interface AiStatus {
  enabled: boolean;
  provider: "ollama" | "deterministic";
  model: string;
  available: boolean;
  message: string;
}
