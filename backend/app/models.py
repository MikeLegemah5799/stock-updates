from typing import Literal, TypedDict


class TickerQuote(TypedDict):
    symbol: str
    company_name: str
    price: float
    change: float
    change_percent: float
    day_high: float
    day_low: float
    volume: int
    market_cap: int
    as_of: str  # ISO timestamp


class CompanyProfile(TypedDict):
    symbol: str
    company_name: str
    sector: str
    industry: str
    market_cap: int


class FilingChunk(TypedDict):
    id: str
    ticker: str
    cik: str
    filing_type: str  # "10-K"
    filing_date: str
    section: str  # "Item 1A - Risk Factors" | "Item 7 - MD&A"
    source_url: str
    chunk_index: int
    text: str


class FilingSummary(TypedDict):
    ticker: str
    filing_type: str
    filing_date: str
    key_points: list[str]
    risks: list[str]
    citations: list[str]
    generated_at: str
    approval_status: Literal["pending", "approved", "rejected", "edited"]


class AdvisorProfile(TypedDict):
    advisor_id: str
    watchlist: list[str]
    recent_queries: list[str]
