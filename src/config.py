import os
from pathlib import Path
from dotenv import load_dotenv

# Base Directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
load_dotenv(dotenv_path=BASE_DIR / ".env")

class Settings:
    """Enterprise Application Configuration"""
    APP_NAME: str = "PyTutor AI Enterprise"
    APP_VERSION: str = "2.0.0"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    
    # Model Configurations
    # Defaulting to openai/gpt-oss-120b or custom GROQ_MODEL
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.2"))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "768"))  # Budget-friendly completion limit

    # Vector Storage
    CHROMA_PERSIST_DIR: str = str(BASE_DIR / "chroma_db")
    DOCS_DIR: str = str(BASE_DIR / "data" / "PDF_files")

    # Token Optimization & Retrieval Settings
    RETRIEVAL_TOP_K: int = int(os.getenv("RETRIEVAL_TOP_K", "3"))  # Reduced from default 4 to save prompt tokens
    MAX_HISTORY_TURNS: int = int(os.getenv("MAX_HISTORY_TURNS", "3"))  # Max conversation turns to retain
    MAX_HISTORY_CHARS_PER_MSG: int = int(os.getenv("MAX_HISTORY_CHARS_PER_MSG", "250"))  # Char budget per history message
    MAX_CONTEXT_CHUNK_CHARS: int = int(os.getenv("MAX_CONTEXT_CHUNK_CHARS", "600"))  # Max chars per chunk

    # Cache Settings
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "true").lower() == "true"
    CACHE_MAX_SIZE: int = int(os.getenv("CACHE_MAX_SIZE", "500"))
    CACHE_TTL_SECONDS: int = int(os.getenv("CACHE_TTL_SECONDS", "3600"))  # 1 hour TTL

settings = Settings()
