from langchain_core.tools import tool

from app.memory.store import get_advisor_profile, save_watchlist


@tool
def get_advisor_memory(advisor_id: str) -> dict:
    """Get an advisor's saved watchlist and recent queries."""
    return dict(get_advisor_profile(advisor_id))


@tool
def update_watchlist(advisor_id: str, ticker: str, action: str) -> dict:
    """Add or remove a ticker from an advisor's watchlist. action is 'add' or 'remove'."""
    return dict(save_watchlist(advisor_id, ticker, action))
