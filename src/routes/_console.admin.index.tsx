import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, FilePlus2, Flame, Gauge, Hourglass, Loader } from "lucide-react";
import { KpiCard, PageHeader, Panel, PriorityBadge, StatusBadge, OverdueFlag } from "@/components/app/ui-bits";
import { MapLegend, MapView } from "@/components/app/MapView";
import { Donut, HBar, PRIO_COLORS, TrendChart, VBar } from "@/components/app/charts";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLookups, useStore, isOverdue } from "@/lib/store";
import { countBy, dailyTrend, kpis } from "@/lib/metrics";
import { CATEGORIES, OPEN_STATUSES, PRIORITIES } from "@/lib/types";
import { fmtDateTime, relTime } from "@/lib/format";

export const Route = createFileRoute("/_console/admin/")({
  head: () => ({ meta: [{ title: "Command Centre — SmartCity Nexus" }, { name: "description", content: "Real-time overview of city incidents, SLAs and department workload." }, { property: "og:title", content: "Command Centre — SmartCity Nexus" }, { property: "og:description", content: "City-wide operations overview." }] }),
  component: CommandCentre,
});

function CommandCentre() {
  const { state } = useStore();
  const L = useLookups();
  const navigate = useNavigate();
  const list = state.incidents;
  const k = useMemo(() => kpis(list), [list]);
  const trend = useMemo(() => dailyTrend(list, 30), [list]);
  const [cat, setCat] = useState("all");
  const [prio, setPrio] = useState("all");
  const [sel, setSel] = useState<string | null>(null);
  const mapList = useMemo(() => list.filter((i) => OPEN_STATUSES.includes(i.status) && (cat === "all" || i.category === cat) && (prio === "all" || i.priority === prio)), [list, cat, prio]);
  const selected = list.find((i) => i.id === sel);

  const deptLoad = state.departments.map((d) => {
    const mine = list.filter((i) => i.departmentId === d.id);
    return { name: d.name.replace(" and ", " & "), Open: mine.filter((i) => OPEN_STATUSES.includes(i.status)).length, Overdue: mine.filter((i) => isOverdue(i)).length, Resolved: mine.filter((i) => i.status === "Resolved" || i.status === "Closed").length };
  });
  const toList = (search: Record<string, string>) => navigate({ to: "/incidents", search });

  const critical = list.filter((i) => i.priority === "Critical" && OPEN_STATUSES.includes(i.status)).slice(0, 5);
  const overdue = list.filter((i) => isOverdue(i)).sort((a, b) => a.slaDeadline.localeCompare(b.slaDeadline)).slice(0, 6);
  const activity = list.flatMap((i) => i.timeline.map((t) => ({ ...t, inc: i }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);
  const resolvedRecent = list.filter((i) => i.resolvedAt).sort((a, b) => b.resolvedAt!.localeCompare(a.resolvedAt!)).slice(0, 5);

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        eyebrow="Command Centre"
        title="City operations overview"
        description="Live picture of incidents across all wards and departments. Metrics are computed from the current demo dataset."
        actions={
          <>
            <Button variant="outline" asChild><Link to="/analytics">Analytics</Link></Button>
            <Button asChild><Link to="/incidents" search={{ status: "Submitted" }}><ClipboardList className="h-4 w-4" />Triage queue</Link></Button>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <KpiCard index={0} label="Total incidents" value={k.total} icon={ClipboardList} delta={k.weekDelta} hint="vs prev. week" onClick={() => toList({})} />
        <KpiCard index={1} label="New reports" value={k.newReports} icon={FilePlus2} hint="Awaiting review" onClick={() => toList({ status: "Submitted" })} />
        <KpiCard index={2} label="Awaiting assignment" value={k.awaiting} icon={Hourglass} tone="warning" hint="No department" onClick={() => toList({ unassigned: "1" })} />
        <KpiCard index={3} label="In progress" value={k.inProgress} icon={Loader} hint="Ack. or active" onClick={() => toList({ status: "In Progress" })} />
        <KpiCard index={4} label="Critical" value={k.critical} icon={Flame} tone="critical" hint="Open critical" onClick={() => toList({ priority: "Critical" })} />
        <KpiCard index={5} label="Overdue" value={k.overdue} icon={AlertTriangle} tone="critical" hint="Past SLA deadline" onClick={() => toList({ overdue: "1" })} />
        <KpiCard index={6} label="Resolved" value={k.resolved} icon={CheckCircle2} tone="success" hint="Resolved + closed" onClick={() => toList({ status: "Resolved" })} />
        <KpiCard index={7} label="SLA compliance" value={`${k.sla}%`} icon={Gauge} tone="success" hint="Resolved within SLA" onClick={() => navigate({ to: "/admin/sla" })} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Incident trend" description="Reported vs resolved, last 30 days" className="xl:col-span-2">
          <TrendChart data={trend} height={260} />
        </Panel>
        <Panel title="Priority breakdown" description="Open incidents · click to filter">
          <Donut data={countBy(list.filter((i) => OPEN_STATUSES.includes(i.status)), (i) => i.priority)} colors={PRIO_COLORS} height={260} onClick={(p) => toList({ priority: p })} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          title="Live incident map"
          description={`${mapList.length} open incidents`}
          className="xl:col-span-2"
          bodyClassName="p-0"
          actions={
            <div className="flex gap-2">
              <Select value={cat} onValueChange={setCat}><SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
              <Select value={prio} onValueChange={setPrio}><SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All priorities</SelectItem>{PRIORITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
            </div>
          }
        >
          <div className="relative">
            <MapView incidents={mapList} selectedId={sel} onSelect={setSel} className="h-[400px] w-full rounded-b-lg" />
            {selected && (
              <div className="absolute bottom-3 left-3 z-[400] w-72 rounded-lg border bg-card p-3 shadow-elevated">
                <div className="flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">{selected.ref}</span><StatusBadge status={selected.status} /></div>
                <div className="mt-1 text-sm font-medium">{selected.title}</div>
                <div className="mt-1 text-xs text-muted-foreground">{selected.location}</div>
                <div className="mt-2 flex items-center justify-between"><PriorityBadge priority={selected.priority} /><Link to="/incidents/$id" params={{ id: selected.id }} className="text-xs font-medium text-primary hover:underline">Open details →</Link></div>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t px-4 py-2"><MapLegend /><Link to="/map" className="text-xs font-medium text-primary hover:underline">Open full map →</Link></div>
        </Panel>
        <Panel title="Critical alerts" description="Open critical incidents" actions={<span className="rounded bg-critical/10 px-1.5 py-0.5 font-mono text-xs text-critical">{k.critical}</span>}>
          <ul className="space-y-2">
            {critical.map((i) => (
              <li key={i.id}>
                <Link to="/incidents/$id" params={{ id: i.id }} className="block rounded-md border border-critical/20 bg-critical/5 p-2.5 hover:border-critical/50">
                  <div className="flex items-center justify-between text-[11px]"><span className="font-mono text-muted-foreground">{i.ref}</span><span className="text-critical">{relTime(i.reportedAt)}</span></div>
                  <div className="mt-0.5 text-sm font-medium">{i.title}</div>
                  <div className="text-xs text-muted-foreground">{i.ward} · {L.dept(i.departmentId)?.name ?? "Unassigned"}</div>
                </Link>
              </li>
            ))}
            {!critical.length && <li className="py-8 text-center text-sm text-muted-foreground">No open critical incidents.</li>}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Department workload" className="xl:col-span-2">
          <VBar data={deptLoad} height={280} keys={[{ key: "Open", name: "Open", color: "var(--chart-1)" }, { key: "Overdue", name: "Overdue", color: "var(--chart-5)" }, { key: "Resolved", name: "Resolved", color: "var(--chart-2)" }]} />
        </Panel>
        <Panel title="Category distribution" description="Click a bar to filter">
          <HBar data={countBy(list, (i) => i.category)} height={280} onClick={(c) => toList({ category: c })} />
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <Panel title="Overdue tasks" actions={<Link to="/incidents" search={{ overdue: "1" }} className="text-xs text-primary hover:underline">All</Link>}>
          <ul className="divide-y text-sm">
            {overdue.map((i) => (
              <li key={i.id} className="py-2"><Link to="/incidents/$id" params={{ id: i.id }} className="block hover:text-primary"><div className="truncate font-medium">{i.title}</div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="font-mono">{i.ref}</span>· due {relTime(i.slaDeadline)}</div></Link></li>
            ))}
            {!overdue.length && <li className="py-6 text-center text-muted-foreground">Nothing overdue.</li>}
          </ul>
        </Panel>
        <Panel title="Recent activity">
          <ul className="space-y-3 text-sm">
            {activity.map((a) => (
              <li key={a.id} className="flex gap-2"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" /><div className="min-w-0"><Link to="/incidents/$id" params={{ id: a.inc.id }} className="block truncate text-xs font-medium hover:text-primary">{a.message}</Link><div className="text-[11px] text-muted-foreground">{a.inc.ref} · {a.actor} · {relTime(a.at)}</div></div></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Recently resolved">
          <ul className="divide-y text-sm">
            {resolvedRecent.map((i) => (
              <li key={i.id} className="py-2"><Link to="/incidents/$id" params={{ id: i.id }} className="block hover:text-primary"><div className="truncate font-medium">{i.title}</div><div className="text-xs text-muted-foreground">{i.ward} · {fmtDateTime(i.resolvedAt)}</div></Link></li>
            ))}
          </ul>
        </Panel>
        <Panel title="Admin actions" actions={<Link to="/admin/audit-logs" className="text-xs text-primary hover:underline">Audit log</Link>}>
          <ul className="space-y-2.5 text-sm">
            {state.audit.slice(0, 6).map((a) => (
              <li key={a.id}><div className="text-xs font-medium">{a.action} <span className="font-mono text-muted-foreground">{a.target}</span></div><div className="text-[11px] text-muted-foreground">{a.actor} · {relTime(a.at)}</div></li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
