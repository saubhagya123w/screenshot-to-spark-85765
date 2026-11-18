import { type Dataset, type ProtectionRule, type QualityIssue, calculateFormula, numericColumns } from "./data-processing";
export const PHASES = [
  "Prompt & integration",
  "Data protection",
  "Data cleaning",
  "Data structure",
  "Formulas & KPIs",
  "Visualisation",
  "Report & closure",
];
export const PHASE_TITLES = [
  "Analytics Prompt & Data Integration",
  "Policies & Confidential Data Protection",
  "Data Cleaning & Data Quality Management",
  "Data Structuring & Relationships",
  "Formula Verification & KPI Calculation",
  "Analytics & Visualisation",
  "Final Report, Export & Session Closure",
];
export const SLEEP_MS = 120_000;
export type SessionStatus = "Active" | "Pending Approval" | "Paused" | "Sleeping" | "Locked" | "Invited" | "Closed" | "Completed";
export type Decision = {
  phase: number;
  action: "Approved" | "Rejected";
  feedback: string;
  time: string;
  consultant: string;
};
export type Formula = {
  name: string;
  formula: string;
  result: string;
  fields: string;
  verified: boolean;
};
export type ChartSpec = {
  id: string;
  title: string;
  type: string;
  x: string;
  y: string;
  aggregation: string;
  group: string;
  filters: string;
  range: string;
  table: string;
};
export type Session = {
  id: string;
  name: string;
  company: string;
  owner: string;
  consultant: string;
  description: string;
  objective: string;
  created: string;
  completed?: string;
  phase: number;
  status: SessionStatus;
  prompt: string;
  sources: string[];
  files: { name: string; size: number; time: string }[];
  datasets: Dataset[];
  processed: Dataset[];
  protection: ProtectionRule[];
  issues: QualityIssue[];
  dimensions: { name: string; score: number; detail: string }[];
  limitations: string[];
  processedPhase: number;
  approved: number[];
  decisions: Decision[];
  activity: { text: string; time: string; phase: number }[];
  collaborators: { name: string; email: string; role: string; permission: string }[];
  formulas: Formula[];
  charts: ChartSpec[];
  quality: number;
  fitness: number;
  relationships: string[];
  lastActivity: number;
};
export type Run = {
  id: string;
  date: string;
  status: "Completed" | "Requires Attention";
  quality: number;
  fitness: number;
  email: string;
  questions: string;
};
export type Automation = {
  id: string;
  name: string;
  company: string;
  owner: string;
  sources: string[];
  rules: string;
  questions: string;
  kpis: string;
  threshold: number;
  day: number;
  time: string;
  timezone: string;
  recipient: string;
  email: string;
  extra: string;
  active: boolean;
  history: Run[];
  changes: { date: string; questions: string }[];
};
export type Profile = { name: string; email: string; organisation: string; role: string };
export type AppData = {
  sessions: Session[];
  automations: Automation[];
  profile: Profile;
  preferences: Record<string, boolean>;
};
export function makeSession(input: Partial<Session>, ids: string[] = []): Session {
  let id = `SAP-${Math.floor(100000 + Math.random() * 900000)}`;
  while (ids.includes(id)) id = `SAP-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();
  return {
    id,
    name: "New Secure Session",
    company: "",
    owner: "",
    consultant: "",
    description: "",
    objective: "",
    created: now,
    phase: 0,
    status: "Active",
    prompt: "",
    sources: [],
    files: [],
    datasets: [],
    processed: [],
    protection: [],
    issues: [],
    dimensions: [],
    limitations: [],
    processedPhase: -1,
    approved: [],
    decisions: [],
    activity: [{ text: "Session created", time: now, phase: 0 }],
    collaborators: [],
    formulas: [],
    charts: [],
    quality: 0,
    fitness: 0,
    relationships: [],
    lastActivity: Date.now(),
    ...input,
  };
}
export function hasAccess(s: Session, email: string, ownerId = "") {
  return Boolean(ownerId && s.owner === ownerId) || Boolean(email && s.collaborators.some((c) => c.email.toLowerCase() === email.toLowerCase()));
}
export function canEdit(s: Session) {
  return !["Completed", "Closed", "Paused", "Sleeping", "Locked", "Invited"].includes(s.status);
}
export function isInactive(last: number, now: number) {
  return now - last >= SLEEP_MS;
}
export function approvePhase(s: Session): Session {
  if (!canEdit(s)) return s;
  if (s.phase > 0 && !s.approved.includes(s.phase - 1)) return s;
  if (s.phase === 0 && (!s.prompt.trim() || !s.datasets.some(d => d.rows.length)))
    return s;
  if (s.phase > 0 && s.processedPhase !== s.phase) return s;
  if (s.phase === 4 && (!s.formulas.length || s.formulas.some((f) => !f.verified))) return s;
  if (s.phase === 6) return s;
  const time = new Date().toISOString();
  return {
    ...s,
    approved: [...new Set([...s.approved, s.phase])],
    decisions: [
      ...s.decisions,
      { phase: s.phase, action: "Approved", feedback: "", time, consultant: s.consultant },
    ],
    activity: [...s.activity, { text: `${PHASES[s.phase]} approved`, time, phase: s.phase }],
    phase: s.phase + 1,
    status: "Pending Approval",
    lastActivity: Date.now(),
  };
}
export function rejectPhase(s: Session, feedback: string): Session {
  if (!canEdit(s) || !feedback.trim()) return s;
  const time = new Date().toISOString();
  return {
    ...s,
    decisions: [
      ...s.decisions,
      { phase: s.phase, action: "Rejected", feedback, time, consultant: s.consultant },
    ],
    activity: [
      ...s.activity,
      { text: "Correction instructions submitted; processing repeated", time, phase: s.phase },
    ],
    processedPhase: -1,
    status: "Pending Approval",
  };
}
export function closeSession(s: Session): Session {
  if (!canEdit(s) || s.phase !== 6 || !s.approved.includes(5)) return s;
  const time = new Date().toISOString();
  return {
    ...s,
    status: "Completed",
    completed: time,
    approved: [...new Set([...s.approved, 6])],
    decisions: [
      ...s.decisions,
      {
        phase: 6,
        action: "Approved",
        feedback: "Report generated and session closed",
        time,
        consultant: s.consultant,
      },
    ],
    activity: [...s.activity, { text: "Final report generated; session closed", time, phase: 6 }],
  };
}
export function learningSignal(d: Decision) {
  return {
    category: PHASES[d.phase],
    signal: "Consultant requested a processing adjustment",
    status: "Categorised · ready for review",
  };
}
export function nextMonthlyDate(
  a: Pick<Automation, "day" | "time" | "timezone">,
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: a.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const part = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  let year = part("year"),
    month = part("month");
  if (
    part("day") > a.day ||
    (part("day") === a.day &&
      `${String(part("hour")).padStart(2, "0")}:${String(part("minute")).padStart(2, "0")}` >=
        a.time)
  ) {
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(a.day, 28)).padStart(2, "0")} ${a.time} (${a.timezone})`;
}
export function initialData(): AppData {
  return {
    sessions: [], automations: [],
    profile: { name: "", email: "", organisation: "", role: "" },
    preferences: { "Confidential data identification": true, "Sensitive-data filtering": true, Masking: true, Anonymisation: false, Pseudonymisation: false, "Session invitations": true, "Session approvals": true, "Session completion": true, "Automated analytics completion": true, "Report delivery": true },
  };
}
export function proposedFormulas(datasets: Dataset[]): Formula[] {
  return [...new Set(datasets.flatMap(numericColumns))].map(field => ({ name: `Total ${field}`, formula: `SUM(${field})`, fields: field, result: calculateFormula(`SUM(${field})`, datasets), verified: false }));
}
export function proposedCharts(datasets: Dataset[]): ChartSpec[] {
  return datasets.flatMap(d => numericColumns(d).slice(0, 4).map(field => ({ id: crypto.randomUUID(), title: `${field} by ${d.columns.find(c => !numericColumns(d).includes(c)) ?? d.columns[0]}`, type: "Bar", x: d.columns.find(c => !numericColumns(d).includes(c)) ?? d.columns[0] ?? field, y: field, aggregation: "Sum", group: "", filters: "", range: "All data", table: d.name })));
}
