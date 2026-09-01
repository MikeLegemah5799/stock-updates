"""JSON-backed advisor watchlist/memory store.

Deliberately not a real database: for the prototype's scope (single-session
local demo) a flat JSON file gives persistence-across-restarts with zero infra.
Swap for a real DB behind the same get/save functions if this grows beyond a
prototype.
"""

import json
import threading
from pathlib import Path

from app.models import AdvisorProfile

_STORE_PATH = Path(__file__).parent / "advisor_store.json"
_lock = threading.Lock()


def _read_all() -> dict[str, AdvisorProfile]:
    if not _STORE_PATH.exists():
        return {}
    with _STORE_PATH.open("r") as f:
        return json.load(f)


def _write_all(data: dict[str, AdvisorProfile]) -> None:
    with _STORE_PATH.open("w") as f:
        json.dump(data, f, indent=2)


def get_advisor_profile(advisor_id: str) -> AdvisorProfile:
    with _lock:
        data = _read_all()
    return data.get(
        advisor_id,
        {"advisor_id": advisor_id, "watchlist": [], "recent_queries": []},
    )


def save_watchlist(advisor_id: str, ticker: str, action: str) -> AdvisorProfile:
    ticker = ticker.upper()
    with _lock:
        data = _read_all()
        profile = data.get(
            advisor_id,
            {"advisor_id": advisor_id, "watchlist": [], "recent_queries": []},
        )
        watchlist = set(profile["watchlist"])
        if action == "add":
            watchlist.add(ticker)
        elif action == "remove":
            watchlist.discard(ticker)
        profile["watchlist"] = sorted(watchlist)
        data[advisor_id] = profile
        _write_all(data)
    return profile


def record_query(advisor_id: str, query: str) -> None:
    with _lock:
        data = _read_all()
        profile = data.get(
            advisor_id,
            {"advisor_id": advisor_id, "watchlist": [], "recent_queries": []},
        )
        recent = profile["recent_queries"]
        recent.append(query)
        profile["recent_queries"] = recent[-10:]
        data[advisor_id] = profile
        _write_all(data)
