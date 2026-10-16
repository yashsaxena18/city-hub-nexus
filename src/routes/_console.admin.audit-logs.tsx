import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Search } from "lucide-react";
import { toast } from "sonner";
import { DemoBadge, PageHeader } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore } from "@/lib/store";
import { ROLE_LABEL } from "@/lib/nav";
import { downloadFile, fmtDateTime, toCsv } from "@/lib/format";

export const Route = createFileRoute("/_console/admin/audit-logs")({
  head: () => ({ meta: [{ title: "Audit Logs — SmartCity Nexus" }, { name: "description", content: "Record of administrative and operational actions." }, { property: "og:title", content: "Audit Logs — SmartCity Nexus" }, { property: "og:description", content: "Action audit trail." }] }),
  component: Audit,
});

function Audit() {
  const { state } = useStore();
  const [q, setQ] = useState("");
  const [action, setAction] = useState("all");
  const actionsList = [...new Set(state.audit.map((a) => a.action))].sort();
  const list = state.audit.filter((a) => (!q || `${a.actor} ${a.target} ${a.detail}`.toLowerCase().includes(q.toLowerCase())) && (action === "all" || a.action === action));
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Audit logs" description={`${list.length} entries · demonstration data`} actions={<><DemoBadge /><Button variant="outline" onClick={() => { downloadFile("audit-log.csv", toCsv(list.map((a) => ({ time: a.at, actor: a.actor, role: a.role, action: a.action, target: a.target, detail: a.detail })))); toast.success("Audit log exported"); }}><Download className="h-4 w-4" />Export CSV</Button></>} />
      <div className="mb-3 flex flex-wrap gap-2">
        <div className="relative w-72"><Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" /><Input className="h-8 pl-8 text-sm" placeholder="Search actor, target, detail…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={action} onValueChange={setAction}><SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All actions</SelectItem>{actionsList.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card shadow-card">
        <Table>
          <TableHeader><TableRow className="bg-muted/50 text-xs"><TableHead>Time</TableHead><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead className="hidden md:table-cell">Detail</TableHead></TableRow></TableHeader>
          <TableBody>{list.slice(0, 200).map((a) => (
            <TableRow key={a.id} className="text-[13px]">
              <TableCell className="whitespace-nowrap font-mono text-xs">{fmtDateTime(a.at)}</TableCell>
              <TableCell><div>{a.actor}</div><div className="text-xs text-muted-foreground">{ROLE_LABEL[a.role]}</div></TableCell>
              <TableCell className="font-medium">{a.action}</TableCell>
              <TableCell className="font-mono text-xs">{a.target}</TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{a.detail}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
}
