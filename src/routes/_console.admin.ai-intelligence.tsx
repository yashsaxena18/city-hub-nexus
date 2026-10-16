import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Brain, Check, Info, Pencil, RefreshCcw, Send, X } from "lucide-react";
import { toast } from "sonner";
import { DemoBadge, PageHeader, Panel, PriorityBadge, StatusBadge } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLookups, useStore, isOverdue } from "@/lib/store";
import { findDuplicates, summarize } from "@/lib/ai";
import { CATEGORIES, OPEN_STATUSES, PRIORITIES, type Category, type Priority } from "@/lib/types";
import { countBy, kpis } from "@/lib/metrics";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_console/admin/ai-intelligence")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : undefined }),
  head: () => ({ meta: [{ title: "AI Incident Intelligence — SmartCity Nexus" }, { name: "description", content: "Classification, duplicate detection and summaries to support reviewers." }, { property: "og:title", content: "AI Incident Intelligence — SmartCity Nexus" }, { property: "og:description", content: "Decision support for incident triage." }] }),
  component: AI,
});

const QUESTIONS = [
  "Which categories have the most overdue incidents?",
  "Which wards have the highest number of unresolved reports?",
  "Which departments have the largest workload?",
  "What is the median resolution time in the selected period?",
  "Which incidents require immediate administrative attention?",
];

