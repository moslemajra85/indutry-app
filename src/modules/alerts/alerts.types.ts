export type AlertSeverity = "info" | "warning" | "critical";

export interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: "production" | "maintenance" | "quality" | "ai";
  createdAt: string;
}
