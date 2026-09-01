from datetime import datetime, timezone

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, ToolMessage
from pydantic import BaseModel, Field

from app.config import settings
from app.graph.state import AgentState
from app.tools.retrieval_tool import retrieve_filing_context

_llm = ChatAnthropic(
    model="claude-haiku-4-5", api_key=settings.anthropic_api_key, temperature=0
).bind_tools([retrieve_filing_context])


class _FilingSummaryDraft(BaseModel):
    key_points: list[str] = Field(description="3-5 key takeaways grounded in the excerpts")
    risks: list[str] = Field(description="Top risk factors mentioned in the excerpts")


_summarizer = ChatAnthropic(
    model="claude-sonnet-4-5", api_key=settings.anthropic_api_key, temperature=0
).with_structured_output(_FilingSummaryDraft)


def filings_rag_agent(state: AgentState) -> dict:
    ticker = state["ticker"]
    last_user_text = state["messages"][-1].content if state["messages"] else ""
    prompt = HumanMessage(
        content=(
            f"Retrieve the most relevant SEC 10-K risk-factor and MD&A context for "
            f"{ticker} to answer: {last_user_text}"
        )
    )
    ai_msg = _llm.invoke([prompt])

    chunks: list[dict] = []
    tool_messages = []
    for call in ai_msg.tool_calls:
        result = retrieve_filing_context.invoke(call["args"])
        chunks.extend(result)
        tool_messages.append(ToolMessage(content=str(result), tool_call_id=call["id"]))

    if not chunks:
        chunks = retrieve_filing_context.invoke(
            {"query": f"risk factors and outlook for {ticker}", "ticker": ticker, "top_k": 5}
        )

    context_text = "\n\n".join(f"[{c['section']}] {c['text']}" for c in chunks)
    if context_text:
        draft = _summarizer.invoke(
            f"Based only on the following SEC 10-K excerpts for {ticker}, extract key points "
            f"and risks. Do not state anything not grounded in the excerpts.\n\n{context_text}"
        )
        key_points, risks = draft.key_points, draft.risks
    else:
        key_points, risks = [], []

    filing_summary = {
        "ticker": ticker,
        "filing_type": "10-K",
        "filing_date": chunks[0]["filing_date"] if chunks else "",
        "key_points": key_points,
        "risks": risks,
        "citations": sorted({c["source_url"] for c in chunks if c.get("source_url")}),
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "approval_status": "pending",
    }

    return {
        "retrieved_chunks": chunks,
        "filing_summary": filing_summary,
        "messages": [prompt, ai_msg, *tool_messages],
    }
