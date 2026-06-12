import { AppError } from "../../shared/http/app-error";
import { ProductionRepository } from "./production.repository";
import type {
  CreateProductionLineInput,
  ProductionLine,
  ProductionLineStatus,
} from "./production.types";

export interface ProductionRepositoryPort {
  list(): Promise<ProductionLine[]>;
  create(input: CreateProductionLineInput): Promise<ProductionLine>;
  updateStatus(id: string, status: ProductionLineStatus): Promise<ProductionLine | null>;
}

export class ProductionService {
  constructor(private readonly repository: ProductionRepositoryPort = new ProductionRepository()) {}

  listLines(): Promise<ProductionLine[]> {
    return this.repository.list();
  }

  createLine(input: CreateProductionLineInput): Promise<ProductionLine> {
    return this.repository.create({
      ...input,
      code: input.code.toUpperCase(),
    });
  }

  async changeLineStatus(id: string, status: ProductionLineStatus): Promise<ProductionLine> {
    const line = await this.repository.updateStatus(id, status);

    if (!line) {
      throw new AppError("Production line not found", 404, "PRODUCTION_LINE_NOT_FOUND");
    }

    return line;
  }
}
