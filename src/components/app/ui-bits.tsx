import type { ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Inbox } from "lucide-react";
import type { Priority, Status } from "@/lib/types";
import { cn } from "@/lib/utils";
import { isOverdue } from "@/lib/store";
import type { Incident } from "@/lib/types";

const STATUS_STYLE: Record<Status, string> = {
  Submitted: "bg-muted text-muted-foreground border-border",
  "Under Review": "bg-info/10 text-info border-info/25",
  Assigned: "bg-primary/10 text-primary border-primary/25",
  Acknowledged: "bg-primary/10 text-primary border-primary/25",
  "In Progress": "bg-warning/12 text-warning border-warning/30",
  Escalated: "bg-critical/10 text-critical border-critical/30",
  Resolved: "bg-success/10 text-success border-success/30",
  Closed: "bg-secondary text-secondary-foreground border-border",
  Reopened: "bg-warning/12 text-warning border-warning/30",
  Rejected: "bg-destructive/10 text-destructive border-destructive/25",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  return <span className={cn("inline-flex items-center whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[11px] font-medium", STATUS_STYLE[status], className)}>{status}</span>;
}

const PRIO_DOT: Record<Priority, string> = { Critical: "bg-critical", High: "bg-warning", Medium: "bg-info", Low: "bg-success" };
export function PriorityBadge({ priority }: { priority: Priority }) {
  const bars = { Low: 1, Medium: 2, High: 3, Critical: 4 }[priority];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium" aria-label={`Priority ${priority}`}>
      <span className="flex items-end gap-px" aria-hidden>
        {[1, 2, 3, 4].map((b) => (
          <span key={b} className={cn("w-[3px] rounded-sm", b <= bars ? PRIO_DOT[priority] : "bg-border")} style={{ height: 4 + b * 2 }} />
        ))}
      </span>
      {priority}
    </span>
  );
}

export function OverdueFlag({ incident }: { incident: Incident }) {
  if (!isOverdue(incident)) return null;
  return <span className="rounded bg-critical/10 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-critical">Overdue</span>;
}

export function PageHeader({ title, description, actions, eyebrow }: { title: string; description?: string; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <div className="mb-1 text-xs font-medium uppercase tracking-wider text-primary">{eyebrow}</div>}
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, actions, children, className, bodyClassName }: { title?: ReactNode; description?: string; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card text-card-foreground shadow-card", className)}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

export function KpiCard({ label, value, hint, icon: Icon, delta, tone = "default", onClick, index = 0 }: { label: string; value: ReactNode; hint?: string; icon: LucideIcon; delta?: number; tone?: "default" | "critical" | "warning" | "success"; onClick?: () => void; index?: number }) {
  const toneCls = { default: "text-primary bg-primary/10", critical: "text-critical bg-critical/10", warning: "text-warning bg-warning/12", success: "text-success bg-success/10" }[tone];
  const Comp = onClick ? motion.button : motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.25 }}
      onClick={onClick}
      className={cn("group rounded-lg border bg-card p-4 text-left shadow-card transition-colors", onClick && "hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-ring")}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("rounded-md p-1.5", toneCls)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight">{value}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {delta !== undefined && (
          <span className={cn("inline-flex items-center font-medium", delta >= 0 ? "text-foreground" : "text-foreground")}>
            {delta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint}
      </div>
    </Comp>
  );
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }: { title: string; description?: string; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-12 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/60" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function DemoBadge({ children = "Demo mode" }: { children?: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-warning">{children}</span>;
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden>
        <rect width="32" height="32" rx="7" className="fill-primary" />
        <path d="M8 22V10l8 7 8-7v12" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-foreground" />
        <circle cx="16" cy="17" r="2" className="fill-primary-foreground" />
      </svg>
      <span className={light ? "text-sidebar-accent-foreground" : ""}>
        SmartCity <span className="text-primary">Nexus</span>
      </span>
    </span>
  );
}
