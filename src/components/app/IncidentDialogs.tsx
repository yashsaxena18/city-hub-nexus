import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useStore } from "@/lib/store";
import { PRIORITIES, STATUSES, type Incident, type Priority, type Status } from "@/lib/types";

export type DialogKind = "assign" | "priority" | "status" | "note" | "escalate" | "reassign";

/** Which status transitions each role may perform. */
export function allowedStatuses(role: string, current: Status): Status[] {
  if (role === "admin") return STATUSES.filter((s) => s !== current);
  if (role === "officer") return (["Acknowledged", "In Progress", "Resolved", "Reopened"] as Status[]).filter((s) => s !== current);
  if (role === "field") return (["In Progress", "Resolved"] as Status[]).filter((s) => s !== current);
  return [];
}

export function useIncidentDialogs() {
  const [kind, setKind] = useState<DialogKind | null>(null);
  const [incId, setIncId] = useState<string | null>(null);
  const open = (k: DialogKind, i: Incident) => {
    setIncId(i.id);
    setKind(k);
  };
  const node = <IncidentDialogs kind={kind} incidentId={incId} onClose={() => setKind(null)} />;
  return { open, node };
}

function IncidentDialogs({ kind, incidentId, onClose }: { kind: DialogKind | null; incidentId: string | null; onClose: () => void }) {
  const { state, me, actions } = useStore();
  const inc = state.incidents.find((i) => i.id === incidentId);
  const [dept, setDept] = useState("");
  const [officer, setOfficer] = useState("");
  const [worker, setWorker] = useState("");
  const [prio, setPrio] = useState<Priority | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [text, setText] = useState("");
  const [err, setErr] = useState("");
  const [key, setKey] = useState("");

  if (inc && key !== `${kind}-${inc.id}`) {
    setKey(`${kind}-${inc.id}`);
    setDept(inc.departmentId ?? "");
    setOfficer(inc.officerId ?? "");
    setWorker(inc.workerId ?? "");
    setPrio(inc.priority);
    setStatus("");
    setText("");
    setErr("");
  }
  if (!inc || !me) return null;
  const close = () => {
    setKey("");
    onClose();
  };

  const officers = state.users.filter((u) => u.role === "officer" && u.departmentId === dept && u.active);
  const workers = state.users.filter((u) => u.role === "field" && u.departmentId === dept && u.active);

  const submit = () => {
    if (kind === "assign") {
      if (!dept) return setErr("Select a department.");
      actions.assign(inc.id, dept, officer || null, worker || null);
      toast.success(`${inc.ref} assigned`);
    } else if (kind === "priority") {
      if (!prio || prio === inc.priority) return setErr("Choose a different priority.");
      actions.setPriority(inc.id, prio);
      toast.success(`Priority updated to ${prio}`);
    } else if (kind === "status") {
      if (!status) return setErr("Select a new status.");
      if ((status === "Rejected" || status === "Resolved") && text.trim().length < 5) return setErr("Add a note of at least 5 characters for this status.");
      actions.setStatus(inc.id, status, text.trim() || undefined);
      toast.success(`Status changed to ${status}`);
    } else if (kind === "note" || kind === "reassign") {
      if (text.trim().length < 3) return setErr("Note must be at least 3 characters.");
      actions.addNote(inc.id, kind === "reassign" ? `Reassignment requested: ${text.trim()}` : text.trim(), kind === "reassign" ? "reassign" : "note");
      toast.success(kind === "reassign" ? "Reassignment request sent to administrator" : "Note added to timeline");
    } else if (kind === "escalate") {
      if (text.trim().length < 5) return setErr("Provide an escalation reason (min 5 characters).");
      actions.escalate(inc.id, text.trim());
      toast.success(`${inc.ref} escalated`);
    }
    close();
  };

  const titles: Record<DialogKind, string> = {
    assign: inc.departmentId ? "Reassign incident" : "Assign incident",
    priority: "Change priority",
    status: "Update status",
    note: "Add internal note",
    escalate: "Escalate incident",
    reassign: "Request reassignment",
  };

  return (
    <Dialog open={!!kind} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{kind && titles[kind]}</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{inc.ref}</span> · {inc.title}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {kind === "assign" && (
            <>
              <Field label="Department">
                <Select value={dept} onValueChange={(v) => { setDept(v); setOfficer(""); setWorker(""); setErr(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>{state.departments.filter((d) => d.active).map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Officer (optional)">
                <Select value={officer} onValueChange={setOfficer} disabled={!dept}>
                  <SelectTrigger><SelectValue placeholder="Select officer" /></SelectTrigger>
                  <SelectContent>{officers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Field worker (optional)">
                <Select value={worker} onValueChange={setWorker} disabled={!dept}>
                  <SelectTrigger><SelectValue placeholder="Select field worker" /></SelectTrigger>
                  <SelectContent>{workers.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
            </>
          )}
          {kind === "priority" && (
            <Field label="Priority">
              <Select value={prio} onValueChange={(v) => { setPrio(v as Priority); setErr(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">SLA deadlines are recalculated from the reported time.</p>
            </Field>
          )}
          {kind === "status" && (
            <>
              <Field label={`New status (current: ${inc.status})`}>
                <Select value={status} onValueChange={(v) => { setStatus(v as Status); setErr(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                  <SelectContent>{allowedStatuses(me.role, inc.status).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Note">
                <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Optional; required for Resolved or Rejected" maxLength={500} />
              </Field>
            </>
          )}
          {(kind === "note" || kind === "escalate" || kind === "reassign") && (
            <Field label={kind === "escalate" ? "Escalation reason" : kind === "reassign" ? "Reason for reassignment" : "Note"}>
              <Textarea value={text} onChange={(e) => { setText(e.target.value); setErr(""); }} maxLength={500} autoFocus />
            </Field>
          )}
          {err && <p className="text-sm text-destructive" role="alert">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close}>Cancel</Button>
          <Button variant={kind === "escalate" ? "destructive" : "default"} onClick={submit}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
