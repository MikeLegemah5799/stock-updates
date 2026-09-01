import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    anthropic_api_key: str = ""

    pinecone_api_key: str = ""
    pinecone_index_name: str = "sec-filings"
    pinecone_cloud: str = "aws"
    pinecone_region: str = "us-east-1"

    langsmith_api_key: str = ""
    langsmith_tracing: bool = False
    langsmith_project: str = "advisor-stock-copilot"

    frontend_origin: str = "http://localhost:3000"

    # SEC EDGAR requires a contact-identifying User-Agent on all requests.
    sec_edgar_contact_email: str = "set-me@example.com"


settings = Settings()

# pydantic-settings parses .env into `settings` but never touches os.environ.
# The langsmith/langchain SDKs read tracing config directly from os.environ,
# so it has to be propagated explicitly or tracing silently never activates.
if settings.langsmith_api_key:
    os.environ.setdefault("LANGSMITH_API_KEY", settings.langsmith_api_key)
    os.environ.setdefault("LANGSMITH_TRACING", "true" if settings.langsmith_tracing else "false")
    os.environ.setdefault("LANGSMITH_PROJECT", settings.langsmith_project)
