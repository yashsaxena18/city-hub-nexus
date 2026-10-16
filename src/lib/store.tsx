import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AuditEntry, Category, Department, DuplicateFlag, Incident, Notification, Priority, Role, SlaRule, Status, User } from "./types";
import { OPEN_STATUSES } from "./types";
import {
  CATEGORY_DEPT,
  DEFAULT_SLA,
  DEMO_ACCOUNTS,
  DEMO_USERS,
  DEPARTMENTS,
  generateAudit,
  generateIncidents,
  generateNotifications,
  makeRef,
  slaFor,
} from "./demo-data";
import { assessIncident } from "./ai";

/**
 * Centralised demo data layer. All mutations go through `actions`, which is the
 * seam to replace with FastAPI calls later. State is persisted to localStorage
 * (non-sensitive demo data only — never credentials).
 */

export interface State {
  incidents: Incident[];
  departments: Department[];
  users: User[];
  notifications: Notification[];
  audit: AuditEntry[];
  sla: SlaRule[];
  duplicateFlags: DuplicateFlag[];
  sessionUserId: string | null;
  seq: number;
}

const KEY = "scn-demo-state-v1";
const H = 3600_000;

export function createInitialState(now = Date.now()): State {
  const incidents = generateIncidents(now);
  return {
    incidents,
    departments: DEPARTMENTS,
    users: DEMO_USERS,
    notifications: generateNotifications(incidents, now),
    audit: generateAudit(now),
    sla: DEFAULT_SLA,
    duplicateFlags: [],
    sessionUserId: null,
    seq: 3000,
  };
}

