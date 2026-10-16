import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Check, CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { MapView } from "@/components/app/MapView";
import { readImages } from "@/components/app/PhotoInput";
import { PageHeader, Panel } from "@/components/app/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { CATEGORIES, PRIORITIES } from "@/lib/types";
import { WARDS } from "@/lib/demo-data";
import { distanceKm } from "@/lib/ai";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_console/citizen/report")({
  head: () => ({ meta: [{ title: "Report an Issue — SmartCity Nexus" }, { name: "description", content: "Step-by-step civic issue reporting with map location and photos." }, { property: "og:title", content: "Report an Issue — SmartCity Nexus" }, { property: "og:description", content: "Report a city issue." }] }),
  component: Wizard,
});

const schema = z.object({
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(100),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: "Choose a category" }) }),
  description: z.string().trim().min(20, "Describe the issue in at least 20 characters").max(1000),
  observedAt: z.string().min(1, "Enter when you observed it"),
  priority: z.enum(PRIORITIES),
  lat: z.number({ invalid_type_error: "Select a location on the map" }),
  lng: z.number(),
  location: z.string().trim().min(3, "Describe the location (street or landmark)").max(160),
  ward: z.string().min(1, "Select a ward"),
  notes: z.string().max(500).optional(),
  confirm: z.literal(true, { errorMap: () => ({ message: "Please confirm the information is accurate" }) }),
});
type F = z.infer<typeof schema>;
const STEPS = ["Details", "Location", "Photos", "Review"];
const STEP_FIELDS: (keyof F)[][] = [["title", "category", "description", "observedAt", "priority"], ["lat", "lng", "location", "ward"], [], ["confirm"]];

