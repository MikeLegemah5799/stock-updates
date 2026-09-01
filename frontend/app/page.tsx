"use client";

import { useEffect, useState } from "react";
import { TickerSearch } from "@/components/TickerSearch";
import { QuoteCard } from "@/components/QuoteCard";
import { FilingSummaryCard } from "@/components/FilingSummaryCard";
import { ApprovalPanel } from "@/components/ApprovalPanel";
import {
  streamQuery,
  approve,
  getWatchlist,
  updateWatchlist,
  type QueryDoneEvent,
  type InterruptPayload,
  type TickerQuote,
  type FilingSummary,
} from "@/lib/api";

const ADVISOR_ID = "demo-advisor";

export default function Home() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<TickerQuote | null>(null);
  const [filingSummary, setFilingSummary] = useState<FilingSummary | null>(null);
  const [interrupt, setInterrupt] = useState<InterruptPayload | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    getWatchlist(ADVISOR_ID)
      .then((p) => setWatchlist(p.watchlist))
      .catch(() => {});
  }, []);

  function applyDoneEvent(event: QueryDoneEvent) {
    setThreadId(event.thread_id);
    setQuote(event.values.quote_data ?? null);
    setFilingSummary(event.values.filing_summary ?? event.interrupt?.final_output.filing_summary ?? null);
    setInterrupt(event.status === "awaiting_approval" ? event.interrupt : null);
  }

  async function handleAsk(message: string) {
    setLoading(true);
    setError(null);
    setInterrupt(null);
    try {
      await streamQuery({ threadId, advisorId: ADVISOR_ID, message }, applyDoneEvent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(decision: "approve" | "reject" | "edit", editedText?: string) {
    if (!threadId) return;
    setLoading(true);
    try {
      const values = await approve({ threadId, decision, editedText });
      setFilingSummary(values.filing_summary ?? null);
      setInterrupt(null);
      if (filingSummary?.ticker && decision === "approve") {
        const profile = await updateWatchlist(ADVISOR_ID, filingSummary.ticker, "add");
        setWatchlist(profile.watchlist);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header>
        <h1 className="text-2xl font-semibold">Advisor Stock Copilot</h1>
        <p className="mt-1 text-sm opacity-70">
          Ask about a ticker&apos;s current price and what its latest SEC 10-K says. Prototype
          covers AAPL, TSLA, and MSFT.
        </p>
      </header>

      <TickerSearch onSubmit={handleAsk} loading={loading} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {watchlist.length > 0 && (
        <p className="text-xs opacity-60">Watchlist: {watchlist.join(", ")}</p>
      )}

      <div className="flex flex-col gap-4">
        {quote && <QuoteCard quote={quote} />}
        {filingSummary && <FilingSummaryCard summary={filingSummary} />}
        {interrupt && <ApprovalPanel interrupt={interrupt} onDecision={handleDecision} />}
      </div>

      {!quote && !filingSummary && !loading && (
        <p className="text-sm opacity-50">No results yet — ask a question above.</p>
      )}
    </div>
  );
}
