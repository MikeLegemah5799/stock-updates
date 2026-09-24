import { AlertTriangle, CheckCircle2, ShieldBan, ShieldCheck } from "lucide-react";
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

function Reply({ turn }: { turn: Turn }) {
  switch (turn.status) {
    case "running":
      return <AgentStatusStepper completed={turn.completedAgents} planned={turn.plannedAgents} />;
    case "error":
      return (
        <span className="flex items-start gap-2 text-pink">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          {turn.errorMessage ?? "Something went wrong."}
        </span>
      );
    case "blocked":
      return (
        <span className="flex items-start gap-2 text-pink">
          <ShieldBan className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} />
          {turn.blockReason ?? "This request was blocked by a guardrail."}
        </span>
      );
    case "awaiting_approval":
      return (
        <span className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-orange" strokeWidth={2} />
          <span>
            Here&apos;s the <b className="font-medium text-text">live quote</b> and a{" "}
            <b className="font-medium text-text">cited brief</b>. Review it in the workspace, then
            sign off.
          </span>
        </span>
      );
    case "complete":
      return (
        <span className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green" strokeWidth={2} />
          Delivered to the workspace.
        </span>
      );
  }
}

export function ChatThread({ turns }: { turns: Turn[] }) {
  if (turns.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-2 px-6 text-center">
        <p className="text-[15px] text-text">Ask about AAPL, TSLA, or MSFT</p>
        <p className="text-sm text-soft">
          Copilot pulls a live quote and a cited SEC filing brief, then hands it to you for
          sign-off.
        </p>
      </div>
    );
  }

  return (
    <div className="scroll-thin flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-5">
      {turns.map((turn) => (
        <div key={turn.id} className="animate-in flex flex-col gap-3">
          <div className="ml-6 rounded-2xl border border-line-md bg-card px-[18px] py-3 text-[15px] leading-snug text-text">
            {turn.question}
          </div>
          <div className="mr-6 rounded-2xl border border-line bg-surface px-[18px] py-3 text-[15px] leading-relaxed text-soft">
            <Reply turn={turn} />
          </div>
        </div>
      ))}
    </div>
  );
}