function Wizard() {
  const { actions } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [done, setDone] = useState<{ id: string; ref: string } | null>(null);
  const form = useForm<F>({ resolver: zodResolver(schema), mode: "onTouched", defaultValues: { title: "", description: "", observedAt: "", priority: "Medium", location: "", ward: "", notes: "", confirm: false as unknown as true } });
  const { register, formState: { errors, isSubmitting }, watch, setValue, trigger } = form;
  const v = watch();

  const next = async () => { if (await trigger(STEP_FIELDS[step])) setStep((s) => s + 1); };
  const pick = (p: { lat: number; lng: number }) => {
    setValue("lat", p.lat, { shouldValidate: true });
    setValue("lng", p.lng);
    const nearest = [...WARDS].sort((a, b) => distanceKm(p, a) - distanceKm(p, b))[0];
    setValue("ward", nearest.name, { shouldValidate: true });
  };
  const onSubmit = form.handleSubmit(async (d) => {
    await new Promise((r) => setTimeout(r, 800));
    try {
      const r = actions.createIncident({ title: d.title, category: d.category, description: d.notes ? `${d.description}\n\nAdditional notes: ${d.notes}` : d.description, priority: d.priority, lat: d.lat, lng: d.lng, location: d.location, ward: d.ward, photos, observedAt: d.observedAt });
      setDone(r);
      toast.success(`Report ${r.ref} submitted`);
    } catch {
      toast.error("Submission failed. Please try again.");
    }
  });
  const err = (k: keyof F) => errors[k] && <p className="text-xs text-destructive">{errors[k]?.message as string}</p>;

  if (done) return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto mt-10 max-w-md rounded-xl border bg-card p-8 text-center shadow-elevated">
      <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
      <h1 className="mt-4 text-xl font-semibold">Report submitted</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your reference number</p>
      <div className="mt-2 rounded-md border bg-muted px-4 py-2 font-mono text-lg font-semibold">{done.ref}</div>
      <p className="mt-3 text-xs text-muted-foreground">Demo mode: stored in this browser only.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button onClick={() => navigate({ to: "/incidents/$id", params: { id: done.id } })}>View incident</Button>
        <Button variant="outline" asChild><Link to="/citizen">Return to dashboard</Link></Button>
      </div>
    </motion.div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Report an issue" description="Four quick steps. Fields marked * are required." />
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-2">
            <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold", i < step ? "border-primary bg-primary text-primary-foreground" : i === step ? "border-primary text-primary" : "text-muted-foreground")}>{i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}</span>
            <span className={cn("hidden text-sm sm:inline", i === step ? "font-medium" : "text-muted-foreground")}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        ))}
      </ol>
      <form onSubmit={onSubmit} noValidate>
        <Panel>
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5"><Label htmlFor="title">Incident title *</Label><Input id="title" {...register("title")} placeholder="e.g. Deep pothole near bus stop" />{err("title")}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Category *</Label>
                  <Select value={v.category} onValueChange={(c) => setValue("category", c as F["category"], { shouldValidate: true })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>{err("category")}</div>
                <div className="space-y-1.5"><Label>Suggested urgency</Label>
                  <Select value={v.priority} onValueChange={(c) => setValue("priority", c as F["priority"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PRIORITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
                  <p className="text-[11px] text-muted-foreground">Final priority is set by the control room.</p></div>
              </div>
              <div className="space-y-1.5"><Label htmlFor="desc">Detailed description *</Label><Textarea id="desc" rows={4} {...register("description")} /><div className="flex justify-between">{err("description") ?? <span />}<span className="text-[11px] text-muted-foreground">{v.description?.length ?? 0}/1000</span></div></div>
              <div className="space-y-1.5"><Label htmlFor="obs">Date & approximate time observed *</Label><Input id="obs" type="datetime-local" max={new Date().toISOString().slice(0, 16)} {...register("observedAt")} className="w-auto" />{err("observedAt")}</div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div><Label>Click the map to place the incident *</Label>
                <div className="mt-2 overflow-hidden rounded-md border"><MapView incidents={[]} pick={{ point: v.lat != null ? { lat: v.lat, lng: v.lng } : null, onPick: pick }} className="h-80 w-full cursor-crosshair" /></div>
                <div className="mt-1.5 font-mono text-xs text-muted-foreground">{v.lat != null ? `Lat ${v.lat.toFixed(5)} · Lng ${v.lng.toFixed(5)}` : "No location selected"}</div>{err("lat")}</div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5"><Label htmlFor="loc">Location description *</Label><Input id="loc" {...register("location")} placeholder="Street, landmark" />{err("location")}</div>
                <div className="space-y-1.5"><Label>Ward *</Label><Select value={v.ward} onValueChange={(w) => setValue("ward", w, { shouldValidate: true })}><SelectTrigger><SelectValue placeholder="Auto-detected from map" /></SelectTrigger><SelectContent>{WARDS.map((w) => <SelectItem key={w.name} value={w.name}>{w.name}</SelectItem>)}</SelectContent></Select>{err("ward")}</div>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <Label>Photographs (optional · JPG/PNG/WEBP · max 5 MB · up to 4)</Label>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-sm text-muted-foreground hover:border-primary/50">
                Click to choose images
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={async (e) => {
                  if (!e.target.files) return;
                  const { urls, errors } = await readImages(e.target.files);
                  errors.forEach((x) => toast.error(x));
                  setPhotos((p) => [...p, ...urls].slice(0, 4));
                  e.target.value = "";
                }} />
              </label>
              {!!photos.length && <div className="grid grid-cols-4 gap-2">{photos.map((p, i) => (
                <div key={i} className="relative"><img src={p} alt={`Attachment ${i + 1}`} className="aspect-square w-full rounded-md border object-cover" /><button type="button" onClick={() => setPhotos(photos.filter((_, k) => k !== i))} className="absolute right-1 top-1 rounded-full bg-background/90 p-1" aria-label="Remove attachment"><X className="h-3 w-3" /></button></div>
              ))}</div>}
              <div className="space-y-1.5"><Label htmlFor="notes">Additional notes</Label><Textarea id="notes" rows={3} {...register("notes")} /></div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4 text-sm">
              {[
                ["Details", 0, [["Title", v.title], ["Category", v.category], ["Urgency", v.priority], ["Observed", v.observedAt?.replace("T", " ")], ["Description", v.description]]],
                ["Location", 1, [["Location", v.location], ["Ward", v.ward], ["Coordinates", v.lat != null ? `${v.lat.toFixed(5)}, ${v.lng.toFixed(5)}` : "—"]]],
                ["Photos", 2, [["Attachments", `${photos.length} photo(s)`], ["Notes", v.notes || "—"]]],
              ].map(([t, s, rows]) => (
                <div key={t as string} className="rounded-md border">
                  <div className="flex items-center justify-between border-b px-3 py-2"><span className="font-medium">{t as string}</span><button type="button" className="text-xs text-primary hover:underline" onClick={() => setStep(s as number)}>Edit</button></div>
                  <dl className="divide-y">{(rows as string[][]).map(([k, val]) => <div key={k} className="grid grid-cols-3 gap-2 px-3 py-1.5"><dt className="text-muted-foreground">{k}</dt><dd className="col-span-2 break-words">{val}</dd></div>)}</dl>
                </div>
              ))}
              <label className="flex items-start gap-2"><Checkbox className="mt-0.5" checked={!!v.confirm} onCheckedChange={(c) => setValue("confirm", (c === true) as true, { shouldValidate: true })} />I confirm this information is accurate to the best of my knowledge.</label>
              {err("confirm")}
            </div>
          )}
        </Panel>
        <div className="mt-4 flex justify-between">
          <Button type="button" variant="outline" disabled={step === 0 || isSubmitting} onClick={() => setStep(step - 1)}>Back</Button>
          {step < 3 ? <Button type="button" onClick={next}>Continue</Button> : <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}Submit report</Button>}
        </div>
      </form>
    </div>
  );
}
