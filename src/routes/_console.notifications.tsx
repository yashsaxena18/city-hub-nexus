import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore, visibleNotifications } from "@/lib/store";
import { fmtDateTime, relTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/notifications")({
  head: () => ({ meta: [{ title: "Notifications — SmartCity Nexus" }, { name: "description", content: "Incident updates, SLA alerts and assignments." }, { property: "og:title", content: "Notifications — SmartCity Nexus" }, { property: "og:description", content: "Your notifications." }] }),
  component: Notifications,
});

const KIND = { info: "bg-info", warning: "bg-warning", critical: "bg-critical", success: "bg-success" };

function Notifications() {
  const { state, me, actions } = useStore();
  const [tab, setTab] = useState("all");
  const all = visibleNotifications(state.notifications, me);
  const list = all.filter((n) => tab === "all" || (tab === "unread" ? !n.read : n.kind === tab));
  const unread = all.filter((n) => !n.read);
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Notifications" description={`${unread.length} unread`} actions={<Button variant="outline" disabled={!unread.length} onClick={() => { actions.markAllRead(unread.map((n) => n.id)); toast.success("All marked as read"); }}>Mark all as read</Button>} />
      <Tabs value={tab} onValueChange={setTab} className="mb-3"><TabsList><TabsTrigger value="all">All</TabsTrigger><TabsTrigger value="unread">Unread</TabsTrigger><TabsTrigger value="critical">Critical</TabsTrigger><TabsTrigger value="warning">Warnings</TabsTrigger></TabsList></Tabs>
      {list.length ? (
        <ul className="divide-y rounded-lg border bg-card shadow-card">
          {list.map((n) => (
            <li key={n.id} className={cn("flex gap-3 px-4 py-3", !n.read && "bg-primary/5")}>
              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", KIND[n.kind])} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-sm font-medium">{n.title}{!n.read && <span className="rounded bg-primary/10 px-1 text-[10px] text-primary">New</span>}</div>
                <div className="text-sm text-muted-foreground">{n.body}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground" title={fmtDateTime(n.at)}>{relTime(n.at)}</div>
              </div>
              <div className="flex items-start gap-1">
                {n.incidentId && <Button size="sm" variant="ghost" asChild onClick={() => actions.markRead(n.id)}><Link to="/incidents/$id" params={{ id: n.incidentId }}>View</Link></Button>}
                {!n.read && <Button size="sm" variant="ghost" onClick={() => actions.markRead(n.id)}>Mark read</Button>}
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Delete" onClick={() => { actions.deleteNotification(n.id); toast("Notification removed"); }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </li>
          ))}
        </ul>
      ) : <EmptyState icon={Bell} title="Nothing here" description="You're all caught up." />}
    </div>
  );
}
