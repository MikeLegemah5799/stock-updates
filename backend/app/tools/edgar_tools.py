"""SEC EDGAR helpers — used only by the offline ingestion script (app/rag/ingest.py),
not exposed to the live agent graph. EDGAR is free and requires no API key, only a
contact-identifying User-Agent header per its fair-use policy.
"""

import re

import requests
from bs4 import BeautifulSoup

from app.config import settings

_HEADERS = {"User-Agent": f"advisor-stock-copilot ({settings.sec_edgar_contact_email})"}

# Hand-mapped for the prototype's 3 seed tickers to avoid an extra full-text
# ticker->CIK lookup call per ingestion run.
TICKER_TO_CIK = {
    "AAPL": "0000320193",
    "TSLA": "0001318605",
    "MSFT": "0000789019",
}

_SECTION_PATTERNS = {
    "Item 1A - Risk Factors": (r"item\s+1a\.?\s+risk\s+factors", r"item\s+1b\."),
    "Item 7 - MD&A": (
        r"item\s+7\.?\s+management.?s\s+discussion",
        r"item\s+7a\.",
    ),
}


def get_latest_10k(ticker: str) -> dict:
    """Return {filing_date, accession_number, primary_document, source_url} for the
    most recent 10-K filed by `ticker`."""
    cik = TICKER_TO_CIK[ticker.upper()]
    resp = requests.get(
        f"https://data.sec.gov/submissions/CIK{cik}.json", headers=_HEADERS, timeout=15
    )
    resp.raise_for_status()
    recent = resp.json()["filings"]["recent"]

    for i, form in enumerate(recent["form"]):
        if form == "10-K":
            accession = recent["accessionNumber"][i].replace("-", "")
            primary_doc = recent["primaryDocument"][i]
            filing_date = recent["filingDate"][i]
            source_url = (
                f"https://www.sec.gov/Archives/edgar/data/{int(cik)}/{accession}/{primary_doc}"
            )
            return {
                "filing_date": filing_date,
                "accession_number": accession,
                "primary_document": primary_doc,
                "source_url": source_url,
            }
    raise ValueError(f"No 10-K found for {ticker}")


def fetch_filing_sections(source_url: str) -> dict[str, str]:
    """Download a 10-K document and extract the Risk Factors and MD&A sections
    via heuristic text splitting (best-effort — 10-K HTML structure varies)."""
    resp = requests.get(source_url, headers=_HEADERS, timeout=30)
    resp.raise_for_status()
    text = BeautifulSoup(resp.content, "html.parser").get_text(separator="\n")
    text = re.sub(r"\n{2,}", "\n", text)

    sections: dict[str, str] = {}
    for label, (start_pat, end_pat) in _SECTION_PATTERNS.items():
        start_match = re.search(start_pat, text, re.IGNORECASE)
        if not start_match:
            continue
        end_match = re.search(end_pat, text[start_match.end():], re.IGNORECASE)
        end_idx = (
            start_match.end() + end_match.start() if end_match else start_match.end() + 20_000
        )
        sections[label] = text[start_match.start():end_idx].strip()
    return sections
