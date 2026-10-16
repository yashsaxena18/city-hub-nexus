import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { KpiCard, PageHeader, Panel } from "@/components/app/ui-bits";
import { Donut, HBar, LineSeries, PRIO_COLORS, TrendChart, VBar } from "@/components/app/charts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, isOverdue } from "@/lib/store";
import { countBy, dailyTrend, kpis } from "@/lib/metrics";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/types";
import { WARDS } from "@/lib/demo-data";
import { downloadFile, hoursBetween, toCsv } from "@/lib/format";
import { BarChart3, CheckCircle2, Clock, Gauge, RefreshCw, Timer, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_console/analytics")({
  validateSearch: (s: Record<string, unknown>): { dept?: string } => ({ dept: typeof s.dept === "string" ? s.dept : undefined }),
  head: () => ({ meta: [{ title: "Analytics & Reports — SmartCity Nexus" }, { name: "description", content: "Resolution times, SLA compliance and ward comparisons." }, { property: "og:title", content: "Analytics — SmartCity Nexus" }, { property: "og:description", content: "Operational analytics." }] }),
  component: Analytics,
});

function Analytics() {
  const { state, me } = useStore();
  const s = Route.useSearch();
  const init = { days: "30", ward: "all", dept: me?.role === "officer" ? me.departmentId! : s.dept ?? "all", category: "all", priority: "all", status: "all" };
  const [f, setF] = useState(init);
  const days = Number(f.days);
  const list = useMemo(() => {
    const from = new Date(Date.now() - days * 864e5).toISOString();
    return state.incidents.filter((i) => i.reportedAt >= from && (f.ward === "all" || i.ward === f.ward) && (f.dept === "all" || i.departmentId === f.dept) && (f.category === "all" || i.category === f.category) && (f.priority === "all" || i.priority === f.priority) && (f.status === "all" || i.status === f.status));
  }, [state.incidents, f, days]);
  const k = kpis(list);
  const deptName = (id: string | null) => state.departments.find((d) => d.id === id)?.name ?? "Unassigned";

  const deptPerf = state.departments.map((d) => {
    const m = list.filter((i) => i.departmentId === d.id);
    const res = m.filter((i) => i.resolvedAt);
    return { name: d.name, Resolved: res.length, Open: m.length - res.length, sla: res.length ? Math.round((res.filter((i) => i.resolvedAt! <= i.slaDeadline).length / res.length) * 100) : 0, avg: res.length ? Math.round(res.reduce((a, i) => a + hoursBetween(i.reportedAt, i.resolvedAt!), 0) / res.length) : 0, overdue: m.filter((i) => isOverdue(i)).length };
  });
  const buckets = [["<8h", 0, 8], ["8–24h", 8, 24], ["1–3d", 24, 72], ["3–7d", 72, 168], [">7d", 168, 1e9]] as const;
  const resDist = buckets.map(([name, a, b]) => ({ name, value: list.filter((i) => i.resolvedAt && hoursBetween(i.reportedAt, i.resolvedAt) >= a && hoursBetween(i.reportedAt, i.resolvedAt) < b).length }));
  const slaWeekly = Array.from({ length: Math.max(1, Math.ceil(days / 7)) }, (_, w) => {
    const end = Date.now() - w * 7 * 864e5, start = end - 7 * 864e5;
    const res = list.filter((i) => i.resolvedAt && +new Date(i.resolvedAt) >= start && +new Date(i.resolvedAt) < end);
    return { name: `W-${w}`, sla: res.length ? Math.round((res.filter((i) => i.resolvedAt! <= i.slaDeadline).length / res.length) * 100) : 0 };
  }).reverse();
  const wardCmp = WARDS.map((w) => ({ name: w.name, Open: list.filter((i) => i.ward === w.name && !i.resolvedAt).length, Resolved: list.filter((i) => i.ward === w.name && i.resolvedAt).length }));

  const reports = [
    { name: "Operations summary", period: `Last ${days} days` },
    { name: "Department performance", period: `Last ${days} days` },
    { name: "SLA compliance", period: `Last ${days} days` },
  ];
  const download = (name: string) => {
    const rows = name === "Department performance" ? deptPerf.map((d) => ({ department: d.name, resolved: d.Resolved, open: d.Open, overdue: d.overdue, avg_resolution_h: d.avg, sla_pct: d.sla }))
      : name === "SLA compliance" ? slaWeekly.map((w) => ({ week: w.name, sla_pct: w.sla }))
      : list.map((i) => ({ ref: i.ref, category: i.category, priority: i.priority, status: i.status, ward: i.ward, department: deptName(i.departmentId), reported_at: i.reportedAt, resolved_at: i.resolvedAt ?? "" }));
    downloadFile(`${name.toLowerCase().replace(/ /g, "-")}.csv`, toCsv(rows));
    toast.success(`${name} downloaded`);
  };

  const Sel = (key: keyof typeof f, label: string, opts: { v: string; l: string }[], all = true) => (
    <Select value={f[key]} onValueChange={(v) => setF({ ...f, [key]: v })} disabled={key === "dept" && me?.role === "officer"}>
      <SelectTrigger className="h-8 w-auto min-w-[120px] text-xs" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent>{all && <SelectItem value="all">All {label}</SelectItem>}{opts.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader title="Analytics & reports" description={`${list.length} incidents in selection · computed from demo data`} />
      <div className="mb-4 flex flex-wrap gap-2 rounded-lg border bg-card p-3 shadow-card">
        {Sel("days", "range", [{ v: "7", l: "Last 7 days" }, { v: "30", l: "Last 30 days" }, { v: "45", l: "Last 45 days" }, { v: "90", l: "Last 90 days" }], false)}
        {Sel("ward", "wards", WARDS.map((w) => ({ v: w.name, l: w.name })))}
        {Sel("dept", "departments", state.departments.map((d) => ({ v: d.id, l: d.name })))}
        {Sel("category", "categories", CATEGORIES.map((v) => ({ v, l: v })))}
        {Sel("priority", "priorities", PRIORITIES.map((v) => ({ v, l: v })))}
        {Sel("status", "statuses", STATUSES.map((v) => ({ v, l: v })))}
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setF(init)}><RotateCcw className="h-3.5 w-3.5" />Reset</Button>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Total reports" value={k.total} icon={BarChart3} />
        <KpiCard label="Resolution rate" value={`${k.total ? Math.round((k.resolved / k.total) * 100) : 0}%`} icon={CheckCircle2} tone="success" />
        <KpiCard label="Median resolution" value={`${k.medianRes}h`} icon={Clock} />
        <KpiCard label="Avg resolution" value={`${k.avgRes}h`} icon={Timer} />
        <KpiCard label="Overdue" value={`${k.total ? Math.round((k.overdue / k.total) * 100) : 0}%`} icon={AlertTriangle} tone="critical" />
        <KpiCard label="SLA compliance" value={`${k.sla}%`} icon={Gauge} tone="success" />
        <KpiCard label="Reopened" value={k.reopened} icon={RefreshCw} tone="warning" />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Incident trend" className="xl:col-span-2"><TrendChart data={dailyTrend(list, days)} /></Panel>
        <Panel title="Priority breakdown"><Donut data={countBy(list, (i) => i.priority)} colors={PRIO_COLORS} height={240} /></Panel>
        <Panel title="Category distribution"><HBar data={countBy(list, (i) => i.category)} /></Panel>
        <Panel title="Ward comparison" className="xl:col-span-2"><VBar data={wardCmp} keys={[{ key: "Open", name: "Open", color: "var(--chart-1)" }, { key: "Resolved", name: "Resolved", color: "var(--chart-2)" }]} /></Panel>
        <Panel title="Department workload" className="xl:col-span-2"><VBar data={deptPerf} keys={[{ key: "Open", name: "Open", color: "var(--chart-1)" }, { key: "Resolved", name: "Resolved", color: "var(--chart-2)" }]} /></Panel>
        <Panel title="Resolution-time distribution"><VBar data={resDist} keys={[{ key: "value", name: "Incidents", color: "var(--chart-3)" }]} /></Panel>
        <Panel title="SLA performance over time" className="xl:col-span-1"><LineSeries data={slaWeekly} dataKey="sla" name="SLA %" domain={[0, 100]} /></Panel>
        <Panel title="Department resolution performance" className="xl:col-span-2" bodyClassName="p-0">
          <Table><TableHeader><TableRow className="text-xs"><TableHead>Department</TableHead><TableHead>Resolved</TableHead><TableHead>Open</TableHead><TableHead>Overdue</TableHead><TableHead>Avg (h)</TableHead><TableHead>SLA</TableHead></TableRow></TableHeader>
            <TableBody>{deptPerf.map((d) => <TableRow key={d.name} className="text-[13px]"><TableCell>{d.name}</TableCell><TableCell>{d.Resolved}</TableCell><TableCell>{d.Open}</TableCell><TableCell>{d.overdue}</TableCell><TableCell>{d.avg}</TableCell><TableCell>{d.sla}%</TableCell></TableRow>)}</TableBody></Table>
        </Panel>
      </div>
      <Panel title="Reports" className="mt-4" bodyClassName="p-0">
        <Table><TableHeader><TableRow className="text-xs"><TableHead>Report</TableHead><TableHead>Period</TableHead><TableHead>Generated</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{reports.map((r) => <TableRow key={r.name} className="text-[13px]"><TableCell className="font-medium">{r.name}</TableCell><TableCell>{r.period}</TableCell><TableCell>On demand</TableCell><TableCell><span className="text-success">Ready</span></TableCell><TableCell className="text-right"><Button size="sm" variant="outline" onClick={() => download(r.name)}><Download className="h-3.5 w-3.5" />CSV</Button></TableCell></TableRow>)}</TableBody></Table>
      </Panel>
    </div>
  );
}
