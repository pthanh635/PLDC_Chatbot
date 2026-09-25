from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from backend.app.schemas import (
    ChatRequest,
    ChatResponse,
    SourceItem,
)
from backend.core.config import settings
from backend.core.llm import llm
from backend.prompts.manager import (
    MODE_LABELS,
    build_prompt,
)
from backend.rag.retriever import retrieve
from backend.rag.vector_store import vector_store


# ============================================================
# LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Chạy khi backend khởi động.

    Model Qwen sẽ được load ngay tại đây,
    thay vì chờ request /chat đầu tiên.
    """

    print("\n========== BACKEND STARTUP ==========")

    if settings.mock_llm:
        print("MOCK_LLM=true -> không tải model.")
    else:
        print("Đang tải Qwen2.5-7B-legal-vn...")
        llm.load()
        print("Qwen đã sẵn sàng.")

    print(
        "RAG ready:",
        vector_store.ready,
    )

    print("====================================\n")

    yield

    print("\n========== BACKEND SHUTDOWN ==========")
    print("Đang tắt backend...")
    print("======================================\n")


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="PLĐC Legal Chatbot API",
    version="1.0.0",
    description=(
        "Chatbot Pháp luật đại cương "
        "với 4 mode trả lời + RAG."
    ),
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(
        settings.cors_origins
    ),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# HELPERS
# ============================================================

def format_page(
    item: dict[str, Any],
) -> str:
    """
    Format page metadata.

    Ví dụ:

        page_start=20
        page_end=20
        -> "20"

        page_start=34
        page_end=35
        -> "34-35"
    """

    page_start = item.get(
        "page_start"
    )

    page_end = item.get(
        "page_end"
    )

    # Tương thích metadata cũ
    if page_start is None:
        old_page = item.get(
            "page"
        )

        if old_page is not None:
            return str(
                old_page
            )

        return "?"

    if page_end is None:
        page_end = page_start

    if page_start == page_end:
        return str(
            page_start
        )

    return (
        f"{page_start}-{page_end}"
    )


def build_sources(
    chunks: list[dict[str, Any]],
) -> list[SourceItem]:
    """
    Chuyển retrieved chunks thành sources
    trả về frontend.
    """

    sources: list[
        SourceItem
    ] = []

    for item in chunks:

        semantic_score = item.get(
            "score"
        )

        rerank_score = item.get(
            "rerank_score"
        )

        display_score = (
            rerank_score
            if rerank_score is not None
            else semantic_score
        )

        source_item = SourceItem(
            source=str(
                item.get(
                    "source",
                    "Tài liệu",
                )
            ),
            page=format_page(
                item
            ),
            score=display_score,
            text_preview=str(
                item.get(
                    "text",
                    "",
                )
            )[:260],
        )

        sources.append(
            source_item
        )

    return sources


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "mock_llm": settings.mock_llm,
        "llm_loaded": llm.loaded,
        "rag_ready": vector_store.ready,
        "model_id": settings.model_id,
        "embedding_model_id": (
            settings.embedding_model_id
        ),
    }


# ============================================================
# MODES
# ============================================================

@app.get("/modes")
def modes():
    return MODE_LABELS


# ============================================================
# CHAT
# ============================================================

@app.post(
    "/chat",
    response_model=ChatResponse,
)
def chat(
    payload: ChatRequest,
):
    # --------------------------------------------------------
    # 1. Validate question
    # --------------------------------------------------------

    question = (
        payload.question.strip()
    )

    if not question:
        raise HTTPException(
            status_code=400,
            detail=(
                "Câu hỏi không được để trống."
            ),
        )

    # --------------------------------------------------------
    # 2. RAG retrieval
    # --------------------------------------------------------

    chunks: list[
        dict[str, Any]
    ] = []

    if vector_store.ready:

        try:
            chunks = retrieve(
                question,
                final_k=3,
            )

        except Exception as exc:
            raise HTTPException(
                status_code=500,
                detail=(
                    f"RAG search lỗi: {exc}"
                ),
            ) from exc

    elif settings.rag_required:

        raise HTTPException(
            status_code=503,
            detail=(
                "Chưa có vector store. "
                "Hãy ingest PDF trước bằng: "
                "python -m backend.scripts.ingest "
                "--pdf "
                "\"data/"
                "Bai-giang-Phap-luat-"
                "dai-cuong.pdf\""
            ),
        )

    # --------------------------------------------------------
    # 3. Build prompt
    # --------------------------------------------------------

    try:
        system_prompt, user_prompt = (
            build_prompt(
                payload.mode,
                question,
                chunks,
            )
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(
                exc
            ),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "Prompt building lỗi: "
                f"{exc}"
            ),
        ) from exc

    # --------------------------------------------------------
    # 4. Generate
    # --------------------------------------------------------

    try:
        answer = llm.generate(
            system_prompt,
            user_prompt,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=(
                "LLM generation lỗi: "
                f"{exc}"
            ),
        ) from exc

    # --------------------------------------------------------
    # 5. Sources
    # --------------------------------------------------------

    sources = build_sources(
        chunks
    )

    # --------------------------------------------------------
    # 6. Response
    # --------------------------------------------------------

    return ChatResponse(
        mode=payload.mode,
        answer=answer,
        sources=sources,
        mock=settings.mock_llm,
    )