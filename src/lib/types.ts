export type Role = "admin" | "citizen" | "officer" | "field";

export const STATUSES = [
  "Submitted",
  "Under Review",
  "Assigned",
  "Acknowledged",
  "In Progress",
  "Escalated",
  "Resolved",
  "Closed",
  "Reopened",
  "Rejected",
] as const;
export type Status = (typeof STATUSES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const CATEGORIES = [
  "Road Damage",
  "Garbage Collection",
  "Water Supply",
  "Drainage & Sewage",
  "Streetlight",
  "Traffic Signal",
  "Public Infrastructure",
  "Environmental Hazard",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const OPEN_STATUSES: Status[] = [
  "Submitted",
  "Under Review",
  "Assigned",
  "Acknowledged",
  "In Progress",
  "Escalated",
  "Reopened",
];

export interface TimelineEvent {
  id: string;
  at: string;
  type: string;
  actor: string;
  message: string;
}

export interface AiAssessment {
  category: Category;
  priority: Priority;
  departmentId: string;
  explanation: string;
  signals: string[];
  at: string;
  review: "Pending" | "Accepted" | "Edited" | "Rejected";
}

export interface Incident {
  id: string;
  ref: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: Status;
  lat: number;
  lng: number;
  location: string;
  ward: string;
  reporterId: string;
  departmentId: string | null;
  officerId: string | null;
  workerId: string | null;
  reportedAt: string;
  ackDeadline: string;
  slaDeadline: string;
  resolvedAt: string | null;
  photos: string[];
  beforePhotos: string[];
  afterPhotos: string[];
  resolutionNotes: string;
  timeline: TimelineEvent[];
  ai: AiAssessment | null;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  head: string;
  active: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  phone: string;
  active: boolean;
  ward?: string;
}

export interface Notification {
  id: string;
  at: string;
  title: string;
  body: string;
  incidentId?: string;
  audience: Role[] | "all";
  userId?: string;
  read: boolean;
  kind: "info" | "warning" | "critical" | "success";
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  role: Role;
  action: string;
  target: string;
  detail: string;
}

export interface SlaRule {
  priority: Priority;
  ackHours: number;
  resolveHours: number;
  escalateTo: string;
}

export interface DuplicateFlag {
  pair: string; // "idA|idB"
  state: "Dismissed" | "Under Review";
}
