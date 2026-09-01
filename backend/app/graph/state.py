from typing import Annotated, Literal, TypedDict

from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

from app.models import FilingChunk, FilingSummary, TickerQuote


class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    advisor_id: str
    ticker: str | None
    quote_data: TickerQuote | None
    retrieved_chunks: list[FilingChunk]
    filing_summary: FilingSummary | None
    guardrail_flags: list[str]
    requires_approval: bool
    approval_decision: Literal["approved", "rejected", "edited"] | None
    final_output: dict | None
    next_agent: str
