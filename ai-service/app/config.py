from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://aurelia:aurelia@localhost:5432/aurelia"
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    anthropic_api_key: str = ""
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    claude_model: str = "claude-sonnet-4-6"
    upload_dir: str = "/tmp/aurelia-uploads"

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
