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
