import type { TickerQuote } from "@/lib/api";

export function QuoteCard({ quote }: { quote: TickerQuote }) {
  const positive = quote.change >= 0;
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="font-semibold text-lg">
          {quote.symbol} <span className="text-sm font-normal opacity-60">{quote.company_name}</span>
        </h3>
        <span className="text-xs opacity-50">as of {new Date(quote.as_of).toLocaleTimeString()}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="text-2xl font-semibold">${quote.price.toFixed(2)}</span>
        <span className={positive ? "text-green-600" : "text-red-600"}>
          {positive ? "+" : ""}
          {quote.change.toFixed(2)} ({positive ? "+" : ""}
          {quote.change_percent.toFixed(2)}%)
        </span>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm opacity-80">
        <div>
          <dt className="opacity-60">Day range</dt>
          <dd>
            ${quote.day_low.toFixed(2)} – ${quote.day_high.toFixed(2)}
          </dd>
        </div>
        <div>
          <dt className="opacity-60">Volume</dt>
          <dd>{quote.volume.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="opacity-60">Market cap</dt>
          <dd>${(quote.market_cap / 1_000_000_000).toFixed(1)}B</dd>
        </div>
      </dl>
    </div>
  );
}
