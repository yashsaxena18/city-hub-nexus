import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Building2, Eye, EyeOff, HardHat, Loader2, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";
import { HOME_FOR, ROLE_LABEL, canAccess } from "@/lib/nav";
import type { Role } from "@/lib/types";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s.redirect === "string" ? s.redirect : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in — SmartCity Nexus" },
      { name: "description", content: "Sign in to the SmartCity Nexus command centre or choose a demo role." },
      { property: "og:title", content: "Sign in — SmartCity Nexus" },
      { property: "og:description", content: "Access the smart city operations platform." },
    ],
  }),
  component: Login,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional(),
});

const DEMO: { role: Role; icon: typeof User; desc: string }[] = [
  { role: "admin", icon: ShieldCheck, desc: "Command centre, SLA, AI & audit" },
  { role: "citizen", icon: User, desc: "Report and track civic issues" },
  { role: "officer", icon: Building2, desc: "Road Maintenance department desk" },
  { role: "field", icon: HardHat, desc: "Field crew task list" },
];

function Login() {
  const { actions, state } = useStore();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [show, setShow] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "", remember: true } });

  const go = (role: Role) => navigate({ to: redirect && canAccess(redirect, role) ? redirect : HOME_FOR[role] });

  const onSubmit = form.handleSubmit(async (v) => {
    await new Promise((r) => setTimeout(r, 600));
    const user = state.users.find((u) => u.email.toLowerCase() === v.email.toLowerCase());
    if (!user) {
      form.setError("email", { message: "No demo account with this email. Use a demo role below or register." });
      return;
    }
    if (!user.active) {
      form.setError("email", { message: "This account has been deactivated." });
      return;
    }
    actions.loginUser(user.id);
    toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
    go(user.role);
  });

  const demo = (role: Role) => {
    actions.loginAs(role);
    toast.success(`Signed in as demo ${ROLE_LABEL[role]}`);
    go(role);
  };

  const { errors, isSubmitting } = form.formState;
  return (
    <AuthLayout title="Sign in to Nexus" subtitle="Access your operations workspace.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" placeholder="admin@nexus.demo" aria-invalid={!!errors.email} {...form.register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative">
            <Input id="password" type={show ? "text" : "password"} autoComplete="current-password" aria-invalid={!!errors.password} {...form.register("password")} />
            <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={form.watch("remember")} onCheckedChange={(c) => form.setValue("remember", !!c)} /> Remember this device
        </label>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Sign in
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          New citizen? <Link to="/register" className="font-medium text-primary hover:underline">Create an account</Link>
        </p>
      </form>

      <div className="mt-8 rounded-lg border border-dashed bg-muted/40 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Demo accounts</span>
          <span className="text-[10px] text-muted-foreground">Any password · 6+ chars</span>
        </div>
        <div className="grid gap-1.5">
          {DEMO.map((d) => (
            <button key={d.role} onClick={() => demo(d.role)} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-left transition-colors hover:border-primary/50">
              <d.icon className="h-4 w-4 text-primary" />
              <span className="flex-1">
                <span className="block text-sm font-medium">{ROLE_LABEL[d.role]}</span>
                <span className="block text-xs text-muted-foreground">{d.desc}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
