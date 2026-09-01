import { AlertTriangle, CheckCircle2, ShieldBan, ShieldCheck, User } from "lucide-react";
import { AgentStatusStepper } from "@/components/agent-status-stepper";
import type { AgentNode } from "@/lib/api";

export type Turn = {
  id: string;
  question: string;
  status: "running" | "awaiting_approval" | "complete" | "error" | "blocked";
  completedAgents: AgentNode[];
  plannedAgents: AgentNode[];
  errorMessage?: string;
  blockReason?: string;
};

function StatusLine({ turn }: { turn: Turn }) {
  if (turn.status === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-danger">
        <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
        {turn.errorMessage ?? "Something went wrong."}
      </span>
    );
  }
  if (turn.status === "blocked") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-danger">
        <ShieldBan className="h-3.5 w-3.5" strokeWidth={2} />
        {turn.blockReason ?? "This request was blocked by a guardrail."}
      </span>
    );
  }
  if (turn.status === "awaiting_approval") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-warning">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
        Ready — awaiting your sign-off in the Approvals panel
      </span>
    );
  }
  if (turn.status === "complete") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success">
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
        Delivered to the workspace
      </span>
    );
  }
  return null;
}

export function ChatThread({ turns }: { turns: Turn[] }) {
  if (turns.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-sm font-medium text-foreground">Ask about AAPL, TSLA, or MSFT</p>
        <p className="text-xs text-muted-foreground">
          Copilot pulls a live quote and a cited SEC filing brief, then hands it to you for
          sign-off.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-3">
      {turns.map((turn) => (
        <div key={turn.id} className="flex flex-col gap-1.5 animate-in">
          <div className="flex items-start gap-2">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface-inset text-muted-foreground">
              <User className="h-3 w-3" strokeWidth={2} />
            </div>
            <p className="text-sm leading-snug text-foreground">{turn.question}</p>
          </div>
          <div className="ml-7 flex flex-col gap-1.5">
            {turn.status === "running" && (
              <AgentStatusStepper completed={turn.completedAgents} planned={turn.plannedAgents} />
            )}
            <StatusLine turn={turn} />
          </div>
        </div>
      ))}
    </div>
  );
}
