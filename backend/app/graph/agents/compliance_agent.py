import re

from langgraph.types import interrupt

from app.graph.state import AgentState

_ADVICE_PATTERNS = [
    r"\byou should (buy|sell|invest)\b",
    r"\bguaranteed?\s+(return|profit)\b",
    r"\bwe recommend\b",
    r"\bstrong buy\b",
]

DISCLAIMER = (
    "This summary is for informational purposes only and does not constitute "
    "investment advice. Consult the full filing and exercise independent judgment."
)

_STATUS_MAP = {"approve": "approved", "reject": "rejected", "edit": "edited"}


def check_compliance(text: str) -> dict:
    """Regex pass for definitive-advice language. Any match forces the human
    approval gate below regardless of the always-on filing-summary sign-off."""
    lowered = text.lower()
    flags = [
        "recommendation_language"
        for pattern in _ADVICE_PATTERNS
        if re.search(pattern, lowered)
    ]
    return {"flags": flags[:1], "pass": not flags}


def compliance_agent(state: AgentState) -> dict:
    summary = state.get("filing_summary")

    text_to_check = " ".join((summary or {}).get("key_points", []) + (summary or {}).get("risks", []))
    for msg in state["messages"]:
        if getattr(msg, "type", "") == "human":
            text_to_check += " " + str(msg.content)

    flags = check_compliance(text_to_check)["flags"]

    final_output = {
        "ticker": state.get("ticker"),
        "quote": state.get("quote_data"),
        "filing_summary": summary,
        "disclaimer": DISCLAIMER,
    }

    # A filing summary always needs advisor sign-off before it's final (models the
    # real compliance requirement for advisor-facing research notes); a guardrail
    # flag forces the same gate even for quote-only answers.
    requires_approval = bool(flags) or summary is not None
    if not requires_approval:
        return {"guardrail_flags": flags, "requires_approval": False, "final_output": final_output}

    resume_value = interrupt(
        {
            "reason": "Advisor sign-off required before this research note is final.",
            "flags": flags,
            "final_output": final_output,
        }
    )
    decision = resume_value.get("decision") if isinstance(resume_value, dict) else resume_value
    approval_status = _STATUS_MAP.get(decision, "pending")

    if summary is not None:
        summary = {**summary, "approval_status": approval_status}
        if decision == "edit" and isinstance(resume_value, dict) and resume_value.get("edited_text"):
            summary["key_points"] = [resume_value["edited_text"]]
        final_output = {**final_output, "filing_summary": summary}

    return {
        "guardrail_flags": flags,
        "requires_approval": True,
        "approval_decision": decision,
        "filing_summary": summary,
        "final_output": {**final_output, "status": approval_status},
    }
