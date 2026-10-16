import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useStore, isOverdue } from "@/lib/store";
import { OPEN_STATUSES, type Department } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/departments")({
  head: () => ({ meta: [{ title: "Department Operations — SmartCity Nexus" }, { name: "description", content: "Municipal departments, workload and SLA compliance." }, { property: "og:title", content: "Departments — SmartCity Nexus" }, { property: "og:description", content: "Department operations." }] }),
  component: Departments,
});

function Departments() {
  const { state, me, actions } = useStore();
  const [edit, setEdit] = useState<Department | null>(null);
  const [toggle, setToggle] = useState<Department | null>(null);
  const [view, setView] = useState<Department | null>(null);
  const isAdmin = me?.role === "admin";
  const list = me?.role === "officer" ? state.departments.filter((d) => d.id === me.departmentId) : state.departments;

  const stats = (id: string) => {
    const inc = state.incidents.filter((i) => i.departmentId === id);
    const res = inc.filter((i) => i.resolvedAt);
    return {
      officers: state.users.filter((u) => u.departmentId === id && u.active).length,
      assigned: inc.length,
      inProgress: inc.filter((i) => i.status === "In Progress").length,
      open: inc.filter((i) => OPEN_STATUSES.includes(i.status)).length,
      overdue: inc.filter((i) => isOverdue(i)).length,
      resolved: res.length,
      sla: res.length ? Math.round((res.filter((i) => i.resolvedAt! <= i.slaDeadline).length / res.length) * 100) : 0,
    };
  };

  const save = () => {
    if (!edit) return;
    if (edit.name.trim().length < 3) return toast.error("Department name must be at least 3 characters");
    actions.upsertDepartment({ ...edit, name: edit.name.trim(), id: edit.id || edit.name.toLowerCase().replace(/[^a-z]+/g, "-") });
    toast.success("Department saved");
    setEdit(null);
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader title="Department operations" description="Workload and performance across municipal departments." actions={isAdmin && <Button onClick={() => setEdit({ id: "", name: "", description: "", head: "", active: true })}><Plus className="h-4 w-4" />Create department</Button>} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {list.map((d) => {
          const s = stats(d.id);
          return (
            <div key={d.id} className={cn("flex flex-col rounded-lg border bg-card p-4 shadow-card", !d.active && "opacity-60")}>
              <div className="flex items-start justify-between gap-2"><h3 className="font-semibold">{d.name}</h3><span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase", d.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>{d.active ? "Active" : "Inactive"}</span></div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{d.description}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[["Officers", s.officers], ["Open", s.open], ["Overdue", s.overdue], ["Active", s.inProgress], ["Resolved", s.resolved], ["SLA", `${s.sla}%`]].map(([l, v]) => (
                  <div key={l as string} className="rounded-md bg-muted/60 py-1.5"><dd className={cn("font-mono text-sm font-semibold", l === "Overdue" && Number(v) > 0 && "text-critical")}>{v}</dd><dt className="text-[10px] text-muted-foreground">{l}</dt></div>
                ))}
              </dl>
              <div className="mt-4 flex flex-wrap gap-1.5 border-t pt-3">
                <Button size="sm" variant="outline" onClick={() => setView(d)}>View</Button>
                <Button size="sm" variant="ghost" asChild><Link to="/incidents" search={{ dept: d.id }}>Incidents</Link></Button>
                <Button size="sm" variant="ghost" asChild><Link to="/analytics" search={{ dept: d.id }}>Analytics</Link></Button>
                {isAdmin && <Button size="sm" variant="ghost" onClick={() => setEdit(d)}>Edit</Button>}
                {isAdmin && <Switch className="ml-auto" checked={d.active} onCheckedChange={() => setToggle(d)} aria-label="Active" />}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Edit department" : "Create department"}</DialogTitle></DialogHeader>
          {edit && <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} maxLength={60} /></div>
            <div className="space-y-1.5"><Label>Head of department</Label><Input value={edit.head} onChange={(e) => setEdit({ ...edit, head: e.target.value })} maxLength={60} /></div>
            <div className="space-y-1.5"><Label>Description</Label><Textarea value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} maxLength={240} /></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toggle} onOpenChange={(o) => !o && setToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{toggle?.active ? "Deactivate" : "Activate"} {toggle?.name}?</AlertDialogTitle><AlertDialogDescription>{toggle?.active ? "Inactive departments cannot receive new assignments." : "The department will be available for assignment again."}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { actions.toggleDepartment(toggle!.id); toast.success("Department updated"); setToggle(null); }}>Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {view && <>
            <SheetHeader><SheetTitle>{view.name}</SheetTitle></SheetHeader>
            <div className="space-y-4 px-4 text-sm">
              <p className="text-muted-foreground">{view.description}</p>
              <div><span className="text-muted-foreground">Head:</span> {view.head}</div>
              <div><div className="mb-2 font-medium">Officers & field staff</div>
                <ul className="divide-y rounded-md border">{state.users.filter((u) => u.departmentId === view.id).map((u) => <li key={u.id} className="flex justify-between px-3 py-2"><span>{u.name}</span><span className="text-xs text-muted-foreground">{u.role === "officer" ? "Officer" : "Field worker"}</span></li>)}</ul>
              </div>
            </div>
          </>}
        </SheetContent>
      </Sheet>
    </div>
  );
}
