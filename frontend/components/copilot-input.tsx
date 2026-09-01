"use client";

import { ArrowUp, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

const EXAMPLES = [
  "Summarize AAPL's biggest risks",
  "What's TSLA trading at?",
  "Give me MSFT's price and outlook",
];

export function CopilotInput({
  onSubmit,
  loading,
}: {
  onSubmit: (message: string) => void;
  loading: boolean;
}) {
  const [message, setMessage] = useState("");

  function submit() {
    if (!message.trim() || loading) return;
    onSubmit(message.trim());
    setMessage("");
  }

  return (
    <div className="flex flex-col gap-2 border-t border-border bg-surface p-3">
      <div
        className={[
          "flex items-end gap-2 rounded-lg border bg-background p-2 transition-colors",
          loading ? "border-brand/40" : "border-border focus-within:border-brand/50",
        ].join(" ")}
      >
        <Sparkles
          className={[
            "mb-2 h-4 w-4 shrink-0 transition-colors",
            loading ? "text-brand animate-pulse" : "text-muted-foreground",
          ].join(" ")}
          strokeWidth={1.75}
        />
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Ask about a ticker's price or SEC filings…"
          rows={1}
          disabled={loading}
          className="max-h-28 flex-1 resize-none bg-transparent py-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !message.trim()}
          aria-label="Send"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-border disabled:text-muted-foreground"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.25} />
          ) : (
            <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.25} />
          )}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            disabled={loading}
            onClick={() => onSubmit(example)}
            className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
