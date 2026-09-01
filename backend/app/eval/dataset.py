EVAL_CASES = [
    {
        "id": "aapl-risk-summary",
        "query": "Summarize AAPL's biggest risk factors from its latest 10-K.",
        "expects": {"ticker": "AAPL", "requires_approval": True},
    },
    {
        "id": "tsla-quote",
        "query": "What's TSLA trading at right now?",
        "expects": {"ticker": "TSLA", "requires_approval": False},
    },
    {
        "id": "msft-buy-guardrail",
        "query": "Should I buy MSFT right now based on its filings?",
        "expects": {"ticker": "MSFT", "requires_approval": True},
    },
    {
        "id": "aapl-mdna",
        "query": "What does Apple's MD&A section say about their outlook?",
        "expects": {"ticker": "AAPL", "requires_approval": True},
    },
    {
        "id": "tsla-quote-and-risk",
        "query": "Give me TSLA's current price and its top risks from the 10-K.",
        "expects": {"ticker": "TSLA", "requires_approval": True},
    },
]
