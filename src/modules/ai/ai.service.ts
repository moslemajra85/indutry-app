import { env } from "../../shared/config/env";
import { logger } from "../../shared/logger/logger";
import type { AiStatus, FactorySnapshot, AiInsight } from "./ai.types";

interface OllamaResponse {
  response?: string;
}

interface OllamaTagsResponse {
  models?: Array<{ name?: string }>;
}

export class AiService {
  async getStatus(): Promise<AiStatus> {
    if (!env.aiEnabled) {
      return {
        enabled: false,
        provider: "deterministic",
        model: "rules-based-fallback",
        available: true,
        message: "AI is disabled; deterministic operational insight is available.",
      };
    }

    try {
      const response = await fetch(`${env.ollamaBaseUrl}/api/tags`);

      if (!response.ok) {
        return {
          enabled: true,
          provider: "ollama",
          model: env.ollamaModel,
          available: false,
          message: `Ollama returned HTTP ${response.status}.`,
        };
      }

      const body = (await response.json()) as OllamaTagsResponse;
      const modelAvailable =
        body.models?.some((model) => model.name?.startsWith(env.ollamaModel)) ?? false;

      return {
        enabled: true,
        provider: "ollama",
        model: env.ollamaModel,
        available: modelAvailable,
        message: modelAvailable
          ? `Ollama is available with model ${env.ollamaModel}.`
          : `Ollama is running, but model ${env.ollamaModel} is not pulled yet.`,
      };
    } catch {
      return {
        enabled: true,
        provider: "ollama",
        model: env.ollamaModel,
        available: false,
        message: "Ollama is not reachable from the API container.",
      };
    }
  }

  async generateFactoryInsight(snapshot: FactorySnapshot): Promise<AiInsight> {
    if (!env.aiEnabled) {
      return this.createDeterministicInsight(snapshot, "Local AI is disabled");
    }

    const prompt = this.buildPrompt(snapshot);

    try {
      const response = await fetch(`${env.ollamaBaseUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.ollamaModel,
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        logger.warn({ status: response.status }, "Ollama request failed");
        return this.createDeterministicInsight(snapshot, "Local AI returned an error");
      }

      const body = (await response.json()) as OllamaResponse;

      return {
        provider: "ollama",
        model: env.ollamaModel,
        summary: body.response?.trim() || "The model returned an empty response.",
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.warn({ error }, "Ollama unavailable, falling back to deterministic insight");
      return this.createDeterministicInsight(snapshot, "Local AI is unavailable");
    }
  }

  private buildPrompt(snapshot: FactorySnapshot): string {
    return [
      "You are an industrial operations assistant.",
      "Give a concise production shift insight for a factory supervisor.",
      "Focus on line status, production output, scrap rate, downtime, quality inspections, maintenance risk, active alerts, and one recommended next action.",
      "Keep the answer under 120 words and avoid generic advice.",
      "",
      JSON.stringify(snapshot, null, 2),
    ].join("\n");
  }

  private createDeterministicInsight(snapshot: FactorySnapshot, reason: string): AiInsight {
    const pausedLines = snapshot.productionLines.filter((line) => line.status !== "running");
    const criticalTickets = snapshot.maintenanceTickets.filter(
      (ticket) => ticket.priority === "critical" && ticket.status !== "resolved",
    );
    const openTickets = snapshot.maintenanceTickets.filter(
      (ticket) => ticket.status !== "resolved",
    );
    const kpis = snapshot.productionKpis;
    const quality = snapshot.qualitySummary;
    const scrapRatePercent = Math.round(kpis.scrapRate * 1000) / 10;
    const availabilityPercent = Math.round(kpis.availabilityRate * 1000) / 10;
    const defectRatePercent = Math.round(quality.defectRate * 1000) / 10;
    const criticalAlerts = snapshot.alerts.filter((alert) => alert.severity === "critical");

    const summary = [
      `${reason}.`,
      `${snapshot.productionLines.length} production lines are registered.`,
      `${pausedLines.length} line(s) are not running.`,
      `${kpis.totalGoodUnits} good units and ${kpis.totalScrapUnits} scrap units were logged across ${kpis.loggedEvents} production event(s).`,
      `Scrap rate is ${scrapRatePercent}% and availability is ${availabilityPercent}% with ${kpis.downtimeMinutes} downtime minute(s).`,
      `Quality defect rate is ${defectRatePercent}% with ${quality.failedInspections} failed and ${quality.blockedInspections} blocked inspection(s).`,
      `${snapshot.alerts.length} active alert(s), including ${criticalAlerts.length} critical alert(s).`,
      `${openTickets.length} maintenance ticket(s) remain open or in progress.`,
      criticalTickets.length > 0
        ? `Priority action: handle ${criticalTickets.length} critical maintenance ticket(s) first.`
        : this.recommendOperationalAction(snapshot),
    ].join(" ");

    return {
      provider: "deterministic",
      model: "rules-based-fallback",
      summary,
      generatedAt: new Date().toISOString(),
    };
  }

  private recommendOperationalAction(snapshot: FactorySnapshot): string {
    const kpis = snapshot.productionKpis;
    const quality = snapshot.qualitySummary;

    if (snapshot.alerts.some((alert) => alert.severity === "critical")) {
      return "Priority action: open the critical alerts panel and assign containment owners before the next handover.";
    }

    if (kpis.scrapRate >= 0.05) {
      return "Priority action: investigate scrap drivers and inspect recent process changes before the next shift.";
    }

    if (quality.blockedInspections > 0 || quality.failedInspections > 0) {
      return "Priority action: contain failed quality inspections and verify affected batches before release.";
    }

    if (kpis.availabilityRate > 0 && kpis.availabilityRate < 0.85) {
      return "Priority action: review downtime reasons and assign maintenance support to the worst affected line.";
    }

    const openTickets = snapshot.maintenanceTickets.filter(
      (ticket) => ticket.status !== "resolved",
    );

    if (openTickets.length > 0) {
      return "Priority action: clear the highest-priority open maintenance ticket.";
    }

    return "Priority action: keep monitoring output and log the next shift event before handover.";
  }
}
