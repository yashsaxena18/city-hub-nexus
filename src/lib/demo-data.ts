import type {
  AuditEntry,
  Category,
  Department,
  Incident,
  Notification,
  Priority,
  SlaRule,
  Status,
  User,
} from "./types";
import { CATEGORIES } from "./types";

/** Demonstration dataset. Generated deterministically relative to `now`. */

export const CITY = { name: "Pune Metropolitan Region", center: [18.5204, 73.8567] as [number, number] };

export const WARDS: { name: string; lat: number; lng: number }[] = [
  { name: "Kothrud", lat: 18.5074, lng: 73.8077 },
  { name: "Shivajinagar", lat: 18.5308, lng: 73.8475 },
  { name: "Hadapsar", lat: 18.5089, lng: 73.926 },
  { name: "Aundh", lat: 18.5593, lng: 73.8078 },
  { name: "Kasba Peth", lat: 18.5196, lng: 73.8553 },
  { name: "Yerawada", lat: 18.5529, lng: 73.8797 },
  { name: "Warje", lat: 18.4844, lng: 73.8007 },
  { name: "Kondhwa", lat: 18.4697, lng: 73.89 },
  { name: "Baner", lat: 18.559, lng: 73.7868 },
  { name: "Viman Nagar", lat: 18.5679, lng: 73.9143 },
];

export const DEPARTMENTS: Department[] = [
  { id: "road", name: "Road Maintenance", description: "Potholes, resurfacing, footpaths and road safety works.", head: "Er. Vikram Joshi", active: true },
  { id: "waste", name: "Waste Management", description: "Door-to-door collection, bins, transfer stations and street sweeping.", head: "Meera Kulkarni", active: true },
  { id: "water", name: "Water Supply", description: "Distribution network, leaks, pressure and supply schedules.", head: "Er. Sanjay Patil", active: true },
  { id: "drainage", name: "Drainage and Sanitation", description: "Storm drains, sewer lines, manholes and public toilets.", head: "Rahul Deshmukh", active: true },
  { id: "electrical", name: "Electrical Maintenance", description: "Streetlights, high-mast lamps and municipal electrical assets.", head: "Er. Priya Nair", active: true },
  { id: "traffic", name: "Traffic and Transport", description: "Signals, signage, lane markings and bus stops.", head: "Arjun Mehta", active: true },
  { id: "infrastructure", name: "Public Infrastructure", description: "Parks, public buildings, benches, bridges and civic property.", head: "Kavita Shah", active: true },
  { id: "environment", name: "Environmental Services", description: "Tree falls, illegal dumping, burning and pollution complaints.", head: "Dr. Neha Gokhale", active: true },
];

export const CATEGORY_DEPT: Record<Category, string> = {
  "Road Damage": "road",
  "Garbage Collection": "waste",
  "Water Supply": "water",
  "Drainage & Sewage": "drainage",
  Streetlight: "electrical",
  "Traffic Signal": "traffic",
  "Public Infrastructure": "infrastructure",
  "Environmental Hazard": "environment",
};

export const DEFAULT_SLA: SlaRule[] = [
  { priority: "Critical", ackHours: 1, resolveHours: 8, escalateTo: "Commissioner's Office" },
  { priority: "High", ackHours: 4, resolveHours: 24, escalateTo: "Department Head" },
  { priority: "Medium", ackHours: 8, resolveHours: 72, escalateTo: "Department Head" },
  { priority: "Low", ackHours: 24, resolveHours: 168, escalateTo: "Ward Officer" },
];

const OFFICER_NAMES = ["Rohan Kale", "Sneha Iyer", "Amit Bhosale", "Pooja Rane", "Nikhil Pawar", "Aditi Sawant", "Karan Malhotra", "Ritu Jadhav"];
const WORKER_NAMES = ["Suresh Gaikwad", "Manoj Shinde", "Ganesh More", "Lata Wagh", "Imran Shaikh", "Deepak Salunke", "Sunita Chavan", "Prakash Mane"];
const CITIZEN_NAMES = ["Aarav Sharma", "Isha Verma", "Farhan Qureshi", "Divya Menon", "Tanmay Kulkarni", "Zoya Fernandes"];

