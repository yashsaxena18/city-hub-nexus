import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, Gauge, Hourglass, Loader } from "lucide-react";
import { toast } from "sonner";
import { KpiCard, PageHeader, Panel } from "@/components/app/ui-bits";
import { TaskList } from "@/components/app/TaskList";
import { Donut, PRIO_COLORS, VBar } from "@/components/app/charts";
import { useIncidentDialogs } from "@/components/app/IncidentDialogs";
import { PhotoInput } from "@/components/app/PhotoInput";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLookups, useStore, isOverdue } from "@/lib/store";
import { countBy, kpis } from "@/lib/metrics";
import { OPEN_STATUSES } from "@/lib/types";
import { relTime } from "@/lib/format";

export const Route = createFileRoute("/_console/officer")({
  head: () => ({ meta: [{ title: "Department Desk — SmartCity Nexus" }, { name: "description", content: "Department officer queue, workload and SLA performance." }, { property: "og:title", content: "Department Desk — SmartCity Nexus" }, { property: "og:description", content: "Officer dashboard." }] }),
  component: Officer,
});

function Officer() {
  const { state, me, actions } = useStore();
  const L = useLookups();
  const dlg = useIncidentDialogs();
  const dept = L.dept(me!.departmentId);
  const mine = useMemo(() => state.incidents.filter((i) => i.departmentId === me!.departmentId), [state.incidents, me]);
  const k = kpis(mine);
  const open = mine.filter((i) => OPEN_STATUSES.includes(i.status));
  const assignedToMe = open.filter((i) => i.officerId === me!.id);
  const awaiting = open.filter((i) => i.status === "Assigned");
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const workers = state.users.filter((u) => u.role === "field" && u.departmentId === me!.departmentId);
  const workload = workers.map((w) => ({ name: w.name.split(" ")[0], Open: open.filter((i) => i.workerId === w.id).length, Overdue: open.filter((i) => i.workerId === w.id && isOverdue(i)).length }));

  const acts = (i: (typeof mine)[number]) => (
    <>
      {i.status === "Assigned" && <Button size="sm" onClick={() => { actions.setStatus(i.id, "Acknowledged"); toast.success("Assignment acknowledged"); }}>Acknowledge</Button>}
      {(i.status === "Acknowledged" || i.status === "Reopened") && <Button size="sm" onClick={() => { actions.setStatus(i.id, "In Progress"); toast.success("Work started"); }}>Start work</Button>}
      <Select value={i.workerId ?? ""} onValueChange={(w) => { actions.assignWorker(i.id, w); toast.success("Field worker assigned"); }}>
        <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Assign crew" /></SelectTrigger>
        <SelectContent>{workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
      </Select>
      <Button size="sm" variant="outline" onClick={() => dlg.open("note", i)}>Progress</Button>
      <PhotoInput label="Evidence" onAdd={(u) => { actions.addPhotos(i.id, "photos", u); toast.success("Evidence uploaded"); }} />
      <Button size="sm" variant="outline" onClick={() => dlg.open("reassign", i)}>Reassign</Button>
      <Button size="sm" variant="outline" className="text-destructive" onClick={() => dlg.open("escalate", i)}>Escalate</Button>
      {i.status === "In Progress" && <Button size="sm" variant="secondary" onClick={() => { actions.setStatus(i.id, "Resolved", "Submitted for verification by department"); toast.success("Submitted for verification"); }}>Submit for verification</Button>}
    </>
  );

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader eyebrow="Department desk" title={dept?.name ?? "Department"} description={dept?.description} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Assigned" value={open.length} icon={ClipboardList} />
        <KpiCard label="Awaiting ack." value={awaiting.length} icon={Hourglass} tone="warning" />
        <KpiCard label="In progress" value={k.inProgress} icon={Loader} />
        <KpiCard label="Overdue" value={k.overdue} icon={AlertTriangle} tone="critical" />
        <KpiCard label="Resolved this week" value={mine.filter((i) => i.resolvedAt && i.resolvedAt >= weekAgo).length} icon={CheckCircle2} tone="success" />
        <KpiCard label="Avg resolution" value={`${k.avgRes}h`} icon={Clock} />
        <KpiCard label="SLA performance" value={`${k.sla}%`} icon={Gauge} tone="success" />
      </div>
      <Panel className="mt-4" bodyClassName="p-0">
        <Tabs defaultValue="queue">
          <div className="border-b px-4 pt-3"><TabsList><TabsTrigger value="queue">Department queue ({open.length})</TabsTrigger><TabsTrigger value="mine">Assigned to me ({assignedToMe.length})</TabsTrigger><TabsTrigger value="overdue">Overdue ({k.overdue})</TabsTrigger></TabsList></div>
          <TabsContent value="queue" className="m-0"><TaskList items={open} actions={acts} empty="Queue is clear" /></TabsContent>
          <TabsContent value="mine" className="m-0"><TaskList items={assignedToMe} actions={acts} /></TabsContent>
          <TabsContent value="overdue" className="m-0"><TaskList items={open.filter((i) => isOverdue(i))} actions={acts} empty="Nothing overdue" /></TabsContent>
        </Tabs>
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Crew workload"><VBar data={workload} height={220} keys={[{ key: "Open", name: "Open", color: "var(--chart-1)" }, { key: "Overdue", name: "Overdue", color: "var(--chart-5)" }]} /></Panel>
        <Panel title="Priority distribution"><Donut data={countBy(open, (i) => i.priority)} colors={PRIO_COLORS} height={220} /></Panel>
        <Panel title="Recent activity">
          <ul className="space-y-2.5">{mine.flatMap((i) => i.timeline.map((t) => ({ ...t, ref: i.ref }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 7).map((t) => <li key={t.id}><div className="text-xs font-medium">{t.message}</div><div className="text-[11px] text-muted-foreground">{t.ref} · {relTime(t.at)}</div></li>)}</ul>
        </Panel>
      </div>
      {dlg.node}
    </div>
  );
}
