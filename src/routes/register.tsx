import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/app/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create a citizen account — SmartCity Nexus" },
      { name: "description", content: "Register to report and track civic issues in your city." },
      { property: "og:title", content: "Register — SmartCity Nexus" },
      { property: "og:description", content: "Create a citizen account to report city issues." },
    ],
  }),
  component: Register,
});

const schema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name").max(80),
    email: z.string().trim().email("Enter a valid email address").max(120),
    password: z.string().min(8, "At least 8 characters").regex(/[A-Z]/, "Include an uppercase letter").regex(/[0-9]/, "Include a number"),
    confirm: z.string(),
    terms: z.literal(true, { errorMap: () => ({ message: "You must accept the terms" }) }),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords do not match" });

function Register() {
  const { actions, state } = useStore();
  const navigate = useNavigate();
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", password: "", confirm: "", terms: false as unknown as true } });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (v) => {
    await new Promise((r) => setTimeout(r, 600));
    if (state.users.some((u) => u.email.toLowerCase() === v.email.toLowerCase())) {
      form.setError("email", { message: "An account with this email already exists" });
      return;
    }
    actions.registerCitizen(v.name, v.email);
    toast.success("Account created — welcome to Nexus");
    navigate({ to: "/citizen" });
  });

  const field = (id: "name" | "email" | "password" | "confirm", label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} aria-invalid={!!errors[id]} {...form.register(id)} />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]?.message}</p>}
    </div>
  );

  return (
    <AuthLayout title="Create a citizen account" subtitle="Registration creates citizen accounts only. Staff roles are assigned by administrators.">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {field("name", "Full name")}
        {field("email", "Email", "email")}
        {field("password", "Password", "password")}
        {field("confirm", "Confirm password", "password")}
        <div>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox className="mt-0.5" checked={!!form.watch("terms")} onCheckedChange={(c) => form.setValue("terms", (c === true) as true, { shouldValidate: true })} />
            I agree to the terms of use and acknowledge reports may be shared with municipal departments.
          </label>
          {errors.terms && <p className="mt-1 text-xs text-destructive">{errors.terms.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />} Create account
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already registered? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
