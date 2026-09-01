"use client";

import { LineChart, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatThread, type Turn } from "@/components/chat-thread";
import { CopilotInput } from "@/components/copilot-input";
import { QuoteCard } from "@/components/quote-card";
import { FilingSummaryCard } from "@/components/filing-summary-card";
import { ApprovalsQueue } from "@/components/approvals-queue";
import { ThemeToggle } from "@/components/theme-toggle";
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
      .catch(() => {});
  }, []);

  function patchTurn(id: string, patch: Partial<Turn>) {
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function applyDoneEvent(turnId: string, event: QueryDoneEvent) {
    setThreadId(event.thread_id);
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
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-white">
            <LineChart className="h-4 w-4" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">Advisor Stock Copilot</p>
            <p className="text-[10.5px] text-muted-foreground">Research briefing tool</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {watchlist.length > 0 && (
            <div className="hidden items-center gap-1.5 sm:flex">
              <Star className="h-3.5 w-3.5 text-warning" strokeWidth={2} fill="currentColor" />
              {watchlist.map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-border bg-surface-inset px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <ThemeToggle />
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-inset text-[11px] font-semibold text-foreground">
            DA
          </div>
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[360px_1fr]">
        <section className="flex min-h-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <ChatThread turns={turns} />
          <CopilotInput onSubmit={handleAsk} loading={loading} />
        </section>

        <section className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4">
          {interrupt && <ApprovalsQueue interrupt={interrupt} onDecision={handleDecision} />}
          {quote && <QuoteCard quote={quote} />}
          {filingSummary && <FilingSummaryCard summary={filingSummary} />}
          {!quote && !filingSummary && !interrupt && (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
              Workspace is empty — ask Copilot a question to get started.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
