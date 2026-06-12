import "./styles.css";

type ProductionLineStatus = "running" | "paused" | "maintenance";
type ProductionShift = "morning" | "evening" | "night";
type MaintenancePriority = "low" | "medium" | "high" | "critical";
type MaintenanceStatus = "open" | "in_progress" | "resolved";
type QualitySeverity = "low" | "medium" | "high" | "critical";
type QualityStatus = "passed" | "failed" | "blocked";
type AlertSeverity = "info" | "warning" | "critical";

interface ProductionLine {
  id: string;
  code: string;
  name: string;
  area: string;
  targetPerHour: number;
  status: ProductionLineStatus;
}

interface ProductionEvent {
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

interface ProductionKpiSummary {
  loggedEvents: number;
  totalGoodUnits: number;
  totalScrapUnits: number;
  scrapRate: number;
  downtimeMinutes: number;
  availabilityRate: number;
  averageUnitsPerHour: number;
}

interface QualityInspection {
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

interface QualitySummary {
  totalInspections: number;
  failedInspections: number;
  blockedInspections: number;
  totalSamples: number;
  totalDefects: number;
  defectRate: number;
}

interface MaintenanceTicket {
  id: string;
  lineId: string;
  lineCode: string;
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
}

interface OperationalAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  createdAt: string;
}

interface AuditEvent {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  createdAt: string;
}

interface AiInsight {
  provider: string;
  model: string;
  summary: string;
  generatedAt: string;
}

interface AiStatus {
  enabled: boolean;
  provider: string;
  model: string;
  available: boolean;
  message: string;
}

interface ApiResponse<T> {
  data: T;
}

interface DashboardState {
  lines: ProductionLine[];
  events: ProductionEvent[];
  productionKpis: ProductionKpiSummary;
  inspections: QualityInspection[];
  qualitySummary: QualitySummary;
  tickets: MaintenanceTicket[];
  alerts: OperationalAlert[];
  auditEvents: AuditEvent[];
  aiStatus: AiStatus | null;
  message: string | null;
  insight: AiInsight | null;
}

const emptyProductionKpis: ProductionKpiSummary = {
  loggedEvents: 0,
  totalGoodUnits: 0,
  totalScrapUnits: 0,
  scrapRate: 0,
  downtimeMinutes: 0,
  availabilityRate: 0,
  averageUnitsPerHour: 0,
};

const emptyQualitySummary: QualitySummary = {
  totalInspections: 0,
  failedInspections: 0,
  blockedInspections: 0,
  totalSamples: 0,
  totalDefects: 0,
  defectRate: 0,
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root was not found");
}

const appRoot = app;

const state: DashboardState = {
  lines: [],
  events: [],
  productionKpis: emptyProductionKpis,
  inspections: [],
  qualitySummary: emptyQualitySummary,
  tickets: [],
  alerts: [],
  auditEvents: [],
  aiStatus: null,
  message: null,
  insight: null,
};

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const body = (await response.json()) as { error?: { message?: string } };
      message = body.error?.message ?? message;
    } catch {
      // Keep status message for non-JSON errors.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

async function loadDashboard(message?: string) {
  appRoot.innerHTML = `<section class="state">Loading factory dashboard...</section>`;

  try {
    const [
      lines,
      events,
      productionKpis,
      inspections,
      qualitySummary,
      tickets,
      alerts,
      auditEvents,
      aiStatus,
    ] = await Promise.all([
      api<ApiResponse<ProductionLine[]>>("/api/production-lines"),
      api<ApiResponse<ProductionEvent[]>>("/api/production-events"),
      api<ApiResponse<ProductionKpiSummary>>("/api/production-events/summary"),
      api<ApiResponse<QualityInspection[]>>("/api/quality-inspections"),
      api<ApiResponse<QualitySummary>>("/api/quality-inspections/summary"),
      api<ApiResponse<MaintenanceTicket[]>>("/api/maintenance-tickets"),
      api<ApiResponse<OperationalAlert[]>>("/api/alerts"),
      api<ApiResponse<AuditEvent[]>>("/api/audit-events"),
      api<ApiResponse<AiStatus>>("/api/ai/status"),
    ]);

    state.lines = lines.data;
    state.events = events.data;
    state.productionKpis = productionKpis.data;
    state.inspections = inspections.data;
    state.qualitySummary = qualitySummary.data;
    state.tickets = tickets.data;
    state.alerts = alerts.data;
    state.auditEvents = auditEvents.data;
    state.aiStatus = aiStatus.data;
    state.message = message ?? null;
    renderDashboard();
  } catch (error) {
    appRoot.innerHTML = `
      <section class="state error">
        <h1>Dashboard unavailable</h1>
        <p>${escapeHtml(errorMessage(error))}</p>
        <p>Start the API and database, then reload this page.</p>
      </section>
    `;
  }
}

function renderDashboard() {
  const runningLines = state.lines.filter((line) => line.status === "running").length;
  const openTickets = state.tickets.filter((ticket) => ticket.status !== "resolved").length;
  const criticalAlerts = state.alerts.filter((alert) => alert.severity === "critical").length;

  appRoot.innerHTML = `
    <section class="shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Factory operations command center</p>
          <h1>IndustryOps AI</h1>
          <p class="subtitle">
            Production, downtime, maintenance, quality containment, audit trail, and local AI risk insight in one modular monolith.
          </p>
          ${renderAiStatus()}
        </div>
        <div class="hero-actions">
          <button id="refresh-dashboard" class="secondary" type="button">Refresh</button>
          <button id="generate-insight" type="button">Generate AI insight</button>
        </div>
      </header>

      ${state.message ? `<p class="notice">${escapeHtml(state.message)}</p>` : ""}

      ${renderSectionNav(openTickets, criticalAlerts)}

      <section id="overview" class="page-section">
        <div class="section-title">
          <div>
            <p class="eyebrow">Overview</p>
            <h2>Factory status</h2>
          </div>
          <span>Live operational snapshot</span>
        </div>
        <section class="metrics" aria-label="Factory metrics">
          ${metricCard("Running lines", `${runningLines}/${state.lines.length}`)}
          ${metricCard("Good units", formatNumber(state.productionKpis.totalGoodUnits))}
          ${metricCard("Scrap rate", formatPercent(state.productionKpis.scrapRate))}
          ${metricCard("Critical alerts", criticalAlerts.toString())}
        </section>
        ${renderAlerts()}
        <section class="metrics kpi-strip" aria-label="Operational KPI summary">
          ${metricCard("Availability", formatPercent(state.productionKpis.availabilityRate))}
          ${metricCard("Avg units/hour", formatNumber(Math.round(state.productionKpis.averageUnitsPerHour)))}
          ${metricCard("Quality defects", `${state.qualitySummary.totalDefects}/${state.qualitySummary.totalSamples}`)}
          ${metricCard("Open tickets", openTickets.toString())}
        </section>
      </section>

      <section id="operations" class="page-section">
        <div class="section-title">
          <div>
            <p class="eyebrow">Operations</p>
            <h2>Production control</h2>
          </div>
          <span>Create lines, log shifts, and review output history</span>
        </div>
        <section class="workspace">
          ${renderProductionLineForm()}
          ${renderProductionEventForm()}
        </section>
        <section class="grid">
          ${renderProductionLinesPanel()}
          ${renderProductionHistoryPanel()}
        </section>
      </section>

      <section id="quality" class="page-section">
        <div class="section-title">
          <div>
            <p class="eyebrow">Quality</p>
            <h2>Inspection and containment</h2>
          </div>
          <span>${formatPercent(state.qualitySummary.defectRate)} defect rate</span>
        </div>
        <section class="grid">
          ${renderQualityInspectionForm()}
          ${renderQualityHistoryPanel()}
        </section>
      </section>

      <section id="maintenance" class="page-section">
        <div class="section-title">
          <div>
            <p class="eyebrow">Maintenance</p>
            <h2>Technical issue tracking</h2>
          </div>
          <span>${openTickets} active ticket(s)</span>
        </div>
        <section class="grid">
          ${renderMaintenanceTicketForm()}
          ${renderMaintenancePanel()}
        </section>
      </section>

      <section id="traceability" class="page-section">
        <div class="section-title">
          <div>
            <p class="eyebrow">Traceability</p>
            <h2>Audit and AI decision support</h2>
          </div>
          <span>Review actions before handover</span>
        </div>
        <section class="grid">
          ${renderAuditPanel()}
          <section class="insight" id="insight-panel">${renderInsight()}</section>
        </section>
      </section>
    </section>
  `;

  bindDashboardEvents();
}

function renderSectionNav(openTickets: number, criticalAlerts: number) {
  return `
    <nav class="section-nav" aria-label="Dashboard sections">
      <a href="#overview" class="nav-link">
        <span>Overview</span>
        <strong>${criticalAlerts} critical</strong>
      </a>
      <a href="#operations" class="nav-link">
        <span>Operations</span>
        <strong>${state.events.length} logs</strong>
      </a>
      <a href="#quality" class="nav-link">
        <span>Quality</span>
        <strong>${state.qualitySummary.failedInspections} failed</strong>
      </a>
      <a href="#maintenance" class="nav-link">
        <span>Maintenance</span>
        <strong>${openTickets} open</strong>
      </a>
      <a href="#traceability" class="nav-link">
        <span>Audit & AI</span>
        <strong>${state.auditEvents.length} events</strong>
      </a>
    </nav>
  `;
}

function renderAiStatus() {
  if (!state.aiStatus) {
    return "";
  }

  const statusClass = state.aiStatus.available ? "status-ok" : "status-warning";

  return `
    <p class="ai-status ${statusClass}">
      AI: ${escapeHtml(state.aiStatus.provider)} · ${escapeHtml(state.aiStatus.model)} · ${escapeHtml(state.aiStatus.message)}
    </p>
  `;
}

function renderAlerts() {
  return `
    <section class="alert-strip" aria-label="Operational alerts">
      ${state.alerts
        .map(
          (alert) => `
            <article class="alert-card ${alert.severity}">
              <strong>${escapeHtml(alert.title)}</strong>
              <span>${escapeHtml(alert.message)}</span>
            </article>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderProductionLineForm() {
  return `
    <section class="panel">
      <div class="section-heading"><h2>Add production line</h2></div>
      <form id="line-form" class="form">
        <label>Line code<input name="code" placeholder="WH-04" required minlength="2" maxlength="30" /></label>
        <label>Name<input name="name" placeholder="Wire Harness Assembly 4" required minlength="2" maxlength="120" /></label>
        <label>Area<input name="area" placeholder="Assembly Hall B" required minlength="2" maxlength="120" /></label>
        <label>Target per hour<input name="targetPerHour" type="number" min="1" max="10000" value="120" required /></label>
        <label>Initial status<select name="status">${statusOptions<ProductionLineStatus>(["running", "paused", "maintenance"], "running")}</select></label>
        <button type="submit">Create line</button>
      </form>
    </section>
  `;
}

function renderProductionEventForm() {
  return `
    <section class="panel highlight-panel">
      <div class="section-heading"><h2>Log shift output</h2></div>
      <form id="event-form" class="form">
        <label>Production line<select name="lineId" required ${state.lines.length === 0 ? "disabled" : ""}>${lineOptions()}</select></label>
        <label>Shift<select name="shift">${statusOptions<ProductionShift>(["morning", "evening", "night"], "morning")}</select></label>
        <label>Operator / team leader<input name="operatorName" placeholder="Shift Leader A" required minlength="2" maxlength="120" /></label>
        <div class="form-row">
          <label>Planned minutes<input name="plannedMinutes" type="number" min="1" max="1440" value="480" required /></label>
          <label>Downtime minutes<input name="downtimeMinutes" type="number" min="0" max="1440" value="0" required /></label>
        </div>
        <div class="form-row">
          <label>Good units<input name="goodUnits" type="number" min="0" max="1000000" value="0" required /></label>
          <label>Scrap units<input name="scrapUnits" type="number" min="0" max="1000000" value="0" required /></label>
        </div>
        <label>Downtime reason<textarea name="downtimeReason" placeholder="Example: sensor fault, material shortage, changeover" maxlength="500"></textarea></label>
        <button type="submit" ${state.lines.length === 0 ? "disabled" : ""}>Log shift</button>
      </form>
    </section>
  `;
}

function renderQualityInspectionForm() {
  return `
    <section class="panel highlight-panel">
      <div class="section-heading"><h2>Record quality inspection</h2></div>
      <form id="quality-form" class="form">
        <label>Production line<select name="lineId" required ${state.lines.length === 0 ? "disabled" : ""}>${lineOptions()}</select></label>
        <label>Inspector<input name="inspectorName" placeholder="Quality Team A" required minlength="2" maxlength="120" /></label>
        <div class="form-row">
          <label>Sample size<input name="sampleSize" type="number" min="1" max="100000" value="50" required /></label>
          <label>Defects<input name="defectCount" type="number" min="0" max="100000" value="0" required /></label>
        </div>
        <div class="form-row">
          <label>Severity<select name="severity">${statusOptions<QualitySeverity>(["low", "medium", "high", "critical"], "medium")}</select></label>
          <label>Status<select name="status">${statusOptions<QualityStatus>(["passed", "failed", "blocked"], "passed")}</select></label>
        </div>
        <label>Notes<textarea name="notes" placeholder="Containment action, defect type, batch risk, measurement result" maxlength="1000"></textarea></label>
        <button type="submit" ${state.lines.length === 0 ? "disabled" : ""}>Save inspection</button>
      </form>
    </section>
  `;
}

function renderMaintenanceTicketForm() {
  return `
    <section class="panel">
      <div class="section-heading"><h2>Create maintenance ticket</h2></div>
      <form id="ticket-form" class="form">
        <label>Production line<select name="lineId" required ${state.lines.length === 0 ? "disabled" : ""}>${lineOptions()}</select></label>
        <label>Title<input name="title" placeholder="Crimping pressure drift" required minlength="3" maxlength="140" /></label>
        <label>Description<textarea name="description" placeholder="Explain fault, symptom, quality risk, or downtime impact." required minlength="10" maxlength="1000"></textarea></label>
        <label>Priority<select name="priority">${statusOptions<MaintenancePriority>(["low", "medium", "high", "critical"], "high")}</select></label>
        <button type="submit" ${state.lines.length === 0 ? "disabled" : ""}>Create ticket</button>
      </form>
    </section>
  `;
}

function renderProductionLinesPanel() {
  return `
    <section>
      <div class="section-heading"><h2>Production lines</h2><span>${state.lines.length} total</span></div>
      <div class="list">${state.lines.map(renderLine).join("") || "<p class='empty'>No production lines yet.</p>"}</div>
    </section>
  `;
}

function renderMaintenancePanel() {
  const openTickets = state.tickets.filter((ticket) => ticket.status !== "resolved").length;

  return `
    <section>
      <div class="section-heading"><h2>Maintenance tickets</h2><span>${openTickets} active</span></div>
      <div class="list">${state.tickets.map(renderTicket).join("") || "<p class='empty'>No maintenance tickets yet.</p>"}</div>
    </section>
  `;
}

function renderProductionHistoryPanel() {
  return `
    <section class="panel event-history">
      <div class="section-heading"><h2>Recent production logs</h2><span>${state.events.length} latest</span></div>
      <div class="event-table">${state.events.map(renderProductionEvent).join("") || "<p class='empty'>No production events logged yet.</p>"}</div>
    </section>
  `;
}

function renderQualityHistoryPanel() {
  return `
    <section class="panel event-history">
      <div class="section-heading"><h2>Quality inspections</h2><span>${formatPercent(state.qualitySummary.defectRate)} defect rate</span></div>
      <div class="event-table">${state.inspections.map(renderQualityInspection).join("") || "<p class='empty'>No quality inspections yet.</p>"}</div>
    </section>
  `;
}

function renderAuditPanel() {
  return `
    <section class="panel event-history">
      <div class="section-heading"><h2>Audit trail</h2><span>${state.auditEvents.length} latest</span></div>
      <div class="event-table">${state.auditEvents.map(renderAuditEvent).join("") || "<p class='empty'>No audit events yet.</p>"}</div>
    </section>
  `;
}

function bindDashboardEvents() {
  document.querySelector("#refresh-dashboard")?.addEventListener("click", () => void loadDashboard("Dashboard refreshed."));
  document.querySelector("#generate-insight")?.addEventListener("click", generateInsight);
  document.querySelector("#line-form")?.addEventListener("submit", handleCreateLine);
  document.querySelector("#event-form")?.addEventListener("submit", handleCreateProductionEvent);
  document.querySelector("#quality-form")?.addEventListener("submit", handleCreateQualityInspection);
  document.querySelector("#ticket-form")?.addEventListener("submit", handleCreateTicket);

  document.querySelectorAll<HTMLSelectElement>("[data-line-status]").forEach((select) => {
    select.addEventListener("change", () => void changeLineStatus(select.dataset.lineStatus ?? "", select.value as ProductionLineStatus));
  });

  document.querySelectorAll<HTMLSelectElement>("[data-ticket-status]").forEach((select) => {
    select.addEventListener("change", () => void changeTicketStatus(select.dataset.ticketStatus ?? "", select.value as MaintenanceStatus));
  });
}

function metricCard(label: string, value: string) {
  return `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`;
}

function renderLine(line: ProductionLine) {
  return `
    <article class="item">
      <div><h3>${escapeHtml(line.code)} · ${escapeHtml(line.name)}</h3><p>${escapeHtml(line.area)}</p></div>
      <div class="item-actions">
        <span class="pill ${line.status}">${formatStatus(line.status)}</span>
        <label>Change status<select data-line-status="${line.id}">${statusOptions<ProductionLineStatus>(["running", "paused", "maintenance"], line.status)}</select></label>
      </div>
      <dl><div><dt>Target/hour</dt><dd>${line.targetPerHour}</dd></div></dl>
    </article>
  `;
}

function renderTicket(ticket: MaintenanceTicket) {
  return `
    <article class="item">
      <div><h3>${escapeHtml(ticket.lineCode)} · ${escapeHtml(ticket.title)}</h3><p>${escapeHtml(ticket.description)}</p></div>
      <div class="item-actions">
        <span class="pill ${ticket.priority}">${formatStatus(ticket.priority)}</span>
        <label>Change status<select data-ticket-status="${ticket.id}">${statusOptions<MaintenanceStatus>(["open", "in_progress", "resolved"], ticket.status)}</select></label>
      </div>
      <dl><div><dt>Status</dt><dd>${formatStatus(ticket.status)}</dd></div></dl>
    </article>
  `;
}

function renderProductionEvent(event: ProductionEvent) {
  return `
    <article class="event-row">
      <div><strong>${escapeHtml(event.lineCode)}</strong><span>${escapeHtml(event.lineName)}</span></div>
      <div><strong>${formatNumber(event.goodUnits)}</strong><span>good units</span></div>
      <div><strong>${formatNumber(event.scrapUnits)}</strong><span>scrap</span></div>
      <div><strong>${event.downtimeMinutes} min</strong><span>${escapeHtml(event.downtimeReason ?? "no downtime reason")}</span></div>
      <div><strong>${formatStatus(event.shift)}</strong><span>${new Date(event.recordedAt).toLocaleString()} · ${escapeHtml(event.operatorName)}</span></div>
    </article>
  `;
}

function renderQualityInspection(inspection: QualityInspection) {
  return `
    <article class="event-row">
      <div><strong>${escapeHtml(inspection.lineCode)}</strong><span>${escapeHtml(inspection.lineName)}</span></div>
      <div><strong>${inspection.defectCount}/${inspection.sampleSize}</strong><span>defects/sample</span></div>
      <div><strong>${formatStatus(inspection.status)}</strong><span>${formatStatus(inspection.severity)} severity</span></div>
      <div><strong>${escapeHtml(inspection.inspectorName)}</strong><span>${escapeHtml(inspection.notes ?? "no notes")}</span></div>
      <div><strong>Inspection</strong><span>${new Date(inspection.createdAt).toLocaleString()}</span></div>
    </article>
  `;
}

function renderAuditEvent(event: AuditEvent) {
  return `
    <article class="event-row compact-row">
      <div><strong>${escapeHtml(event.action)}</strong><span>${escapeHtml(event.entityType)}</span></div>
      <div><strong>${escapeHtml(event.actor)}</strong><span>actor</span></div>
      <div class="wide-cell"><strong>${escapeHtml(event.summary)}</strong><span>${new Date(event.createdAt).toLocaleString()}</span></div>
    </article>
  `;
}

function renderInsight() {
  if (!state.insight) {
    return `
      <h2>Shift insight</h2>
      <p>Click the AI button to summarize line status, output, scrap, downtime, quality, alerts, and maintenance risk.</p>
    `;
  }

  return `
    <h2>Shift insight</h2>
    <p>${escapeHtml(state.insight.summary)}</p>
    <small>Provider: ${escapeHtml(state.insight.provider)} · Model: ${escapeHtml(state.insight.model)} · ${new Date(state.insight.generatedAt).toLocaleString()}</small>
  `;
}

async function handleCreateLine(event: Event) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);

  try {
    await api<ApiResponse<ProductionLine>>("/api/production-lines", {
      method: "POST",
      body: JSON.stringify({
        code: getFormString(formData, "code"),
        name: getFormString(formData, "name"),
        area: getFormString(formData, "area"),
        targetPerHour: getFormNumber(formData, "targetPerHour"),
        status: getFormString(formData, "status"),
      }),
    });
    await loadDashboard("Production line created.");
  } catch (error) {
    showNotice(errorMessage(error), true);
  }
}

