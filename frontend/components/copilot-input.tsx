"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

const EXAMPLES = [
  "Summarize AAPL's biggest risks",
  "What's TSLA trading at?",
  "Give me MSFT's price and outlook",
];

export function CopilotInput({
  onSubmit,
  loading,
  showExamples,
}: {
  onSubmit: (message: string) => void;
  loading: boolean;
  showExamples: boolean;
}) {
  const [message, setMessage] = useState("");

  function submit() {
    if (!message.trim() || loading) return;
    onSubmit(message.trim());
    setMessage("");
  }

  return (
    <div className="flex flex-col gap-3 p-5">
      {showExamples && (
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={loading}
              onClick={() => onSubmit(example)}
              className="rounded-full border border-line-md px-3 py-1 text-xs text-soft transition-colors hover:border-yellow/50 hover:text-text disabled:pointer-events-none disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      <div
        className={[
          "flex items-center gap-2 rounded-2xl border bg-bg-deep py-2 pl-[18px] pr-2 transition-colors",
          loading ? "border-cyan/40" : "border-line-md focus-within:border-yellow/60",
        ].join(" ")}
      >
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask Copilot…"
          disabled={loading}
          className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-text placeholder:text-soft focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !message.trim()}
          aria-label="Send"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-yellow text-bg-deep transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} />
          ) : (
            <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
          )}
        </button>
      </div>
    </div>
  );
}
