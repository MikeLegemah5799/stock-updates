import { AlertOctagon, ExternalLink, FileText, ListChecks } from "lucide-react";
import type { FilingSummary } from "@/lib/api";

const STATUS_STYLE: Record<FilingSummary["approval_status"], string> = {
  pending: "bg-warning-bg text-warning border-warning-border",
  approved: "bg-success-bg text-success border-success-border",
  rejected: "bg-danger-bg text-danger border-danger-border",
  edited: "bg-edited-bg text-edited border-edited-border",
};

export function FilingSummaryCard({ summary }: { summary: FilingSummary }) {
  return (
    <section className="animate-in overflow-hidden rounded-lg border border-border bg-surface">
      <header className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={2} />
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {summary.ticker} · {summary.filing_type}
          </h3>
          <span className="text-xs text-muted-foreground">{summary.filing_date}</span>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wide ${STATUS_STYLE[summary.approval_status]}`}
        >
          {summary.approval_status}
        </span>
      </header>

      <div className="grid grid-cols-1 gap-4 px-4 py-3 sm:grid-cols-2">
        <div>
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <ListChecks className="h-3 w-3" strokeWidth={2.25} />
            Key points
          </h4>
          <ul className="flex flex-col gap-1.5">
            {summary.key_points.map((point, i) => (
              <li key={i} className="flex gap-1.5 text-[12.5px] leading-snug text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            <AlertOctagon className="h-3 w-3" strokeWidth={2.25} />
            Top risks
          </h4>
          <ul className="flex flex-col gap-1.5">
            {summary.risks.map((risk, i) => (
              <li key={i} className="flex gap-1.5 text-[12.5px] leading-snug text-foreground">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-danger" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {summary.citations.length > 0 && (
        <footer className="flex flex-col gap-1 border-t border-border px-4 py-2.5">
          {summary.citations.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-brand"
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