export const DEMO_USERS: User[] = [
  { id: "u-admin", name: "Ananya Rao", email: "admin@nexus.demo", role: "admin", departmentId: null, phone: "+91 98220 10001", active: true },
  ...DEPARTMENTS.map((d, i) => ({ id: `u-off-${d.id}`, name: OFFICER_NAMES[i], email: `${OFFICER_NAMES[i].split(" ")[0].toLowerCase()}@nexus.demo`, role: "officer" as const, departmentId: d.id, phone: `+91 98220 2${String(i).padStart(4, "0")}`, active: true })),
  ...DEPARTMENTS.map((d, i) => ({ id: `u-fw-${d.id}`, name: WORKER_NAMES[i], email: `${WORKER_NAMES[i].split(" ")[0].toLowerCase()}@nexus.demo`, role: "field" as const, departmentId: d.id, phone: `+91 98220 3${String(i).padStart(4, "0")}`, active: true })),
  ...CITIZEN_NAMES.map((n, i) => ({ id: `u-cit-${i}`, name: n, email: `${n.split(" ")[0].toLowerCase()}@citizen.demo`, role: "citizen" as const, departmentId: null, phone: `+91 98220 4${String(i).padStart(4, "0")}`, active: true, ward: WARDS[i].name })),
];

export const DEMO_ACCOUNTS: Record<"admin" | "citizen" | "officer" | "field", string> = {
  admin: "u-admin",
  citizen: "u-cit-0",
  officer: "u-off-road",
  field: "u-fw-road",
};

const TEMPLATES: Record<Category, { t: string; d: string }[]> = {
  "Road Damage": [
    { t: "Deep pothole near bus stop", d: "Large pothole roughly 1m wide causing two-wheelers to swerve into traffic." },
    { t: "Road surface caved in after rain", d: "Portion of the carriageway has sunk; water collecting and depth unknown." },
    { t: "Broken footpath slabs", d: "Several footpath slabs broken and lifted, pedestrians forced onto road." },
  ],
  "Garbage Collection": [
    { t: "Overflowing community bin", d: "Bin has not been cleared for three days, waste spilling onto the road." },
    { t: "Missed door-to-door collection", d: "Collection vehicle has not visited the lane since Monday." },
    { t: "Garbage pile at street corner", d: "Mixed waste dumped at the corner, stray animals spreading it." },
  ],
  "Water Supply": [
    { t: "Major pipeline leak", d: "Clean water gushing from a burst pipe beside the main road for hours." },
    { t: "No water supply since morning", d: "Entire housing society reports no supply during scheduled hours." },
    { t: "Contaminated tap water", d: "Residents report muddy, foul-smelling water from municipal taps." },
  ],
  "Drainage & Sewage": [
    { t: "Open manhole on main road", d: "Manhole cover missing, extremely dangerous at night." },
    { t: "Sewage overflow into lane", d: "Sewage line overflowing, strong odour and health risk to residents." },
    { t: "Blocked storm drain", d: "Drain choked with plastic, road flooding during light rain." },
  ],
  Streetlight: [
    { t: "Streetlights not working on stretch", d: "About 8 consecutive lights off, stretch completely dark after 7 pm." },
    { t: "Flickering streetlight near school", d: "Light flickers continuously, children use this route in the evening." },
    { t: "Exposed wiring on light pole", d: "Junction box open with live wires exposed at ground level." },
  ],
  "Traffic Signal": [
    { t: "Traffic signal not functioning", d: "Signal at the junction is off, heavy congestion during peak hours." },
    { t: "Signal timer stuck", d: "Pedestrian timer stuck on red, people crossing unsafely." },
    { t: "Damaged road sign", d: "Speed limit sign knocked down by a vehicle." },
  ],
  "Public Infrastructure": [
    { t: "Broken benches in public park", d: "Multiple benches broken with protruding iron rods." },
    { t: "Damaged bus shelter roof", d: "Roof sheet hanging loose and may fall in strong wind." },
    { t: "Public toilet non-functional", d: "Doors broken and no water supply at the public toilet block." },
  ],
  "Environmental Hazard": [
    { t: "Tree fallen across road", d: "Large tree uprooted, blocking one lane and resting on cables." },
    { t: "Garbage burning in open plot", d: "Daily burning of waste causing heavy smoke in residential area." },
    { t: "Construction debris dumped illegally", d: "Truckloads of debris dumped along the riverside at night." },
  ],
};

