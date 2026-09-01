from langchain_anthropic import ChatAnthropic
from pydantic import BaseModel, Field

from app.config import settings
from app.graph.state import AgentState
from app.memory.store import record_query


class _RoutingDecision(BaseModel):
    ticker: str = Field(description="Stock ticker symbol mentioned or implied, e.g. AAPL")
    need_quote: bool = Field(description="Whether the advisor wants current price/quote data")
    need_filing_summary: bool = Field(
        description="Whether the advisor wants SEC filing / risk-factor / MD&A info"
    )


_router = ChatAnthropic(
    model="claude-haiku-4-5", api_key=settings.anthropic_api_key, temperature=0
).with_structured_output(_RoutingDecision)


def supervisor(state: AgentState) -> dict:
    last_message = state["messages"][-1].content if state["messages"] else ""
    record_query(state["advisor_id"], str(last_message))

    decision = _router.invoke(
        f"Advisor question: {last_message}\n"
        "Identify the stock ticker symbol and whether the advisor needs a live "
        "price quote, a SEC filing / risk-factor summary, or both."
    )

    next_agents = []
    if decision.need_quote:
        next_agents.append("market_data_agent")
    if decision.need_filing_summary:
        next_agents.append("filings_rag_agent")
    if not next_agents:
        next_agents = ["market_data_agent"]

    return {"ticker": decision.ticker.upper(), "next_agent": ",".join(next_agents)}


def route_from_supervisor(state: AgentState) -> list[str]:
    return state["next_agent"].split(",")
