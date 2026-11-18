import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ShieldCheck,
  Check,
  ArrowRight,
  Pause,
  Play,
  LockKeyhole,
  UserPlus,
  Download,
  Upload,
  Database,
  FileText,
  Trash2,
  Info,
  Pencil,
  Plus,
  Clock3,
  RefreshCw,
  Printer,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePrototype } from "./prototype-store";
import { Meta, PageHeading, Panel, Progress, Status } from "./shared";
import { AnalyticsDashboard } from "./analytics-dashboard";
import {
  PHASES,
  PHASE_TITLES,
  INITIAL_PROMPT,
  approvePhase,
  rejectPhase,
  closeSession,
  canEdit,
  hasAccess,
  isInactive,
  type Session,
  type Formula,
} from "@/lib/prototype-model";
import {
  downloadReport,
  downloadHistory,
  downloadCSV,
  REPORT_SECTIONS,
} from "@/lib/prototype-export";
export const SOURCE_NAMES = [
  "Accounting system",
  "CRM",
  "ERP",
  "Spreadsheets",
  "Database",
  "Invoices",
  "Financial system",
  "Sales system",
  "Inventory system",
];
const PROTECTION: [string, string, string, string, string, string][] = [
  [
    "Personal information",
    "customer_name",
    "John Example",
    "Medium",
    "Masked",
    "Personal identifier; pseudonymised for aggregation",
  ],
  [
    "Bank details",
    "iban",
    "DE89370400440532013000",
    "High",
    "Removed",
    "Bank details are not needed for revenue analysis",
  ],
  [
    "Employee information",
    "employee_name",
    "Anna Example",
    "Medium",
    "Masked",
    "Employee identifiers replaced with stable aliases",
  ],
  [
    "Contact information",
    "email",
    "customer@example.com",
    "High",
    "Removed",
    "Direct identifiers excluded from analytics",
  ],
  [
    "Business metrics",
    "revenue",
    "EUR 12,400",
    "Low",
    "Retained",
    "Necessary for the approved profitability objective",
  ],
];
const CLEANING: [string, string, string, string, string][] = [
  ["Missing values", "Revenue", "18", "Flagged for review", "Resolved"],
  ["Duplicate records", "Invoice ID", "12", "Duplicate removed", "Resolved"],
  ["Invalid date", "Date", "4", "Converted to ISO date", "Resolved"],
  ["Inconsistent format", "Country", "23", "Standardised country names", "Resolved"],
  ["Currency inconsistency", "Sales amount", "7", "Normalised to EUR", "Resolved"],
  [
    "Missing customer attributes",
    "Customer region",
    "8",
    "Excluded from retention analysis",
    "Limitation",
  ],
];
const DATA_ROWS = [
  ["TX-1001", "Customer_001", "Consulting", "Germany", "12400", "8600", "2026-11-02"],
  ["TX-1002", "Customer_002", "Software", "Sweden", "18600", "11900", "2026-11-03"],
  ["TX-1003", "Customer_003", "Support", "Denmark", "9400", "6100", "2026-11-04"],
  ["TX-1004", "Customer_004", "Consulting", "Finland", "15800", "10300", "2026-11-05"],
];
export function SessionWorkspace({ id }: { id: string }) {
  const { data, updateSession, ready } = usePrototype();
  const s = data.sessions.find((s) => s.id === id);
  const [busy, setBusy] = useState("");
  const [modal, setModal] = useState("");
  const [detail, setDetail] = useState("");
  const [feedback, setFeedback] = useState("");
  const [tab, setTab] = useState("Overview");
  const [formula, setFormula] = useState<Formula | null>(null);
  const last = useRef(Date.now());
  useEffect(() => {
    if (!s || s.status === "Completed" || s.status === "Sleeping" || s.status === "Paused") return;
    last.current = Date.now();
    const activity = () => {
      last.current = Date.now();
    };
    window.addEventListener("pointerdown", activity);
    window.addEventListener("keydown", activity);
    window.addEventListener("pointermove", activity);
    const timer = setInterval(() => {
      if (isInactive(last.current, Date.now()))
        updateSession(id, (x) => ({ ...x, status: "Sleeping", lastActivity: last.current }));
    }, 1000);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("pointermove", activity);
    };
  }, [id, s?.status]);
  if (!ready) return <p className="p-10 text-muted-foreground">Opening secure session…</p>;
  if (!s)
    return (
      <>
        <PageHeading
          title="Session not found"
          subtitle="This session is unavailable in this demo workspace."
        />
        <Button asChild>
          <Link to="/sessions">Back to sessions</Link>
        </Button>
      </>
    );
  if (!hasAccess(s, data.profile.email))
    return (
      <div className="locked-workspace">
        <LockKeyhole className="mx-auto mb-4" />
        <h2 className="text-lg font-semibold">Invitation required</h2>
        <p className="text-sm text-muted-foreground mt-3">
          Only the owner and invited collaborators can open this session.
        </p>
      </div>
    );
  const readonly = s.status === "Completed";
  const editable = canEdit(s);
  const patch = (change: Partial<Session>) =>
    updateSession(id, (x) => (canEdit(x) ? { ...x, ...change, lastActivity: Date.now() } : x));
  async function process(message: string, fn: () => void) {
    setBusy(message);
    await new Promise((r) => setTimeout(r, 1000));
    fn();
    setBusy("");
    toast.success("Processing complete. Results ready for review.");
  }
  function approve() {
    if (!s) return;
    if (
      s.phase === 0 &&
      (!s.prompt.trim() || (!s.sample && !s.files.length && !s.sources.length))
    ) {
      toast.error("Add analytics requirements and a data source or sample dataset first.");
      return;
    }
    if (s.phase === 4 && s.formulas.some((f) => !f.verified)) {
      toast.error("Verify every formula before approving this phase.");
      return;
    }
    process(`Preparing ${PHASES[s.phase + 1]}…`, () => updateSession(id, approvePhase));
  }
  const exportData = () =>
    downloadCSV(`${id}-ai-ready-data.csv`, [
      [
        "Transaction ID",
        "Customer alias",
        "Category",
        "Region",
        "Revenue EUR",
        "Expenses EUR",
        "Date",
      ],
      ...DATA_ROWS,
    ]);
  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const allowed = ["csv", "xlsx", "xls", "pdf", "json"];
    const valid = Array.from(files).filter((f) =>
      allowed.includes(f.name.split(".").pop()?.toLowerCase() ?? ""),
    );
    if (valid.length !== files.length)
      toast.error("Supported files: CSV, XLSX, XLS, PDF and JSON.");
    patch({
      files: [
        ...s.files,
        ...valid.map((f) => ({ name: f.name, size: f.size, time: new Date().toISOString() })),
      ],
    });
    if (valid.length)
      toast.info(
        "File metadata saved. Analytics use fictional sample results; uploaded contents are not processed.",
      );
  };
  return (
    <>
      <PageHeading title={s.name} subtitle={`${s.company} · ${s.consultant}`}>
        <Status status={s.status} />
        {!readonly && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModal("invite")}
              disabled={!editable}
            >
              <UserPlus />
              Invite
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                updateSession(id, (x) => ({
                  ...x,
                  status: x.status === "Paused" ? "Active" : "Paused",
                }))
              }
              disabled={s.status === "Sleeping"}
            >
              {s.status === "Paused" ? <Play /> : <Pause />}
              {s.status === "Paused" ? "Resume" : "Pause"}
            </Button>
            <Button
              variant="outline"
              size="icon"
              title="Simulate 2-minute inactivity"
              aria-label="Simulate 2-minute inactivity"
              disabled={!editable}
              onClick={() => updateSession(id, (x) => ({ ...x, status: "Sleeping" }))}
            >
              <LockKeyhole />
            </Button>
          </>
        )}
      </PageHeading>
      <div className="flex flex-wrap gap-5 mb-5 text-[11px] text-muted-foreground">
        <span className="font-mono text-primary">{s.id}</span>
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} />
          Private consultant session
        </span>
        <span>Created {new Date(s.created).toLocaleDateString("en-GB")}</span>
        <span>
          {s.collaborators.length} invited collaborator{s.collaborators.length !== 1 ? "s" : ""}
        </span>
        <span className="ml-auto">
          {readonly ? "7 of 7 phases complete" : `Phase ${s.phase + 1} of 7`}
        </span>
      </div>
      <div className="phase-tracker">
        {PHASES.map((p, i) => (
          <div
            key={p}
            className={`phase-step ${s.approved.includes(i) ? "done" : s.phase === i ? "current" : ""}`}
          >
            <span className="step-circle">
              {s.approved.includes(i) ? <Check size={12} /> : i + 1}
            </span>
            {p}
          </div>
        ))}
      </div>
      {s.status === "Paused" || s.status === "Sleeping" ? (
        <div className="locked-workspace">
          <LockKeyhole className="mx-auto text-primary" size={35} />
          <h2 className="text-xl font-semibold mt-5">
            {s.status === "Sleeping" ? "Session sleeping" : "Session paused"}
          </h2>
          <p className="text-sm text-muted-foreground mt-3">
            Your progress in phase {s.phase + 1} has been preserved.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {s.status === "Sleeping"
              ? "Re-authentication is required after 2 minutes of inactivity."
              : "Resume whenever you are ready to continue."}
          </p>
          <Button
            className="mt-6"
            onClick={() =>
              s.status === "Sleeping"
                ? setModal("auth")
                : updateSession(id, (x) => ({ ...x, status: "Active", lastActivity: Date.now() }))
            }
          >
            <Play />
            {s.status === "Sleeping" ? "Re-authenticate & Resume" : "Resume Session"}
          </Button>
          <p className="text-[10px] text-muted-foreground mt-4">
            Simulated session protection · Not production authentication
          </p>
        </div>
      ) : (
        <>
          {busy && (
            <div className="mb-5 panel p-5 flex items-center gap-3 text-primary">
              <RefreshCw className="animate-spin" size={17} />
              <span className="text-sm">{busy}</span>
            </div>
          )}
          {readonly ? (
            <div className="space-y-6">
              <div className="panel p-5 bg-success-soft">
                <div className="flex items-center gap-2 font-medium text-success">
                  <Check />
                  Session completed and closed
                </div>
                <p className="text-xs text-success mt-2">
                  All approvals retained. The dashboard and report are view-only.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => downloadReport(s)}>
                  <Download />
                  Download Final Report PDF
                </Button>
                <Button variant="outline" onClick={() => downloadHistory(s)}>
                  <Download />
                  Download Phase Feedback & Approval History PDF
                </Button>
                <Button variant="outline" onClick={() => setModal("report")}>
                  <FileText />
                  View Report
                </Button>
              </div>
              <AnalyticsDashboard session={s} readonly />
              <Panel title="Approval & feedback history">
                {s.decisions.map((d, i) => (
                  <div className="timeline-item" key={i}>
                    <div className="flex gap-2 items-center">
                      <strong>{PHASES[d.phase]}</strong>
                      <Status status={d.action} />
                    </div>
                    <p className="text-muted-foreground mt-2">
                      {d.consultant} · {new Date(d.time).toLocaleString("en-GB")}
                    </p>
                    {d.feedback && <p className="mt-2">{d.feedback}</p>}
                  </div>
                ))}
              </Panel>
              <Panel title="Session activity">
                {s.activity.map((a, i) => (
                  <div key={i} className="timeline-item">
                    <strong>{a.text}</strong>
                    <p className="text-muted-foreground mt-1">
                      {PHASES[a.phase]} · {new Date(a.time).toLocaleString("en-GB")}
                    </p>
                  </div>
                ))}
              </Panel>
            </div>
          ) : (
            <>
              <div className="flex justify-between gap-3 items-start mb-5">
                <div>
                  <h2 className="text-lg font-semibold">{PHASE_TITLES[s.phase]}</h2>
                  <p className="text-xs text-muted-foreground mt-2">
                    {
                      [
                        "Define your business questions and choose the data for this analysis.",
                        "Review confidential fields and the protection rules applied before analytics.",
                        "Review cleaning changes, data quality and task-specific analytics fitness.",
                        "Inspect and approve the proposed business data model.",
                        "Verify every formula and calculation before dashboard generation.",
                        "Review the generated dashboard and customise your visualisations.",
                        "Review your business report, then generate and close the session.",
                      ][s.phase]
                    }
                  </p>
                </div>
                <Status status={busy ? "Processing" : "Awaiting Review"} />
              </div>
              {s.phase === 0 && (
                <div className="space-y-5">
                  <Panel title="Define your analytics requirements">
                    <label className="field">
                      Analytics prompt
                      <textarea
                        className="text-editor min-h-44"
                        aria-label="Analytics prompt"
                        value={s.prompt}
                        onChange={(e) => patch({ prompt: e.target.value })}
                        placeholder="Describe the business questions, metrics, visualisations and insights you need…"
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {[
                        "Analyse monthly revenue and profitability.",
                        "Compare sales across regions.",
                        "Identify customer retention trends.",
                      ].map((p) => (
                        <Button
                          key={p}
                          size="sm"
                          variant="outline"
                          onClick={() => patch({ prompt: s.prompt ? `${s.prompt}\n${p}` : p })}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => toast.success("Analytics prompt saved in this session.")}
                    >
                      <Check />
                      Save Prompt
                    </Button>
                  </Panel>
                  <Panel
                    title="Data integration"
                    action={
                      <Button
                        size="sm"
                        onClick={() => patch({ sample: true, prompt: s.prompt || INITIAL_PROMPT })}
                      >
                        <Database />
                        Use Sample Business Data
                      </Button>
                    }
                  >
                    <p className="text-xs text-muted-foreground mb-4">
                      Files and connections are simulated. Results always use fictional business
                      data.
                    </p>
                    <div
                      className="upload-zone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        addFiles(e.dataTransfer.files);
                      }}
                    >
                      <Upload size={25} className="mx-auto text-primary mb-3" />
                      <p className="text-xs font-medium mb-2">Drop your files here, or browse</p>
                      <p className="text-[10px] text-muted-foreground mb-4">
                        CSV, XLSX, XLS, PDF or JSON · File metadata only
                      </p>
                      <Input
                        aria-label="Upload data files"
                        type="file"
                        accept=".csv,.xlsx,.xls,.pdf,.json"
                        multiple
                        onChange={(e) => addFiles(e.target.files)}
                        className="max-w-xs mx-auto"
                      />
                    </div>
                    {s.files.length > 0 && (
                      <div className="table-scroll mt-4">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>File</th>
                              <th>Size</th>
                              <th>Uploaded</th>
                              <th>Status</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {s.files.map((f, i) => (
                              <tr key={`${f.name}-${i}`}>
                                <td>{f.name}</td>
                                <td>{(f.size / 1024).toFixed(1)} KB</td>
                                <td>{new Date(f.time).toLocaleTimeString("en-GB")}</td>
                                <td>
                                  <Status status="Ready for simulation" />
                                </td>
                                <td>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    aria-label={`Remove ${f.name}`}
                                    onClick={() =>
                                      patch({ files: s.files.filter((_, j) => i !== j) })
                                    }
                                  >
                                    <Trash2 />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <h3 className="section-title mt-6 mb-4">Connect a data source</h3>
                    <div className="source-grid">
                      {SOURCE_NAMES.map((name) => (
                        <div className="source-card" key={name}>
                          <Database size={21} className="text-primary" />
                          <h3 className="text-xs font-medium">{name}</h3>
                          <p className="text-[10px] text-muted-foreground">
                            Business records & transactional data
                          </p>
                          <Button
                            variant={s.sources.includes(name) ? "outline" : "secondary"}
                            size="sm"
                            onClick={() =>
                              patch({
                                sources: s.sources.includes(name)
                                  ? s.sources.filter((x) => x !== name)
                                  : [...s.sources, name],
                              })
                            }
                          >
                            {s.sources.includes(name) ? "Disconnect" : "Connect"}
                          </Button>
                          {s.sources.includes(name) && (
                            <>
                              <Status status="Connected (simulated)" />
                              <p className="text-[10px] text-muted-foreground">
                                Synced now · Sales, expenses, invoices
                              </p>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    {(s.sample || s.sources.length > 0 || s.files.length > 0) && (
                      <div className="mt-5 p-4 bg-info-soft rounded text-xs flex flex-wrap gap-6">
                        <span>{s.files.length} uploaded files</span>
                        <span>{s.sources.length} connected sources</span>
                        <span>1,250 sample records</span>
                        <span>24 columns · 7 business categories</span>
                      </div>
                    )}
                  </Panel>
                </div>
              )}
              {s.phase === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      ["Records scanned", "1,250"],
                      ["Sensitive fields", "47"],
                      ["Masked / removed", "18 / 12"],
                      ["Retained fields", "17"],
                    ].map(([l, v]) => (
                      <div className="metric-card" key={l}>
                        <div className="text-xs text-muted-foreground">{l}</div>
                        <div className="text-2xl font-semibold mt-3">{v}</div>
                      </div>
                    ))}
                  </div>
                  <Panel
                    title="Confidential-data review"
                    body={false}
                    action={<Status status="Policies applied" />}
                  >
                    <div className="table-scroll">
                      <table className="data-table">
                        <thead>
                          <tr>
                            {[
                              "Category",
                              "Original field",
                              "Fictional example",
                              "Risk",
                              "Action",
                              "Explanation",
                            ].map((x) => (
                              <th key={x}>{x}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {PROTECTION.map((r) => (
                            <tr key={r[1]}>
                              {r.slice(0, 4).map((c, i) => (
                                <td key={i}>{c}</td>
                              ))}
                              <td>
                                <Status status={r[4]} />
                              </td>
                              <td>
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={() => {
                                    setDetail(
                                      `${r[0]}: ${r[1]} was ${r[4].toLowerCase()}. ${r[5]}. Policy: data minimisation and purpose-limited processing. Only non-identifying business metrics are used for this sample analysis.`,
                                    );
                                    setModal("detail");
                                  }}
                                >
                                  View Explanation
                                  <Info />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Panel>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={exportData}>
                      <Download />
                      Download AI-Ready Data
                    </Button>
                    <Button variant="outline" onClick={() => setModal("data")}>
                      <Database />
                      View Processed Data
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDetail(
                          "12 sensitive fields removed, including banking and contact details. 18 fields masked using stable fictional aliases. 17 necessary business fields retained under the analytics purpose rule.",
                        );
                        setModal("detail");
                      }}
                    >
                      View Removal Summary
                    </Button>
                  </div>
                </div>
              )}
              {s.phase === 2 && (
                <div className="space-y-5">
                  <div className="flex flex-wrap gap-1 border-b border-border pb-3">
                    {[
                      "Overview",
                      "Data Preview",
                      "Cleaning Results",
                      "Issues",
                      "Quality Assessment",
                    ].map((t) => (
                      <Button
                        key={t}
                        variant={tab === t ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => setTab(t)}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                  {tab === "Overview" || tab === "Quality Assessment" ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Panel title="Data quality score">
                          <div className="text-4xl font-semibold text-primary">{s.quality}%</div>
                          <p className="text-xs text-muted-foreground my-3">
                            Overall dataset completeness, consistency and validity.
                          </p>
                          <Progress value={s.quality} />
                          <div className="mt-5 space-y-3">
                            {[
                              ["Completeness", 95],
                              ["Consistency", 91],
                              ["Validity", 94],
                              ["Accuracy", 93],
                              ["Uniqueness", 96],
                              ["Structural quality", 90],
                            ].map(([name, score]) => (
                              <div key={name}>
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span>{name}</span>
                                  <span>{score}%</span>
                                </div>
                                <Progress value={Number(score)} />
                              </div>
                            ))}
                          </div>
                        </Panel>
                        <Panel title="Analytics fitness assessment">
                          <div className="text-4xl font-semibold text-success">{s.fitness}%</div>
                          <p className="text-xs text-muted-foreground my-3">
                            Suitability for your specific analytical requirements.
                          </p>
                          <Progress value={s.fitness} />
                          <div className="mt-5">
                            <Status status="Ready with Limitations" />
                            <p className="text-xs text-muted-foreground leading-relaxed mt-4">
                              Revenue and profitability analysis are supported. Customer retention
                              analysis may be affected by missing customer attributes. High data
                              quality does not imply fitness for every analytical task.
                            </p>
                            <div className="mt-4 p-3 bg-warning-soft rounded text-xs text-warning">
                              Recommendation: enrich customer attributes before retention analysis.
                            </div>
                          </div>
                        </Panel>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          ["Total records", "1,250"],
                          ["Missing values", "18"],
                          ["Duplicates removed", "12"],
                          ["Issues corrected", "64"],
                        ].map(([l, v]) => (
                          <div className="metric-card" key={l}>
                            <p className="text-xs text-muted-foreground">{l}</p>
                            <p className="text-xl mt-2 font-semibold">{v}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : tab === "Data Preview" ? (
                    <DataPreview />
                  ) : (
                    <Panel title={tab} body={false}>
                      <div className="table-scroll">
                        <table className="data-table">
                          <thead>
                            <tr>
                              {[
                                "Issue",
                                "Field",
                                "Affected records",
                                "Action",
                                "Status",
                                "Details",
                              ].map((x) => (
                                <th key={x}>{x}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {CLEANING.map((r) => (
                              <tr key={r[0]}>
                                {r.slice(0, 4).map((v, i) => (
                                  <td key={i}>{v}</td>
                                ))}
                                <td>
                                  <Status status={r[4]} />
                                </td>
                                <td>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={`Inspect ${r[0]}`}
                                    onClick={() => {
                                      setDetail(
                                        `${r[0]} in ${r[1]} affected ${r[2]} records. Action: ${r[3]}. ${r[4] === "Limitation" ? "Some customer analytics remain limited; no values have been invented." : "Corrections recorded in the sample cleaning history."}`,
                                      );
                                      setModal("detail");
                                    }}
                                  >
                                    <Info />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Panel>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportData}>
                      <Download />
                      Download Cleaned Data
                    </Button>
                    <Button variant="outline" onClick={() => setModal("data")}>
                      <Database />
                      View Detailed Data
                    </Button>
                  </div>
                </div>
              )}
              {s.phase === 3 && (
                <Panel
                  title="Business data model"
                  action={
                    <Button variant="outline" size="sm" onClick={() => setModal("structure")}>
                      <Pencil />
                      Edit Structure
                    </Button>
                  }
                >
                  <div className="model-grid">
                    {[
                      ["Customers", "id (PK)", "alias", "region", "210 records · 5 columns"],
                      [
                        "Sales",
                        "id (PK)",
                        "customer_id (FK)",
                        "product_id (FK)",
                        "1,250 records · 8 columns",
                      ],
                      ["Products", "id (PK)", "category", "unit_price", "48 records · 6 columns"],
                    ].map(([name, ...fields]) => (
                      <div className="model-table" key={name}>
                        <h3>{name}</h3>
                        {fields.map((f) => (
                          <p key={f}>{f}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                  <h3 className="section-title mb-3">Proposed relationships</h3>
                  {s.relationships.map((r, i) => (
                    <div
                      className="flex justify-between items-center gap-3 py-3 border-b border-border"
                      key={i}
                    >
                      <span className="text-xs font-mono">{r}</span>
                      <span className="badge success">Many to one</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-4">
                    Business categories: Sales, Customers, Products, Expenses, Invoices,
                    Transactions, Employees.
                  </p>
                </Panel>
              )}
              {s.phase === 4 && (
                <Panel
                  title="Formula verification"
                  body={false}
                  action={
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setFormula({
                            name: "",
                            formula: "",
                            result: "",
                            fields: "",
                            verified: false,
                          })
                        }
                      >
                        <Plus />
                        Add My Own Formula
                      </Button>
                      <Button
                        size="sm"
                        onClick={() =>
                          patch({ formulas: s.formulas.map((f) => ({ ...f, verified: true })) })
                        }
                      >
                        <Check />
                        Verify all calculations
                      </Button>
                    </div>
                  }
                >
                  <div className="table-scroll">
                    <table className="data-table">
                      <thead>
                        <tr>
                          {[
                            "KPI",
                            "Proposed formula",
                            "Data fields",
                            "Result",
                            "Verification",
                            "Actions",
                          ].map((x) => (
                            <th key={x}>{x}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {s.formulas.map((f, i) => (
                          <tr key={i}>
                            <td className="font-medium">{f.name}</td>
                            <td className="font-mono max-w-64 whitespace-normal">{f.formula}</td>
                            <td className="text-muted-foreground">{f.fields}</td>
                            <td className="font-semibold">{f.result}</td>
                            <td>
                              <Button
                                size="sm"
                                variant={f.verified ? "secondary" : "outline"}
                                onClick={() =>
                                  patch({
                                    formulas: s.formulas.map((x, j) =>
                                      i === j ? { ...x, verified: !x.verified } : x,
                                    ),
                                  })
                                }
                              >
                                {f.verified ? <Check /> : <Clock3 />}
                                {f.verified ? "Verified" : "Verify"}
                              </Button>
                            </td>
                            <td>
                              <div className="flex">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Edit ${f.name}`}
                                  onClick={() => setFormula(f)}
                                >
                                  <Pencil />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Explain ${f.name}`}
                                  onClick={() => {
                                    setDetail(
                                      `${f.name}: ${f.formula}. Uses ${f.fields}. Sample result: ${f.result}. This KPI measures business performance using approved non-identifying fields. Replacement formulas use a consultant-supplied sample result in this prototype.`,
                                    );
                                    setModal("detail");
                                  }}
                                >
                                  <Info />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              )}
              {s.phase === 5 && (
                <AnalyticsDashboard session={s} onChange={(charts) => patch({ charts })} />
              )}
              {s.phase === 6 && (
                <>
                  <div className="flex flex-wrap gap-2 mb-5">
                    <Button variant="outline" onClick={() => setModal("report")}>
                      <FileText />
                      View Report
                    </Button>
                    <Button variant="outline" onClick={() => window.print()}>
                      <Printer />
                      Print Report
                    </Button>
                  </div>
                  <ReportPreview s={s} />
                </>
              )}
              <div className="review-bar">
                <div>
                  <div className="text-xs font-medium flex gap-2 items-center">
                    <ShieldCheck size={15} className="text-primary" />
                    Consultant review required
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {s.phase === 6
                      ? "Generating the final report closes this session and disables editing."
                      : "Review the results before approving the next phase."}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!busy}
                    onClick={() => toast.success("Session draft saved.")}
                  >
                    Save Draft
                  </Button>
                  {s.phase > 0 && s.phase < 6 && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!!busy}
                      onClick={() => setModal("feedback")}
                    >
                      Reject & Provide Feedback
                    </Button>
                  )}
                  <Button
                    size="sm"
                    disabled={!!busy || (s.phase === 5 && !s.charts.length)}
                    onClick={() =>
                      s.phase === 6
                        ? process("Generating your final business report…", () => {
                            updateSession(id, closeSession);
                            toast.success("Report generated. Session completed and closed.");
                          })
                        : approve()
                    }
                  >
                    {s.phase === 6 ? <FileText /> : <Check />}
                    {
                      [
                        "Approve & Continue to Policies",
                        "Approve Data Protection Processing",
                        "Approve Cleaned Data",
                        "Approve Data Structure",
                        "Approve Formulas & KPIs",
                        "Approve Final Dashboard",
                        "Generate Report & Close Session",
                      ][s.phase]
                    }
                    <ArrowRight />
                  </Button>
                </div>
              </div>
              {s.decisions
                .filter((d) => d.action === "Rejected" && d.phase === s.phase)
                .map((d, i) => (
                  <div className="mt-4 p-4 rounded bg-warning-soft text-warning text-xs" key={i}>
                    <strong>Correction cycle completed</strong>
                    <p className="mt-2">{d.feedback}</p>
                    <p className="mt-2">Updated results are ready for your review.</p>
                  </div>
                ))}
            </>
          )}
        </>
      )}
      <Dialog
        open={!!modal}
        onOpenChange={(o) => {
          if (!o) setModal("");
        }}
      >
        <DialogContent
          className={
            modal === "report"
              ? "max-w-4xl max-h-[90vh] overflow-y-auto"
              : modal === "data"
                ? "max-w-3xl"
                : ""
          }
        >
          <DialogTitle>
            {
              (
                {
                  auth: "Resume your secure session",
                  invite: "Invite a collaborator",
                  feedback: "Reject phase & request corrections",
                  detail: "Processing explanation",
                  data: "AI-ready sample data",
                  structure: "Edit data relationships",
                  report: "Business analytics report",
                } as Record<string, string>
              )[modal]
            }
          </DialogTitle>
          <DialogDescription>
            {modal === "auth"
              ? "Simulated re-authentication. Use your demo email and any password of 4 or more characters."
              : modal === "feedback"
                ? "Your instructions are retained in this session. Only a non-confidential category signal enters the learning view."
                : "Fictional sample data · Interactive prototype"}
          </DialogDescription>
          {modal === "auth" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                if (String(f.get("email")).toLowerCase() !== data.profile.email.toLowerCase()) {
                  toast.error("Use the email of the session owner’s demo account.");
                  return;
                }
                updateSession(id, (x) => ({ ...x, status: "Active", lastActivity: Date.now() }));
                last.current = Date.now();
                setModal("");
                toast.success("Session resumed from the same phase.");
              }}
            >
              <label className="field">
                Email
                <Input name="email" type="email" defaultValue={data.profile.email} required />
              </label>
              <label className="field">
                Demo Password
                <Input name="password" type="password" required minLength={4} />
              </label>
              <Button type="submit">
                <Play />
                Re-authenticate & Resume
              </Button>
            </form>
          )}
          {modal === "invite" && (
            <>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  const collaborator = {
                    name: String(f.get("name")),
                    email: String(f.get("email")),
                    role: String(f.get("role")),
                    permission: String(f.get("permission")),
                  };
                  patch({
                    collaborators: [...s.collaborators, collaborator],
                    activity: [
                      ...s.activity,
                      {
                        text: `Collaborator invited (${collaborator.permission})`,
                        time: new Date().toISOString(),
                        phase: s.phase,
                      },
                    ],
                  });
                  setModal("");
                  toast.success("Invitation recorded (simulated, no email sent).");
                }}
              >
                <label className="field">
                  Invitee Name
                  <Input name="name" required />
                </label>
                <label className="field">
                  Invitee Email
                  <Input name="email" type="email" required />
                </label>
                <div className="form-grid">
                  <label className="field">
                    Role
                    <select className="select-input" name="role">
                      <option>Consultant</option>
                      <option>Collaborator</option>
                    </select>
                  </label>
                  <label className="field">
                    Permission Level
                    <select className="select-input" name="permission">
                      {["View", "Review", "Collaborate", "Edit"].map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <Button type="submit">
                  <UserPlus />
                  Send Simulated Invitation
                </Button>
              </form>
              {s.collaborators.map((c, i) => (
                <p className="text-xs text-muted-foreground" key={i}>
                  {c.name} · {c.email} · {c.permission}
                </p>
              ))}
            </>
          )}
          {modal === "feedback" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!feedback.trim()) return;
                setModal("");
                process("Repeating processing with consultant instructions…", () => {
                  updateSession(id, (x) => rejectPhase(x, feedback));
                  setFeedback("");
                });
              }}
              className="space-y-4"
            >
              <label className="field">
                Correction instructions
                <textarea
                  className="text-editor"
                  required
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Describe what should be corrected. Avoid confidential information."
                />
              </label>
              <Button type="submit">
                <RefreshCw />
                Submit Feedback & Repeat Processing
              </Button>
            </form>
          )}
          {modal === "detail" && (
            <p className="text-sm leading-relaxed text-muted-foreground">{detail}</p>
          )}
          {modal === "data" && (
            <>
              <DataPreview />
              <Button variant="outline" onClick={exportData}>
                <Download />
                Download Processed Data
              </Button>
            </>
          )}
          {modal === "structure" && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                patch({
                  relationships: String(f.get("relationships")).split("\n").filter(Boolean),
                });
                setModal("");
                toast.success("Data relationships updated.");
              }}
            >
              <label className="field">
                Relationships (one per line)
                <textarea
                  className="text-editor font-mono"
                  name="relationships"
                  defaultValue={s.relationships.join("\n")}
                  required
                />
              </label>
              <Button type="submit">
                <Check />
                Save Structure
              </Button>
            </form>
          )}
          {modal === "report" && (
            <>
              <ReportPreview s={s} />
              <div className="flex gap-2">
                <Button disabled={!readonly} onClick={() => downloadReport(s)}>
                  <Download />
                  Download Report PDF
                </Button>
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer />
                  Print Report
                </Button>
              </div>
              {!readonly && (
                <p className="text-xs text-muted-foreground">
                  Generate and close the session to enable the final PDF download.
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!formula}
        onOpenChange={(o) => {
          if (!o) setFormula(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Formula editor</DialogTitle>
          <DialogDescription>
            Review the logic and provide a calculated sample result. Editing resets verification.
          </DialogDescription>
          {formula && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const next = {
                  name: String(f.get("name")),
                  formula: String(f.get("formula")),
                  result: String(f.get("result")),
                  fields: String(f.get("fields")),
                  verified: false,
                };
                const index = s.formulas.indexOf(formula);
                patch({
                  formulas:
                    index >= 0
                      ? s.formulas.map((x, i) => (i === index ? next : x))
                      : [...s.formulas, next],
                });
                setFormula(null);
                toast.success("Formula updated. Verify the revised calculation.");
              }}
            >
              {[
                ["KPI Name", "name"],
                ["Formula", "formula"],
                ["Data Fields Used", "fields"],
                ["Sample Calculation Result", "result"],
              ].map(([label, name]) => (
                <label className="field" key={name}>
                  {label}
                  <Input
                    name={name}
                    required
                    defaultValue={String(formula[name as keyof Formula])}
                  />
                </label>
              ))}
              <Button type="submit">
                <Check />
                Save Formula & Recalculate
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
function DataPreview() {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {[
              "Transaction",
              "Customer alias",
              "Category",
              "Region",
              "Revenue EUR",
              "Expenses EUR",
              "Date",
            ].map((x) => (
              <th key={x}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DATA_ROWS.map((r, i) => (
            <tr key={i}>
              {r.map((v, j) => (
                <td key={j}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="p-4 text-[10px] text-muted-foreground">
        4 sample rows shown · 1,250 simulated records · Original identifiers removed or masked
      </p>
    </div>
  );
}
function ReportPreview({ s }: { s: Session }) {
  return (
    <article className="report-paper">
      <div className="eyebrow">SECURE AI PARTNER · BUSINESS INTELLIGENCE</div>
      <h2>{s.name}</h2>
      <p>{s.company}</p>
      <div className="flex flex-wrap gap-5 mt-4 text-[11px] text-muted-foreground">
        <span>{s.id}</span>
        <span>{s.consultant}</span>
        <span>{new Date(s.completed ?? s.created).toLocaleDateString("en-GB")}</span>
      </div>
      <div className="border-t border-border mt-6 pt-4">
        <h3>Analytics objective</h3>
        <p>{s.objective || s.prompt}</p>
      </div>
      <h3>Key performance indicators</h3>
      <div className="grid grid-cols-2 gap-3 my-4">
        {s.formulas.slice(0, 4).map((f) => (
          <div key={f.name}>
            <p>{f.name}</p>
            <strong className="text-lg">{f.result}</strong>
          </div>
        ))}
      </div>
      {REPORT_SECTIONS.map(([title, text]) => (
        <section key={title}>
          <h3>{title}</h3>
          <p>{text}</p>
        </section>
      ))}
      <p className="border-t border-border mt-8 pt-4">
        Quality {s.quality}% · Analytics fitness {s.fitness}% · Fictional data, simulated analysis.
        Findings are illustrative, not business advice.
      </p>
    </article>
  );
}
