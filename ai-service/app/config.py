from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://aurelia:aurelia@localhost:5432/aurelia"
    chroma_host: str = "localhost"
    chroma_port: int = 8000
    jwt_secret: str = ""
    jwt_algorithm: str = "HS256"
    ollama_base_url: str = "http://host.docker.internal:11434"
    ollama_model: str = "llama3.2"
    upload_dir: str = "/tmp/aurelia-uploads"

    model_config = {"env_file": ".env", "case_sensitive": False}


settings = Settings()
