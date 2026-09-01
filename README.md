# Advisor Stock Copilot

A prototype that gets a financial advisor up to speed on a stock fast: a live quote plus a
plain-English, cited summary of what the company's latest SEC 10-K actually says — gated behind
an advisor approval step before it's treated as final.

Built as a 2-hour prototype. Scope is deliberately narrow — see "Known limitations" below.

## Architecture

- `frontend/` — Next.js app (advisor chat UI: ticker search, quote card, filing summary card,
  approve/edit/reject panel).
- `backend/` — FastAPI + LangGraph service. Owns the agent graph, tools, RAG retrieval,
  guardrails, memory, and eval harness. The only component that talks to Anthropic, Pinecone, and
  LangSmith.

Graph: a **supervisor** agent routes each advisor question to a **market data agent** (mocked
quotes) and/or a **filings RAG agent** (Pinecone retrieval + summarization), which converge on a
**compliance agent** that runs guardrail checks and pauses for human (advisor) approval before any
filing summary is treated as final.

Full design rationale is in the original plan discussion; the short version: mocked quotes and
pre-seeded filings keep the demo from depending on flaky external APIs, and Pinecone's integrated
embeddings keep Anthropic as the only paid vendor.

## Setup

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in ANTHROPIC_API_KEY, PINECONE_API_KEY, LANGSMITH_API_KEY, SEC_EDGAR_CONTACT_EMAIL
python -m app.rag.ingest   # one-time: pulls AAPL/TSLA/MSFT 10-Ks into Pinecone
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local   # points at http://localhost:8000 by default
npm run dev
```

Open http://localhost:3000 and ask something like *"Summarize AAPL's biggest risks and give me the
current price."* Supported tickers: **AAPL, TSLA, MSFT**.

### Eval (optional)

```bash
cd backend && source .venv/bin/activate
python -m app.eval.run_eval
```

Runs the 5-case dataset against the compiled graph and reports scores in the LangSmith project
dashboard (`LANGSMITH_PROJECT` in `.env`).

## Known limitations (explicit MVP cuts)

- **Quotes are mocked**, not live — `app/tools/quote_tool.py` mirrors a real API's response shape
  so swapping in a provider like Finnhub later is a one-file change.
- **Only 3 tickers have filing coverage** (AAPL, TSLA, MSFT), pre-ingested via `app/rag/ingest.py`
  rather than fetched live per query.
- **No persistent database** — thread state lives in LangGraph's in-process `MemorySaver` and
  resets on backend restart; the advisor watchlist is a flat JSON file
  (`backend/app/memory/advisor_store.json`, gitignored).
- **Eval is a 5-case harness**, meant to be run manually, not a CI-gated suite.
- **Local-only** — no deployment config included; Vercel (frontend) + Render/Fly.io (backend) free
  tiers are the natural next step.
