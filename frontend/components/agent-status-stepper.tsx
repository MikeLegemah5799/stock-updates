import { Check, Loader2 } from "lucide-react";
import type { AgentNode } from "@/lib/api";

const STEP_LABELS: Record<AgentNode, string> = {
  input_guardrail: "Input check",
  supervisor: "Supervisor",
  market_data_agent: "Market data",
  filings_rag_agent: "Filings RAG",
  compliance_agent: "Compliance",
};

const STEPS: AgentNode[] = [
  "input_guardrail",
  "supervisor",
  "market_data_agent",
  "filings_rag_agent",
  "compliance_agent",
];

type StepState = "pending" | "active" | "done" | "skipped";

function stepState(
  node: AgentNode,
  completed: Set<AgentNode>,
  planned: Set<AgentNode>
): StepState {
  if (completed.has(node)) return "done";

  if (node === "input_guardrail") return "active";
  if (!completed.has("input_guardrail")) return "pending";

  if (node === "supervisor") return "active";
  if (!completed.has("supervisor")) return "pending";

  if (node === "compliance_agent") {
    const gating = [...planned].filter(
      (n) => n !== "input_guardrail" && n !== "supervisor" && n !== "compliance_agent"
    );
    return gating.every((n) => completed.has(n)) ? "active" : "pending";
  }

  return planned.has(node) ? "active" : "skipped";
}

export function AgentStatusStepper({
  completed,
  planned,
}: {
  completed: AgentNode[];
  planned: AgentNode[];
}) {
  const completedSet = new Set(completed);
  const plannedSet = new Set(planned);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {STEPS.map((node) => {
        const state = stepState(node, completedSet, plannedSet);
        if (state === "skipped") return null;

        return (
          <span
            key={node}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
              state === "done" &&
                "border-success-border bg-success-bg text-success",
              state === "active" &&
                "border-brand/30 bg-brand-bg text-brand animate-agent-pulse",
              state === "pending" &&
                "border-border bg-surface-inset text-muted-foreground",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {state === "done" && <Check className="h-3 w-3" strokeWidth={2.5} />}
            {state === "active" && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2.5} />}
            {STEP_LABELS[node]}
          </span>
        );
      })}
    </div>
  );
}
