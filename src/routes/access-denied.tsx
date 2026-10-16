import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/ui-bits";
import { useStore } from "@/lib/store";
import { HOME_FOR, ROLE_LABEL } from "@/lib/nav";

export const Route = createFileRoute("/access-denied")({
  head: () => ({
    meta: [
      { title: "Access denied — SmartCity Nexus" },
      { name: "description", content: "You don't have permission to view this page." },
      { property: "og:title", content: "Access denied — SmartCity Nexus" },
      { property: "og:description", content: "Role-based access control." },
    ],
  }),
  component: Denied,
});

function Denied() {
  const { me } = useStore();
  return (
    <div className="grid-lines flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-elevated">
        <Logo />
        <ShieldAlert className="mx-auto mt-6 h-10 w-10 text-critical" />
        <h1 className="mt-3 text-lg font-semibold">Access denied</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pages in Nexus are restricted by role. {me ? `You are signed in as ${ROLE_LABEL[me.role]}.` : "You are not signed in."} In production, roles are assigned securely by the backend.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          {me ? <Button asChild><Link to={HOME_FOR[me.role]}>My dashboard</Link></Button> : <Button asChild><Link to="/login">Sign in</Link></Button>}
          <Button variant="outline" asChild><Link to="/">Home</Link></Button>
        </div>
      </div>
    </div>
  );
}
