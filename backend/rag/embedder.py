from __future__ import annotations

from functools import lru_cache
import numpy as np

from backend.core.config import settings


@lru_cache(maxsize=1)
def get_embedding_model():
    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(settings.embedding_model_id)


def embed_texts(texts: list[str]) -> np.ndarray:
    model = get_embedding_model()
    vectors = model.encode(
        texts,
        batch_size=32,
        show_progress_bar=len(texts) > 32,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )
    return np.asarray(vectors, dtype="float32")
