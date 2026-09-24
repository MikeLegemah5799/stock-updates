import type { TickerQuote } from "@/lib/api";

export function QuoteCard({ quote }: { quote: TickerQuote }) {
  const positive = quote.change_percent >= 0;

  return (
    <section className="animate-in rounded-2xl border border-line-md bg-card px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="font-mono text-2xl font-medium tracking-tight text-text">{quote.symbol}</h3>
            <span className="rounded-full border border-cyan/40 px-2 py-0.5 font-mono text-[11px] text-cyan">
              live quote
            </span>
          </div>
          <p className="mt-1 text-sm text-soft">{quote.company_name}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-medium tabular-nums text-text">
            ${quote.price.toFixed(2)}
          </p>
          <p
            className={`mt-1 font-mono text-xs tabular-nums ${positive ? "text-green" : "text-pink"}`}
          >
            {positive ? "▲" : "▼"} {Math.abs(quote.change_percent).toFixed(2)}%
          </p>
        </div>
      </div>
    </section>
  );
}