let idc = 0;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${(idc++).toString(36)}`;

/** Pure helpers (also used by tests) */
export function isOverdue(i: Incident, now = Date.now()) {
  return OPEN_STATUSES.includes(i.status) && new Date(i.slaDeadline).getTime() < now;
}

export function applyStatus(i: Incident, status: Status, actor: string, note?: string, now = Date.now()): Incident {
  const at = new Date(now).toISOString();
  return {
    ...i,
    status,
    resolvedAt: status === "Resolved" ? at : status === "Reopened" ? null : i.resolvedAt,
    resolutionNotes: status === "Resolved" && note ? note : i.resolutionNotes,
    timeline: [
      ...i.timeline,
      { id: uid("t"), at, type: "status", actor, message: `Status changed ${i.status} → ${status}${note ? ` — ${note}` : ""}` },
    ],
  };
}

export function applyPriority(i: Incident, priority: Priority, rules: SlaRule[], actor: string, now = Date.now()): Incident {
  const r = slaFor(priority, rules);
  const start = new Date(i.reportedAt).getTime();
  return {
    ...i,
    priority,
    ackDeadline: new Date(start + r.ackHours * H).toISOString(),
    slaDeadline: new Date(start + r.resolveHours * H).toISOString(),
    timeline: [...i.timeline, { id: uid("t"), at: new Date(now).toISOString(), type: "priority", actor, message: `Priority changed ${i.priority} → ${priority}` }],
  };
}

export interface NewIncidentInput {
  title: string;
  category: Category;
  description: string;
  priority: Priority;
  lat: number;
  lng: number;
  location: string;
  ward: string;
  photos: string[];
  observedAt: string;
}

function useStoreImpl() {
  const [state, setState] = useState<State>(() => createInitialState());
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {
      /* ignore corrupt demo state */
    }
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota: photos may be large; ignore */
    }
  }, [state]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const me = state.users.find((u) => u.id === state.sessionUserId) ?? null;
  const meRef = useRef(me);
  meRef.current = me;

  const mutate = useCallback((fn: (s: State) => State) => setState((s) => fn(s)), []);

  const audit = (s: State, action: string, target: string, detail: string): AuditEntry[] => {
    const u = meRef.current;
    return [{ id: uid("a"), at: new Date().toISOString(), actor: u?.name ?? "System", role: u?.role ?? "admin", action, target, detail }, ...s.audit];
  };
  const notify = (s: State, n: Omit<Notification, "id" | "at" | "read">): Notification[] => [
    { ...n, id: uid("n"), at: new Date().toISOString(), read: false },
    ...s.notifications,
  ];
  const updateIncident = (s: State, id: string, fn: (i: Incident) => Incident) => s.incidents.map((i) => (i.id === id ? fn(i) : i));
  const actorName = () => meRef.current?.name ?? "System";

  const actions = useMemo(
    () => ({
      loginAs(role: Role) {
        mutate((s) => ({ ...s, sessionUserId: DEMO_ACCOUNTS[role] }));
      },
      loginUser(userId: string) {
        mutate((s) => ({ ...s, sessionUserId: userId }));
      },
      logout() {
        mutate((s) => ({ ...s, sessionUserId: null }));
      },
      resetDemo() {
        const fresh = createInitialState();
        mutate((s) => ({ ...fresh, sessionUserId: s.sessionUserId }));
      },
      registerCitizen(name: string, email: string) {
        const id = uid("u-cit");
        mutate((s) => ({
          ...s,
          users: [...s.users, { id, name, email, role: "citizen", departmentId: null, phone: "", active: true }],
          sessionUserId: id,
        }));
      },
      createIncident(input: NewIncidentInput): { id: string; ref: string } {
        const id = uid("inc");
        const ref = makeRef(stateRef.current.seq + 1);
        stateRef.current = { ...stateRef.current, seq: stateRef.current.seq + 1 };
        mutate((s) => {
          const now = Date.now();
          const r = slaFor(input.priority, s.sla);
          const inc: Incident = {
            id,
            ref,
            ...input,
            status: "Submitted",
            reporterId: meRef.current?.id ?? "u-cit-0",
            departmentId: null,
            officerId: null,
            workerId: null,
            reportedAt: new Date(now).toISOString(),
            ackDeadline: new Date(now + r.ackHours * H).toISOString(),
            slaDeadline: new Date(now + r.resolveHours * H).toISOString(),
            resolvedAt: null,
            beforePhotos: [],
            afterPhotos: [],
            resolutionNotes: "",
            timeline: [{ id: uid("t"), at: new Date(now).toISOString(), type: "created", actor: actorName(), message: `Incident reported. Observed ${new Date(input.observedAt).toLocaleString()}` }],
            ai: null,
          };
          return {
            ...s,
            seq: Math.max(s.seq + 1, Number(ref.slice(-5))),
            incidents: [inc, ...s.incidents],
            notifications: notify(s, { title: "New incident reported", body: `${ref} · ${input.title}`, incidentId: id, audience: ["admin"], kind: input.priority === "Critical" ? "critical" : "info" }),
            audit: audit(s, "Created incident", ref, input.category),
          };
        });
        return { id, ref };
      },
      assign(id: string, departmentId: string, officerId: string | null, workerId?: string | null) {
        mutate((s) => {
          const inc = s.incidents.find((i) => i.id === id)!;
          const dept = s.departments.find((d) => d.id === departmentId)!;
          const officer = s.users.find((u) => u.id === officerId);
          const worker = s.users.find((u) => u.id === workerId);
          return {
            ...s,
            incidents: updateIncident(s, id, (i) => ({
              ...i,
              departmentId,
              officerId,
              workerId: workerId === undefined ? i.workerId : workerId,
              status: ["Submitted", "Under Review", "Reopened"].includes(i.status) ? "Assigned" : i.status,
              timeline: [...i.timeline, { id: uid("t"), at: new Date().toISOString(), type: "assigned", actor: actorName(), message: `Assigned to ${dept.name}${officer ? ` · ${officer.name}` : ""}${worker ? ` · field: ${worker.name}` : ""}` }],
            })),
            notifications: notify(s, { title: "Incident assigned", body: `${inc.ref} assigned to ${dept.name}`, incidentId: id, audience: ["officer", "field"], kind: "info" }),
            audit: audit(s, "Assigned incident", inc.ref, `${dept.name}${officer ? ` / ${officer.name}` : ""}`),
          };
        });
      },
      assignWorker(id: string, workerId: string) {
        mutate((s) => {
          const inc = s.incidents.find((i) => i.id === id)!;
          const w = s.users.find((u) => u.id === workerId)!;
          return {
            ...s,
            incidents: updateIncident(s, id, (i) => ({ ...i, workerId, timeline: [...i.timeline, { id: uid("t"), at: new Date().toISOString(), type: "assigned", actor: actorName(), message: `Field task assigned to ${w.name}` }] })),
            notifications: notify(s, { title: "New field task", body: `${inc.ref} · ${inc.title}`, incidentId: id, audience: ["field"], userId: workerId, kind: "info" }),
            audit: audit(s, "Assigned field worker", inc.ref, w.name),
          };
        });
      },
      setStatus(id: string, status: Status, note?: string) {
        mutate((s) => {
          const inc = s.incidents.find((i) => i.id === id)!;
          return {
            ...s,
            incidents: updateIncident(s, id, (i) => applyStatus(i, status, actorName(), note)),
            notifications: notify(s, { title: `Status: ${status}`, body: `${inc.ref} · ${inc.title}`, incidentId: id, audience: "all", userId: inc.reporterId, kind: status === "Resolved" ? "success" : "info" }),
            audit: audit(s, "Updated status", inc.ref, `${inc.status} → ${status}`),
          };
        });
      },
      setPriority(id: string, priority: Priority) {
        mutate((s) => {
          const inc = s.incidents.find((i) => i.id === id)!;
          return {
            ...s,
            incidents: updateIncident(s, id, (i) => applyPriority(i, priority, s.sla, actorName())),
            audit: audit(s, "Changed priority", inc.ref, `${inc.priority} → ${priority}`),
          };
        });
      },
      addNote(id: string, note: string, kind = "note") {
        mutate((s) => {
          const inc = s.incidents.find((i) => i.id === id)!;
          return {
            ...s,
            incidents: updateIncident(s, id, (i) => ({ ...i, timeline: [...i.timeline, { id: uid("t"), at: new Date().toISOString(), type: kind, actor: actorName(), message: note }] })),
            audit: audit(s, kind === "reassign" ? "Requested reassignment" : "Added note", inc.ref, note.slice(0, 80)),
          };
        });
      },
      addPhotos(id: string, which: "beforePhotos" | "afterPhotos" | "photos", urls: string[]) {
        mutate((s) => ({
          ...s,
          incidents: updateIncident(s, id, (i) => ({ ...i, [which]: [...i[which], ...urls], timeline: [...i.timeline, { id: uid("t"), at: new Date().toISOString(), type: "evidence", actor: actorName(), message: `${urls.length} ${which === "beforePhotos" ? "before" : which === "afterPhotos" ? "after" : ""} photo(s) uploaded` }] })),
        }));
      },
      escalate(id: string, reason: string, simulated = false) {
        mutate((s) => {
          const inc = s.incidents.find((i) => i.id === id)!;
          const r = slaFor(inc.priority, s.sla);
          return {
            ...s,
            incidents: updateIncident(s, id, (i) => ({ ...i, status: "Escalated", timeline: [...i.timeline, { id: uid("t"), at: new Date().toISOString(), type: "escalated", actor: simulated ? "SLA monitor (simulated)" : actorName(), message: `Escalated to ${r.escalateTo}: ${reason}` }] })),
            notifications: notify(s, { title: simulated ? "Simulated SLA escalation" : "Incident escalated", body: `${inc.ref} → ${r.escalateTo}`, incidentId: id, audience: ["admin", "officer"], kind: "critical" }),
            audit: audit(s, "Escalated incident", inc.ref, `${r.escalateTo}: ${reason}`),
          };
        });
      },
      runAssessment(id: string) {
        mutate((s) => ({
          ...s,
          incidents: updateIncident(s, id, (i) => ({ ...i, ai: assessIncident(i), timeline: [...i.timeline, { id: uid("t"), at: new Date().toISOString(), type: "ai", actor: "Rule-based assessor (demo)", message: "Simulated AI assessment generated" }] })),
        }));
      },
      reviewAssessment(id: string, review: "Accepted" | "Rejected" | "Edited", edit?: { category: Category; priority: Priority; departmentId: string }) {
        mutate((s) => {
          const inc = s.incidents.find((i) => i.id === id)!;
          if (!inc.ai) return s;
          const ai = { ...inc.ai, ...(edit ?? {}), review };
          const apply = review !== "Rejected";
          return {
            ...s,
            incidents: updateIncident(s, id, (i) => {
              let next: Incident = { ...i, ai };
              if (apply) {
                next = { ...next, category: ai.category };
                if (ai.priority !== i.priority) next = applyPriority(next, ai.priority, s.sla, actorName());
              }
              return { ...next, timeline: [...next.timeline, { id: uid("t"), at: new Date().toISOString(), type: "ai", actor: actorName(), message: `AI recommendation ${review.toLowerCase()}` }] };
            }),
            audit: audit(s, `AI recommendation ${review.toLowerCase()}`, inc.ref, `${ai.category} / ${ai.priority}`),
          };
        });
      },
      flagDuplicate(pair: string, state: DuplicateFlag["state"]) {
        mutate((s) => ({
          ...s,
          duplicateFlags: [...s.duplicateFlags.filter((d) => d.pair !== pair), { pair, state }],
          audit: audit(s, state === "Dismissed" ? "Dismissed duplicate" : "Flagged duplicate for review", pair.replace("|", " ↔ "), ""),
        }));
      },
      markRead(id: string) {
        mutate((s) => ({ ...s, notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
      },
      markAllRead(ids: string[]) {
        mutate((s) => ({ ...s, notifications: s.notifications.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)) }));
      },
      deleteNotification(id: string) {
        mutate((s) => ({ ...s, notifications: s.notifications.filter((n) => n.id !== id) }));
      },
      upsertDepartment(d: Department) {
        mutate((s) => {
          const exists = s.departments.some((x) => x.id === d.id);
          return {
            ...s,
            departments: exists ? s.departments.map((x) => (x.id === d.id ? d : x)) : [...s.departments, d],
            audit: audit(s, exists ? "Edited department" : "Created department", d.name, ""),
          };
        });
      },
      toggleDepartment(id: string) {
        mutate((s) => {
          const d = s.departments.find((x) => x.id === id)!;
          return { ...s, departments: s.departments.map((x) => (x.id === id ? { ...x, active: !x.active } : x)), audit: audit(s, d.active ? "Deactivated department" : "Activated department", d.name, "") };
        });
      },
      upsertUser(u: User) {
        mutate((s) => {
          const exists = s.users.some((x) => x.id === u.id);
          return { ...s, users: exists ? s.users.map((x) => (x.id === u.id ? u : x)) : [...s.users, u], audit: audit(s, exists ? "Edited user" : "Created demo user", u.name, u.role) };
        });
      },
      toggleUser(id: string) {
        mutate((s) => {
          const u = s.users.find((x) => x.id === id)!;
          return { ...s, users: s.users.map((x) => (x.id === id ? { ...x, active: !x.active } : x)), audit: audit(s, u.active ? "Deactivated user" : "Activated user", u.name, "") };
        });
      },
      updateSla(rule: SlaRule) {
        mutate((s) => ({ ...s, sla: s.sla.map((r) => (r.priority === rule.priority ? rule : r)), audit: audit(s, "Updated SLA rule", rule.priority, `Ack ${rule.ackHours}h · Resolve ${rule.resolveHours}h`) }));
      },
      updateProfile(patch: Partial<User>) {
        mutate((s) => ({ ...s, users: s.users.map((u) => (u.id === s.sessionUserId ? { ...u, ...patch } : u)) }));
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate],
  );

  return { state, ready, me, actions };
}

type Store = ReturnType<typeof useStoreImpl>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const store = useStoreImpl();
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside provider");
  return s;
}

/** Selector helpers */
export function useLookups() {
  const { state } = useStore();
  return useMemo(() => {
    const users = new Map(state.users.map((u) => [u.id, u]));
    const depts = new Map(state.departments.map((d) => [d.id, d]));
    return {
      user: (id: string | null | undefined) => (id ? users.get(id) : undefined),
      dept: (id: string | null | undefined) => (id ? depts.get(id) : undefined),
      deptForCategory: (c: Category) => CATEGORY_DEPT[c],
    };
  }, [state.users, state.departments]);
}

export function visibleNotifications(ns: Notification[], me: User | null) {
  if (!me) return [];
  return ns.filter((n) => (n.userId ? n.userId === me.id || (n.audience !== "all" && n.audience.includes(me.role) && me.role !== "citizen") : n.audience === "all" ? me.role !== "citizen" : n.audience.includes(me.role)));
}
