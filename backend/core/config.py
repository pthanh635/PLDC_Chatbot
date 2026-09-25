from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")


def _as_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _as_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


def _as_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    model_id: str = os.getenv("MODEL_ID", "bqbbao6/Qwen2.5-7B-legal-vn")
    embedding_model_id: str = os.getenv(
        "EMBEDDING_MODEL_ID", "cyhapun/vn-legal-embedding-v1"
    )
    vector_store_dir: Path = ROOT_DIR / os.getenv(
        "VECTOR_STORE_DIR", "backend/data/vector_store"
    )

    load_in_4bit: bool = _as_bool("LOAD_IN_4BIT", False)
    mock_llm: bool = _as_bool("MOCK_LLM", True)
    rag_required: bool = _as_bool("RAG_REQUIRED", True)

    max_new_tokens: int = _as_int("MAX_NEW_TOKENS", 900)
    temperature: float = _as_float("TEMPERATURE", 0.15)
    top_p: float = _as_float("TOP_P", 0.9)
    top_k: int = _as_int("TOP_K", 5)

    api_host: str = os.getenv("API_HOST", "127.0.0.1")
    api_port: int = _as_int("API_PORT", 8000)
    cors_origins: tuple[str, ...] = tuple(
        item.strip()
        for item in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
        if item.strip()
    )


settings = Settings()
