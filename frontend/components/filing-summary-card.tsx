import { ExternalLink } from "lucide-react";
import type { FilingSummary } from "@/lib/api";

function ItemTag() {
  return (
    <span className="shrink-0 rounded-md border border-yellow/50 px-1.5 py-px font-mono text-[11px] text-yellow">
      Item 1A
    </span>
  );
}

export function FilingSummaryCard({ summary }: { summary: FilingSummary }) {
  return (
    <section className="animate-in rounded-2xl border border-line-md bg-card px-6 py-5">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-[15px] font-medium text-text">
          Latest {summary.filing_type} brief · Risk factors
        </h3>
        <span className="font-mono text-xs text-soft">cited</span>
      </header>

      <ul className="mt-4 flex flex-col">
        {summary.risks.map((risk, i) => (
          <li
            key={i}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-dashed border-line-md py-3 text-[15px] leading-snug text-text first:border-t-0 first:pt-0"
          >
            <span>{risk}</span>
            <ItemTag />
          </li>
        ))}
      </ul>

      {summary.key_points.length > 0 && (
        <div className="mt-2 border-t border-dashed border-line-md pt-4">
          <h4 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-cyan">
            Key points
          </h4>
          <ul className="flex flex-col gap-1.5">
            {summary.key_points.map((point, i) => (
              <li key={i} className="flex gap-2 text-sm leading-snug text-soft">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-yellow" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.citations.length > 0 && (
        <footer className="mt-4 flex flex-col gap-1">
          {summary.citations.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 truncate font-mono text-[11px] text-soft transition-colors hover:text-cyan"
            >
              <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={2} />
              <span className="truncate">{url}</span>
            </a>
          ))}
        </footer>
      )}
    </section>
  );
}
