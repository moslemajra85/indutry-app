import { ProductionEventsRepository } from "./production-events.repository";
import type {
  CreateProductionEventInput,
  ProductionEvent,
  ProductionKpiSummary,
} from "./production-events.types";

export interface ProductionEventsRepositoryPort {
  listRecent(limit?: number): Promise<ProductionEvent[]>;
  create(input: CreateProductionEventInput): Promise<ProductionEvent>;
  getSummary(): Promise<ProductionKpiSummary>;
}

export class ProductionEventsService {
  constructor(
    private readonly repository: ProductionEventsRepositoryPort = new ProductionEventsRepository(),
  ) {}

  listRecentEvents(): Promise<ProductionEvent[]> {
    return this.repository.listRecent(20);
  }

  createEvent(input: CreateProductionEventInput): Promise<ProductionEvent> {
    return this.repository.create({
      ...input,
      operatorName: input.operatorName.trim(),
      downtimeReason: input.downtimeReason?.trim() || null,
    });
  }

  getKpiSummary(): Promise<ProductionKpiSummary> {
    return this.repository.getSummary();
  }
}
