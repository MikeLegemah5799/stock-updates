import type { FilingSummary } from "@/lib/api";

const STATUS_STYLE: Record<FilingSummary["approval_status"], string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  edited: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
};

export function FilingSummaryCard({ summary }: { summary: FilingSummary }) {
  return (
    <div className="rounded-lg border border-black/10 dark:border-white/15 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">
          {summary.ticker} · {summary.filing_type} ({summary.filing_date})
        </h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[summary.approval_status]}`}>
          {summary.approval_status}
        </span>
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-medium opacity-70">Key points</h4>
        <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
          {summary.key_points.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </div>

      <div className="mt-3">
        <h4 className="text-sm font-medium opacity-70">Top risks</h4>
        <ul className="mt-1 list-disc pl-5 text-sm space-y-1">
          {summary.risks.map((risk, i) => (
            <li key={i}>{risk}</li>
          ))}
        </ul>
      </div>

      {summary.citations.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-medium opacity-70">Sources</h4>
          <ul className="mt-1 space-y-1 text-xs">
            {summary.citations.map((url) => (
              <li key={url}>
                <a href={url} target="_blank" rel="noreferrer" className="underline break-all">
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
