import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Brain, Download, FileText, Flag, MapPin, MessageSquarePlus, Pencil, Send, Upload, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { DemoBadge, EmptyState, OverdueFlag, Panel, PriorityBadge, StatusBadge } from "@/components/app/ui-bits";
import { MapView } from "@/components/app/MapView";
import { useIncidentDialogs } from "@/components/app/IncidentDialogs";
import { PhotoInput } from "@/components/app/PhotoInput";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLookups, useStore, isOverdue } from "@/lib/store";
import { downloadFile, fmtDateTime, relTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/incidents/$id")({
  head: () => ({ meta: [{ title: "Incident details — SmartCity Nexus" }, { name: "description", content: "Incident details, SLA progress and full activity timeline." }, { property: "og:title", content: "Incident details — SmartCity Nexus" }, { property: "og:description", content: "Incident timeline and actions." }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { state, me, actions } = useStore();
  const L = useLookups();
  const navigate = useNavigate();
  const dlg = useIncidentDialogs();
  const inc = state.incidents.find((i) => i.id === id);
  if (!inc || !me) return <EmptyState title="Incident not found" description="It may have been removed or the link is incorrect." action={<Button asChild><Link to="/incidents">Back to incidents</Link></Button>} />;
  if (me.role === "citizen" && inc.reporterId !== me.id) return <EmptyState title="Not available" description="Citizens can view only their own reports." action={<Button asChild><Link to="/citizen">My dashboard</Link></Button>} />;

  const isAdmin = me.role === "admin";
  const isStaff = me.role !== "citizen";
  const start = new Date(inc.reportedAt).getTime();
  const end = new Date(inc.slaDeadline).getTime();
  const stop = inc.resolvedAt ? new Date(inc.resolvedAt).getTime() : Date.now();
  const pct = Math.min(100, Math.max(0, ((stop - start) / (end - start)) * 100));
  const reporter = L.user(inc.reporterId);

  const exportDetails = () => {
    const lines = [
      `SmartCity Nexus — Incident ${inc.ref}`, `Title: ${inc.title}`, `Category: ${inc.category}`, `Priority: ${inc.priority}`, `Status: ${inc.status}`,
      `Location: ${inc.location} (${inc.lat.toFixed(5)}, ${inc.lng.toFixed(5)})`, `Ward: ${inc.ward}`, `Department: ${L.dept(inc.departmentId)?.name ?? "Unassigned"}`,
      `Reported: ${inc.reportedAt}`, `SLA deadline: ${inc.slaDeadline}`, "", "Description:", inc.description, "", "Timeline:",
      ...inc.timeline.map((t) => `- ${t.at} · ${t.actor}: ${t.message}`),
    ];
    downloadFile(`${inc.ref}.txt`, lines.join("\n"), "text/plain");
    toast.success("Incident details exported");
  };

  return (
    <div className="mx-auto max-w-[1400px]">
      <button onClick={() => history.length > 1 ? history.back() : navigate({ to: "/incidents" })} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Back</button>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm text-muted-foreground">{inc.ref}</span><StatusBadge status={inc.status} /><PriorityBadge priority={inc.priority} /><OverdueFlag incident={inc} /></div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{inc.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{inc.category} · {inc.location}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin && <Button size="sm" onClick={() => dlg.open("assign", inc)}><UserPlus className="h-4 w-4" />{inc.departmentId ? "Reassign" : "Assign"}</Button>}
          {isAdmin && <Button size="sm" variant="outline" onClick={() => dlg.open("priority", inc)}><Flag className="h-4 w-4" />Priority</Button>}
          {isStaff && <Button size="sm" variant="outline" onClick={() => dlg.open("status", inc)}><Pencil className="h-4 w-4" />Status</Button>}
          {isStaff && <Button size="sm" variant="outline" onClick={() => dlg.open("note", inc)}><MessageSquarePlus className="h-4 w-4" />Note</Button>}
          {(isAdmin || me.role === "officer") && <Button size="sm" variant="outline" className="text-destructive" onClick={() => dlg.open("escalate", inc)}>Escalate</Button>}
          <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/map", search: { focus: inc.id } })}><MapPin className="h-4 w-4" />Map</Button>
          <Button size="sm" variant="ghost" onClick={exportDetails}><Download className="h-4 w-4" />Export</Button>
          {me.role === "citizen" && inc.status === "Resolved" && <Button size="sm" variant="outline" onClick={() => { actions.setStatus(inc.id, "Reopened", "Citizen reports issue persists"); toast.success("Report reopened"); }}>Issue persists — reopen</Button>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel title="Description">
            <p className="text-sm leading-relaxed">{inc.description}</p>
            {inc.resolutionNotes && <div className="mt-4 rounded-md border border-success/30 bg-success/5 p-3 text-sm"><div className="text-xs font-semibold text-success">Resolution notes</div>{inc.resolutionNotes}</div>}
          </Panel>
          <Panel title="Photographs" actions={isStaff && <PhotoInput label="Upload evidence" onAdd={(u) => { actions.addPhotos(inc.id, "photos", u); toast.success("Evidence uploaded"); }} />}>
            {[...inc.photos, ...inc.beforePhotos, ...inc.afterPhotos].length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[...inc.photos.map((p) => ["Report", p]), ...inc.beforePhotos.map((p) => ["Before", p]), ...inc.afterPhotos.map((p) => ["After", p])].map(([l, p], k) => (
                  <figure key={k} className="overflow-hidden rounded-md border"><img src={p} alt={`${l} photograph`} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="px-2 py-1 text-[11px] text-muted-foreground">{l}</figcaption></figure>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No photographs attached.</p>
            )}
          </Panel>
          <Panel title="Activity timeline" description={`${inc.timeline.length} events`}>
            <ol id="timeline" className="relative space-y-4 border-l pl-5">
              {[...inc.timeline].reverse().map((t) => (
                <li key={t.id} className="relative">
                  <span className={cn("absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-card", t.type === "escalated" ? "bg-critical" : t.type === "resolved" || t.type === "closed" ? "bg-success" : t.type === "ai" ? "bg-info" : "bg-primary")} />
                  <div className="text-sm">{t.message}</div>
                  <div className="text-xs text-muted-foreground">{t.actor} · {fmtDateTime(t.at)} ({relTime(t.at)})</div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="SLA" actions={isOverdue(inc) ? <span className="text-xs font-semibold text-critical">Breached</span> : undefined}>
            <Progress value={pct} className={cn("h-2", pct >= 100 && "[&>div]:bg-critical", pct >= 75 && pct < 100 && "[&>div]:bg-warning")} />
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-muted-foreground">Reported</dt><dd className="text-right">{fmtDateTime(inc.reportedAt)}</dd>
              <dt className="text-muted-foreground">Acknowledge by</dt><dd className="text-right">{fmtDateTime(inc.ackDeadline)}</dd>
              <dt className="text-muted-foreground">Resolve by</dt><dd className="text-right">{fmtDateTime(inc.slaDeadline)}</dd>
              <dt className="text-muted-foreground">Resolved</dt><dd className="text-right">{fmtDateTime(inc.resolvedAt)}</dd>
            </dl>
          </Panel>
          <Panel title="Assignment">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Department</dt><dd>{L.dept(inc.departmentId)?.name ?? "Unassigned"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Officer</dt><dd>{L.user(inc.officerId)?.name ?? "—"}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Field worker</dt><dd>{L.user(inc.workerId)?.name ?? "—"}</dd></div>
            </dl>
          </Panel>
          <Panel title="Location" bodyClassName="p-0">
            <MapView incidents={[inc]} selectedId={inc.id} cluster={false} center={[inc.lat, inc.lng]} zoom={15} className="h-48 w-full" />
            <div className="px-4 py-2 text-xs text-muted-foreground">{inc.location} · Ward {inc.ward}<br /><span className="font-mono">{inc.lat.toFixed(5)}, {inc.lng.toFixed(5)}</span></div>
          </Panel>
          {isStaff && (
            <Panel title="Reporter">
              <div className="text-sm">{reporter?.name ?? "Anonymous"}</div>
              {isAdmin && <div className="text-xs text-muted-foreground">{reporter?.email} · {reporter?.phone}</div>}
              {!isAdmin && <div className="text-xs text-muted-foreground">Contact details visible to administrators only.</div>}
            </Panel>
          )}
          {isStaff && (
            <Panel title={<span className="flex items-center gap-2"><Brain className="h-4 w-4 text-info" />AI assessment <DemoBadge>Simulated</DemoBadge></span>}>
              {inc.ai ? (
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Category</span>{inc.ai.category}</div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Priority</span>{inc.ai.priority}</div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Review</span>{inc.ai.review}</div>
                  <p className="pt-1 text-xs text-muted-foreground">{inc.ai.explanation}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No assessment yet.</p>
              )}
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => { actions.runAssessment(inc.id); toast.success("Rule-based assessment generated"); }}><Send className="h-3.5 w-3.5" />{inc.ai ? "Reassess" : "Assess"}</Button>
                {isAdmin && <Button size="sm" variant="ghost" asChild><Link to="/admin/ai-intelligence" search={{ id: inc.id }}><FileText className="h-3.5 w-3.5" />Review</Link></Button>}
              </div>
            </Panel>
          )}
        </div>
      </div>
      {dlg.node}
      <span className="hidden"><Upload /></span>
    </div>
  );
}