async function handleCreateProductionEvent(event: Event) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);

  try {
    await api<ApiResponse<ProductionEvent>>("/api/production-events", {
      method: "POST",
      body: JSON.stringify({
        lineId: getFormString(formData, "lineId"),
        shift: getFormString(formData, "shift"),
        operatorName: getFormString(formData, "operatorName"),
        plannedMinutes: getFormNumber(formData, "plannedMinutes"),
        goodUnits: getFormNumber(formData, "goodUnits"),
        scrapUnits: getFormNumber(formData, "scrapUnits"),
        downtimeMinutes: getFormNumber(formData, "downtimeMinutes"),
        downtimeReason: getFormString(formData, "downtimeReason"),
      }),
    });
    await loadDashboard("Shift production event logged.");
  } catch (error) {
    showNotice(errorMessage(error), true);
  }
}

async function handleCreateQualityInspection(event: Event) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);

  try {
    await api<ApiResponse<QualityInspection>>("/api/quality-inspections", {
      method: "POST",
      body: JSON.stringify({
        lineId: getFormString(formData, "lineId"),
        inspectorName: getFormString(formData, "inspectorName"),
        sampleSize: getFormNumber(formData, "sampleSize"),
        defectCount: getFormNumber(formData, "defectCount"),
        severity: getFormString(formData, "severity"),
        status: getFormString(formData, "status"),
        notes: getFormString(formData, "notes"),
      }),
    });
    await loadDashboard("Quality inspection recorded.");
  } catch (error) {
    showNotice(errorMessage(error), true);
  }
}

