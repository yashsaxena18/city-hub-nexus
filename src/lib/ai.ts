import type { AiAssessment, Category, Incident, Priority } from "./types";
import { CATEGORY_DEPT } from "./demo-data";

/**
 * Rule-based, keyword-driven assessor used in DEMO MODE.
 * This is NOT a machine-learning model; it's a transparent stand-in for a future AI service.
 */
const KEYWORDS: Record<Category, string[]> = {
  "Road Damage": ["pothole", "road", "footpath", "carriageway", "asphalt", "caved"],
  "Garbage Collection": ["garbage", "bin", "waste", "collection", "trash"],
  "Water Supply": ["water", "pipe", "pipeline", "leak", "tap", "supply"],
  "Drainage & Sewage": ["drain", "sewage", "manhole", "sewer", "flood"],
  Streetlight: ["streetlight", "light", "lamp", "dark", "wiring"],
  "Traffic Signal": ["signal", "traffic", "junction", "sign", "timer"],
  "Public Infrastructure": ["bench", "park", "shelter", "toilet", "bridge", "building"],
  "Environmental Hazard": ["tree", "burning", "smoke", "debris", "dumped", "pollution"],
};
const URGENT = ["live wires", "exposed", "open manhole", "dangerous", "burst", "gushing", "fallen", "blocking", "sewage", "school", "caved"];
const MODERATE = ["congestion", "dark", "flooding", "health", "days", "contaminated"];

export function assessIncident(i: Pick<Incident, "title" | "description" | "category" | "priority">, now = Date.now()): AiAssessment {
  const text = `${i.title} ${i.description}`.toLowerCase();
  let best: Category = i.category;
  let bestScore = 0;
  for (const [cat, words] of Object.entries(KEYWORDS) as [Category, string[]][]) {
    const score = words.filter((w) => text.includes(w)).length;
    if (score > bestScore) {
      best = cat;
      bestScore = score;
    }
  }
  const urgent = URGENT.filter((w) => text.includes(w));
  const moderate = MODERATE.filter((w) => text.includes(w));
  const priority: Priority = urgent.length >= 2 ? "Critical" : urgent.length === 1 ? "High" : moderate.length ? "Medium" : "Low";
  const signals = [
    ...(bestScore ? KEYWORDS[best].filter((w) => text.includes(w)).map((w) => `category keyword: “${w}”`) : ["no category keywords matched — kept reported category"]),
    ...urgent.map((w) => `safety signal: “${w}”`),
    ...moderate.map((w) => `impact signal: “${w}”`),
  ];
  return {
    category: best,
    priority,
    departmentId: CATEGORY_DEPT[best],
    explanation: `Rule-based match on ${bestScore} category keyword(s) and ${urgent.length} safety signal(s). ${priority === "Critical" || priority === "High" ? "Public-safety terms suggest elevated urgency." : "No immediate safety risk terms detected."}`,
    signals,
    at: new Date(now).toISOString(),
    review: "Pending",
  };
}

const R = 6371;
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function tokens(s: string) {
  return new Set(s.toLowerCase().replace(/[^a-z ]/g, " ").split(/\s+/).filter((w) => w.length > 3));
}
export function textSimilarity(a: string, b: string) {
  const A = tokens(a);
  const B = tokens(b);
  const inter = [...A].filter((x) => B.has(x)).length;
  return inter / Math.max(1, new Set([...A, ...B]).size);
}

export function findDuplicates(target: Incident, all: Incident[]) {
  return all
    .filter((o) => o.id !== target.id && o.category === target.category)
    .map((o) => {
      const km = distanceKm(target, o);
      const sim = textSimilarity(`${target.title} ${target.description}`, `${o.title} ${o.description}`);
      const score = Math.max(0, sim * 0.6 + Math.max(0, 1 - km / 1.5) * 0.4);
      return { incident: o, km, score };
    })
    .filter((d) => d.score > 0.45)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function summarize(i: Incident) {
  const missing: string[] = [];
  if (!i.photos.length) missing.push("No photographs attached");
  if (i.description.length < 60) missing.push("Description is brief; exact landmark or size not stated");
  if (!i.departmentId) missing.push("No department assigned yet");
  const followUps = [
    !i.departmentId ? `Assign to the responsible department for ${i.category}` : "Confirm the assigned officer has acknowledged",
    i.priority === "Critical" || i.priority === "High" ? "Arrange site barricading or interim safety measures" : "Schedule inspection within the SLA window",
    "Notify the reporter once work begins",
  ];
  return {
    summary: `${i.priority}-priority ${i.category.toLowerCase()} issue at ${i.location}: ${i.description}`,
    key: [`Ward: ${i.ward}`, `Status: ${i.status}`, `Reported: ${new Date(i.reportedAt).toLocaleString()}`],
    missing,
    followUps,
  };
}
