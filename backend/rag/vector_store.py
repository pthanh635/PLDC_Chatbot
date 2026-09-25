from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import faiss
import numpy as np

from backend.core.config import settings
from backend.rag.embedder import embed_texts


class VectorStore:
    def __init__(self, directory: Path | None = None) -> None:
        self.directory = directory or settings.vector_store_dir
        self.index_path = self.directory / "index.faiss"
        self.metadata_path = self.directory / "metadata.json"

        self._index = None
        self._metadata: list[dict[str, Any]] = []

    @property
    def ready(self) -> bool:
        return (
            self.index_path.exists()
            and self.metadata_path.exists()
        )

    def load(self) -> None:
        if self._index is not None:
            return

        if not self.ready:
            raise FileNotFoundError(
                "Chưa có vector store. "
                "Hãy chạy script ingest PDF trước."
            )

        self._index = faiss.read_index(
            str(self.index_path)
        )

        self._metadata = json.loads(
            self.metadata_path.read_text(
                encoding="utf-8"
            )
        )

        if self._index.ntotal != len(self._metadata):
            raise RuntimeError(
                "Số vector trong FAISS không khớp "
                "với số record metadata."
            )

    def search(
        self,
        query: str,
        top_k: int,
    ) -> list[dict[str, Any]]:

        self.load()

        assert self._index is not None

        if not query.strip():
            return []

        # ---------------------------------------------
        # Embed query
        # ---------------------------------------------

        query_vector = embed_texts([query])

        query_vector = np.asarray(
            query_vector,
            dtype="float32",
        )

        # Document vectors đã normalize lúc ingest,
        # nên query cũng phải normalize.
        faiss.normalize_L2(query_vector)

        # Không search nhiều hơn số vector đang có
        k = min(
            top_k,
            self._index.ntotal,
        )

        scores, indices = self._index.search(
            query_vector,
            k,
        )

        # ---------------------------------------------
        # Build results
        # ---------------------------------------------

        results: list[dict[str, Any]] = []

        for score, idx in zip(
            scores[0],
            indices[0],
        ):
            if idx < 0:
                continue

            if idx >= len(self._metadata):
                continue

            item = dict(
                self._metadata[idx]
            )

            item["score"] = float(score)

            results.append(item)

        return results


vector_store = VectorStore()