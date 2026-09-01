"use client";

import { useState } from "react";
import type { InterruptPayload } from "@/lib/api";

export function ApprovalPanel({
  interrupt,
  onDecision,
}: {
  interrupt: InterruptPayload;
  onDecision: (decision: "approve" | "reject" | "edit", editedText?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    interrupt.final_output.filing_summary?.key_points.join(" ") ?? ""
  );

  return (
    <div className="rounded-lg border-2 border-amber-400 dark:border-amber-500 p-4 bg-amber-50 dark:bg-amber-950/30">
      <h3 className="font-semibold">Awaiting advisor approval</h3>
      <p className="mt-1 text-sm opacity-80">{interrupt.reason}</p>
      {interrupt.flags.length > 0 && (
        <p className="mt-1 text-sm text-red-700 dark:text-red-400">
          Guardrail flags: {interrupt.flags.join(", ")}
        </p>
      )}

      {editing && (
        <textarea
          className="mt-3 w-full rounded border border-black/15 dark:border-white/20 bg-white dark:bg-black p-2 text-sm"
          rows={4}
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
        />
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onDecision("approve")}
          className="rounded bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
        >
          Approve
        </button>
        <button
          onClick={() => (editing ? onDecision("edit", editedText) : setEditing(true))}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {editing ? "Save edit" : "Edit"}
        </button>
        <button
          onClick={() => onDecision("reject")}
          className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
