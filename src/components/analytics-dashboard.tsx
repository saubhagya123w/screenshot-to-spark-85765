import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
  Treemap,
} from "recharts";
import { BarChart3, Pencil, Plus, Trash2, ArrowUp, ArrowDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type ChartSpec, type Session } from "@/lib/prototype-model";
import { type DataRow, type Dataset, numeric } from "@/lib/data-processing";
import { Panel } from "./shared";
import { downloadCSV } from "@/lib/prototype-export";
const TYPES = [
  "Bar",
  "Column",
  "Line",
  "Area",
  "Pie",
  "Donut",
  "Scatter",
  "Bubble",
  "Heatmap",
  "Treemap",
  "KPI Card",

];
export function ChartGraphic({ spec, datasets }: { spec: ChartSpec; datasets: Dataset[] }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const dataset = datasets.find(d => d.name === spec.table) ?? datasets[0];
  const key = spec.x;
  let raw = dataset?.rows ?? [];
  const grouped = new Map<string, number[]>();
  for(const row of raw) {
    const value = numeric(row[spec.y]);
    if(value === null) continue;
    const group = String(row[key] ?? "");
    grouped.set(group, [...(grouped.get(group) ?? []),value]);
  }
  let rows: DataRow[] = [...grouped].map(([group,values]) => ({ [key]: group, [spec.y]: spec.aggregation === "Count" ? values.length : spec.aggregation === "Average" ? values.reduce((n,v) => n+v,0)/values.length : values.reduce((n,v) => n+v,0) }));
  if (spec.filters.trim())
    rows = rows.filter((r) =>
      Object.values(r).some((v) => String(v).toLowerCase().includes(spec.filters.toLowerCase())),
    );
  const measure = spec.y;
  if (!rows.length)
    return (
      <div className="chart-wrap grid place-items-center text-xs text-muted-foreground">
        No data matches this filter.
      </div>
    );
  if (!ready) return <div className="chart-wrap" />;
  const axis = (
    <>
      <CartesianGrid stroke="var(--chart-grid)" vertical={false} strokeDasharray="3 3" />
      <XAxis
        dataKey={key}
        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
        axisLine={false}
        tickLine={false}
      />
      <YAxis
        tickFormatter={(n) => `${n / 1000}k`}
        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
        axisLine={false}
        tickLine={false}
        width={42}
      />
      <Tooltip
        formatter={(v) => Number(v).toLocaleString()}
        contentStyle={{
          background: "var(--card)",
          borderColor: "var(--border)",
          borderRadius: 5,
          fontSize: 11,
        }}
      />
    </>
  );
  const colors = [
    "var(--primary)",
    "var(--chart-profit)",
    "var(--warning)",
    "var(--muted-foreground)",
  ];
  if (spec.type === "KPI Card") {
    const vals = rows.map((r) => Number(r[measure as keyof typeof r]));
    const result =
      spec.aggregation === "Average"
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : spec.aggregation === "Count"
          ? vals.length
          : vals.reduce((a, b) => a + b, 0);
    return (
      <div className="chart-wrap flex flex-col items-center justify-center">
        <div className="text-4xl font-semibold">
          
          {result.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <span className="mt-3 text-xs text-muted-foreground">
          {spec.aggregation} · {measure}
        </span>
      </div>
    );
  }
  if (["Pie", "Donut"].includes(spec.type))
    return (
      <div className="chart-wrap">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={rows}
              dataKey={measure}
              nameKey={key}
              innerRadius={spec.type === "Donut" ? 50 : 0}
              outerRadius={80}
              paddingAngle={3}
            >
              {rows.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => Number(v).toLocaleString()} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  if (spec.type === "Treemap")
    return (
      <div className="chart-wrap">
        <ResponsiveContainer>
          <Treemap
            data={rows.map((r) => ({
              name: r[key as keyof typeof r],
              size: r[measure as keyof typeof r],
            }))}
            dataKey="size"
            stroke="var(--card)"
            fill="var(--primary)"
          />
        </ResponsiveContainer>
      </div>
    );
  if (["Scatter", "Bubble"].includes(spec.type))
    return (
      <div className="chart-wrap">
        <ResponsiveContainer>
          <ScatterChart>
            {axis}
            <XAxis type="number" dataKey={spec.x} />
            <YAxis type="number" dataKey={spec.y} />
            <ZAxis dataKey={spec.y} range={[60, 400]} />
            <Scatter data={rows} fill="var(--primary)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  if (spec.type === "Heatmap")
    return (
      <div className="chart-wrap grid grid-cols-3 gap-2 p-3">
        {rows.map((r, i) => (
          <div
            key={i}
            className="rounded bg-info-soft text-primary flex flex-col justify-center items-center text-xs"
          >
            <span>{String(r[key as keyof typeof r])}</span>
            <strong className="mt-2">
              {Number(r[measure as keyof typeof r]).toLocaleString()}
            </strong>
          </div>
        ))}
      </div>
    );
  return (
    <div className="chart-wrap">
      <ResponsiveContainer>
        {spec.type === "Area" ? (
          <AreaChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            {axis}
            <Area
              type="monotone"
              dataKey={measure}
              stroke="var(--primary)"
              fill="var(--info-soft)"
              strokeWidth={2}
            />
          </AreaChart>
        ) : spec.type === "Line" || spec.type === "Combo Chart" ? (
          <LineChart data={rows}>
            {axis}
            <Line
              type="monotone"
              dataKey={measure}
              stroke="var(--primary)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        ) : (
          <BarChart data={rows} layout={spec.type === "Bar" ? "vertical" : "horizontal"}>
            {spec.type === "Bar" ? (
              <>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey={key}
                  width={65}
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
              </>
            ) : (
              axis
            )}
            <Bar dataKey={measure} fill="var(--primary)" radius={[3, 3, 3, 3]} barSize={24} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
export function AnalyticsDashboard({
  session,
  onChange,
  readonly = false,
}: {
  session: Session;
  onChange?: (charts: ChartSpec[]) => void;
  readonly?: boolean;
}) {
  const [edit, setEdit] = useState<ChartSpec | null>(null);
  const charts = session.charts;
  const save = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!edit) return;
    const f = new FormData(e.currentTarget);
    const result = { ...edit, ...Object.fromEntries(f) } as ChartSpec;
    onChange?.(
      charts.some((c) => c.id === edit.id)
        ? charts.map((c) => (c.id === edit.id ? result : c))
        : [...charts, result],
    );
    setEdit(null);
  };
  return (
    <div className="space-y-5">
      <details className="panel p-4">
        <summary className="text-xs font-medium cursor-pointer">
          Original analytics requirements
        </summary>
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{session.prompt}</p>
      </details>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {session.formulas.slice(0, 4).map((f) => (
          <div className="metric-card" key={f.name}>
            <div className="text-xs text-muted-foreground">{f.name}</div>
            <div className="mt-3 text-2xl font-semibold">{f.result}</div>
            <div className="mt-2 text-[10px] text-success">Approved calculation</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="section-title">Executive Performance Dashboard</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              downloadCSV(`${session.id}-dashboard.csv`, [
                session.processed[0]?.columns ?? [],
                ...(session.processed[0]?.rows ?? []).map(r => (session.processed[0]?.columns ?? []).map(c => String(r[c] ?? ""))),
              ])
            }
          >
            <Download />
            Download Dashboard
          </Button>
          {!readonly && (
            <Button
              size="sm"
              onClick={() =>
                setEdit({
                  ...(charts[0] ?? {
                    type: "Area",
                    x: session.processed[0]?.columns[0] ?? "",
                    y: session.processed[0]?.columns[1] ?? "",
                    aggregation: "Sum",
                    group: "",
                    filters: "",
                    range: "All data",
                    table: session.processed[0]?.name ?? "",
                  }),
                  id: crypto.randomUUID(),
                  title: "New visualisation",
                })
              }
            >
              <Plus />
              Add Visualisation
            </Button>
          )}
        </div>
      </div>
      <div className="analytics-grid">
        {charts.map((c, i) => (
          <Panel
            key={c.id}
            title={c.title}
            action={
              !readonly ? (
                <div className="flex">
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Move ${c.title} up`}
                    disabled={i === 0}
                    onClick={() => {
                      const next = charts.filter((x) => x.id !== c.id);
                      next.splice(Math.max(0, i - 1), 0, c);
                      onChange?.(next);
                    }}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Move ${c.title} down`}
                    disabled={i === charts.length - 1}
                    onClick={() => {
                      const next = charts.filter((x) => x.id !== c.id);
                      next.splice(Math.min(charts.length - 1, i + 1), 0, c);
                      onChange?.(next);
                    }}
                  >
                    <ArrowDown />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Edit ${c.title}`}
                    onClick={() => setEdit(c)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${c.title}`}
                    onClick={() => onChange?.(charts.filter((x) => x.id !== c.id))}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ) : (
                <span className="badge neutral">View only</span>
              )
            }
          >
            <ChartGraphic spec={c} datasets={session.processed} />
            <div className="mt-3 flex gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="status-dot text-primary" />
                {c.y}
              </span>
              <span className="ml-auto">{c.range}</span>
            </div>
          </Panel>
        ))}
      </div>
      {charts.length === 0 && (
        <div className="panel p-10 text-center text-muted-foreground">
          <BarChart3 className="mx-auto mb-3" />
          No visualisations. Add a chart to your dashboard.
        </div>
      )}
      <Dialog
        open={!!edit}
        onOpenChange={(o) => {
          if (!o) setEdit(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogTitle>Configure visualisation</DialogTitle>
          <DialogDescription>Select fields from your approved data.</DialogDescription>
          {edit && (
            <form onSubmit={save} className="space-y-4">
              <label className="field">
                Visualisation Name
                <Input name="title" required defaultValue={edit.title} />
              </label>
              <div className="form-grid">
                {[
                  ["Chart Type", "type", TYPES],
                  ["Data Table", "table", session.processed.map(d => d.name)],
                  ["X-axis", "x", [...new Set(session.processed.flatMap(d => d.columns))]],
                  ["Y-axis / Measure", "y", [...new Set(session.processed.flatMap(d => d.columns))]],
                  ["Group By", "group", [...new Set(session.processed.flatMap(d => d.columns))]],
                  ["Aggregation", "aggregation", ["Sum", "Average", "Count"]],
                  ["Date Range", "range", ["All data"]],
                ].map(([label, name, options]) => (
                  <label className="field" key={String(name)}>
                    {String(label)}
                    <select
                      name={String(name)}
                      className="select-input"
                      defaultValue={String(edit[String(name) as keyof ChartSpec])}
                    >
                      {(options as string[]).map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                ))}
                <label className="field">
                  Filters
                  <Input
                    name="filters"
                    defaultValue={edit.filters}
                    placeholder="Filter value"
                  />
                </label>
              </div>
              <p className="text-xs text-muted-foreground">
                Calculations use the selected fields and aggregation.
              </p>
              <Button type="submit">
                <CheckIcon />
                Save visualisation
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
function CheckIcon() {
  return <BarChart3 size={15} />;
}
