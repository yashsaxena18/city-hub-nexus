import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — SmartCity Nexus" },
      { name: "description", content: "Set a new password for your SmartCity Nexus account." },
      { property: "og:title", content: "Reset password — SmartCity Nexus" },
      { property: "og:description", content: "Set a new account password." },
    ],
  }),
  component: Reset,
});

const schema = z
  .object({ password: z.string().min(8, "At least 8 characters").regex(/[0-9]/, "Include a number"), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

function Reset() {
  const [done, setDone] = useState(false);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });
  const { errors, isSubmitting } = form.formState;
  const onSubmit = form.handleSubmit(async () => {
    await new Promise((r) => setTimeout(r, 700));
    setDone(true);
  });
  return (
    <AuthLayout title="Choose a new password">
      {done ? (
        <div className="rounded-lg border bg-card p-5 text-sm">
          <CheckCircle2 className="h-6 w-6 text-success" />
          <p className="mt-3 font-medium">Password updated (demo)</p>
          <p className="mt-1 text-muted-foreground">No password was stored. Connect a backend to enable real resets.</p>
          <Button asChild size="sm" className="mt-4"><Link to="/login">Sign in</Link></Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input id="confirm" type="password" {...form.register("confirm")} />
            {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
          </div>
          <Button className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
