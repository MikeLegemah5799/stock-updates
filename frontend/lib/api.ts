const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export type TickerQuote = {
  symbol: string;
  company_name: string;
  price: number;
  change: number;
  change_percent: number;
  day_high: number;
  day_low: number;
  volume: number;
  market_cap: number;
  as_of: string;
};

export type FilingSummary = {
  ticker: string;
  filing_type: string;
  filing_date: string;
  key_points: string[];
  risks: string[];
  citations: string[];
  generated_at: string;
  approval_status: "pending" | "approved" | "rejected" | "edited";
};

export type InterruptPayload = {
  reason: string;
  flags: string[];
  final_output: {
    ticker: string | null;
    quote: TickerQuote | null;
    filing_summary: FilingSummary | null;
    disclaimer: string;
  };
};

export type QueryDoneEvent = {
  thread_id: string;
  status: "awaiting_approval" | "complete";
  values: {
    ticker?: string;
    quote_data?: TickerQuote;
    filing_summary?: FilingSummary;
  };
  interrupt: InterruptPayload | null;
};

export type AdvisorProfile = {
  advisor_id: string;
  watchlist: string[];
  recent_queries: string[];
};

// The graph nodes as the backend names them in each streamed "update" event,
// in the order the supervisor can invoke them.
export const AGENT_NODES = [
  "supervisor",
  "market_data_agent",
  "filings_rag_agent",
  "compliance_agent",
] as const;
export type AgentNode = (typeof AGENT_NODES)[number];

// Reads the backend's text/event-stream response. onUpdate fires once per
// graph node as it completes (drives the live agent-status stepper); onDone
// fires once with the terminal payload once the run finishes or pauses at
// the human-approval interrupt.
export async function streamQuery(
  params: { threadId: string | null; advisorId: string; message: string },
  handlers: {
    onUpdate?: (node: AgentNode, payload: unknown) => void;
    onDone: (event: QueryDoneEvent) => void;
  }
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      thread_id: params.threadId,
      advisor_id: params.advisorId,
      message: params.message,
    }),
  });
  if (!res.ok || !res.body) {
    throw new Error(`Query failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // sse-starlette terminates each field with \r\n, so a frame boundary is
    // \r\n\r\n, not \n\n.
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";

    for (const frame of frames) {
      const lines = frame.split(/\r?\n/);
      const eventLine = lines.find((l) => l.startsWith("event:"));
      const dataLine = lines.find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const data = JSON.parse(dataLine.slice("data:".length).trim());
      const eventType = eventLine?.slice("event:".length).trim();
      if (eventType === "update") {
        const node = (Object.keys(data) as string[]).find((k) =>
          (AGENT_NODES as readonly string[]).includes(k)
        );
        if (node) handlers.onUpdate?.(node as AgentNode, data[node]);
      } else if (eventType === "done") {
        handlers.onDone(data as QueryDoneEvent);
      }
    }
  }
}

export async function approve(params: {
  threadId: string;
  decision: "approve" | "reject" | "edit";
  editedText?: string;
}): Promise<QueryDoneEvent["values"]> {
  const res = await fetch(`${BACKEND_URL}/api/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      thread_id: params.threadId,
      decision: params.decision,
      edited_text: params.editedText ?? null,
    }),
  });
  if (!res.ok) throw new Error(`Approve failed: ${res.status}`);
  const json = await res.json();
  return json.values;
}

export async function getWatchlist(advisorId: string): Promise<AdvisorProfile> {
  const res = await fetch(`${BACKEND_URL}/api/watchlist/${advisorId}`);
  if (!res.ok) throw new Error(`Watchlist fetch failed: ${res.status}`);
  return res.json();
}

export async function updateWatchlist(
  advisorId: string,
  ticker: string,
  action: "add" | "remove"
): Promise<AdvisorProfile> {
  const res = await fetch(`${BACKEND_URL}/api/watchlist/${advisorId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, action }),
  });
  if (!res.ok) throw new Error(`Watchlist update failed: ${res.status}`);
  return res.json();
}