const STREETS = ["FC Road", "JM Road", "Karve Road", "Paud Road", "Nagar Road", "Solapur Road", "Baner Road", "Satara Road", "Laxmi Road", "Airport Road", "University Road", "Sinhagad Road"];

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const H = 3600_000;

export function slaFor(priority: Priority, rules: SlaRule[] = DEFAULT_SLA) {
  return rules.find((r) => r.priority === priority) ?? DEFAULT_SLA[2];
}

export function makeRef(n: number, year = 2026) {
  return `SCN-${year}-${String(n).padStart(5, "0")}`;
}

export function generateIncidents(now: number, count = 72): Incident[] {
  const rnd = mulberry32(20261016);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
  const list: Incident[] = [];
  const statusPool: Status[] = [
    "Submitted", "Submitted", "Under Review", "Assigned", "Assigned", "Acknowledged", "In Progress", "In Progress", "In Progress",
    "Escalated", "Resolved", "Resolved", "Resolved", "Closed", "Closed", "Reopened", "Rejected",
  ];
  const prioPool: Priority[] = ["Low", "Low", "Medium", "Medium", "Medium", "High", "High", "Critical"];
  for (let i = 0; i < count; i++) {
    const category = pick(CATEGORIES);
    const tpl = pick(TEMPLATES[category]);
    const ward = pick(WARDS);
    const priority = pick(prioPool);
    const status = pick(statusPool);
    const ageH = Math.floor(rnd() * 24 * 45) + 1;
    const reportedAt = now - ageH * H;
    const sla = slaFor(priority);
    const dept = CATEGORY_DEPT[category];
    const assigned = !["Submitted", "Under Review", "Rejected"].includes(status);
    const fieldStage = ["In Progress", "Resolved", "Closed", "Escalated"].includes(status);
    const resolved = status === "Resolved" || status === "Closed";
    const resolveH = Math.max(2, Math.floor(rnd() * sla.resolveHours * 1.4));
    const resolvedAt = resolved ? Math.min(now - H, reportedAt + resolveH * H) : null;
    const reporter = `u-cit-${Math.floor(rnd() * CITIZEN_NAMES.length)}`;
    const ref = makeRef(1000 + i * 7 + 3);
    const timeline = [
      { id: `${ref}-t1`, at: new Date(reportedAt).toISOString(), type: "created", actor: "Citizen", message: "Incident reported via citizen portal" },
    ];
    if (status !== "Submitted") timeline.push({ id: `${ref}-t2`, at: new Date(reportedAt + 0.4 * H).toISOString(), type: "reviewed", actor: "Ananya Rao", message: status === "Rejected" ? "Reviewed and rejected: outside municipal jurisdiction" : "Incident reviewed by control room" });
    if (assigned) timeline.push({ id: `${ref}-t3`, at: new Date(reportedAt + 0.8 * H).toISOString(), type: "assigned", actor: "Ananya Rao", message: `Assigned to ${DEPARTMENTS.find((d) => d.id === dept)!.name}` });
    if (fieldStage) timeline.push({ id: `${ref}-t4`, at: new Date(reportedAt + 2 * H).toISOString(), type: "started", actor: "Field team", message: "Work started on site" });
    if (status === "Escalated") timeline.push({ id: `${ref}-t5`, at: new Date(reportedAt + sla.resolveHours * H).toISOString(), type: "escalated", actor: "SLA monitor (demo)", message: `Resolution SLA breached, escalated to ${sla.escalateTo}` });
    if (resolvedAt) timeline.push({ id: `${ref}-t6`, at: new Date(resolvedAt).toISOString(), type: "resolved", actor: "Field team", message: "Work completed and verified" });
    if (status === "Closed") timeline.push({ id: `${ref}-t7`, at: new Date(resolvedAt! + 2 * H).toISOString(), type: "closed", actor: "Ananya Rao", message: "Incident closed" });
    list.push({
      id: `inc-${i + 1}`,
      ref,
      title: tpl.t,
      description: tpl.d,
      category,
      priority,
      status,
      lat: ward.lat + (rnd() - 0.5) * 0.028,
      lng: ward.lng + (rnd() - 0.5) * 0.028,
      location: `${pick(STREETS)}, ${ward.name}`,
      ward: ward.name,
      reporterId: reporter,
      departmentId: assigned ? dept : null,
      officerId: assigned ? `u-off-${dept}` : null,
      workerId: fieldStage || (assigned && rnd() > 0.5) ? `u-fw-${dept}` : null,
      reportedAt: new Date(reportedAt).toISOString(),
      ackDeadline: new Date(reportedAt + sla.ackHours * H).toISOString(),
      slaDeadline: new Date(reportedAt + sla.resolveHours * H).toISOString(),
      resolvedAt: resolvedAt ? new Date(resolvedAt).toISOString() : null,
      photos: [],
      beforePhotos: [],
      afterPhotos: [],
      resolutionNotes: resolved ? "Repair completed, site cleaned and photographed." : "",
      timeline,
      ai: null,
    });
  }
  // A guaranteed near-duplicate pair for the duplicate detection demo
  const base = list[4];
  list.push({
    ...base,
    id: `inc-${count + 1}`,
    ref: makeRef(1999),
    title: base.title + " (second report)",
    lat: base.lat + 0.0006,
    lng: base.lng - 0.0004,
    reporterId: "u-cit-5",
    status: "Submitted",
    departmentId: null,
    officerId: null,
    workerId: null,
    reportedAt: new Date(new Date(base.reportedAt).getTime() + 3 * H).toISOString(),
    timeline: [{ id: "dup-t1", at: new Date(new Date(base.reportedAt).getTime() + 3 * H).toISOString(), type: "created", actor: "Citizen", message: "Incident reported via citizen portal" }],
  });
  return list.sort((a, b) => b.reportedAt.localeCompare(a.reportedAt));
}

