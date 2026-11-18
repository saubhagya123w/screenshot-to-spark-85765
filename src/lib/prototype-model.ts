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
  "Data Quality, Structuring & Relationships",
  "Formula Verification & KPI Calculation",
  "Analytics & Visualisation",
  "Final Report, Export & Session Closure",
];
export const SLEEP_MS = 120_000;
export type SessionStatus = "Active" | "Pending Approval" | "Paused" | "Sleeping" | "Completed";
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
  sample: boolean;
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
export const INITIAL_PROMPT =
  "Analyse monthly revenue and profitability for Nordic Business Solutions GmbH. Compare sales across regions, identify the most profitable product categories and highlight changes in operational expenses. Include revenue growth, profit margin and outstanding invoices.";
export const INITIAL_FORMULAS: Formula[] = [
  {
    name: "Total Revenue",
    formula: "SUM(Sales Amount)",
    result: "€284,500",
    fields: "Sales.amount",
    verified: false,
  },
  {
    name: "Total Expenses",
    formula: "SUM(Expense Amount)",
    result: "€196,200",
    fields: "Expenses.amount",
    verified: false,
  },
  {
    name: "Net Profit",
    formula: "Total Revenue - Total Expenses",
    result: "€88,300",
    fields: "Revenue, Expenses",
    verified: false,
  },
  {
    name: "Profit Margin",
    formula: "Net Profit / Total Revenue * 100",
    result: "31.04%",
    fields: "Net Profit, Revenue",
    verified: false,
  },
  {
    name: "Revenue Growth",
    formula: "(Current Revenue - Previous Revenue) / Previous Revenue * 100",
    result: "12.8%",
    fields: "Sales.month, Sales.amount",
    verified: false,
  },
  {
    name: "Average Transaction Value",
    formula: "Total Revenue / Number of Transactions",
    result: "€227.60",
    fields: "Sales.amount, Transactions.id",
    verified: false,
  },
];
export const INITIAL_CHARTS: ChartSpec[] = [
  {
    id: "revenue",
    title: "Revenue & profitability",
    type: "Area",
    x: "Month",
    y: "Revenue",
    aggregation: "Sum",
    group: "Month",
    filters: "",
    range: "Last 6 months",
    table: "Sales",
  },
  {
    id: "regions",
    title: "Sales by region",
    type: "Bar",
    x: "Region",
    y: "Revenue",
    aggregation: "Sum",
    group: "Region",
    filters: "",
    range: "Last 6 months",
    table: "Sales",
  },
];
export const MONTHLY_DATA = [
  { Month: "Jun", Revenue: 205000, Expenses: 156000, Profit: 49000 },
  { Month: "Jul", Revenue: 224000, Expenses: 169000, Profit: 55000 },
  { Month: "Aug", Revenue: 216000, Expenses: 157000, Profit: 59000 },
  { Month: "Sep", Revenue: 252200, Expenses: 179000, Profit: 73200 },
  { Month: "Oct", Revenue: 268000, Expenses: 188500, Profit: 79500 },
  { Month: "Nov", Revenue: 284500, Expenses: 196200, Profit: 88300 },
];
export const REGION_DATA = [
  { Region: "Germany", Revenue: 114500, Expenses: 80000, Profit: 34500 },
  { Region: "Sweden", Revenue: 76000, Expenses: 50000, Profit: 26000 },
  { Region: "Denmark", Revenue: 54000, Expenses: 38000, Profit: 16000 },
  { Region: "Finland", Revenue: 40000, Expenses: 28200, Profit: 11800 },
];
export function makeSession(input: Partial<Session>, ids: string[] = []): Session {
  let id = `SAP-${Math.floor(100000 + Math.random() * 900000)}`;
  while (ids.includes(id)) id = `SAP-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toISOString();
  return {
    id,
    name: "New Secure Session",
    company: "Nordic Business Solutions GmbH",
    owner: "alex",
    consultant: "Alex Morgan",
    description: "",
    objective: "",
    created: now,
    phase: 0,
    status: "Active",
    prompt: "",
    sources: [],
    files: [],
    sample: false,
    approved: [],
    decisions: [],
    activity: [{ text: "Session created", time: now, phase: 0 }],
    collaborators: [],
    formulas: structuredClone(INITIAL_FORMULAS),
    charts: structuredClone(INITIAL_CHARTS),
    quality: 92,
    fitness: 88,
    relationships: ["Sales.customer_id → Customers.id", "Sales.product_id → Products.id"],
    lastActivity: Date.now(),
    ...input,
  };
}
export function hasAccess(s: Session, email: string, ownerId = "alex") {
  return s.owner === ownerId || s.collaborators.some((c) => c.email === email);
}
export function canEdit(s: Session) {
  return !["Completed", "Paused", "Sleeping"].includes(s.status);
}
export function isInactive(last: number, now: number) {
  return now - last >= SLEEP_MS;
}
export function approvePhase(s: Session): Session {
  if (!canEdit(s)) return s;
  if (s.phase > 0 && !s.approved.includes(s.phase - 1)) return s;
  if (s.phase === 0 && (!s.prompt.trim() || (!s.sample && !s.sources.length && !s.files.length)))
    return s;
  if (s.phase === 4 && s.formulas.some((f) => !f.verified)) return s;
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
    quality: s.phase === 2 ? Math.min(98, s.quality + 2) : s.quality,
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
  const base = {
    sample: true,
    prompt: INITIAL_PROMPT,
    sources: ["Accounting system", "Sales system"],
  };
  const sessions = [
    makeSession({
      ...base,
      id: "SAP-847291",
      name: "Sales Performance Analysis",
      phase: 5,
      approved: [0, 1, 2, 3, 4],
      status: "Active",
      formulas: INITIAL_FORMULAS.map((f) => ({ ...f, verified: true })),
    }),
    makeSession({
      ...base,
      id: "SAP-847315",
      name: "Financial Analytics",
      phase: 2,
      approved: [0, 1],
      status: "Pending Approval",
    }),
    makeSession({
      ...base,
      id: "SAP-847328",
      name: "Operational Cost Review",
      phase: 1,
      approved: [0],
      status: "Pending Approval",
    }),
    makeSession({
      ...base,
      id: "SAP-847322",
      name: "Customer Analytics",
      phase: 6,
      status: "Completed",
      approved: [0, 1, 2, 3, 4, 5, 6],
      completed: "2026-11-17T14:30:00Z",
    }),
    makeSession({
      ...base,
      id: "SAP-847309",
      name: "Q3 Revenue & Profitability",
      phase: 6,
      status: "Completed",
      approved: [0, 1, 2, 3, 4, 5, 6],
      completed: "2026-11-16T11:45:00Z",
    }),
    makeSession({
      ...base,
      id: "SAP-847301",
      name: "Inventory & Demand Analysis",
      phase: 3,
      approved: [0, 1, 2],
      status: "Sleeping",
    }),
  ].map((s) => ({
    ...s,
    created: "2026-11-18T08:30:00Z",
    activity: [
      { text: "Session created", time: "2026-11-18T08:30:00Z", phase: 0 },
      ...s.approved.map((p) => ({
        text: `${PHASES[p]} approved`,
        time: "2026-11-18T09:00:00Z",
        phase: p,
      })),
    ],
    decisions: s.approved.map((p) => ({
      phase: p,
      action: "Approved" as const,
      feedback: "",
      time: "2026-11-18T09:00:00Z",
      consultant: s.consultant,
    })),
  }));
  return {
    sessions,
    automations: [
      {
        id: "AUTO-1001",
        name: "Monthly Financial Performance",
        company: "Nordic Business Solutions GmbH",
        owner: "Alex Morgan",
        sources: ["Accounting system", "Sales system"],
        rules:
          "Mask personal identifiers, remove bank details, standardise EUR values, remove duplicate invoices.",
        questions:
          "What was monthly revenue? How did expenses change? What are the main profitability risks?",
        kpis: "Revenue, Expenses, Net Profit, Profit Margin",
        threshold: 85,
        day: 1,
        time: "09:00",
        timezone: "Europe/Berlin",
        recipient: "Emma Wilson",
        email: "emma@example.com",
        extra: "",
        active: true,
        changes: [],
        history: [
          {
            id: "RUN-1001",
            date: "2026-11-01T08:00:00Z",
            status: "Completed",
            quality: 94,
            fitness: 91,
            email: "Delivered (simulated)",
            questions: "Compare revenue and expenses for October.",
          },
        ],
      },
    ],
    profile: {
      name: "Alex Morgan",
      email: "alex@example.com",
      organisation: "Nordic Advisory Group",
      role: "Senior Consultant",
    },
    preferences: {
      "Confidential data identification": true,
      "Sensitive-data filtering": true,
      Masking: true,
      Anonymisation: true,
      Pseudonymisation: false,
      "Session invitations": true,
      "Session approvals": true,
      "Session completion": true,
      "Automated analytics completion": true,
      "Report delivery": true,
    },
  };
}
