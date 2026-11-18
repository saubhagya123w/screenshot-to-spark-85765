import { describe, it, expect } from "vitest";
import {
  makeSession,
  approvePhase,
  rejectPhase,
  closeSession,
  hasAccess,
  isInactive,
  learningSignal,
  nextMonthlyDate,
  INITIAL_FORMULAS,
} from "@/lib/prototype-model";
describe("Consultant workflow rules", () => {
  for (const phase of [1, 2, 3, 4, 5])
    it(`phase ${phase + 1} cannot advance without phase ${phase} approval`, () => {
      const s = makeSession({
        phase,
        approved: [],
        formulas: INITIAL_FORMULAS.map((f) => ({ ...f, verified: true })),
      });
      expect(approvePhase(s).phase).toBe(phase);
    });
  it("requires requirements and data in phase 1", () => {
    const s = makeSession({ prompt: "Revenue analytics" });
    expect(approvePhase(s).phase).toBe(0);
    expect(approvePhase({ ...s, sample: true }).phase).toBe(1);
  });
  it("requires verified formulas", () => {
    const s = makeSession({ phase: 4, approved: [0, 1, 2, 3] });
    expect(approvePhase(s).phase).toBe(4);
    expect(
      approvePhase({ ...s, formulas: s.formulas.map((f) => ({ ...f, verified: true })) }).phase,
    ).toBe(5);
  });
  it("cannot generate report before dashboard approval", () => {
    const s = makeSession({ phase: 6, approved: [0, 1, 2, 3, 4] });
    expect(closeSession(s).status).toBe("Active");
  });
  it("closes after report generation and disallows further changes", () => {
    const s = closeSession(makeSession({ phase: 6, approved: [0, 1, 2, 3, 4, 5] }));
    expect(s.status).toBe("Completed");
    expect(s.completed).toBeTruthy();
    expect(rejectPhase(s, "Change data")).toEqual(s);
    expect(approvePhase(s)).toEqual(s);
  });
  it("retains rejected feedback and repeats the same phase", () => {
    const s = rejectPhase(
      makeSession({ phase: 2, approved: [0, 1] }),
      "Keep missing values flagged",
    );
    expect(s.phase).toBe(2);
    expect(s.decisions[0]?.feedback).toBe("Keep missing values flagged");
    expect(s.quality).toBe(94);
  });
  it("retains approvals", () => {
    const s = approvePhase(makeSession({ phase: 1, approved: [0] }));
    expect(s.approved).toEqual([0, 1]);
    expect(s.decisions[0]?.action).toBe("Approved");
  });
});
describe("Session protection", () => {
  it("generates distinct session identifiers", () => {
    const ids = Array.from({ length: 100 }, (_, i) => makeSession({ id: `SAP-${100000 + i}` }));
    const fresh = makeSession(
      {},
      ids.map((s) => s.id),
    );
    expect(ids.some((s) => s.id === fresh.id)).toBe(false);
    expect(fresh.id).toMatch(/^SAP-\d{6}$/);
  });
  it("grants access to owner and invited users only", () => {
    const s = makeSession({
      collaborators: [
        { email: "invited@example.com", name: "Invitee", role: "Consultant", permission: "View" },
      ],
    });
    expect(hasAccess(s, "owner@example.com", "alex")).toBe(true);
    expect(hasAccess(s, "other@example.com", "other")).toBe(false);
    expect(hasAccess(s, "invited@example.com", "other")).toBe(true);
  });
  it("sleeps at exactly two minutes, not before", () => {
    expect(isInactive(1000, 120999)).toBe(false);
    expect(isInactive(1000, 121000)).toBe(true);
  });
  it("paused and sleeping sessions cannot progress", () => {
    for (const status of ["Paused", "Sleeping"] as const) {
      const s = makeSession({ status, phase: 1, approved: [0] });
      expect(approvePhase(s)).toEqual(s);
      expect(rejectPhase(s, "Correction")).toEqual(s);
    }
  });
});
describe("Monthly and learning rules", () => {
  it("schedules the following monthly date after the current run date", () => {
    expect(
      nextMonthlyDate({ day: 1, time: "09:00", timezone: "UTC" }, new Date("2026-11-18T10:00:00Z")),
    ).toBe("2026-12-01 09:00 (UTC)");
  });
  it("keeps the current month before its approved run date", () => {
    expect(
      nextMonthlyDate(
        { day: 20, time: "09:00", timezone: "UTC" },
        new Date("2026-11-18T10:00:00Z"),
      ),
    ).toBe("2026-11-20 09:00 (UTC)");
  });
  it("never propagates confidential feedback into learning signals", () => {
    const signal = learningSignal({
      phase: 2,
      action: "Rejected",
      feedback: "Confidential IBAN DE89370400440532013000",
      consultant: "Alex",
      time: "2026-11-18",
    });
    expect(JSON.stringify(signal)).not.toContain("DE89370400440532013000");
    expect(signal.category).toBe("Data cleaning");
  });
});
