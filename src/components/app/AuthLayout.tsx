import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { DemoBadge, Logo } from "./ui-bits";
import cityImg from "@/assets/city-ops.jpg";

export function AuthLayout({ title, subtitle, children, aside }: { title: string; subtitle?: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <DemoBadge />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
        <p className="text-center text-xs text-muted-foreground">Demonstration environment. No real credentials are stored.</p>
      </div>
      <div className="relative hidden overflow-hidden bg-navy lg:block">
        <img src={cityImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" width={1600} height={1008} />
        <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-12 text-navy-foreground">{aside ?? (
          <>
            <p className="text-2xl font-semibold leading-snug">“One City. One Command Centre. Smarter Decisions.”</p>
            <p className="mt-3 max-w-md text-sm text-navy-foreground/70">Citizens, administrators, officers and field crews working from a single source of truth.</p>
          </>
        )}</div>
      </div>
    </div>
  );
}
