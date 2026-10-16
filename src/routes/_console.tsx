import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Logo } from "@/components/app/ui-bits";
import { useStore } from "@/lib/store";
import { canAccess, HOME_FOR, ROLE_LABEL } from "@/lib/nav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_console")({
  component: ConsoleLayout,
});

export function BrandedLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Logo />
      <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/3 animate-[pulse_1s_ease-in-out_infinite] rounded-full bg-primary" />
      </div>
      <p className="text-xs text-muted-foreground">Loading command centre…</p>
    </div>
  );
}

function ConsoleLayout() {
  const { ready, me } = useStore();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !me) navigate({ to: "/login", search: { redirect: pathname } });
  }, [ready, me, pathname, navigate]);

  if (!ready || !me) return <BrandedLoader />;

  return (
    <AppShell>
      {canAccess(pathname, me.role) ? <Outlet /> : <AccessDeniedInline role={me.role} />}
    </AppShell>
  );
}

function AccessDeniedInline({ role }: { role: keyof typeof ROLE_LABEL }) {
  return (
    <div className="mx-auto mt-16 max-w-md rounded-lg border bg-card p-8 text-center shadow-card">
      <ShieldAlert className="mx-auto h-10 w-10 text-critical" />
      <h1 className="mt-4 text-lg font-semibold">Access denied</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your current role ({ROLE_LABEL[role]}) doesn't have permission to view this page.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button asChild><Link to={HOME_FOR[role]}>Go to my dashboard</Link></Button>
        <Button variant="outline" asChild><Link to="/access-denied">Learn more</Link></Button>
      </div>
    </div>
  );
}
