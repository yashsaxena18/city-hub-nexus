import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Brain, Building2, CheckCircle2, ClipboardCheck, HardHat, MapPin, Radio, ShieldCheck, Timer, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoBadge, Logo } from "@/components/app/ui-bits";
import cityImg from "@/assets/city-ops.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartCity Nexus — One City. One Command Centre." },
      { name: "description", content: "Report, monitor, assign and resolve urban incidents from a single smart-city command centre." },
      { property: "og:title", content: "SmartCity Nexus — Smart City Operations & Incident Management" },
      { property: "og:description", content: "One City. One Command Centre. Smarter Decisions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: ClipboardCheck, t: "Citizen reporting", d: "Guided, map-based reporting with photos and live status tracking." },
  { icon: Radio, t: "Unified command centre", d: "Live KPIs, critical alerts and department workload in one view." },
  { icon: Building2, t: "Department workflows", d: "Assignment, acknowledgement, progress notes and verification." },
  { icon: HardHat, t: "Field workforce", d: "Mobile-ready task lists with before/after evidence capture." },
  { icon: Timer, t: "SLA & escalation", d: "Priority-based deadlines with automatic escalation paths." },
  { icon: Brain, t: "Incident intelligence", d: "Classification, duplicate detection and summaries to support reviewers." },
  { icon: MapPin, t: "Geospatial view", d: "Clustered incident map with hotspots and ward-level filters." },
  { icon: BarChart3, t: "Analytics & reports", d: "Resolution times, SLA compliance and ward comparisons." },
];

const ROLES = [
  { icon: ShieldCheck, t: "Administrators", d: "Oversee operations, configure SLAs and audit every action." },
  { icon: Users, t: "Citizens", d: "Report issues in under a minute and follow progress." },
  { icon: Building2, t: "Department officers", d: "Manage queues, acknowledge and escalate with context." },
  { icon: HardHat, t: "Field workers", d: "Receive tasks, navigate to sites and submit evidence." },
];

const STEPS = ["Citizen reports an issue", "Control room reviews & prioritises", "Department assigns a field crew", "Work completed with evidence", "Verified, closed & reported"];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Platform</a>
            <a href="#workflow" className="hover:text-foreground">Workflow</a>
            <a href="#roles" className="hover:text-foreground">Roles</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link to="/login">Sign in</Link></Button>
            <Button size="sm" asChild><Link to="/register">Get started</Link></Button>
          </div>
        </div>
      </header>

      <section className="bg-hero relative overflow-hidden border-b">
        <div className="grid-lines absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-md border bg-card px-2 py-1 text-xs font-medium text-muted-foreground">One City. One Command Centre. Smarter Decisions.</span>
            </div>
            <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Smarter Cities.<br />Faster Response.<br /><span className="text-primary">Better Living.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              SmartCity Nexus centralises civic reporting, incident response and urban operations — connecting citizens, municipal administrators, department officers and field crews on one accountable platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild><Link to="/login" search={{ redirect: "/citizen/report" }}>Report an Issue <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button size="lg" variant="outline" asChild><Link to="/login">Explore Command Centre</Link></Button>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><DemoBadge /> Interactive demo with four role-based experiences</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="relative">
            <div className="overflow-hidden rounded-xl border bg-card shadow-elevated">
              <img src={cityImg} alt="City operations overview with live incident data points" className="aspect-[16/10] w-full object-cover" width={1600} height={1000} />
            </div>
            <div className="absolute -bottom-6 -left-4 w-56 rounded-lg border bg-card p-3 shadow-elevated sm:-left-8">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">SLA compliance <span className="text-success">▲ 4.2%</span></div>
              <div className="mt-1 font-mono text-2xl font-semibold">91.4%</div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full w-[91%] rounded-full bg-primary" /></div>
            </div>
            <div className="absolute -right-3 -top-4 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs shadow-elevated">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-critical opacity-60" /><span className="relative h-2 w-2 rounded-full bg-critical" /></span>
              Critical: Open manhole · Kothrud
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {[["8", "Municipal departments"], ["10", "City wards covered"], ["4", "Role-based workspaces"], ["24/7", "Incident visibility"]].map(([v, l]) => (
            <div key={l} className="bg-background px-6 py-6">
              <div className="font-mono text-2xl font-semibold">{v}</div>
              <div className="text-xs text-muted-foreground">{l}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <div className="text-xs font-medium uppercase tracking-wider text-primary">Platform</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Everything a city operations team needs</h2>
          <p className="mt-3 text-muted-foreground">From the first citizen report to the final audit entry, every step is tracked, measured and accountable.</p>
        </div>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.t} className="bg-card p-5">
              <f.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="border-y bg-navy text-navy-foreground">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="text-xs font-medium uppercase tracking-wider text-sidebar-primary">Workflow</div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">From report to resolution</h2>
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s} className="rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-4">
                <div className="font-mono text-xs text-sidebar-primary">0{i + 1}</div>
                <div className="mt-2 text-sm font-medium">{s}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-semibold tracking-tight">Built for every stakeholder</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((r) => (
            <div key={r.t} className="rounded-lg border bg-card p-5 shadow-card">
              <r.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{r.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{r.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-start justify-between gap-6 rounded-xl border bg-card p-8 shadow-card md:flex-row md:items-center">
          <div>
            <h3 className="text-xl font-semibold">See it in action</h3>
            <p className="mt-1 text-sm text-muted-foreground">Sign in with any demo role — no account required.</p>
          </div>
          <Button size="lg" asChild><Link to="/login">Open the demo <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <Logo />
          <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Final-year B.Tech CSE project · Demonstration data only</span>
        </div>
      </footer>
    </div>
  );
}
