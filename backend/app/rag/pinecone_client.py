"""Pinecone client using integrated (hosted) embeddings.

Using create_index_for_model + upsert_records/search means Pinecone generates
embeddings server-side (e.g. multilingual-e5-large) — no second embedding API
key is needed, keeping Anthropic as the only paid vendor in this prototype.
"""

from pinecone import Pinecone

from app.config import settings

NAMESPACE = "sec-filings"
EMBED_MODEL = "multilingual-e5-large"

_pc: Pinecone | None = None


def get_client() -> Pinecone:
    global _pc
    if _pc is None:
        _pc = Pinecone(api_key=settings.pinecone_api_key)
    return _pc


def get_or_create_index():
    pc = get_client()
    name = settings.pinecone_index_name
    if not pc.has_index(name):
        pc.create_index_for_model(
            name=name,
            cloud=settings.pinecone_cloud,
            region=settings.pinecone_region,
            embed={
                "model": EMBED_MODEL,
                "field_map": {"text": "text"},
            },
        )
    return pc.Index(name)
