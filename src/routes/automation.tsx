import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  CalendarClock,
  Play,
  Pencil,
  Mail,
  Download,
  Check,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Pause,
  FileText,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { usePrototype } from "@/components/prototype-store";
import { Meta, PageHeading, Panel, Status, Progress } from "@/components/shared";
import { SOURCE_NAMES } from "@/components/session-workspace";
import {
  nextMonthlyDate,
  makeSession,
  INITIAL_PROMPT,
  type Automation,
  type Run,
} from "@/lib/prototype-model";
import { downloadAutoReport, REPORT_SECTIONS } from "@/lib/prototype-export";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
export const Route = createFileRoute("/automation")({
  head: () =>
    Meta(
      "Automated Monthly Analytics",
      "Configure monthly business analytics rules, sources, questions, schedules and simulated report delivery.",
    ),
  component: AutomationPage,
});
const STEPS = [
  "Configuration",
  "Company",
  "Authorised owner",
  "Data sources",
  "Analytics rules",
  "Analytics questions",
  "Monthly schedule",
  "Report recipients",
  "Review & activate",
];
const PROCESSING = [
  "Scheduled execution begins",
  "Collecting configured data sources",
  "Applying confidentiality policies",
  "Masking personal identifiers",
  "Cleaning data",
  "Assessing data quality",
  "Evaluating analytics fitness",
  "Structuring data",
  "Establishing relationships",
  "Calculating approved KPIs",
  "Performing business analytics",
  "Generating dashboard",
  "Generating report",
  "Simulating report email delivery",
];
function AutomationPage() {
  const { data, saveAutomation } = usePrototype();
  const [edit, setEdit] = useState<Automation | null>(null);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState<{ id: string; stage: number } | null>(null);
  const [preview, setPreview] = useState<{ a: Automation; r: Run; mode: string } | null>(null);
  const [currentTab, setCurrentTab] = useState("Current configuration");
  function create() {
    setStep(0);
    setEdit({
      id: `AUTO-${crypto.randomUUID().slice(0, 8)}`,
      name: "Monthly Business Analytics",
      company: "Nordic Business Solutions GmbH",
      owner: data.profile.name,
      sources: [],
      rules: "Mask identifiers; remove bank details; standardise currencies; remove duplicates.",
      questions: INITIAL_PROMPT,
      kpis: "Revenue, Expenses, Net Profit, Profit Margin",
      threshold: 85,
      day: 1,
      time: "09:00",
      timezone: "Europe/Berlin",
      recipient: "Emma Wilson",
      email: "emma@example.com",
      extra: "",
      active: false,
      history: [],
      changes: [],
    });
  }
  async function run(a: Automation) {
    if (!a.active || running) return;
    setRunning({ id: a.id, stage: 0 });
    for (let i = 0; i < PROCESSING.length; i++) {
      setRunning({ id: a.id, stage: i });
      await new Promise((r) => setTimeout(r, 250));
    }
    const passed = 94 >= a.threshold;
    const r: Run = {
      id: `RUN-${crypto.randomUUID().slice(0, 8)}`,
      date: new Date().toISOString(),
      status: passed ? "Completed" : "Requires Attention",
      quality: 94,
      fitness: 91,
      email: passed ? "Delivered (simulated)" : "Not sent — quality threshold failed",
      questions: a.questions,
    };
    saveAutomation({ ...a, history: [r, ...a.history] });
    setRunning(null);
    toast[passed ? "success" : "warning"](
      passed
        ? "Monthly execution completed. Report delivery simulated."
        : "Data quality is below the approved threshold. Report withheld.",
    );
  }
  function persist(active: boolean) {
    if (!edit) return;
    const previous = data.automations.find((a) => a.id === edit.id);
    const changed = previous && previous.questions !== edit.questions;
    saveAutomation({
      ...edit,
      active,
      changes: changed
        ? [{ date: new Date().toISOString(), questions: previous.questions }, ...edit.changes]
        : edit.changes,
    });
    setEdit(null);
    toast.success(
      active ? "Monthly analytics configuration activated." : "Configuration saved as draft.",
    );
  }
  return (
    <>
      <PageHeading
        title="Automated monthly analytics"
        subtitle="Approved rules. Monthly execution. No consultant approvals during processing."
      >
        <Button onClick={create}>
          <Plus />
          New Configuration
        </Button>
      </PageHeading>
      <div className="mb-6 p-4 rounded border border-border bg-info-soft flex gap-3">
        <CalendarClock size={19} className="text-primary shrink-0" />
        <div>
          <p className="text-xs font-medium">A separate, fully automated workflow</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Monthly schedules and email deliveries are simulated in this prototype. Executions use
            your latest approved requirements.
          </p>
        </div>
      </div>
      <div className="space-y-6">
        {data.automations.map((a) => (
          <Panel
            key={a.id}
            title={a.name}
            action={<Status status={a.active ? "Active configuration" : "Draft"} />}
          >
            <div className="flex flex-wrap gap-4 justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{a.company}</p>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Owner: {a.owner} · {a.id}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!running}
                  onClick={() => {
                    setEdit(structuredClone(a));
                    setStep(0);
                  }}
                >
                  <Pencil />
                  Edit Configuration
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!!running}
                  onClick={() => saveAutomation({ ...a, active: !a.active })}
                >
                  {a.active ? <Pause /> : <Play />}
                  {a.active ? "Deactivate" : "Activate"}
                </Button>
                <Button size="sm" disabled={!a.active || !!running} onClick={() => run(a)}>
                  <Play />
                  Simulate Scheduled Execution
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
              <div>
                <div className="eyebrow">SCHEDULE</div>
                <p className="text-xs mt-2 font-medium">Once monthly · Day {a.day}</p>
                <p className="text-[10px] mt-1 text-muted-foreground">Next: {nextMonthlyDate(a)}</p>
              </div>
              <div>
                <div className="eyebrow">DATA SOURCES</div>
                <p className="text-xs mt-2">{a.sources.join(", ") || "No sources selected"}</p>
                <p className="text-[10px] mt-1 text-muted-foreground">
                  Minimum quality: {a.threshold}%
                </p>
              </div>
              <div>
                <div className="eyebrow">REPORT RECIPIENT</div>
                <p className="text-xs mt-2">{a.recipient}</p>
                <p className="text-[10px] mt-1 text-muted-foreground">{a.email}</p>
              </div>
            </div>
            {running?.id === a.id && (
              <div className="mt-5 bg-info-soft p-4 rounded">
                <p className="text-xs text-primary flex gap-2 items-center mb-3">
                  <RefreshCw size={14} className="animate-spin" />
                  {PROCESSING[running.stage]}…
                </p>
                <Progress value={((running.stage + 1) / PROCESSING.length) * 100} />
                <p className="mt-2 text-[10px] text-muted-foreground">
                  No human approval required · Using approved configuration
                </p>
              </div>
            )}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex gap-1 flex-wrap mb-4">
                {["Current configuration", "Previous configuration", "Change history"].map((t) => (
                  <Button
                    key={t}
                    variant={currentTab === t ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setCurrentTab(t)}
                  >
                    {t}
                  </Button>
                ))}
              </div>
              {currentTab === "Current configuration" ? (
                <div>
                  <p className="text-xs leading-relaxed">{a.questions}</p>
                  <p className="text-[10px] text-muted-foreground mt-3">KPIs: {a.kpis}</p>
                  <p className="text-[10px] text-muted-foreground mt-2">Rules: {a.rules}</p>
                </div>
              ) : currentTab === "Previous configuration" ? (
                <p className="text-xs text-muted-foreground">
                  {a.changes[0]?.questions ??
                    a.history[0]?.questions ??
                    "No previous configuration."}
                </p>
              ) : a.changes.length ? (
                a.changes.map((c, i) => (
                  <div key={i} className="timeline-item">
                    <p className="text-xs">{new Date(c.date).toLocaleString("en-GB")}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Previous questions: {c.questions}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No configuration changes recorded.</p>
              )}
            </div>
            <h3 className="section-title mt-6 mb-4">Monthly execution history</h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    {[
                      "Execution date",
                      "Status",
                      "Data quality",
                      "Fitness",
                      "Email delivery",
                      "Actions",
                    ].map((x) => (
                      <th key={x}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {a.history.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.date).toLocaleString("en-GB")}</td>
                      <td>
                        <Status status={r.status} />
                      </td>
                      <td>{r.quality}%</td>
                      <td>{r.fitness}%</td>
                      <td className="whitespace-normal">{r.email}</td>
                      <td>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View report"
                            aria-label="View automated report"
                            disabled={r.status !== "Completed"}
                            onClick={() => setPreview({ a, r, mode: "report" })}
                          >
                            <FileText />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View dashboard"
                            aria-label="View automated dashboard"
                            disabled={r.status !== "Completed"}
                            onClick={() => setPreview({ a, r, mode: "dashboard" })}
                          >
                            <Database />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View email preview"
                            aria-label="View Email Preview"
                            onClick={() => setPreview({ a, r, mode: "email" })}
                          >
                            <Mail />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Download monthly report"
                            aria-label="Download monthly report"
                            disabled={r.status !== "Completed"}
                            onClick={() => downloadAutoReport(a, r)}
                          >
                            <Download />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!a.history.length && (
                <p className="text-xs p-5 text-muted-foreground">
                  No executions yet. Simulate a scheduled run to generate a report.
                </p>
              )}
            </div>
          </Panel>
        ))}
      </div>
      <Dialog
        open={!!edit}
        onOpenChange={(o) => {
          if (!o) setEdit(null);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>Configure monthly analytics</DialogTitle>
          <DialogDescription>
            Step {step + 1} of 9 · {STEPS[step]}
          </DialogDescription>
          <Progress value={((step + 1) / 9) * 100} />
          {edit && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step < 8) setStep(step + 1);
                else persist(true);
              }}
              className="space-y-5"
            >
              <div className="py-3">
                {step === 0 && (
                  <label className="field">
                    Configuration Name
                    <Input
                      required
                      value={edit.name}
                      onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                    />
                  </label>
                )}
                {step === 1 && (
                  <label className="field">
                    Company Name
                    <Input
                      required
                      value={edit.company}
                      onChange={(e) => setEdit({ ...edit, company: e.target.value })}
                    />
                  </label>
                )}
                {step === 2 && (
                  <>
                    <label className="field">
                      Authorised Configuration Owner
                      <Input
                        required
                        value={edit.owner}
                        onChange={(e) => setEdit({ ...edit, owner: e.target.value })}
                      />
                    </label>
                    <p className="mt-3 text-xs text-muted-foreground">
                      This prototype simulates an authorised company owner; real role verification
                      is not connected.
                    </p>
                  </>
                )}
                {step === 3 && (
                  <>
                    <h3 className="section-title mb-4">Select data sources</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {SOURCE_NAMES.map((n) => (
                        <label
                          key={n}
                          className="flex items-center gap-2 text-xs border border-border p-3 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={edit.sources.includes(n)}
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                sources: e.target.checked
                                  ? [...edit.sources, n]
                                  : edit.sources.filter((s) => s !== n),
                              })
                            }
                          />
                          {n}
                        </label>
                      ))}
                    </div>
                    {!edit.sources.length && (
                      <p className="text-xs text-warning mt-3">
                        Select at least one source to continue.
                      </p>
                    )}
                  </>
                )}
                {step === 4 && (
                  <div className="space-y-4">
                    <label className="field">
                      Processing & Confidentiality Rules
                      <textarea
                        className="text-editor"
                        required
                        value={edit.rules}
                        onChange={(e) => setEdit({ ...edit, rules: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Minimum Data Quality Threshold (%)
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={edit.threshold}
                        onChange={(e) => setEdit({ ...edit, threshold: Number(e.target.value) })}
                      />
                    </label>
                    <label className="field">
                      Formula & KPI Requirements
                      <Input
                        required
                        value={edit.kpis}
                        onChange={(e) => setEdit({ ...edit, kpis: e.target.value })}
                      />
                    </label>
                  </div>
                )}
                {step === 5 && (
                  <label className="field">
                    Analytics Questions & Requirements
                    <textarea
                      className="text-editor min-h-48"
                      required
                      value={edit.questions}
                      onChange={(e) => setEdit({ ...edit, questions: e.target.value })}
                    />
                    <span className="text-xs text-muted-foreground">
                      Update these questions before each monthly run. Previous requirements are
                      retained.
                    </span>
                  </label>
                )}
                {step === 6 && (
                  <div className="space-y-4">
                    <div className="badge">Once per month</div>
                    <label className="field">
                      Day of Month
                      <Input
                        type="number"
                        min={1}
                        max={28}
                        required
                        value={edit.day}
                        onChange={(e) => setEdit({ ...edit, day: Number(e.target.value) })}
                      />
                    </label>
                    <label className="field">
                      Time
                      <Input
                        type="time"
                        required
                        value={edit.time}
                        onChange={(e) => setEdit({ ...edit, time: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Time Zone
                      <select
                        className="select-input"
                        value={edit.timezone}
                        onChange={(e) => setEdit({ ...edit, timezone: e.target.value })}
                      >
                        {[
                          "Europe/Berlin",
                          "Europe/London",
                          "America/New_York",
                          "Asia/Kolkata",
                          "UTC",
                        ].map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Days 1–28 keep your monthly schedule consistent across all months.
                    </p>
                  </div>
                )}
                {step === 7 && (
                  <div className="space-y-4">
                    <label className="field">
                      Recipient Name
                      <Input
                        required
                        value={edit.recipient}
                        onChange={(e) => setEdit({ ...edit, recipient: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Recipient Email
                      <Input
                        type="email"
                        required
                        value={edit.email}
                        onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Additional Recipients
                      <Input
                        value={edit.extra}
                        placeholder="Optional email addresses"
                        onChange={(e) => setEdit({ ...edit, extra: e.target.value })}
                      />
                    </label>
                  </div>
                )}
                {step === 8 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">{edit.name}</h3>
                    <p className="text-xs">
                      {edit.company} · {edit.owner}
                    </p>
                    <p className="text-xs">Sources: {edit.sources.join(", ")}</p>
                    <p className="text-xs">Rules: {edit.rules}</p>
                    <p className="text-xs">
                      Quality threshold: {edit.threshold}% · KPIs: {edit.kpis}
                    </p>
                    <p className="text-xs">Questions: {edit.questions}</p>
                    <p className="text-xs">Schedule: once monthly · {nextMonthlyDate(edit)}</p>
                    <p className="text-xs">
                      Recipient: {edit.recipient} · {edit.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Activation approves this configuration for simulated monthly runs. No real
                      emails or scheduled background jobs are created.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-between border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={() => persist(false)}>
                  Save Draft
                </Button>
                <div className="flex gap-2">
                  {step > 0 && (
                    <Button variant="outline" type="button" onClick={() => setStep(step - 1)}>
                      <ArrowLeft />
                      Back
                    </Button>
                  )}
                  <Button type="submit" disabled={step === 3 && !edit.sources.length}>
                    {step === 8 ? <Check /> : <ArrowRight />}
                    {step === 8 ? "Activate Monthly Analytics" : "Continue"}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!preview}
        onOpenChange={(o) => {
          if (!o) setPreview(null);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogTitle>
            {preview?.mode === "email"
              ? "Monthly report email preview"
              : preview?.mode === "dashboard"
                ? "Generated monthly dashboard"
                : "Monthly business analytics report"}
          </DialogTitle>
          <DialogDescription>Fictional analytics · No real email sent</DialogDescription>
          {preview &&
            (preview.mode === "email" ? (
              <div className="space-y-5">
                <div className="border-b border-border pb-4 space-y-2 text-xs">
                  <p>
                    <strong>To:</strong> {preview.a.recipient} &lt;{preview.a.email}&gt;{" "}
                    {preview.a.extra}
                  </p>
                  <p>
                    <strong>Subject:</strong> Secure AI Partner — Monthly Business Analytics Report
                  </p>
                  <p>
                    <strong>Reporting month:</strong>{" "}
                    {new Date(preview.r.date).toLocaleDateString("en-GB", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <Status status={preview.r.email} />
                </div>
                <p className="text-sm">Dear {preview.a.recipient},</p>
                <p className="text-sm leading-relaxed">
                  Your monthly analytics report for {preview.a.company} is ready. Revenue reached
                  €284,500 with net profit of €88,300 and a 31.04% margin.
                </p>
                <p className="text-sm leading-relaxed">
                  Key findings: revenue growth is strong in Germany and Sweden. Review logistics
                  costs and improve customer attribute completeness before retention analysis.
                </p>
                <p className="text-sm">
                  Recommendation: prioritise high-margin categories and monitor overdue invoices
                  monthly.
                </p>
                {preview.r.status === "Completed" && (
                  <Button
                    variant="outline"
                    onClick={() => downloadAutoReport(preview.a, preview.r)}
                  >
                    <Download />
                    Monthly Analytics Report PDF
                  </Button>
                )}
              </div>
            ) : preview.mode === "dashboard" ? (
              <AnalyticsDashboard session={makeSession({ prompt: preview.r.questions })} readonly />
            ) : (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">{preview.a.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {preview.a.company} · {preview.r.id}
                </p>
                <p className="text-sm">Analytics requirements: {preview.r.questions}</p>
                {REPORT_SECTIONS.map(([t, b]) => (
                  <section key={t}>
                    <h3 className="font-semibold text-sm mb-2">{t}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{b}</p>
                  </section>
                ))}
                <Button onClick={() => downloadAutoReport(preview.a, preview.r)}>
                  <Download />
                  Download Report PDF
                </Button>
              </div>
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}
