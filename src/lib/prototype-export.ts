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
  for (const line of ["Fictional business data | Prototype report", "", ...lines]) {
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
export const REPORT_SECTIONS: [string, string][] = [
  [
    "Executive Summary",
    "Revenue reached EUR 284,500 in November, an increase of 12.8% over the comparable prior period. Net profit was EUR 88,300, with a 31.04% margin. Growth was driven by German and Swedish sales.",
  ],
  [
    "Revenue Analysis",
    "Germany contributed EUR 114,500, representing 40.2% of total revenue. Sweden contributed EUR 76,000, followed by Denmark at EUR 54,000 and Finland at EUR 40,000.",
  ],
  [
    "Expense & Profitability Analysis",
    "Operating expenses totalled EUR 196,200. Expense growth remains below revenue growth. Procurement and logistics are the largest controllable cost categories.",
  ],
  [
    "Trends & Visualisation Findings",
    "Six-month revenue increased from EUR 205,000 in June to EUR 284,500 in November. The dashboard shows improving profitability, with a temporary seasonal dip in August.",
  ],
  [
    "Strengths & Opportunities",
    "Strong regional diversification and improving margins offer opportunities to expand high-performing product categories in Sweden and Germany.",
  ],
  [
    "Weaknesses & Risks",
    "Missing customer attributes limit retention analysis. Supplier concentration and variable logistics costs may affect future profitability. Outstanding invoices require monitoring.",
  ],
  [
    "Recommendations",
    "Prioritise profitable product categories. Review logistics contracts. Improve customer data completeness and establish a monthly overdue-invoice review.",
  ],
  [
    "Conclusion",
    "Business performance is improving. Continue monthly monitoring of revenue, profitability and data quality before extending customer-level analytics.",
  ],
];
export function reportLines(s: Session) {
  return [
    `Session: ${s.id} | ${s.name}`,
    `Company: ${s.company}`,
    `Consultant: ${s.consultant}`,
    `Created: ${s.created}`,
    `Objective: ${s.objective || s.prompt}`,
    `Quality: ${s.quality}% | Analytics fitness: ${s.fitness}%`,
    ...s.formulas.map((f) => `${f.name}: ${f.result}`),
    ...REPORT_SECTIONS.flatMap(([title, text]) => [title, text]),
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
      ...REPORT_SECTIONS.flatMap(([title, text]) => [title, text]),
    ],
    `${r.id}-monthly-report.pdf`,
  );
}
