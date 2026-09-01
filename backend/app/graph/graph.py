from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph

from app.graph.agents.compliance_agent import compliance_agent
from app.graph.agents.filings_rag_agent import filings_rag_agent
from app.graph.agents.market_data_agent import market_data_agent
from app.graph.state import AgentState
from app.graph.supervisor import route_from_supervisor, supervisor

_checkpointer = MemorySaver()


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("supervisor", supervisor)
    graph.add_node("market_data_agent", market_data_agent)
    graph.add_node("filings_rag_agent", filings_rag_agent)
    graph.add_node("compliance_agent", compliance_agent)

    graph.add_edge(START, "supervisor")
    graph.add_conditional_edges(
        "supervisor",
        route_from_supervisor,
        ["market_data_agent", "filings_rag_agent"],
    )
    # Both agents converge on the same compliance node (LangGraph runs it once
    # per superstep even when reached from a parallel fan-out).
    graph.add_edge("market_data_agent", "compliance_agent")
    graph.add_edge("filings_rag_agent", "compliance_agent")
    graph.add_edge("compliance_agent", END)

    return graph.compile(checkpointer=_checkpointer)


app_graph = build_graph()
