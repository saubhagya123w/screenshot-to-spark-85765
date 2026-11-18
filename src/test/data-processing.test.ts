import { describe,it,expect } from "vitest";
import { detectProtection,protectData,assessData,calculateFormula,type Dataset } from "@/lib/data-processing";
const rows: Dataset[] = [{name:"User data",columns:["customer_name","amount","region"],rows:[{customer_name:"Private Person",amount:10,region:"North"},{customer_name:"Other Person",amount:20,region:"South"}]}];
describe("User data workflow",() => {
  it("masks identifiers before analytics",() => {
    const rules=detectProtection(rows);
    expect(rules.map(r => r.field)).toContain("customer_name");
    const processed=protectData(rows,rules);
    expect(processed[0]?.rows[0]?.customer_name).toBe("[masked]");
    expect(processed[0]?.rows[0]?.amount).toBe(10);
  });
  it("removes configured fields from prepared data",() => {
    const processed=protectData(rows,[{field:"customer_name",method:"Removal",reason:"User policy"}]);
    expect(processed[0]?.columns).not.toContain("customer_name");
    expect(processed[0]?.rows[0]).not.toHaveProperty("customer_name");
  });
  it("derives KPI results from imported numeric cells",() => {
    expect(calculateFormula("SUM(amount)",rows)).toBe("30");
    expect(calculateFormula("AVERAGE(amount)",rows)).toBe("15");
  });
  it("rejects unknown fields and executable formulas",() => {
    expect(() => calculateFormula("SUM(unknown)",rows)).toThrow();
    expect(() => calculateFormula("import('secret')",rows)).toThrow();
  });
  it("evaluates quality independently from analytics fitness",() => {
    const result=assessData([{name:"Text only",columns:["category"],rows:[{category:"Good"}]}],"Calculate total revenue");
    expect(result.quality).toBe(100); expect(result.fitness).toBe(0);
  });
  it("reports missing values without inventing replacements",() => {
    const result=assessData([{name:"Missing",columns:["amount"],rows:[{amount:""},{amount:20}]}],"Total amount");
    expect(result.dimensions.find(d => d.name === "Completeness")?.score).toBe(50);
    expect(result.cleaned[0]?.rows[0]?.amount).toBe("");
  });
});