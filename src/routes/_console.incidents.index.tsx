import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowUpDown, Download, Eye, LayoutGrid, List, MapPin, MoreHorizontal, Plus, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PriorityBadge, StatusBadge, OverdueFlag, EmptyState } from "@/components/app/ui-bits";
import { useIncidentDialogs } from "@/components/app/IncidentDialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLookups, useStore, isOverdue } from "@/lib/store";
import { CATEGORIES, PRIORITIES, STATUSES, type Incident } from "@/lib/types";
import { WARDS } from "@/lib/demo-data";
import { downloadFile, fmtDateTime, toCsv } from "@/lib/format";
import { cn } from "@/lib/utils";

type Search = { q?: string; status?: string; priority?: string; category?: string; dept?: string; ward?: string; overdue?: string; unassigned?: string; from?: string; to?: string; sort?: string; view?: string; page?: number };

export const Route = createFileRoute("/_console/incidents/")({
  validateSearch: (s: Record<string, unknown>): Search => {
    const out: Search = {};
    for (const k of ["q", "status", "priority", "category", "dept", "ward", "overdue", "unassigned", "from", "to", "sort", "view"] as const) if (typeof s[k] === "string" && s[k]) out[k] = s[k] as string;
    if (s.page) out.page = Number(s.page) || 1;
    return out;
  },
  head: () => ({ meta: [{ title: "Incident Management — SmartCity Nexus" }, { name: "description", content: "Search, filter, assign and export city incidents." }, { property: "og:title", content: "Incident Management — SmartCity Nexus" }, { property: "og:description", content: "Manage all reported incidents." }] }),
  component: Incidents,
});

const PRIO_RANK = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const PAGE = 15;

