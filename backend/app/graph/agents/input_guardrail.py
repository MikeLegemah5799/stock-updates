from langchain_core.messages import AIMessage

from app.graph.guardrails import check_input, refusal_message
from app.graph.state import AgentState


def input_guardrail(state: AgentState) -> dict:
    last_message = state["messages"][-1].content if state["messages"] else ""
    result = check_input(str(last_message))

    if not result.blocked:
        return {"blocked": False}

    message = refusal_message(result.category)
    return {
        "blocked": True,
        "block_category": result.category,
        "block_reason": message,
        "messages": [AIMessage(content=message)],
        "final_output": {"blocked": True, "category": result.category, "message": message},
    }


def route_after_input_guardrail(state: AgentState) -> str:
    return "blocked" if state.get("blocked") else "continue"
