import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — SmartCity Nexus" },
      { name: "description", content: "Request a password reset link for your SmartCity Nexus account." },
      { property: "og:title", content: "Forgot password — SmartCity Nexus" },
      { property: "og:description", content: "Reset access to your account." },
    ],
  }),
  component: Forgot,
});

const schema = z.object({ email: z.string().trim().email("Enter a valid email address") });

function Forgot() {
  const [sent, setSent] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "" } });
  const onSubmit = form.handleSubmit(async (v) => {
    await new Promise((r) => setTimeout(r, 700));
    setSent(v.email);
  });
  return (
    <AuthLayout title="Reset your password" subtitle="We'll send a reset link to your email.">
      {sent ? (
        <div className="rounded-lg border bg-card p-5 text-sm">
          <MailCheck className="h-6 w-6 text-success" />
          <p className="mt-3 font-medium">Check your inbox</p>
          <p className="mt-1 text-muted-foreground">In demo mode no email is sent. If an account exists for {sent}, a link would arrive shortly.</p>
          <div className="mt-4 flex gap-2">
            <Button asChild size="sm"><Link to="/reset-password">Open demo reset page</Link></Button>
            <Button asChild size="sm" variant="outline"><Link to="/login">Back to sign in</Link></Button>
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register("email")} aria-invalid={!!form.formState.errors.email} />
            {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
          </div>
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Send reset link
          </Button>
          <Link to="/login" className="block text-center text-sm text-primary hover:underline">Back to sign in</Link>
        </form>
      )}
    </AuthLayout>
  );
}
