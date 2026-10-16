import type { Incident } from "./types";
import { OPEN_STATUSES } from "./types";
import { isOverdue } from "./store";
import { hoursBetween, median } from "./format";

const D = 86400_000;

export function kpis(list: Incident[], now = Date.now()) {
  const inPeriod = (i: Incident, from: number, to: number) => {
    const t = new Date(i.reportedAt).getTime();
    return t >= from && t < to;
  };
  const last7 = list.filter((i) => inPeriod(i, now - 7 * D, now + 1)).length;
  const prev7 = list.filter((i) => inPeriod(i, now - 14 * D, now - 7 * D)).length;
  const resolved = list.filter((i) => i.status === "Resolved" || i.status === "Closed");
  const withinSla = resolved.filter((i) => i.resolvedAt && i.resolvedAt <= i.slaDeadline).length;
  const resTimes = resolved.filter((i) => i.resolvedAt).map((i) => hoursBetween(i.reportedAt, i.resolvedAt!));
  return {
    total: list.length,
    newReports: list.filter((i) => i.status === "Submitted").length,
    awaiting: list.filter((i) => ["Submitted", "Under Review", "Reopened"].includes(i.status) && !i.departmentId).length,
    inProgress: list.filter((i) => i.status === "In Progress" || i.status === "Acknowledged").length,
    critical: list.filter((i) => i.priority === "Critical" && OPEN_STATUSES.includes(i.status)).length,
    overdue: list.filter((i) => isOverdue(i, now)).length,
    resolved: resolved.length,
    open: list.filter((i) => OPEN_STATUSES.includes(i.status)).length,
    reopened: list.filter((i) => i.status === "Reopened").length,
    sla: resolved.length ? Math.round((withinSla / resolved.length) * 1000) / 10 : 0,
    medianRes: Math.round(median(resTimes) * 10) / 10,
    avgRes: resTimes.length ? Math.round((resTimes.reduce((a, b) => a + b, 0) / resTimes.length) * 10) / 10 : 0,
    weekDelta: prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : 0,
  };
}

export function dailyTrend(list: Incident[], days = 30, now = Date.now()) {
  const out: { day: string; reported: number; resolved: number }[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const start = new Date(now - d * D);
    start.setHours(0, 0, 0, 0);
    const s = start.getTime();
    const e = s + D;
    out.push({
      day: start.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      reported: list.filter((i) => { const t = new Date(i.reportedAt).getTime(); return t >= s && t < e; }).length,
      resolved: list.filter((i) => { if (!i.resolvedAt) return false; const t = new Date(i.resolvedAt).getTime(); return t >= s && t < e; }).length,
    });
  }
  return out;
}

export function countBy<T extends string>(list: Incident[], key: (i: Incident) => T) {
  const m = new Map<T, number>();
  for (const i of list) m.set(key(i), (m.get(key(i)) ?? 0) + 1);
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
