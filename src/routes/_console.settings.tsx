import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { DemoBadge, PageHeader, Panel } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useStore } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { ROLE_LABEL } from "@/lib/nav";

export const Route = createFileRoute("/_console/settings")({
  head: () => ({ meta: [{ title: "Settings — SmartCity Nexus" }, { name: "description", content: "Profile, appearance and notification preferences." }, { property: "og:title", content: "Settings — SmartCity Nexus" }, { property: "og:description", content: "Account settings." }] }),
  component: Settings,
});

const schema = z.object({ name: z.string().trim().min(2, "Name must be at least 2 characters").max(80), phone: z.string().trim().max(20) });

function Settings() {
  const { me, actions } = useStore();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(me!.name);
  const [phone, setPhone] = useState(me!.phone);
  const save = () => {
    const r = schema.safeParse({ name, phone });
    if (!r.success) return toast.error(r.error.issues[0].message);
    actions.updateProfile(r.data);
    toast.success("Profile saved locally (demo)");
  };
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Profile & settings" />
      <Panel title="Profile">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="n">Full name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="p">Phone</Label><Input id="p" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input value={me!.email} disabled /></div>
          <div className="space-y-1.5"><Label>Role</Label><Input value={ROLE_LABEL[me!.role]} disabled /></div>
        </div>
        <Button className="mt-4" onClick={save}>Save profile</Button>
      </Panel>
      <Panel title="Appearance">
        <div className="flex items-center justify-between"><div><div className="text-sm font-medium">Dark mode</div><div className="text-xs text-muted-foreground">Saved on this device.</div></div><Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} /></div>
      </Panel>
      <Panel title="Notification channels" actions={<DemoBadge>Requires backend</DemoBadge>}>
        {["Email alerts", "SMS alerts", "Daily digest"].map((l) => <div key={l} className="flex items-center justify-between py-1.5 text-sm opacity-60"><span>{l}</span><Switch disabled /></div>)}
        <p className="mt-2 text-xs text-muted-foreground">These channels are unavailable until a messaging backend is connected. In-app notifications work in demo mode.</p>
      </Panel>
      <Panel title="Security">
        <p className="text-sm text-muted-foreground">Password changes and two-factor authentication require a connected authentication service.</p>
      </Panel>
      <Panel title="Demo data">
        <AlertDialog>
          <AlertDialogTrigger asChild><Button variant="destructive">Reset demo data</Button></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Reset all demo data?</AlertDialogTitle><AlertDialogDescription>New reports, assignments, notes and audit entries in this browser will be discarded.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { actions.resetDemo(); toast.success("Demo data reset"); }}>Reset</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Panel>
    </div>
  );
}
