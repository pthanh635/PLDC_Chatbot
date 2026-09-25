from __future__ import annotations

from typing import Any


SYSTEM_PROMPT = """
Bạn là trợ lý môn Pháp luật đại cương.
Chỉ trả lời dựa trên CONTEXT và dữ kiện trong câu hỏi.
Không tự tạo điều luật, tên văn bản hoặc dữ kiện không có trong CONTEXT.
Nếu thiếu dữ kiện để kết luận, phải nói rõ chưa đủ dữ kiện.
""".strip()


def format_page(chunk: dict[str, Any]) -> str:
    page_start = chunk.get("page_start")
    page_end = chunk.get("page_end")

    # Tương thích metadata cũ
    if page_start is None:
        old_page = chunk.get("page")
        return str(old_page) if old_page is not None else "?"

    if page_end is None or page_start == page_end:
        return str(page_start)

    return f"{page_start}-{page_end}"


def render_context(
    chunks: list[dict[str, Any]],
) -> str:
    if not chunks:
        return "Không có CONTEXT được truy xuất."

    blocks = []

    for index, chunk in enumerate(
        chunks,
        start=1,
    ):
        source = str(
            chunk.get(
                "source",
                "Tài liệu",
            )
        )

        page = format_page(chunk)

        text = str(
            chunk.get(
                "text",
                "",
            )
        ).strip()

        if not text:
            continue

        blocks.append(
            f"[TÀI LIỆU {index} | {source} | trang {page}]\n{text}"
        )

    if not blocks:
        return "Không có CONTEXT hợp lệ."

    return "\n\n".join(blocks)