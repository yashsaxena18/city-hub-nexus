import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import type { Incident } from "@/lib/types";
import { OverdueFlag, PriorityBadge, StatusBadge, EmptyState } from "./ui-bits";
import { fmtDateTime } from "@/lib/format";

export function TaskList({ items, actions, empty = "No tasks" }: { items: Incident[]; actions: (i: Incident) => ReactNode; empty?: string }) {
  if (!items.length) return <EmptyState title={empty} />;
  return (
    <ul className="divide-y">
      {items.map((i) => (
        <li key={i.id} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{i.ref}</span><StatusBadge status={i.status} /><PriorityBadge priority={i.priority} /><OverdueFlag incident={i} /></div>
            <Link to="/incidents/$id" params={{ id: i.id }} className="mt-0.5 block truncate text-sm font-medium hover:text-primary">{i.title}</Link>
            <div className="text-xs text-muted-foreground">{i.category} · {i.location} · due {fmtDateTime(i.slaDeadline)}</div>
          </div>
          <div className="flex flex-wrap gap-1.5">{actions(i)}</div>
        </li>
      ))}
    </ul>
  );
}
