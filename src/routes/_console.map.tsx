import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Crosshair, Flame, List, Map as MapIcon, RotateCcw, Search, X } from "lucide-react";
import { MapLegend, MapView } from "@/components/app/MapView";
import { PageHeader, PriorityBadge, StatusBadge } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLookups, useStore } from "@/lib/store";
import { CATEGORIES, PRIORITIES, STATUSES } from "@/lib/types";
import { WARDS } from "@/lib/demo-data";
import { fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/map")({
  validateSearch: (s: Record<string, unknown>) => ({ focus: typeof s.focus === "string" ? s.focus : undefined }),
  head: () => ({ meta: [{ title: "Live City Map — SmartCity Nexus" }, { name: "description", content: "Geospatial view of incidents with clustering and hotspots." }, { property: "og:title", content: "Live City Map — SmartCity Nexus" }, { property: "og:description", content: "Incident map of the city." }] }),
  component: CityMap,
});

const EMPTY = { category: "all", priority: "all", status: "all", dept: "all", ward: "all", from: "", to: "", q: "" };

function CityMap() {
  const { state, me } = useStore();
  const L = useLookups();
  const { focus } = Route.useSearch();
  const [f, setF] = useState(EMPTY);
  const [sel, setSel] = useState<string | null>(focus ?? null);
  const [view, setView] = useState<"map" | "list">("map");
  const [hot, setHot] = useState(false);
  const [cluster, setCluster] = useState(true);
  const [fit, setFit] = useState<number | undefined>(undefined);

  const scoped = useMemo(() => {
    if (me?.role === "citizen") return state.incidents.filter((i) => i.reporterId === me.id || !["Rejected"].includes(i.status));
    if (me?.role === "field") return state.incidents.filter((i) => i.workerId === me.id);
    if (me?.role === "officer") return state.incidents.filter((i) => i.departmentId === me.departmentId);
    return state.incidents;
  }, [state.incidents, me]);
  const list = useMemo(() => scoped.filter((i) =>
    (f.category === "all" || i.category === f.category) && (f.priority === "all" || i.priority === f.priority) && (f.status === "all" || i.status === f.status) &&
    (f.dept === "all" || i.departmentId === f.dept) && (f.ward === "all" || i.ward === f.ward) && (!f.from || i.reportedAt >= f.from) && (!f.to || i.reportedAt <= f.to + "T23:59") &&
    (!f.q || `${i.location} ${i.ward} ${i.ref} ${i.title}`.toLowerCase().includes(f.q.toLowerCase()))), [scoped, f]);
  const selected = state.incidents.find((i) => i.id === sel);
  const S = (k: keyof typeof EMPTY, label: string, opts: { v: string; l: string }[]) => (
    <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}>
      <SelectTrigger className="h-8 w-auto min-w-[110px] text-xs" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="all">All {label}</SelectItem>{opts.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader title="Live city map" description={`${list.length} incidents shown · OpenStreetMap`} actions={
        <div className="flex rounded-md border p-0.5">
          <button onClick={() => setView("map")} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs", view === "map" && "bg-muted")}><MapIcon className="h-3.5 w-3.5" />Map</button>
          <button onClick={() => setView("list")} className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs", view === "list" && "bg-muted")}><List className="h-3.5 w-3.5" />List</button>
        </div>} />
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3 shadow-card">
        <div className="relative w-56"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="h-8 pl-8 text-xs" placeholder="Search location…" value={f.q} onChange={(e) => setF({ ...f, q: e.target.value })} /></div>
        {S("category", "categories", CATEGORIES.map((v) => ({ v, l: v })))}
        {S("priority", "priorities", PRIORITIES.map((v) => ({ v, l: v })))}
        {S("status", "statuses", STATUSES.map((v) => ({ v, l: v })))}
        {me?.role === "admin" && S("dept", "departments", state.departments.map((d) => ({ v: d.id, l: d.name })))}
        {S("ward", "wards", WARDS.map((w) => ({ v: w.name, l: w.name })))}
        <Input type="date" className="h-8 w-[130px] text-xs" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} aria-label="From" />
        <Input type="date" className="h-8 w-[130px] text-xs" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} aria-label="To" />
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setF(EMPTY)}><RotateCcw className="h-3.5 w-3.5" />Reset</Button>
      </div>
      {view === "map" ? (
        <div className="relative overflow-hidden rounded-lg border shadow-card">
          <MapView incidents={list} selectedId={sel} onSelect={setSel} cluster={cluster} hotspots={hot} fitSignal={fit} className="h-[calc(100vh-280px)] min-h-[460px] w-full" />
          <div className="absolute right-3 top-3 z-[400] flex flex-col gap-1.5">
            <Button size="sm" variant="secondary" className="shadow-elevated" onClick={() => setFit(Date.now())}><Crosshair className="h-3.5 w-3.5" />Fit all</Button>
            <Button size="sm" variant={hot ? "default" : "secondary"} className="shadow-elevated" onClick={() => setHot(!hot)}><Flame className="h-3.5 w-3.5" />Hotspots</Button>
            <Button size="sm" variant={cluster ? "default" : "secondary"} className="shadow-elevated" onClick={() => setCluster(!cluster)}>Cluster</Button>
          </div>
          <div className="absolute bottom-3 left-3 z-[400] rounded-md border bg-card px-3 py-2 shadow-elevated"><MapLegend /></div>
          {selected && (
            <aside className="absolute bottom-3 right-3 top-36 z-[400] w-80 overflow-y-auto rounded-lg border bg-card p-4 shadow-elevated">
              <div className="flex items-center justify-between"><span className="font-mono text-xs text-muted-foreground">{selected.ref}</span><button onClick={() => setSel(null)} aria-label="Close"><X className="h-4 w-4" /></button></div>
              <h3 className="mt-1 font-semibold">{selected.title}</h3>
              <div className="mt-2 flex gap-2"><StatusBadge status={selected.status} /><PriorityBadge priority={selected.priority} /></div>
              <p className="mt-3 text-sm text-muted-foreground">{selected.description}</p>
              <dl className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between"><dt className="text-muted-foreground">Location</dt><dd>{selected.location}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Department</dt><dd>{L.dept(selected.departmentId)?.name ?? "Unassigned"}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Reported</dt><dd>{fmtDateTime(selected.reportedAt)}</dd></div>
              </dl>
              {(me?.role !== "citizen" || selected.reporterId === me.id) && <Button asChild size="sm" className="mt-4 w-full"><Link to="/incidents/$id" params={{ id: selected.id }}>Open incident</Link></Button>}
            </aside>
          )}
        </div>
      ) : (
        <div className="divide-y rounded-lg border bg-card shadow-card">
          {list.map((i) => (
            <button key={i.id} onClick={() => { setSel(i.id); setView("map"); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-muted">
              <span className="w-32 font-mono text-xs text-muted-foreground">{i.ref}</span><span className="flex-1 truncate">{i.title}</span>
              <span className="hidden text-xs text-muted-foreground md:inline">{i.location}</span><PriorityBadge priority={i.priority} /><StatusBadge status={i.status} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