async function handleCreateTicket(event: Event) {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const formData = new FormData(form);

  try {
    await api<ApiResponse<MaintenanceTicket>>("/api/maintenance-tickets", {
      method: "POST",
      body: JSON.stringify({
        lineId: getFormString(formData, "lineId"),
        title: getFormString(formData, "title"),
        description: getFormString(formData, "description"),
        priority: getFormString(formData, "priority"),
      }),
    });
    await loadDashboard("Maintenance ticket created.");
  } catch (error) {
    showNotice(errorMessage(error), true);
  }
}

async function changeLineStatus(id: string, status: ProductionLineStatus) {
  if (!id) return;

  try {
    await api<ApiResponse<ProductionLine>>(`/api/production-lines/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await loadDashboard("Production line status updated.");
  } catch (error) {
    showNotice(errorMessage(error), true);
  }
}

async function changeTicketStatus(id: string, status: MaintenanceStatus) {
  if (!id) return;

  try {
    await api<ApiResponse<MaintenanceTicket>>(`/api/maintenance-tickets/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await loadDashboard("Maintenance ticket status updated.");
  } catch (error) {
    showNotice(errorMessage(error), true);
  }
}

async function generateInsight() {
  const button = document.querySelector<HTMLButtonElement>("#generate-insight");
  const panel = document.querySelector<HTMLElement>("#insight-panel");
  if (!panel) return;

  button?.setAttribute("disabled", "true");
  panel.innerHTML = `<h2>Shift insight</h2><p>Generating insight from current factory data...</p>`;

  try {
    const response = await api<ApiResponse<AiInsight>>("/api/ai/factory-insight", { method: "POST" });
    state.insight = response.data;
    panel.innerHTML = renderInsight();
    await loadDashboard("AI insight generated.");
  } catch (error) {
    panel.innerHTML = `<h2>Shift insight</h2><p class="error-text">${escapeHtml(errorMessage(error))}</p>`;
  } finally {
    button?.removeAttribute("disabled");
  }
}

function lineOptions() {
  return state.lines
    .map((line) => `<option value="${line.id}">${escapeHtml(line.code)} · ${escapeHtml(line.name)}</option>`)
    .join("");
}

function statusOptions<T extends string>(options: T[], selected: T) {
  return options
    .map((option) => `<option value="${option}" ${option === selected ? "selected" : ""}>${formatStatus(option)}</option>`)
    .join("");
}

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function getFormNumber(formData: FormData, name: string) {
  return Number(getFormString(formData, name));
}

function showNotice(message: string, isError = false) {
  const existing = document.querySelector(".notice");

  if (existing) {
    existing.className = isError ? "notice notice-error" : "notice";
    existing.textContent = message;
    return;
  }

  document.querySelector(".shell")?.insertAdjacentHTML(
    "afterbegin",
    `<p class="${isError ? "notice notice-error" : "notice"}">${escapeHtml(message)}</p>`,
  );
}

function formatStatus(value: string) {
  return value.replaceAll("_", " ");
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadDashboard();
