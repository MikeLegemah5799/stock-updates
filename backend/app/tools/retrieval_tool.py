from langchain_core.tools import tool

from app.rag.pinecone_client import NAMESPACE, get_or_create_index


@tool
def retrieve_filing_context(query: str, ticker: str, top_k: int = 5) -> list[dict]:
    """Search the ingested SEC 10-K filing chunks (Risk Factors + MD&A) for a
    ticker and return the top_k most relevant chunks with their source metadata."""
    index = get_or_create_index()
    results = index.search(
        namespace=NAMESPACE,
        query={
            "inputs": {"text": query},
            "top_k": top_k,
            "filter": {"ticker": ticker.upper()},
        },
    )
    hits = results.get("result", {}).get("hits", [])
    return [
        {
            "text": hit["fields"].get("text", ""),
            "section": hit["fields"].get("section", ""),
            "source_url": hit["fields"].get("source_url", ""),
            "filing_date": hit["fields"].get("filing_date", ""),
            "score": hit.get("_score"),
        }
        for hit in hits
    ]
