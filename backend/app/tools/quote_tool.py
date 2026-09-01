"""Mocked market-data source.

Signatures mirror what a real quote API (e.g. Finnhub /quote + /stock/profile2)
would return, so swapping in a live provider later is a one-file change: replace
the body of get_stock_quote / get_company_profile with an HTTP call and keep the
return shape.
"""

from datetime import datetime, timezone

from langchain_core.tools import tool

from app.models import CompanyProfile, TickerQuote

_MOCK_QUOTES: dict[str, TickerQuote] = {
    "AAPL": {
        "symbol": "AAPL",
        "company_name": "Apple Inc.",
        "price": 227.52,
        "change": 1.84,
        "change_percent": 0.82,
        "day_high": 228.10,
        "day_low": 224.90,
        "volume": 48_302_100,
        "market_cap": 3_460_000_000_000,
        "as_of": "",
    },
    "TSLA": {
        "symbol": "TSLA",
        "company_name": "Tesla, Inc.",
        "price": 248.13,
        "change": -3.27,
        "change_percent": -1.30,
        "day_high": 253.40,
        "day_low": 246.55,
        "volume": 71_845_600,
        "market_cap": 791_000_000_000,
        "as_of": "",
    },
    "MSFT": {
        "symbol": "MSFT",
        "company_name": "Microsoft Corporation",
        "price": 421.90,
        "change": 2.11,
        "change_percent": 0.50,
        "day_high": 423.75,
        "day_low": 418.60,
        "volume": 19_204_300,
        "market_cap": 3_130_000_000_000,
        "as_of": "",
    },
}

_MOCK_PROFILES: dict[str, CompanyProfile] = {
    "AAPL": {
        "symbol": "AAPL",
        "company_name": "Apple Inc.",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "market_cap": 3_460_000_000_000,
    },
    "TSLA": {
        "symbol": "TSLA",
        "company_name": "Tesla, Inc.",
        "sector": "Consumer Cyclical",
        "industry": "Auto Manufacturers",
        "market_cap": 791_000_000_000,
    },
    "MSFT": {
        "symbol": "MSFT",
        "company_name": "Microsoft Corporation",
        "sector": "Technology",
        "industry": "Software - Infrastructure",
        "market_cap": 3_130_000_000_000,
    },
}


@tool
def get_stock_quote(ticker: str) -> TickerQuote | dict:
    """Get the current (mocked) quote for a stock ticker symbol."""
    quote = _MOCK_QUOTES.get(ticker.upper())
    if quote is None:
        return {"error": f"No quote data available for '{ticker}'."}
    return {**quote, "as_of": datetime.now(timezone.utc).isoformat()}


@tool
def get_company_profile(ticker: str) -> CompanyProfile | dict:
    """Get company profile info (sector, industry, market cap) for a ticker symbol."""
    profile = _MOCK_PROFILES.get(ticker.upper())
    if profile is None:
        return {"error": f"No profile data available for '{ticker}'."}
    return profile