function AI() {
  const { state, actions } = useStore();
  const L = useLookups();
  const search = Route.useSearch();
  const [id, setId] = useState(search.id ?? state.incidents.find((i) => i.status === "Submitted")?.id ?? state.incidents[0].id);
  const inc = state.incidents.find((i) => i.id === id)!;
  const [editing, setEditing] = useState<{ category: Category; priority: Priority; departmentId: string } | null>(null);
  const [chat, setChat] = useState<{ q: string; a: string[] }[]>([]);
  const dups = useMemo(() => findDuplicates(inc, state.incidents), [inc, state.incidents]);
  const sum = summarize(inc);

  const answer = (q: string): string[] => {
    const all = state.incidents;
    const open = all.filter((i) => OPEN_STATUSES.includes(i.status));
    if (q.includes("overdue")) return countBy(all.filter((i) => isOverdue(i)), (i) => i.category).slice(0, 5).map((r) => `${r.name}: ${r.value} overdue`);
    if (q.includes("wards")) return countBy(open, (i) => i.ward).slice(0, 5).map((r) => `${r.name}: ${r.value} unresolved`);
    if (q.includes("departments")) return countBy(open.filter((i) => i.departmentId), (i) => L.dept(i.departmentId)!.name).slice(0, 5).map((r) => `${r.name}: ${r.value} open incidents`);
    if (q.includes("median")) { const k = kpis(all); return [`Median resolution time: ${k.medianRes} hours`, `Average: ${k.avgRes} hours across ${k.resolved} resolved incidents`]; }
    return open.filter((i) => i.priority === "Critical" || isOverdue(i)).sort((a, b) => a.slaDeadline.localeCompare(b.slaDeadline)).slice(0, 5).map((i) => `${i.ref} · ${i.title} (${i.priority}${isOverdue(i) ? ", overdue" : ""})`);
  };

  return (
    <div className="mx-auto max-w-[1500px]">
      <PageHeader eyebrow="Intelligence" title="AI incident intelligence" actions={<DemoBadge>Rule-based simulation</DemoBadge>} />
      <div className="mb-4 flex gap-3 rounded-lg border border-info/30 bg-info/5 p-3 text-sm"><Info className="h-4 w-4 shrink-0 text-info" /><p>AI recommendations support human decision-making. Authorized personnel remain responsible for final incident classification and prioritization. <span className="text-muted-foreground">In demo mode, results come from a transparent keyword ruleset — not a live AI model — and no confidence scores are shown.</span></p></div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Incident:</span>
        <Select value={id} onValueChange={(v) => { setId(v); setEditing(null); }}>
          <SelectTrigger className="w-[420px] max-w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{state.incidents.slice(0, 80).map((i) => <SelectItem key={i.id} value={i.id}>{i.ref} · {i.title}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" size="sm" asChild><Link to="/incidents/$id" params={{ id: inc.id }}>Open incident</Link></Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={<span className="flex items-center gap-2"><Brain className="h-4 w-4 text-info" />Classification</span>} actions={<Button size="sm" variant="outline" onClick={() => { actions.runAssessment(inc.id); toast.success("Simulated assessment generated"); }}><RefreshCcw className="h-3.5 w-3.5" />{inc.ai ? "Reassess" : "Assess"}</Button>}>
          <div className="rounded-md bg-muted/50 p-3 text-sm"><div className="font-medium">{inc.title}</div><p className="mt-1 text-muted-foreground">{inc.description}</p><div className="mt-2 flex gap-2"><StatusBadge status={inc.status} /><PriorityBadge priority={inc.priority} /><span className="text-xs text-muted-foreground">Reported as {inc.category}</span></div></div>
          {inc.ai ? (
            <div className="mt-4 space-y-3 text-sm">
              {editing ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as Category })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  <Select value={editing.priority} onValueChange={(v) => setEditing({ ...editing, priority: v as Priority })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  <Select value={editing.departmentId} onValueChange={(v) => setEditing({ ...editing, departmentId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{state.departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
                </div>
              ) : (
                <dl className="grid grid-cols-3 gap-2">
                  {[["Suggested category", inc.ai.category], ["Suggested priority", inc.ai.priority], ["Suggested department", L.dept(inc.ai.departmentId)?.name]].map(([k, v]) => <div key={k} className="rounded-md border p-2"><dt className="text-[11px] text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>)}
                </dl>
              )}
              <p className="text-muted-foreground">{inc.ai.explanation}</p>
              <ul className="flex flex-wrap gap-1.5">{inc.ai.signals.map((s) => <li key={s} className="rounded border bg-muted/50 px-1.5 py-0.5 text-[11px]">{s}</li>)}</ul>
              <div className="text-xs text-muted-foreground">Assessed {fmtDateTime(inc.ai.at)} · Review: <span className="font-medium text-foreground">{inc.ai.review}</span></div>
              <div className="flex flex-wrap gap-2">
                {editing ? <>
                  <Button size="sm" onClick={() => { actions.reviewAssessment(inc.id, "Edited", editing); setEditing(null); toast.success("Edited recommendation applied"); }}>Save & apply</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                </> : <>
                  <Button size="sm" onClick={() => { actions.reviewAssessment(inc.id, "Accepted"); toast.success("Recommendation accepted"); }}><Check className="h-3.5 w-3.5" />Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing({ category: inc.ai!.category, priority: inc.ai!.priority, departmentId: inc.ai!.departmentId })}><Pencil className="h-3.5 w-3.5" />Edit</Button>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => { actions.reviewAssessment(inc.id, "Rejected"); toast("Recommendation rejected"); }}><X className="h-3.5 w-3.5" />Reject</Button>
                </>}
              </div>
            </div>
          ) : <p className="mt-4 text-sm text-muted-foreground">No assessment yet. Run the rule-based assessor to generate a recommendation.</p>}
        </Panel>

        <Panel title="Summary" description="Generated from incident fields (rule-based)">
          <p className="text-sm">{sum.summary}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3 text-sm">
            <div><div className="mb-1 text-xs font-semibold text-muted-foreground">Key information</div><ul className="space-y-1">{sum.key.map((k) => <li key={k}>{k}</li>)}</ul></div>
            <div><div className="mb-1 text-xs font-semibold text-muted-foreground">Missing details</div><ul className="space-y-1">{sum.missing.length ? sum.missing.map((k) => <li key={k} className="text-warning">{k}</li>) : <li>None</li>}</ul></div>
            <div><div className="mb-1 text-xs font-semibold text-muted-foreground">Follow-up</div><ul className="space-y-1">{sum.followUps.map((k) => <li key={k}>{k}</li>)}</ul></div>
          </div>
        </Panel>

        <Panel title="Possible duplicates" description="Same category, text overlap and proximity. Never auto-merged.">
          {dups.length ? (
            <ul className="divide-y text-sm">
              {dups.map((d) => {
                const pair = [inc.id, d.incident.id].sort().join("|");
                const flag = state.duplicateFlags.find((f) => f.pair === pair);
                return (
                  <li key={d.incident.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <div className="min-w-0 flex-1"><div className="font-mono text-xs text-muted-foreground">{d.incident.ref}</div><div className="truncate font-medium">{d.incident.title}</div><div className="text-xs text-muted-foreground">{d.incident.category} · {d.km.toFixed(2)} km away · {fmtDateTime(d.incident.reportedAt)}</div></div>
                    <div className="w-24"><div className="h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(d.score * 100)}%` }} /></div><div className="mt-0.5 text-[10px] text-muted-foreground">Similarity {d.score > 0.75 ? "high" : "moderate"}</div></div>
                    {flag ? <span className="text-xs text-muted-foreground">{flag.state}</span> : <div className="flex gap-1">
                      <Button size="sm" variant="ghost" asChild><Link to="/incidents/$id" params={{ id: d.incident.id }}>Compare</Link></Button>
                      <Button size="sm" variant="outline" onClick={() => { actions.flagDuplicate(pair, "Under Review"); toast.success("Marked for review"); }}>Review</Button>
                      <Button size="sm" variant="ghost" onClick={() => { actions.flagDuplicate(pair, "Dismissed"); toast("Suggestion dismissed"); }}>Dismiss</Button>
                    </div>}
                  </li>
                );
              })}
            </ul>
          ) : <p className="text-sm text-muted-foreground">No likely duplicates found.</p>}
        </Panel>

        <Panel title="Analytics assistant" actions={<DemoBadge>Demo analytics</DemoBadge>}>
          <div className="flex flex-wrap gap-1.5">{QUESTIONS.map((q) => <button key={q} onClick={() => setChat((c) => [...c, { q, a: answer(q) }])} className="rounded-md border px-2 py-1 text-left text-xs hover:border-primary/50 hover:bg-primary/5">{q}</button>)}</div>
          <div className="mt-4 max-h-80 space-y-3 overflow-y-auto">
            {chat.map((m, i) => (
              <div key={i} className="space-y-1.5">
                <div className="ml-auto w-fit max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">{m.q}</div>
                <div className="w-fit max-w-[90%] rounded-lg border bg-muted/50 px-3 py-2 text-sm"><div className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Computed from local demo dataset</div><ul className="list-disc space-y-0.5 pl-4">{m.a.map((l) => <li key={l}>{l}</li>)}</ul></div>
              </div>
            ))}
            {!chat.length && <p className="flex items-center gap-2 text-sm text-muted-foreground"><Send className="h-3.5 w-3.5" />Pick a question to query the dataset.</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
