import json
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from langchain_core.messages import HumanMessage
from langgraph.types import Command
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse

from app.config import settings
from app.graph.graph import app_graph
from app.memory.store import get_advisor_profile, save_watchlist
from app.tools.quote_tool import get_stock_quote

app = FastAPI(title="Advisor Stock Copilot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_methods=["*"],
    allow_headers=["*"],
)


class QueryRequest(BaseModel):
    thread_id: str | None = None
    advisor_id: str
    message: str


class ApproveRequest(BaseModel):
    thread_id: str
    decision: str  # "approve" | "reject" | "edit"
    edited_text: str | None = None


class WatchlistRequest(BaseModel):
    ticker: str
    action: str  # "add" | "remove"


def _graph_inputs(message: str, advisor_id: str) -> dict:
    return {
        "messages": [HumanMessage(content=message)],
        "advisor_id": advisor_id,
        "retrieved_chunks": [],
        "guardrail_flags": [],
        "requires_approval": False,
    }


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/query")
def query(req: QueryRequest):
    thread_id = req.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    inputs = _graph_inputs(req.message, req.advisor_id)

    def gen():
        for update in app_graph.stream(inputs, config, stream_mode="updates"):
            if "__interrupt__" in update:
                # Surfaced separately as a clean {reason, flags, final_output}
                # payload below rather than the raw Interrupt namedtuple.
                continue
            yield {
                "event": "update",
                "data": json.dumps({"thread_id": thread_id, **update}, default=str),
            }

        state = app_graph.get_state(config)
        interrupts = [t for task in state.tasks for t in task.interrupts]
        awaiting_approval = bool(interrupts)
        if state.values.get("blocked"):
            status = "blocked"
        elif awaiting_approval:
            status = "awaiting_approval"
        else:
            status = "complete"
        yield {
            "event": "done",
            "data": json.dumps(
                {
                    "thread_id": thread_id,
                    "status": status,
                    "values": state.values,
                    "interrupt": interrupts[0].value if interrupts else None,
                },
                default=str,
            ),
        }

    return EventSourceResponse(gen())


@app.post("/api/approve")
def approve(req: ApproveRequest):
    config = {"configurable": {"thread_id": req.thread_id}}
    resume_value = {"decision": req.decision, "edited_text": req.edited_text}
    app_graph.invoke(Command(resume=resume_value), config)
    state = app_graph.get_state(config)
    return {"thread_id": req.thread_id, "status": "complete", "values": state.values}


@app.get("/api/quote/{ticker}")
def quote(ticker: str):
    return get_stock_quote.invoke({"ticker": ticker})


@app.get("/api/watchlist/{advisor_id}")
def watchlist(advisor_id: str):
    return get_advisor_profile(advisor_id)


@app.post("/api/watchlist/{advisor_id}")
def update_watchlist(advisor_id: str, req: WatchlistRequest):
    return save_watchlist(advisor_id, req.ticker, req.action)
