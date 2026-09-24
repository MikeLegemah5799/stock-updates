"use client";

import { Check, Loader2, PenLine, ShieldAlert, X } from "lucide-react";
import { useState } from "react";
import type { FilingSummary, InterruptPayload } from "@/lib/api";

type Decision = "approve" | "reject" | "edit";

const STATUS: Record<FilingSummary["approval_status"], { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "border-orange/40 bg-orange/10 text-orange" },
  approved: { label: "Approved", cls: "border-green/40 bg-green/10 text-green" },
  rejected: { label: "Rejected", cls: "border-pink/40 bg-pink/10 text-pink" },
  edited: { label: "Edited", cls: "border-purple/40 bg-purple/10 text-purple" },
};

export function StatusPill({ status }: { status: FilingSummary["approval_status"] }) {
  const s = STATUS[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium ${s.cls}`}
    >
      {status === "approved" && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      {status === "rejected" && <X className="h-3.5 w-3.5" strokeWidth={3} />}
      {s.label}
    </span>
  );
}

/** The "Advisor sign-off" bar. Shows decision controls while a review is pending. */
export function SignOffBar({
  status,
  interrupt,
  onDecision,
}: {
  status: FilingSummary["approval_status"];
  interrupt: InterruptPayload | null;
  onDecision: (decision: Decision, editedText?: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    interrupt?.final_output.filing_summary?.key_points.join(" ") ?? ""
  );
  const [pending, setPending] = useState<Decision | null>(null);
  const busy = pending !== null;

  async function handle(decision: Decision, text?: string) {
    setPending(decision);
    try {
      await onDecision(decision, text);
    } finally {
      setPending(null);
    }
  }

  const spinner = <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.5} />;

  return (
    <section className="animate-in rounded-2xl border border-line-md bg-card px-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] text-soft">Advisor sign-off</h3>

        {interrupt ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => handle("approve")}
              className="inline-flex items-center gap-1.5 rounded-full border border-green/40 bg-green/10 px-4 py-1.5 text-sm font-medium text-green transition-colors hover:bg-green/20 disabled:opacity-50"
            >
              {pending === "approve" ? spinner : <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => (editing ? handle("edit", editedText) : setEditing(true))}
              className="inline-flex items-center gap-1.5 rounded-full border border-line-md px-4 py-1.5 text-sm font-medium text-text transition-colors hover:bg-surface disabled:opacity-50"
            >
              {pending === "edit" ? spinner : <PenLine className="h-3.5 w-3.5" strokeWidth={2.5} />}
              {editing ? "Save edit" : "Edit"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handle("reject")}
              className="inline-flex items-center gap-1.5 rounded-full border border-pink/40 px-4 py-1.5 text-sm font-medium text-pink transition-colors hover:bg-pink/10 disabled:opacity-50"
            >
              {pending === "reject" ? spinner : <X className="h-3.5 w-3.5" strokeWidth={3} />}
              Reject
            </button>
          </div>
        ) : (
          <StatusPill status={status} />
        )}
      </div>

      {interrupt && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-dashed border-line-md pt-3">
          <p className="text-sm text-soft">{interrupt.reason}</p>
          {interrupt.flags.length > 0 && (
            <p className="inline-flex w-fit items-center gap-1.5 rounded-md border border-pink/40 bg-pink/10 px-2 py-1 font-mono text-[11px] text-pink">
              <ShieldAlert className="h-3 w-3" strokeWidth={2.25} />
              Guardrail flagged: {interrupt.flags.join(", ")}
            </p>
          )}
          {editing && (
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-line-md bg-bg-deep px-3 py-2 text-sm text-text focus:border-yellow/60 focus:outline-none"
            />
          )}
        </div>
      )}
    </section>
  );
}