function Incidents() {
  const { state, me } = useStore();
  const L = useLookups();
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/incidents/" });
  const dlg = useIncidentDialogs();
  const set = (patch: Partial<Search>) => navigate({ search: (prev: Search) => ({ ...prev, page: undefined, ...patch }), replace: true });

  const scoped = useMemo(() => {
    if (!me) return [];
    if (me.role === "citizen") return state.incidents.filter((i) => i.reporterId === me.id);
    if (me.role === "officer") return state.incidents.filter((i) => i.departmentId === me.departmentId);
    if (me.role === "field") return state.incidents.filter((i) => i.workerId === me.id);
    return state.incidents;
  }, [state.incidents, me]);

  const filtered = useMemo(() => {
    const q = s.q?.toLowerCase();
    let r = scoped.filter(
      (i) =>
        (!q || `${i.ref} ${i.title} ${i.category} ${i.location}`.toLowerCase().includes(q)) &&
        (!s.status || i.status === s.status) &&
        (!s.priority || i.priority === s.priority) &&
        (!s.category || i.category === s.category) &&
        (!s.dept || i.departmentId === s.dept) &&
        (!s.ward || i.ward === s.ward) &&
        (!s.overdue || isOverdue(i)) &&
        (!s.unassigned || !i.departmentId) &&
        (!s.from || i.reportedAt >= s.from) &&
        (!s.to || i.reportedAt <= s.to + "T23:59:59"),
    );
    const sort = s.sort ?? "newest";
    r = [...r].sort((a, b) =>
      sort === "oldest" ? a.reportedAt.localeCompare(b.reportedAt) : sort === "priority" ? PRIO_RANK[a.priority] - PRIO_RANK[b.priority] : sort === "deadline" ? a.slaDeadline.localeCompare(b.slaDeadline) : b.reportedAt.localeCompare(a.reportedAt),
    );
    return r;
  }, [scoped, s]);

  const page = s.page ?? 1;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE);
  const canManage = me?.role === "admin" || me?.role === "officer";
  const hasFilters = Object.keys(s).some((k) => !["view", "sort", "page"].includes(k));

  const exportCsv = () => {
    const csv = toCsv(filtered.map((i) => ({ reference: i.ref, title: i.title, category: i.category, priority: i.priority, status: i.status, location: i.location, ward: i.ward, reported_by: L.user(i.reporterId)?.name, department: L.dept(i.departmentId)?.name, officer: L.user(i.officerId)?.name, reported_at: i.reportedAt, sla_deadline: i.slaDeadline, overdue: isOverdue(i) ? "yes" : "no" })));
    downloadFile(`incidents-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    toast.success(`Exported ${filtered.length} incidents`);
  };

  const rowMenu = (i: Incident) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Actions for ${i.ref}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate({ to: "/incidents/$id", params: { id: i.id } })}><Eye className="h-4 w-4" />View details</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/incidents/$id", params: { id: i.id }, hash: "timeline" })}>View timeline</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate({ to: "/map", search: { focus: i.id } })}><MapPin className="h-4 w-4" />Open on map</DropdownMenuItem>
        {canManage && (
          <>
            <DropdownMenuSeparator />
            {me?.role === "admin" && <DropdownMenuItem onClick={() => dlg.open("assign", i)}>Assign department</DropdownMenuItem>}
            {me?.role === "admin" && <DropdownMenuItem onClick={() => dlg.open("priority", i)}>Change priority</DropdownMenuItem>}
            <DropdownMenuItem onClick={() => dlg.open("status", i)}>Update status</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => dlg.open("escalate", i)}>Escalate</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const F = ({ k, label, options }: { k: keyof Search; label: string; options: { v: string; l: string }[] }) => (
    <Select value={(s[k] as string) ?? "all"} onValueChange={(v) => set({ [k]: v === "all" ? undefined : v })}>
      <SelectTrigger className={cn("h-8 w-auto min-w-[120px] text-xs", s[k] && "border-primary/50 bg-primary/5")} aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="all">All {label.toLowerCase()}</SelectItem>{options.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        title={me?.role === "citizen" ? "My reports" : "Incident management"}
        description={`${filtered.length} of ${scoped.length} incidents${me?.role === "officer" ? ` · ${L.dept(me.departmentId)?.name}` : ""}`}
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download className="h-4 w-4" />Export CSV</Button>
            {(me?.role === "admin" || me?.role === "citizen") && <Button asChild><Link to="/citizen/report"><Plus className="h-4 w-4" />{me.role === "admin" ? "Create incident" : "Report issue"}</Link></Button>}
          </>
        }
      />
      <div className="mb-4 rounded-lg border bg-card p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input value={s.q ?? ""} onChange={(e) => set({ q: e.target.value || undefined })} placeholder="Search reference, title, category, location…" className="h-8 pl-8 text-sm" aria-label="Search incidents" />
          </div>
          <F k="status" label="Statuses" options={STATUSES.map((v) => ({ v, l: v }))} />
          <F k="priority" label="Priorities" options={PRIORITIES.map((v) => ({ v, l: v }))} />
          <F k="category" label="Categories" options={CATEGORIES.map((v) => ({ v, l: v }))} />
          {me?.role === "admin" && <F k="dept" label="Departments" options={state.departments.map((d) => ({ v: d.id, l: d.name }))} />}
          <F k="ward" label="Wards" options={WARDS.map((w) => ({ v: w.name, l: w.name }))} />
          <div className="flex items-center gap-1 text-xs">
            <Input type="date" value={s.from ?? ""} onChange={(e) => set({ from: e.target.value || undefined })} className="h-8 w-[130px] text-xs" aria-label="From date" />
            <span className="text-muted-foreground">–</span>
            <Input type="date" value={s.to ?? ""} onChange={(e) => set({ to: e.target.value || undefined })} className="h-8 w-[130px] text-xs" aria-label="To date" />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button onClick={() => set({ overdue: s.overdue ? undefined : "1" })} className={cn("rounded-md border px-2 py-1", s.overdue && "border-critical/40 bg-critical/10 text-critical")}>Overdue only</button>
            {me?.role === "admin" && <button onClick={() => set({ unassigned: s.unassigned ? undefined : "1" })} className={cn("rounded-md border px-2 py-1", s.unassigned && "border-primary/40 bg-primary/10 text-primary")}>Unassigned</button>}
            {hasFilters && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => navigate({ search: { view: s.view } })}><RotateCcw className="h-3.5 w-3.5" />Reset filters</Button>}
          </div>
          <div className="flex items-center gap-2">
            <Select value={s.sort ?? "newest"} onValueChange={(v) => set({ sort: v })}>
              <SelectTrigger className="h-8 w-[150px] text-xs" aria-label="Sort"><ArrowUpDown className="h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem><SelectItem value="priority">Highest priority</SelectItem><SelectItem value="deadline">SLA deadline</SelectItem></SelectContent>
            </Select>
            <div className="flex rounded-md border p-0.5">
              <button aria-label="Table view" onClick={() => set({ view: undefined })} className={cn("rounded p-1", !s.view && "bg-muted")}><List className="h-4 w-4" /></button>
              <button aria-label="Grid view" onClick={() => set({ view: "grid" })} className={cn("rounded p-1", s.view === "grid" && "bg-muted")}><LayoutGrid className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      </div>

      {!rows.length ? (
        <EmptyState title="No incidents match these filters" description="Try widening the date range or resetting filters." action={<Button variant="outline" onClick={() => navigate({ search: {} })}>Reset filters</Button>} />
      ) : s.view === "grid" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((i) => (
            <div key={i.id} className="rounded-lg border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">{i.ref}</span>{rowMenu(i)}</div>
              <Link to="/incidents/$id" params={{ id: i.id }} className="mt-1 block font-medium hover:text-primary">{i.title}</Link>
              <div className="mt-1 text-xs text-muted-foreground">{i.category} · {i.location}</div>
              <div className="mt-3 flex items-center gap-2"><StatusBadge status={i.status} /><PriorityBadge priority={i.priority} /><OverdueFlag incident={i} /></div>
              <div className="mt-3 flex justify-between border-t pt-2 text-[11px] text-muted-foreground"><span>{L.dept(i.departmentId)?.name ?? "Unassigned"}</span><span>Due {fmtDateTime(i.slaDeadline)}</span></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-card shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 text-xs">
                <TableHead>Reference</TableHead><TableHead>Incident</TableHead><TableHead>Priority</TableHead><TableHead className="hidden lg:table-cell">Location</TableHead>
                <TableHead className="hidden xl:table-cell">Reported by</TableHead><TableHead className="hidden md:table-cell">Department</TableHead><TableHead className="hidden 2xl:table-cell">Officer</TableHead>
                <TableHead>Status</TableHead><TableHead className="hidden lg:table-cell">Reported</TableHead><TableHead className="hidden md:table-cell">SLA deadline</TableHead><TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((i) => (
                <TableRow key={i.id} className="text-[13px]">
                  <TableCell className="font-mono text-xs text-muted-foreground">{i.ref}</TableCell>
                  <TableCell className="max-w-[260px]"><Link to="/incidents/$id" params={{ id: i.id }} className="block truncate font-medium hover:text-primary">{i.title}</Link><div className="text-xs text-muted-foreground">{i.category}</div></TableCell>
                  <TableCell><PriorityBadge priority={i.priority} /></TableCell>
                  <TableCell className="hidden max-w-[180px] lg:table-cell"><div className="truncate">{i.location}</div><div className="text-xs text-muted-foreground">Ward: {i.ward}</div></TableCell>
                  <TableCell className="hidden xl:table-cell">{L.user(i.reporterId)?.name ?? "—"}</TableCell>
                  <TableCell className="hidden md:table-cell">{L.dept(i.departmentId)?.name ?? <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  <TableCell className="hidden 2xl:table-cell">{L.user(i.officerId)?.name ?? "—"}</TableCell>
                  <TableCell><StatusBadge status={i.status} /></TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs lg:table-cell">{fmtDateTime(i.reportedAt)}</TableCell>
                  <TableCell className="hidden whitespace-nowrap text-xs md:table-cell"><div className="flex items-center gap-1.5">{fmtDateTime(i.slaDeadline)}<OverdueFlag incident={i} /></div></TableCell>
                  <TableCell>{rowMenu(i)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {filtered.length > PAGE && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {page} of {pages} · {filtered.length} results</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => navigate({ search: (p: Search) => ({ ...p, page: page - 1 }) })}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => navigate({ search: (p: Search) => ({ ...p, page: page + 1 }) })}>Next</Button>
          </div>
        </div>
      )}
      {dlg.node}
    </div>
  );
}
