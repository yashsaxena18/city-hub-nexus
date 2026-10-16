import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Gauge, Timer, Zap } from "lucide-react";
import { toast } from "sonner";
import { DemoBadge, KpiCard, PageHeader, Panel, PriorityBadge, StatusBadge } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useStore, isOverdue } from "@/lib/store";
import { kpis } from "@/lib/metrics";
import { relTime } from "@/lib/format";
import type { SlaRule } from "@/lib/types";

export const Route = createFileRoute("/_console/admin/sla")({
  head: () => ({ meta: [{ title: "SLA & Escalations — SmartCity Nexus" }, { name: "description", content: "Configure SLA targets and review escalations." }, { property: "og:title", content: "SLA & Escalations — SmartCity Nexus" }, { property: "og:description", content: "SLA management." }] }),
  component: Sla,
});

function Sla() {
  const { state, actions } = useStore();
  const [draft, setDraft] = useState<Record<string, SlaRule>>({});
  const [confirm, setConfirm] = useState(false);
  const k = kpis(state.incidents);
  const overdue = state.incidents.filter((i) => isOverdue(i) && i.status !== "Escalated");
  const escalated = state.incidents.filter((i) => i.status === "Escalated");
  const atRisk = state.incidents.filter((i) => !isOverdue(i) && ["Assigned", "Acknowledged", "In Progress"].includes(i.status) && +new Date(i.slaDeadline) - Date.now() < 12 * 3600_000);

  const save = (p: string) => {
    const r = draft[p];
    if (!r || r.ackHours <= 0 || r.resolveHours <= r.ackHours) return toast.error("Resolution target must exceed acknowledgement target, both positive");
    actions.updateSla(r);
    setDraft((d) => { const n = { ...d }; delete n[p]; return n; });
    toast.success(`${p} SLA updated (applies to priority changes and new reports)`);
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="SLA & escalations" description="Targets per priority and incidents breaching them." actions={<><DemoBadge>Simulated scheduler</DemoBadge><Button variant="destructive" disabled={!overdue.length} onClick={() => setConfirm(true)}><Zap className="h-4 w-4" />Run escalation check</Button></>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="SLA compliance" value={`${k.sla}%`} icon={Gauge} tone="success" />
        <KpiCard label="Breached, not escalated" value={overdue.length} icon={AlertTriangle} tone="critical" />
        <KpiCard label="Escalated" value={escalated.length} icon={Zap} tone="warning" />
        <KpiCard label="At risk (<12h)" value={atRisk.length} icon={Timer} tone="warning" />
      </div>
      <Panel title="SLA rules" className="mt-4" bodyClassName="p-0">
        <Table>
          <TableHeader><TableRow className="text-xs"><TableHead>Priority</TableHead><TableHead>Acknowledge (h)</TableHead><TableHead>Resolve (h)</TableHead><TableHead>Escalate to</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{state.sla.map((r) => { const d = draft[r.priority] ?? r; return (
            <TableRow key={r.priority}>
              <TableCell><PriorityBadge priority={r.priority} /></TableCell>
              <TableCell><Input type="number" min={1} className="h-8 w-24" value={d.ackHours} onChange={(e) => setDraft({ ...draft, [r.priority]: { ...d, ackHours: Number(e.target.value) } })} /></TableCell>
              <TableCell><Input type="number" min={1} className="h-8 w-24" value={d.resolveHours} onChange={(e) => setDraft({ ...draft, [r.priority]: { ...d, resolveHours: Number(e.target.value) } })} /></TableCell>
              <TableCell><Input className="h-8 w-56" value={d.escalateTo} onChange={(e) => setDraft({ ...draft, [r.priority]: { ...d, escalateTo: e.target.value } })} /></TableCell>
              <TableCell className="text-right"><Button size="sm" disabled={!draft[r.priority]} onClick={() => save(r.priority)}>Save</Button></TableCell>
            </TableRow>); })}</TableBody>
        </Table>
      </Panel>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Breached — awaiting escalation" bodyClassName="p-0">
          <ul className="divide-y">{overdue.slice(0, 12).map((i) => <li key={i.id} className="flex items-center gap-3 px-4 py-2 text-sm"><span className="font-mono text-xs text-muted-foreground">{i.ref}</span><Link to="/incidents/$id" params={{ id: i.id }} className="flex-1 truncate hover:text-primary">{i.title}</Link><span className="text-xs text-critical">due {relTime(i.slaDeadline)}</span><Button size="sm" variant="outline" onClick={() => { actions.escalate(i.id, "Resolution SLA breached", true); toast.success(`${i.ref} escalated (simulated)`); }}>Escalate</Button></li>)}
          {!overdue.length && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No unescalated breaches.</li>}</ul>
        </Panel>
        <Panel title="Escalated incidents" bodyClassName="p-0">
          <ul className="divide-y">{escalated.slice(0, 12).map((i) => <li key={i.id} className="flex items-center gap-3 px-4 py-2 text-sm"><span className="font-mono text-xs text-muted-foreground">{i.ref}</span><Link to="/incidents/$id" params={{ id: i.id }} className="flex-1 truncate hover:text-primary">{i.title}</Link><StatusBadge status={i.status} /></li>)}</ul>
        </Panel>
      </div>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Run simulated escalation check?</AlertDialogTitle><AlertDialogDescription>{overdue.length} breached incidents will be escalated per SLA rules, generating timeline events, notifications and audit entries. No real background scheduler is running.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { overdue.forEach((i) => actions.escalate(i.id, "Resolution SLA breached", true)); toast.success(`${overdue.length} incidents escalated (simulated)`); }}>Run check</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
