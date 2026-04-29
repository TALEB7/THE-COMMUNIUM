from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"

    class Config:
        env_file = ".env"


settings = Settings()
