import type { Session, Automation, Run } from "./prototype-model";
import { PHASES } from "./prototype-model";
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((x) => `"${x.replaceAll('"', '""')}"`).join(",")).join("\n");
  downloadBlob(filename, new Blob([csv], { type: "text/csv;charset=utf-8;" }));
}
export async function exportPDF(title: string, lines: string[], filename: string) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  let y = 24;
  pdf.setFontSize(20);
  pdf.text("Secure AI Partner", 20, y);
  y += 12;
  pdf.setFontSize(14);
  pdf.text(title, 20, y);
  y += 12;
  pdf.setFontSize(10);
  for (const line of lines) {
    const wrapped = pdf.splitTextToSize(line, 170) as string[];
    for (const text of wrapped) {
      if (y > 275) {
        pdf.addPage();
        y = 22;
      }
      pdf.text(text, 20, y);
      y += 6;
    }
    y += 3;
  }
  pdf.save(filename);
}
export function reportSections(s: Session): [string, string][] {
  return [
    ["Analytics requirements", s.prompt],
    ["Data summary", `${s.processed.reduce((n,d) => n + d.rows.length,0)} approved rows across ${s.processed.length} tables. Sources: ${s.files.map(f => f.name).join(", ")}.`],
    ["Data quality", `${s.quality}% across evaluated dimensions. ${s.dimensions.map(d => `${d.name}: ${d.score}% (${d.detail})`).join("; ")}`],
    ["Analytics fitness and limitations", `${s.fitness}%. ${s.limitations.join(" ")}`],
    ["Approved calculations", s.formulas.filter(f => f.verified).map(f => `${f.name}: ${f.result}. Formula: ${f.formula}`).join("; ")],
    ["Dashboard", s.charts.map(c => `${c.title}: ${c.type}; ${c.x} / ${c.y}; ${c.aggregation}; ${c.filters || "no filter"}`).join("; ")],
    ["Consultant decisions", s.decisions.map(d => `${PHASES[d.phase]}: ${d.action}${d.feedback ? ` — ${d.feedback}` : ""}`).join("; ")],
    ["Conclusions", "Results are derived from the imported data and approved calculations. Business accuracy, risks, opportunities and causal interpretation require consultant assessment; no unsupported findings are inferred."],
  ];
}
export function reportLines(s: Session) {
  return [
    `Session: ${s.id} | ${s.name}`,
    `Company: ${s.company}`,
    `Consultant: ${s.consultant}`,
    `Created: ${s.created}`,
    `Objective: ${s.objective || s.prompt}`,
    `Quality: ${s.quality}% | Analytics fitness: ${s.fitness}%`,
    ...s.formulas.map((f) => `${f.name}: ${f.result}`),
    ...reportSections(s).flatMap(([title, text]) => [title, text]),
  ];
}
export function downloadReport(s: Session) {
  return exportPDF(s.name, reportLines(s), `${s.id}-report.pdf`);
}
export function downloadHistory(s: Session) {
  return exportPDF(
    "Phase Feedback & Approval History",
    [
      `Session: ${s.id}`,
      `Consultant: ${s.consultant}`,
      ...s.decisions.map(
        (d) =>
          `${d.time} | ${PHASES[d.phase]} | ${d.action} | ${d.consultant} | ${d.feedback || "No additional feedback"}`,
      ),
      ...s.activity.map((a) => `${a.time} | ${PHASES[a.phase]} | ${a.text}`),
    ],
    `${s.id}-approval-history.pdf`,
  );
}
export function downloadAutoReport(a: Automation, r: Run) {
  return exportPDF(
    a.name,
    [
      `Company: ${a.company}`,
      `Run: ${r.id} | ${r.date}`,
      `Analytics questions: ${r.questions}`,
      `Quality ${r.quality}% | Fitness ${r.fitness}%`,
      `Execution status: ${r.status}`, `Delivery: ${r.email}`,
    ],
    `${r.id}-monthly-report.pdf`,
  );
}
