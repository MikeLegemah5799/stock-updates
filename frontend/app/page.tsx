"use client";

import { useEffect, useState } from "react";
import { ChatThread, type Turn } from "@/components/chat-thread";
import { CopilotInput } from "@/components/copilot-input";
import { QuoteCard } from "@/components/quote-card";
import { FilingSummaryCard } from "@/components/filing-summary-card";
import { SignOffBar } from "@/components/approvals-queue";
import { Logo } from "@/components/logo";
import {
  streamQuery,
  approve,
  getWatchlist,
  updateWatchlist,
  type AgentNode,
  type QueryDoneEvent,
  type InterruptPayload,
  type TickerQuote,
  type FilingSummary,
} from "@/lib/api";

const ADVISOR_ID = "demo-advisor";
const DEFAULT_PLAN: AgentNode[] = [
  "input_guardrail",
  "supervisor",
  "market_data_agent",
  "filings_rag_agent",
  "compliance_agent",
];

export default function Home() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [quote, setQuote] = useState<TickerQuote | null>(null);
  const [filingSummary, setFilingSummary] = useState<FilingSummary | null>(null);
  const [interrupt, setInterrupt] = useState<InterruptPayload | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    getWatchlist(ADVISOR_ID)
      .then((p) => setWatchlist(p.watchlist))
      .catch(() => { });
  }, []);

  function patchTurn(id: string, patch: Partial<Turn>) {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function applyDoneEvent(turnId: string, event: QueryDoneEvent) {
    setThreadId(event.thread_id);

    if (event.status === "blocked") {
      patchTurn(turnId, { status: "blocked", blockReason: event.values.block_reason });
      return;
    }

    setQuote(event.values.quote_data ?? null);
    setFilingSummary(
      event.values.filing_summary ?? event.interrupt?.final_output.filing_summary ?? null
    );
    setInterrupt(event.status === "awaiting_approval" ? event.interrupt : null);
    patchTurn(turnId, { status: event.status === "awaiting_approval" ? "awaiting_approval" : "complete" });
  }

  async function handleAsk(message: string) {
    const turnId = crypto.randomUUID();
    setTurns((prev) => [
      ...prev,
      { id: turnId, question: message, status: "running", completedAgents: [], plannedAgents: DEFAULT_PLAN },
    ]);
    setLoading(true);
    setInterrupt(null);
    try {
      await streamQuery(
        { threadId, advisorId: ADVISOR_ID, message },
        {
          onUpdate: (node, payload) => {
            setTurns((prev) =>
              prev.map((t) => {
                if (t.id !== turnId) return t;
                const completedAgents = [...t.completedAgents, node];
                let plannedAgents = t.plannedAgents;
                if (
                  node === "supervisor" &&
                  payload &&
                  typeof payload === "object" &&
                  "next_agent" in payload
                ) {
                  const next = String((payload as { next_agent: string }).next_agent).split(",");
                  plannedAgents = ["supervisor", ...(next as AgentNode[]), "compliance_agent"];
                }
                return { ...t, completedAgents, plannedAgents };
              })
            );
          },
          onDone: (event) => applyDoneEvent(turnId, event),
        }
      );
    } catch (e) {
      patchTurn(turnId, {
        status: "error",
        errorMessage: e instanceof Error ? e.message : "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(decision: "approve" | "reject" | "edit", editedText?: string) {
    if (!threadId) return;
    const decidedTicker = filingSummary?.ticker;
    const values = await approve({ threadId, decision, editedText });
    setFilingSummary(values.filing_summary ?? null);
    setInterrupt(null);
    setTurns((prev) => {
      const last = prev[prev.length - 1];
      return last ? prev.map((t) => (t.id === last.id ? { ...t, status: "complete" } : t)) : prev;
    });
    if (decision === "approve" && decidedTicker) {
      const profile = await updateWatchlist(ADVISOR_ID, decidedTicker, "add");
      setWatchlist(profile.watchlist);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col gap-10 px-6 py-8 lg:h-screen lg:flex-row lg:items-center lg:gap-14 lg:px-[5vw] lg:py-0">

      <div className="flex min-h-[640px] flex-1 flex-col overflow-hidden rounded-[28px] border border-line-md bg-bg shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] lg:h-[82vh] lg:max-h-[860px] lg:min-h-0">
        <header className="flex shrink-0 items-center justify-between border-b border-line px-6 py-4">
          <div className="flex items-center gap-3.5">
            <Logo size="sm" />
            <div className="leading-tight">
              <p className="font-serif text-[17px] font-semibold tracking-tight">Advisor Stock Copilot</p>
              <p className="font-mono text-xs text-cyan">Research briefing tool</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {watchlist.length > 0 && (
              <div className="hidden items-center gap-1.5 sm:flex" aria-label="Watchlist">
                {watchlist.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-line-md px-1.5 py-0.5 font-mono text-[11px] text-soft"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-purple text-sm font-semibold text-bg-deep">
              DA
            </div>
          </div>
        </header>

        <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(280px,34%)_1fr]">
          <section className="flex min-h-[320px] flex-col border-b border-line bg-bg lg:min-h-0 lg:border-b-0 lg:border-r">
            <ChatThread turns={turns} />
            <CopilotInput onSubmit={handleAsk} loading={loading} showExamples={turns.length === 0} />
          </section>

          <section className="scroll-thin flex min-h-0 flex-col gap-4 overflow-y-auto bg-bg p-6">
            {quote && <QuoteCard quote={quote} />}
            {filingSummary && <FilingSummaryCard summary={filingSummary} />}
            {filingSummary && (
              <SignOffBar
                key={filingSummary.generated_at}
                status={filingSummary.approval_status}
                interrupt={interrupt}
                onDecision={handleDecision}
              />
            )}
            {!quote && !filingSummary && (
              <div className="flex flex-1 items-center justify-center text-center text-sm text-soft">
                Workspace is empty — ask Copilot a question to get started.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
