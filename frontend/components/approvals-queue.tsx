"use client";

import { CheckCircle2, Loader2, PenLine, ShieldAlert, XCircle } from "lucide-react";
import { useState } from "react";
import type { InterruptPayload } from "@/lib/api";

type Decision = "approve" | "reject" | "edit";

export function ApprovalsQueue({
  interrupt,
  onDecision,
}: {
  interrupt: InterruptPayload;
  onDecision: (decision: Decision, editedText?: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    interrupt.final_output.filing_summary?.key_points.join(" ") ?? ""
  );
  const [pending, setPending] = useState<Decision | null>(null);

  async function handle(decision: Decision, text?: string) {
    setPending(decision);
    try {
      await onDecision(decision, text);
    } finally {
      setPending(null);
    }
  }

  const summary = interrupt.final_output.filing_summary;
  const busy = pending !== null;

  return (
    <section className="animate-in overflow-hidden rounded-lg border border-warning-border bg-warning-bg/40">
      <header className="flex items-center gap-2 border-b border-warning-border px-4 py-2.5">
        <ShieldAlert className="h-4 w-4 text-warning" strokeWidth={2} />
        <h3 className="text-sm font-semibold text-foreground">Approvals queue</h3>
        <span className="rounded-full bg-warning text-background px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">
          1
        </span>
      </header>

      <div className="flex flex-col gap-2.5 px-4 py-3">
        <p className="text-[12.5px] text-foreground">{interrupt.reason}</p>

        {interrupt.flags.length > 0 && (
          <p className="inline-flex w-fit items-center gap-1.5 rounded-md border border-danger-border bg-danger-bg px-2 py-1 text-[11px] font-medium text-danger">
            <ShieldAlert className="h-3 w-3" strokeWidth={2.25} />
            Guardrail flagged: {interrupt.flags.join(", ")}
          </p>
        )}

        {summary && !editing && (
          <ul className="flex flex-col gap-1 rounded-md border border-border bg-background px-3 py-2">
            {summary.key_points.slice(0, 2).map((point, i) => (
              <li key={i} className="truncate text-[12px] text-muted-foreground">
                &bull; {point}
              </li>
            ))}
          </ul>
        )}

        {editing && (
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-[12.5px] text-foreground focus:border-brand/50 focus:outline-none"
          />
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={busy}
            onClick={() => handle("approve")}
            className="inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-1.5 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending === "approve" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.25} />
            )}
            Approve
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => (editing ? handle("edit", editedText) : setEditing(true))}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending === "edit" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
            ) : (
              <PenLine className="h-3.5 w-3.5" strokeWidth={2.25} />
            )}
            {editing ? "Save edit" : "Edit"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => handle("reject")}
            className="inline-flex items-center gap-1.5 rounded-md border border-danger-border px-3 py-1.5 text-[12.5px] font-medium text-danger transition-colors hover:bg-danger-bg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending === "reject" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
            ) : (
              <XCircle className="h-3.5 w-3.5" strokeWidth={2.25} />
            )}
            Reject
          </button>
        </div>
      </div>
    </section>
  );
}
