import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, ClipboardList, Loader, Navigation } from "lucide-react";
import { toast } from "sonner";
import { KpiCard, PageHeader, Panel } from "@/components/app/ui-bits";
import { TaskList } from "@/components/app/TaskList";
import { useIncidentDialogs } from "@/components/app/IncidentDialogs";
import { PhotoInput } from "@/components/app/PhotoInput";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLookups, useStore, isOverdue } from "@/lib/store";
import { OPEN_STATUSES } from "@/lib/types";

export const Route = createFileRoute("/_console/field")({
  head: () => ({ meta: [{ title: "My Tasks — SmartCity Nexus" }, { name: "description", content: "Field worker task list with evidence capture." }, { property: "og:title", content: "Field Tasks — SmartCity Nexus" }, { property: "og:description", content: "Field crew dashboard." }] }),
  component: Field,
});

function Field() {
  const { state, me, actions } = useStore();
  const L = useLookups();
  const navigate = useNavigate();
  const dlg = useIncidentDialogs();
  const mine = state.incidents.filter((i) => i.workerId === me!.id);
  const open = mine.filter((i) => OPEN_STATUSES.includes(i.status));
  const today = new Date().toDateString();
  const done = mine.filter((i) => i.status === "Resolved" || i.status === "Closed");

  const acts = (i: (typeof mine)[number]) => (
    <>
      <Button size="sm" variant="ghost" onClick={() => navigate({ to: "/map", search: { focus: i.id } })}>Map</Button>
      <Button size="sm" variant="ghost" asChild><a href={`https://www.openstreetmap.org/directions?to=${i.lat},${i.lng}`} target="_blank" rel="noreferrer"><Navigation className="h-3.5 w-3.5" />Directions</a></Button>
      {i.status !== "In Progress" && OPEN_STATUSES.includes(i.status) && <Button size="sm" onClick={() => { actions.setStatus(i.id, "In Progress", "Field crew on site"); toast.success("Task started"); }}>Start task</Button>}
      <Button size="sm" variant="outline" onClick={() => dlg.open("note", i)}>Work notes</Button>
      <PhotoInput label={`Before (${i.beforePhotos.length})`} onAdd={(u) => { actions.addPhotos(i.id, "beforePhotos", u); toast.success("Before photos uploaded"); }} />
      <PhotoInput label={`After (${i.afterPhotos.length})`} onAdd={(u) => { actions.addPhotos(i.id, "afterPhotos", u); toast.success("After photos uploaded"); }} />
      {i.status === "In Progress" && <Button size="sm" variant="secondary" onClick={() => {
        if (!i.afterPhotos.length) return toast.error("Upload at least one after photo before submitting");
        actions.setStatus(i.id, "Resolved", "Work complete — submitted for verification");
        toast.success("Submitted for verification");
      }}>Complete & submit</Button>}
    </>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader eyebrow="Field crew" title={`Good day, ${me!.name.split(" ")[0]}`} description={`${L.dept(me!.departmentId)?.name} · tasks assigned to you`} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Assigned today" value={mine.filter((i) => new Date(i.timeline.find((t) => t.type === "assigned")?.at ?? 0).toDateString() === today).length} icon={ClipboardList} />
        <KpiCard label="In progress" value={open.filter((i) => i.status === "In Progress").length} icon={Loader} />
        <KpiCard label="Completed" value={done.length} icon={CheckCircle2} tone="success" />
        <KpiCard label="Overdue" value={open.filter((i) => isOverdue(i)).length} icon={AlertTriangle} tone="critical" />
      </div>
      <Panel className="mt-4" bodyClassName="p-0">
        <Tabs defaultValue="open">
          <div className="border-b px-4 pt-3"><TabsList><TabsTrigger value="open">Open ({open.length})</TabsTrigger><TabsTrigger value="done">Completed ({done.length})</TabsTrigger></TabsList></div>
          <TabsContent value="open" className="m-0"><TaskList items={open} actions={acts} empty="No open tasks" /></TabsContent>
          <TabsContent value="done" className="m-0"><TaskList items={done} actions={() => null} /></TabsContent>
        </Tabs>
      </Panel>
      {dlg.node}
    </div>
  );
}
