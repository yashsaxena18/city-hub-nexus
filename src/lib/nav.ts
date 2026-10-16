import {
  Activity, BarChart3, Bell, Brain, Building2, ClipboardList, FileClock, HardHat, LayoutDashboard, Map, PlusCircle, Settings, Timer, Users,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "./types";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  roles: Role[];
  group: "Operations" | "Intelligence" | "Administration" | "Account";
}

export const NAV: NavItem[] = [
  { label: "Command Centre", to: "/admin", icon: LayoutDashboard, roles: ["admin"], group: "Operations" },
  { label: "My Dashboard", to: "/citizen", icon: LayoutDashboard, roles: ["citizen"], group: "Operations" },
  { label: "Report an Issue", to: "/citizen/report", icon: PlusCircle, roles: ["citizen"], group: "Operations" },
  { label: "Department Desk", to: "/officer", icon: LayoutDashboard, roles: ["officer"], group: "Operations" },
  { label: "My Tasks", to: "/field", icon: HardHat, roles: ["field"], group: "Operations" },
  { label: "Incident Management", to: "/incidents", icon: ClipboardList, roles: ["admin", "officer", "citizen"], group: "Operations" },
  { label: "Live City Map", to: "/map", icon: Map, roles: ["admin", "officer", "field", "citizen"], group: "Operations" },
  { label: "Department Operations", to: "/departments", icon: Building2, roles: ["admin", "officer"], group: "Operations" },
  { label: "Field Workforce", to: "/workforce", icon: Users, roles: ["admin"], group: "Operations" },
  { label: "AI Incident Intelligence", to: "/admin/ai-intelligence", icon: Brain, roles: ["admin"], group: "Intelligence" },
  { label: "Analytics & Reports", to: "/analytics", icon: BarChart3, roles: ["admin", "officer"], group: "Intelligence" },
  { label: "SLA & Escalations", to: "/admin/sla", icon: Timer, roles: ["admin"], group: "Administration" },
  { label: "Audit Logs", to: "/admin/audit-logs", icon: FileClock, roles: ["admin"], group: "Administration" },
  { label: "Notifications", to: "/notifications", icon: Bell, roles: ["admin", "officer", "field", "citizen"], group: "Account" },
  { label: "Settings", to: "/settings", icon: Settings, roles: ["admin", "officer", "field", "citizen"], group: "Account" },
];

export const HOME_FOR: Record<Role, string> = { admin: "/admin", citizen: "/citizen", officer: "/officer", field: "/field" };
export const ROLE_LABEL: Record<Role, string> = { admin: "Administrator", citizen: "Citizen", officer: "Department Officer", field: "Field Worker" };

/** Route-level access rules (longest prefix wins). */
const ACCESS: [string, Role[]][] = [
  ["/admin", ["admin"]],
  ["/citizen", ["citizen"]],
  ["/officer", ["officer"]],
  ["/field", ["field"]],
  ["/workforce", ["admin"]],
  ["/departments", ["admin", "officer"]],
  ["/analytics", ["admin", "officer"]],
  ["/incidents", ["admin", "officer", "citizen", "field"]],
  ["/map", ["admin", "officer", "field", "citizen"]],
  ["/notifications", ["admin", "officer", "field", "citizen"]],
  ["/settings", ["admin", "officer", "field", "citizen"]],
];

export function canAccess(path: string, role: Role) {
  const match = ACCESS.filter(([p]) => path === p || path.startsWith(p + "/")).sort((a, b) => b[0].length - a[0].length)[0];
  return match ? match[1].includes(role) : true;
}

export const CRUMB: Record<string, string> = Object.fromEntries(NAV.map((n) => [n.to, n.label]));

export { Activity };
