import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLookups, useStore } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/nav";
import { OPEN_STATUSES, type Role, type User } from "@/lib/types";

export const Route = createFileRoute("/_console/workforce")({
  head: () => ({ meta: [{ title: "Field Workforce & Users — SmartCity Nexus" }, { name: "description", content: "Manage users, roles and department assignments." }, { property: "og:title", content: "Workforce — SmartCity Nexus" }, { property: "og:description", content: "User and workforce management." }] }),
  component: Workforce,
});

const userSchema = z.object({ name: z.string().trim().min(2, "Name required").max(80), email: z.string().trim().email("Valid email required"), phone: z.string().max(20) });

function Workforce() {
  const { state, actions } = useStore();
  const L = useLookups();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("all");
  const [dept, setDept] = useState("all");
  const [act, setAct] = useState("all");
  const [edit, setEdit] = useState<User | null>(null);
  const [toggle, setToggle] = useState<User | null>(null);
  const list = state.users.filter((u) => (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) && (role === "all" || u.role === role) && (dept === "all" || u.departmentId === dept) && (act === "all" || String(u.active) === act));
  const tasks = (u: User) => state.incidents.filter((i) => (i.workerId === u.id || i.officerId === u.id) && OPEN_STATUSES.includes(i.status)).length;

  const save = () => {
    if (!edit) return;
    const r = userSchema.safeParse(edit);
    if (!r.success) return toast.error(r.error.issues[0].message);
    if ((edit.role === "officer" || edit.role === "field") && !edit.departmentId) return toast.error("Officers and field workers need a department");
    actions.upsertUser({ ...edit, id: edit.id || `u-${Date.now().toString(36)}`, departmentId: edit.role === "officer" || edit.role === "field" ? edit.departmentId : null });
    toast.success("User saved (demo)");
    setEdit(null);
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader title="Users & field workforce" description="Demo user directory. Production role assignment happens securely on the backend." actions={<Button onClick={() => setEdit({ id: "", name: "", email: "", phone: "", role: "field", departmentId: null, active: true })}><Plus className="h-4 w-4" />Create demo user</Button>} />
      <div className="mb-3 flex flex-wrap gap-2 rounded-lg border bg-card p-3 shadow-card">
        <div className="relative w-64"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="h-8 pl-8 text-sm" placeholder="Search users…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={role} onValueChange={setRole}><SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent></Select>
        <Select value={dept} onValueChange={setDept}><SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All departments</SelectItem>{state.departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
        <Select value={act} onValueChange={setAct}><SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Any status</SelectItem><SelectItem value="true">Active</SelectItem><SelectItem value="false">Inactive</SelectItem></SelectContent></Select>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card shadow-card">
        <Table>
          <TableHeader><TableRow className="bg-muted/50 text-xs"><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead className="hidden md:table-cell">Department</TableHead><TableHead className="hidden lg:table-cell">Phone</TableHead><TableHead>Open tasks</TableHead><TableHead>Active</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {list.map((u) => (
              <TableRow key={u.id} className="text-[13px]">
                <TableCell><div className="font-medium">{u.name}</div><div className="text-xs text-muted-foreground">{u.email}</div></TableCell>
                <TableCell>{ROLE_LABEL[u.role]}</TableCell>
                <TableCell className="hidden md:table-cell">{L.dept(u.departmentId)?.name ?? "—"}</TableCell>
                <TableCell className="hidden font-mono text-xs lg:table-cell">{u.phone || "—"}</TableCell>
                <TableCell>{u.role === "field" || u.role === "officer" ? <Link className="text-primary hover:underline" to="/incidents" search={{ dept: u.departmentId ?? undefined }}>{tasks(u)}</Link> : "—"}</TableCell>
                <TableCell><Switch checked={u.active} onCheckedChange={() => setToggle(u)} disabled={u.id === "u-admin"} aria-label="Active" /></TableCell>
                <TableCell><Button size="sm" variant="ghost" onClick={() => setEdit(u)}>Edit</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Edit user" : "Create demo user"}</DialogTitle></DialogHeader>
          {edit && <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Full name</Label><Input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Role</Label><Select value={edit.role} onValueChange={(r) => setEdit({ ...edit, role: r as Role })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(ROLE_LABEL) as Role[]).map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label>Department</Label><Select value={edit.departmentId ?? ""} onValueChange={(d) => setEdit({ ...edit, departmentId: d })} disabled={edit.role === "admin" || edit.role === "citizen"}><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger><SelectContent>{state.departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setEdit(null)}>Cancel</Button><Button onClick={save}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!toggle} onOpenChange={(o) => !o && setToggle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{toggle?.active ? "Deactivate" : "Activate"} {toggle?.name}?</AlertDialogTitle><AlertDialogDescription>{toggle?.active ? "The user will no longer be able to sign in." : "The user will regain access."}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { actions.toggleUser(toggle!.id); toast.success("User updated"); setToggle(null); }}>Confirm</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
