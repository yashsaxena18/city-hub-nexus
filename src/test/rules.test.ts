import { describe, expect, it } from "vitest";
import { applyPriority, applyStatus, createInitialState, isOverdue } from "@/lib/store";
import { DEFAULT_SLA, makeRef } from "@/lib/demo-data";

const now = Date.UTC(2026, 9, 16, 12);
const base = createInitialState(now).incidents[0];

describe("incident rules", () => {
  it("reference format is SCN-YEAR-5 digits", () => {
    expect(makeRef(42)).toBe("SCN-2026-00042");
  });
  it("status change appends a timeline event", () => {
    const next = applyStatus({ ...base, status: "Assigned" }, "In Progress", "Tester", undefined, now);
    expect(next.timeline.length).toBe(base.timeline.length + 1);
    expect(next.status).toBe("In Progress");
  });
  it("critical priority sets an 8h resolution deadline", () => {
    const next = applyPriority(base, "Critical", DEFAULT_SLA, "T", now);
    expect(new Date(next.slaDeadline).getTime() - new Date(base.reportedAt).getTime()).toBe(8 * 3600_000);
  });
  it("resolved incidents are never overdue", () => {
    expect(isOverdue({ ...base, status: "Resolved", slaDeadline: new Date(now - 1000).toISOString() }, now)).toBe(false);
    expect(isOverdue({ ...base, status: "In Progress", slaDeadline: new Date(now - 1000).toISOString() }, now)).toBe(true);
  });
});
