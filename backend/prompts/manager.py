from __future__ import annotations

from backend.prompts.base import SYSTEM_PROMPT, render_context
from backend.prompts.nhan_dinh import INSTRUCTION as NHAN_DINH
from backend.prompts.so_sanh import INSTRUCTION as SO_SANH
from backend.prompts.tinh_huong import INSTRUCTION as TINH_HUONG
from backend.prompts.dinh_nghia import INSTRUCTION as DINH_NGHIA


MODE_INSTRUCTIONS = {
    "nhan_dinh": NHAN_DINH,
    "so_sanh": SO_SANH,
    "tinh_huong": TINH_HUONG,
    "dinh_nghia": DINH_NGHIA,
}


MODE_LABELS = {
    "nhan_dinh": "Nhận định đúng/sai",
    "so_sanh": "So sánh",
    "tinh_huong": "Tình huống",
    "dinh_nghia": "Định nghĩa",
}


def build_prompt(
    mode: str,
    question: str,
    chunks: list[dict],
) -> tuple[str, str]:

    if mode not in MODE_INSTRUCTIONS:
        raise ValueError(
            f"Mode không hợp lệ: {mode}"
        )

    context = render_context(chunks)

    user_prompt = f"""
{MODE_INSTRUCTIONS[mode]}

CONTEXT:
{context}

CÂU HỎI:
{question.strip()}

Trả lời trực tiếp. Không lặp lại câu hỏi hoặc hướng dẫn.
""".strip()

    return SYSTEM_PROMPT, user_prompt