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


_MIN_SECTION_CHARS = 1_000
_MAX_SECTION_CHARS = 40_000


def fetch_filing_sections(source_url: str) -> dict[str, str]:
    """Download a 10-K document and extract the Risk Factors and MD&A sections
    via heuristic text splitting (best-effort — 10-K HTML structure varies).

    A 10-K's table of contents lists "Item 1A. Risk Factors" near the top as a
    one-line entry, which a naive first-match search grabs instead of the real
    section. The actual section header is typically the *last* occurrence of
    that heading in the document, so start matches are scanned newest-first
    and the first one followed by a substantial amount of text is used.
    """
    resp = requests.get(source_url, headers=_HEADERS, timeout=30)
    resp.raise_for_status()
    text = BeautifulSoup(resp.content, "html.parser").get_text(separator="\n")
    text = re.sub(r"\n{2,}", "\n", text)

    sections: dict[str, str] = {}
    for label, (start_pat, end_pat) in _SECTION_PATTERNS.items():
        start_matches = list(re.finditer(start_pat, text, re.IGNORECASE))
        if not start_matches:
            continue

        chosen = None
        for m in reversed(start_matches):
            end_match = re.search(end_pat, text[m.end():], re.IGNORECASE)
            end_idx = m.end() + end_match.start() if end_match else m.end() + _MAX_SECTION_CHARS
            candidate = text[m.start():end_idx].strip()
            if len(candidate) >= _MIN_SECTION_CHARS:
                chosen = candidate
                break

        if chosen is None:
            m = start_matches[-1]
            chosen = text[m.start():m.end() + _MAX_SECTION_CHARS].strip()

        sections[label] = chosen
    return sections