export function generateNotifications(incidents: Incident[], now: number): Notification[] {
  const crit = incidents.filter((i) => i.priority === "Critical" && i.status !== "Closed").slice(0, 4);
  return [
    ...crit.map((i, k) => ({ id: `n-c-${k}`, at: new Date(now - (k + 1) * 2 * H).toISOString(), title: "Critical incident open", body: `${i.ref} · ${i.title} in ${i.ward}`, incidentId: i.id, audience: ["admin", "officer"] as ("admin" | "officer")[], read: k > 1, kind: "critical" as const })),
    { id: "n-s-1", at: new Date(now - 5 * H).toISOString(), title: "SLA breach risk", body: "6 incidents are within 2 hours of their resolution deadline.", audience: ["admin"], read: false, kind: "warning" },
    { id: "n-r-1", at: new Date(now - 9 * H).toISOString(), title: "Your report was resolved", body: `${incidents[10].ref} has been marked resolved. Please confirm.`, incidentId: incidents[10].id, audience: ["citizen"], read: false, kind: "success" },
    { id: "n-t-1", at: new Date(now - 3 * H).toISOString(), title: "New task assigned", body: "A road repair task has been assigned to your crew.", audience: ["field"], read: false, kind: "info" },
    { id: "n-a-1", at: new Date(now - 26 * H).toISOString(), title: "Weekly report generated", body: "Operations summary for last week is ready to download.", audience: ["admin", "officer"], read: true, kind: "info" },
  ];
}

export function generateAudit(now: number): AuditEntry[] {
  const e = (h: number, action: string, target: string, detail: string, actor = "Ananya Rao", role: AuditEntry["role"] = "admin"): AuditEntry => ({ id: `a-${h}-${action}`, at: new Date(now - h * H).toISOString(), actor, role, action, target, detail });
  return [
    e(1, "Assigned incident", "SCN-2026-01003", "Assigned to Road Maintenance"),
    e(3, "Changed priority", "SCN-2026-01010", "Medium → High"),
    e(6, "Updated status", "SCN-2026-01024", "In Progress → Resolved", "Rohan Kale", "officer"),
    e(12, "Updated SLA rule", "Critical", "Resolution target 8h"),
    e(20, "Deactivated user", "u-cit-9", "Spam submissions"),
    e(30, "Escalated incident", "SCN-2026-01045", "Escalated to Commissioner's Office"),
  ];
}
