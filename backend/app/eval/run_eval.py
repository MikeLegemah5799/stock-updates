"""Eval harness: runs the 5-case dataset against the compiled graph via
LangSmith's evaluate(), so each run is scored and traced in the LangSmith
project dashboard. LangSmith tracing itself is automatic once
LANGSMITH_TRACING/LANGSMITH_API_KEY are set - this script only adds scoring.

Run manually with: python -m app.eval.run_eval
"""

import uuid

from langchain_core.messages import HumanMessage
from langsmith import evaluate

from app.eval.dataset import EVAL_CASES
from app.graph.graph import app_graph


def _target(inputs: dict) -> dict:
    thread_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}
    graph_inputs = {
        "messages": [HumanMessage(content=inputs["query"])],
        "advisor_id": "eval-harness",
        "retrieved_chunks": [],
        "guardrail_flags": [],
        "requires_approval": False,
    }
    app_graph.invoke(graph_inputs, config)
    state = app_graph.get_state(config)

    interrupted = bool(state.tasks and any(t.interrupts for t in state.tasks))
    interrupt_payload = (
        state.tasks[0].interrupts[0].value if interrupted and state.tasks[0].interrupts else {}
    )

    return {
        "ticker": state.values.get("ticker"),
        "requires_approval": interrupted,
        "filing_summary": (
            interrupt_payload.get("final_output", {}).get("filing_summary")
            if interrupted
            else state.values.get("filing_summary")
        ),
        "quote_data": state.values.get("quote_data"),
    }


def ticker_correct(run, example) -> dict:
    expected = example.outputs["expects"].get("ticker")
    score = expected is None or expected == run.outputs.get("ticker")
    return {"key": "ticker_correct", "score": float(score)}


def guardrail_correct(run, example) -> dict:
    expected = example.outputs["expects"].get("requires_approval")
    if expected is None:
        return {"key": "guardrail_correct", "score": 1.0}
    return {"key": "guardrail_correct", "score": float(run.outputs.get("requires_approval") == expected)}


def groundedness(run, example) -> dict:
    summary = run.outputs.get("filing_summary")
    if not summary:
        return {"key": "groundedness", "score": 1.0}
    return {"key": "groundedness", "score": float(bool(summary.get("citations")))}


def main():
    examples = [
        {"inputs": {"query": c["query"]}, "outputs": {"expects": c["expects"]}} for c in EVAL_CASES
    ]
    evaluate(
        _target,
        data=examples,
        evaluators=[ticker_correct, guardrail_correct, groundedness],
        experiment_prefix="advisor-stock-copilot",
    )


if __name__ == "__main__":
    main()
