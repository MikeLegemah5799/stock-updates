from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, ToolMessage

from app.config import settings
from app.graph.state import AgentState
from app.tools.quote_tool import get_company_profile, get_stock_quote

_TOOLS = {"get_stock_quote": get_stock_quote, "get_company_profile": get_company_profile}

_llm = ChatAnthropic(
    model="claude-haiku-4-5", api_key=settings.anthropic_api_key, temperature=0
).bind_tools(list(_TOOLS.values()))


def market_data_agent(state: AgentState) -> dict:
    ticker = state["ticker"]
    prompt = HumanMessage(
        content=f"Get the current quote and company profile for ticker {ticker}."
    )
    ai_msg = _llm.invoke([prompt])

    quote_data = None
    tool_messages = []
    for call in ai_msg.tool_calls:
        result = _TOOLS[call["name"]].invoke(call["args"])
        if call["name"] == "get_stock_quote":
            quote_data = result
        tool_messages.append(ToolMessage(content=str(result), tool_call_id=call["id"]))

    return {
        "quote_data": quote_data,
        "messages": [prompt, ai_msg, *tool_messages],
    }
