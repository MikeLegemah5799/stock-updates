import { Clock, TrendingDown, TrendingUp } from "lucide-react";
import type { TickerQuote } from "@/lib/api";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="font-mono text-[13px] tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

export function QuoteCard({ quote }: { quote: TickerQuote }) {
  const positive = quote.change >= 0;
  const Trend = positive ? TrendingUp : TrendingDown;

  return (
    <section className="animate-in overflow-hidden rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{quote.symbol}</h3>
          <span className="text-xs text-muted-foreground">{quote.company_name}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground">
          <Clock className="h-3 w-3" strokeWidth={2} />
          {new Date(quote.as_of).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </header>

      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-baseline gap-2.5">
          <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
            ${quote.price.toFixed(2)}
          </span>
          <span
            className={[
              "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-xs font-medium tabular-nums",
              positive ? "bg-success-bg text-success" : "bg-danger-bg text-danger",
            ].join(" ")}
          >
            <Trend className="h-3 w-3" strokeWidth={2.25} />
            {positive ? "+" : ""}
            {quote.change.toFixed(2)} ({positive ? "+" : ""}
            {quote.change_percent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-border px-4 py-2.5">
        <Stat label="Day range" value={`${quote.day_low.toFixed(2)}–${quote.day_high.toFixed(2)}`} />
        <Stat label="Volume" value={quote.volume.toLocaleString()} />
        <Stat label="Market cap" value={`$${(quote.market_cap / 1_000_000_000).toFixed(1)}B`} />
      </dl>
    </section>
  );
}
