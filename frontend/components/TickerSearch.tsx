"use client";

import { useState } from "react";

export function TickerSearch({
  onSubmit,
  loading,
}: {
  onSubmit: (message: string) => void;
  loading: boolean;
}) {
  const [message, setMessage] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (message.trim()) onSubmit(message.trim());
      }}
      className="flex gap-2"
    >
      <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="e.g. Summarize AAPL's biggest risks and give me the current price"
        className="flex-1 rounded border border-black/15 dark:border-white/20 bg-white dark:bg-black px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading || !message.trim()}
        className="rounded bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm font-medium disabled:opacity-40"
      >
        {loading ? "Working…" : "Ask"}
      </button>
    </form>
  );
}
