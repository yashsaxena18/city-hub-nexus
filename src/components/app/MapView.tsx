import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import type { IncidentMapProps } from "./IncidentMap";
import { cn } from "@/lib/utils";

const IncidentMap = lazy(() => import("./IncidentMap"));

export function MapView(props: IncidentMapProps) {
  const fallback = <Skeleton className={cn("h-full w-full", props.className)} />;
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <IncidentMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}

export function MapLegend() {
  const items = [
    ["Critical", "bg-critical"],
    ["High", "bg-warning"],
    ["Medium", "bg-info"],
    ["Low", "bg-success"],
  ];
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      {items.map(([l, c]) => (
        <span key={l} className="inline-flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", c)} />
          {l}
        </span>
      ))}
      <span className="inline-flex items-center gap-1.5">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/85 text-[9px] font-semibold text-primary-foreground">n</span>
        Cluster
      </span>
    </div>
  );
}
