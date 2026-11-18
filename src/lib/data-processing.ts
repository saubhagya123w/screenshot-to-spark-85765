import Papa from "papaparse";
import { evaluate } from "mathjs";

export type DataRow = Record<string, string | number>;
export type Dataset = { name: string; columns: string[]; rows: DataRow[] };
export type ProtectionRule = { field: string; method: string; reason: string };
export type QualityIssue = { criterion: string; count: number; action: string };
export async function readDataset(file: File): Promise<Dataset[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv") {
    const parsed = Papa.parse<DataRow>(await file.text(), { header: true, skipEmptyLines: "greedy" });
    if (parsed.errors.length) throw new Error(parsed.errors[0]?.message || "Invalid CSV");
    if (!parsed.meta.fields?.length || !parsed.data.length) throw new Error("The file has no data rows.");
    return [{ name: file.name, columns: parsed.meta.fields, rows: parsed.data }];
  }
  if (ext === "json") {
    const rows: unknown = JSON.parse(await file.text());
    if (!Array.isArray(rows) || !rows.length || rows.some(r => !r || typeof r !== "object" || Array.isArray(r))) throw new Error("JSON must contain an array of row objects.");
    const columns = [...new Set(rows.flatMap(r => Object.keys(r)))];
    return [{ name: file.name, columns, rows: rows.map(r => Object.fromEntries(columns.map(c => [c, String(r[c] ?? "")])) as DataRow) }];
  }
  if (ext === "xlsx" || ext === "xls") {
    const XLSX = await import("xlsx");
    const book = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
    return book.SheetNames.flatMap(name => {
      const sheet = book.Sheets[name];
      if (!sheet) return [];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
      if (!rows.length) return [];
      const columns = [...new Set(rows.flatMap(r => Object.keys(r)))];
      return [{ name: `${file.name} / ${name}`, columns, rows: rows.map(r => Object.fromEntries(columns.map(c => [c, String(r[c] ?? "")])) as DataRow) }];
    });
  }
  throw new Error("Import CSV, Excel or JSON data. PDF table extraction is not available.");
}
export function detectProtection(datasets: Dataset[]): ProtectionRule[] {
  return [...new Set(datasets.flatMap(d => d.columns))].filter(field =>
    /email|phone|address|iban|bank|passport|ssn|salary|birth|employee.*name|customer.*name|first.?name|last.?name|(^|_)name$/i.test(field)
    || datasets.some(d => d.rows.some(r => /[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/i.test(String(r[field] ?? ""))))
  ).map(field => ({ field, method: /iban|bank|passport|ssn/i.test(field) ? "Removal" : "Masking", reason: "Potential identifier detected by field-name or value rules; review for purpose-limited processing." }));
}
export function protectData(datasets: Dataset[], rules: ProtectionRule[]): Dataset[] {
  const aliases = new Map<string, string>();
  return datasets.map(d => ({ ...d, columns: d.columns.filter(c => !rules.some(r => r.field === c && r.method === "Removal")), rows: d.rows.map(row => Object.fromEntries(d.columns.filter(c => !rules.some(r => r.field === c && r.method === "Removal")).map(c => {
    const rule = rules.find(r => r.field === c);
    const value = row[c] ?? "";
    if (!rule || rule.method === "Retain" || value === "") return [c, value];
    if (rule.method === "Pseudonymisation") {
      const key = `${c}:${value}`;
      if (!aliases.has(key)) aliases.set(key, `ID_${aliases.size + 1}`);
      return [c, aliases.get(key) ?? ""];
    }
    return [c, rule.method === "Anonymisation" ? "[anonymised]" : "[masked]"];
  })) as DataRow) }));
}
export function numeric(value: string | number | undefined): number | null {
  if (value === undefined || String(value).trim() === "") return null;
  const clean = String(value).trim().replace(/[€$£\s]/g, "").replace(/,/g, "");
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
}
export function numericColumns(d: Dataset): string[] {
  return d.columns.filter(c => d.rows.some(r => numeric(r[c]) !== null) && d.rows.every(r => String(r[c] ?? "").trim() === "" || numeric(r[c]) !== null));
}
export function assessData(datasets: Dataset[], prompt: string) {
  const rows = datasets.flatMap(d => d.rows), cells = datasets.reduce((n,d) => n + d.rows.length * d.columns.length, 0);
  const missing = datasets.reduce((n,d) => n + d.rows.reduce((a,r) => a + d.columns.filter(c => String(r[c] ?? "").trim() === "").length, 0), 0);
  const duplicates = datasets.reduce((n,d) => n + d.rows.length - new Set(d.rows.map(r => JSON.stringify(r))).size, 0);
  const whitespace = rows.reduce((n,r) => n + Object.values(r).filter(v => String(v) !== String(v).trim()).length, 0);
  const score = (bad: number, total: number) => total ? Math.round(100 * (1 - bad / total)) : 0;
  const dimensions = [{ name: "Completeness", score: score(missing,cells), detail: `${missing} missing cells of ${cells}` }, { name: "Consistency", score: score(whitespace,cells), detail: `${whitespace} values need whitespace normalisation` }, { name: "Uniqueness", score: score(duplicates,rows.length), detail: `${duplicates} exact duplicate rows` }, { name: "Structural quality", score: datasets.length && cells ? 100 : 0, detail: "Tabular structure and named columns" }];
  const quality = cells ? Math.round(dimensions.reduce((n,d) => n + d.score,0) / dimensions.length) : 0;
  const measures = datasets.flatMap(d => numericColumns(d));
  const fitness = rows.length && measures.length ? quality : 0;
  const limitations = ["Accuracy and business validity require consultant verification against source records.", "Date, currency, outlier and relationship semantics require review; no values or conversions are invented.", ...(measures.length ? [] : ["No numeric fields available for KPI calculations."]), ...(prompt.trim() ? ["Confirm that imported columns answer every requirement in the original prompt."] : ["Analytics requirements have not been provided."])];
  const issues: QualityIssue[] = [{ criterion:"Missing values",count:missing,action:"Left empty; no imputed values" },{criterion:"Duplicate records",count:duplicates,action:"Exact duplicates removed within each table"},{criterion:"Formatting",count:whitespace,action:"Leading and trailing whitespace trimmed"}];
  const cleaned = datasets.map(d => ({ ...d, rows: [...new Map(d.rows.map(r => { const row = Object.fromEntries(d.columns.map(c => [c, typeof r[c] === "number" ? r[c] : String(r[c] ?? "").trim()])) as DataRow; return [JSON.stringify(row),row] as const; })).values()] }));
  return {quality,fitness,dimensions,limitations,issues,cleaned};
}
export function calculateFormula(expression: string, datasets: Dataset[]): string {
  let error = false;
  const replaced = expression.replace(/\b(SUM|AVERAGE|COUNT|MIN|MAX)\(([^()]+)\)/gi, (_, op: string, field: string) => {
    const column = field.trim();
    if (!datasets.some(d => d.columns.includes(column))) { error = true; return "0"; }
    const values = datasets.flatMap(d => d.rows.map(r => numeric(r[column]))).filter((n): n is number => n !== null);
    const sum = values.reduce((n,v) => n + v,0);
    const result = op.toUpperCase() === "COUNT" ? values.length : op.toUpperCase() === "SUM" ? sum : op.toUpperCase() === "AVERAGE" ? sum / values.length : op.toUpperCase() === "MIN" ? Math.min(...values) : Math.max(...values);
    return String(result);
  });
  if (error || !/^[\d\s+\-*/().%]+$/.test(replaced)) throw new Error("Use SUM, AVERAGE, COUNT, MIN or MAX with a column name and arithmetic operators.");
  const result: unknown = evaluate(replaced);
  if (typeof result !== "number" || !Number.isFinite(result)) throw new Error("The calculation does not produce a finite number.");
  return result.toLocaleString("en-US", { maximumFractionDigits: 4 });
}