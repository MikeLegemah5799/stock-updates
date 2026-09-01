"""One-time ingestion script: EDGAR -> chunk -> Pinecone upsert.

Run before the demo (`python -m app.rag.ingest`) to pre-seed the filing index
for the 3 prototype tickers. Not called by the live agent graph — retrieval at
query time only ever reads from Pinecone (app/tools/retrieval_tool.py).
"""

from app.rag.pinecone_client import NAMESPACE, get_or_create_index
from app.tools.edgar_tools import TICKER_TO_CIK, fetch_filing_sections, get_latest_10k

CHUNK_WORDS = 500
CHUNK_OVERLAP = 50


def _chunk(text: str) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + CHUNK_WORDS
        chunks.append(" ".join(words[start:end]))
        start = end - CHUNK_OVERLAP
    return chunks


def ingest_ticker(ticker: str, index) -> int:
    filing = get_latest_10k(ticker)
    sections = fetch_filing_sections(filing["source_url"])

    records = []
    for section_name, section_text in sections.items():
        for i, chunk_text in enumerate(_chunk(section_text)):
            records.append(
                {
                    "_id": f"{ticker}-{filing['accession_number']}-{section_name[:6]}-{i}",
                    "text": chunk_text,
                    "ticker": ticker,
                    "cik": TICKER_TO_CIK[ticker],
                    "filing_type": "10-K",
                    "filing_date": filing["filing_date"],
                    "section": section_name,
                    "source_url": filing["source_url"],
                    "chunk_index": i,
                }
            )

    if records:
        # upsert_records batches internally but caps request size; chunk to be safe.
        for i in range(0, len(records), 90):
            index.upsert_records(namespace=NAMESPACE, records=records[i : i + 90])
    return len(records)


def main():
    index = get_or_create_index()
    for ticker in TICKER_TO_CIK:
        count = ingest_ticker(ticker, index)
        print(f"{ticker}: ingested {count} chunks")


if __name__ == "__main__":
    main()
