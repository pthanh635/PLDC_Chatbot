from __future__ import annotations

from typing import Literal
from pydantic import BaseModel, Field

Mode = Literal["nhan_dinh", "so_sanh", "tinh_huong", "dinh_nghia"]


class ChatRequest(BaseModel):
    mode: Mode
    question: str = Field(min_length=2, max_length=5000)


class SourceItem(BaseModel):
    source: str
    page: int | str
    score: float | None = None
    text_preview: str


class ChatResponse(BaseModel):
    mode: Mode
    answer: str
    sources: list[SourceItem]
    mock: bool = False
