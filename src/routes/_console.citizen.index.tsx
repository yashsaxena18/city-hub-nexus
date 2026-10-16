import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ClipboardList, Hourglass, Loader, Plus, Camera, MapPin, FileText } from "lucide-react";
import { EmptyState, KpiCard, PageHeader, Panel, StatusBadge } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { useStore, visibleNotifications } from "@/lib/store";
import { fmtDate, relTime } from "@/lib/format";

export const Route = createFileRoute("/_console/citizen/")({
  head: () => ({ meta: [{ title: "My Dashboard — SmartCity Nexus" }, { name: "description", content: "Track your civic issue reports." }, { property: "og:title", content: "Citizen Dashboard — SmartCity Nexus" }, { property: "og:description", content: "Your reports and updates." }] }),
  component: Citizen,
});

function Citizen() {
  const { state, me } = useStore();
  const mine = state.incidents.filter((i) => i.reporterId === me!.id);
  const pending = mine.filter((i) => ["Submitted", "Under Review", "Assigned", "Acknowledged", "Reopened"].includes(i.status)).length;
  const prog = mine.filter((i) => i.status === "In Progress" || i.status === "Escalated").length;
  const res = mine.filter((i) => i.status === "Resolved" || i.status === "Closed").length;
  const notes = visibleNotifications(state.notifications, me).slice(0, 5);
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader eyebrow="Citizen portal" title={`Welcome, ${me!.name.split(" ")[0]}`} description="Report issues in your neighbourhood and follow them to resolution." actions={<Button asChild><Link to="/citizen/report"><Plus className="h-4 w-4" />Report new issue</Link></Button>} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total reports" value={mine.length} icon={ClipboardList} />
        <KpiCard label="Pending" value={pending} icon={Hourglass} tone="warning" />
        <KpiCard label="In progress" value={prog} icon={Loader} />
        <KpiCard label="Resolved" value={res} icon={CheckCircle2} tone="success" />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Recent reports" className="lg:col-span-2" actions={<Link to="/incidents" className="text-xs text-primary hover:underline">View all</Link>} bodyClassName="p-0">
          {mine.length ? (
            <ul className="divide-y">
              {mine.slice(0, 8).map((i) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{i.ref}</span><StatusBadge status={i.status} /></div>
                    <div className="mt-0.5 truncate text-sm font-medium">{i.title}</div>
                    <div className="text-xs text-muted-foreground">{i.category} · {i.location} · {fmtDate(i.reportedAt)}</div>
                    <div className="text-xs text-muted-foreground">Latest: {i.timeline.at(-1)?.message} ({relTime(i.timeline.at(-1)!.at)})</div>
                  </div>
                  <Button size="sm" variant="outline" asChild><Link to="/incidents/$id" params={{ id: i.id }}>View details</Link></Button>
                </li>
              ))}
            </ul>
          ) : <div className="p-4"><EmptyState title="No reports yet" description="Your submitted issues will appear here." action={<Button asChild><Link to="/citizen/report">Report an issue</Link></Button>} /></div>}
        </Panel>
        <div className="space-y-4">
          <Panel title="Notifications" actions={<Link to="/notifications" className="text-xs text-primary hover:underline">All</Link>}>
            <ul className="space-y-2.5 text-sm">{notes.map((n) => <li key={n.id}><div className="text-xs font-medium">{n.title}</div><div className="text-xs text-muted-foreground">{n.body}</div></li>)}{!notes.length && <li className="text-xs text-muted-foreground">No notifications.</li>}</ul>
          </Panel>
          <Panel title="How to write a good report">
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-primary" />Drop the pin exactly where the issue is.</li>
              <li className="flex gap-2"><Camera className="h-4 w-4 shrink-0 text-primary" />Add a clear photo showing scale.</li>
              <li className="flex gap-2"><FileText className="h-4 w-4 shrink-0 text-primary" />Mention landmarks and any safety risk.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
