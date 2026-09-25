from __future__ import annotations

import re
import unicodedata
from typing import Any

from backend.rag.vector_store import vector_store


# ============================================================
# CONFIG
# ============================================================

# Retrieve rộng trước rồi mới rerank.
# Không phải toàn bộ 8 chunks đều được đưa vào LLM.
CANDIDATE_K = 8

# Khi so sánh A và B:
# search riêng A, B để tránh embedding câu tổng hợp bỏ sót một khái niệm.
COMPARE_TERM_K = 5


# ============================================================
# TEXT NORMALIZATION
# ============================================================

def normalize_text(text: str) -> str:
    """
    Chuẩn hóa text cho:
    - keyword matching
    - exact phrase matching
    - phân tích câu hỏi

    Ví dụ:
        "Pháp luật là gì?"
        ->
        "pháp luật là gì"
    """

    if not text:
        return ""

    text = unicodedata.normalize("NFC", text)
    text = text.lower()

    # Thay punctuation bằng khoảng trắng.
    text = re.sub(r"[^\w\s]", " ", text)

    # Gộp nhiều khoảng trắng.
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def normalize_text_keep_punctuation(text: str) -> str:
    """
    Chuẩn hóa nhưng giữ punctuation.

    Dùng khi cần phân biệt:

        "Pháp luật là ..."

    với:

        "Chức năng của pháp luật là ..."
    """

    if not text:
        return ""

    text = unicodedata.normalize("NFC", text)
    text = text.lower()

    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# QUERY ANALYSIS
# ============================================================

def extract_subject(question: str) -> str:
    """
    Lấy chủ thể/khái niệm chính trong câu hỏi định nghĩa.

    Ví dụ:
        "Pháp luật là gì?"
            -> "pháp luật"

        "Lỗi cố ý trực tiếp là gì?"
            -> "lỗi cố ý trực tiếp"

        "Khái niệm vi phạm pháp luật"
            -> "vi phạm pháp luật"

        "Định nghĩa quan hệ pháp luật"
            -> "quan hệ pháp luật"
    """

    q = normalize_text(question)

    patterns = [
        r"^(.*?)\s+là\s+gì$",
        r"^khái\s+niệm\s+(.+)$",
        r"^định\s+nghĩa\s+(.+)$",
        r"^hãy\s+nêu\s+khái\s+niệm\s+(.+)$",
        r"^nêu\s+khái\s+niệm\s+(.+)$",
    ]

    for pattern in patterns:
        match = re.match(pattern, q)

        if match:
            return match.group(1).strip()

    return q


def extract_comparison_concepts(
    question: str,
) -> tuple[str, str] | None:
    """
    Phát hiện câu hỏi so sánh/phân biệt.

    Ví dụ:
        "So sánh vi phạm hành chính và vi phạm dân sự"
        ->
        (
            "vi phạm hành chính",
            "vi phạm dân sự",
        )

        "Phân biệt năng lực pháp luật với năng lực hành vi"
        ->
        (
            "năng lực pháp luật",
            "năng lực hành vi",
        )
    """

    q = normalize_text(question)

    patterns = [
        r"^so\s+sánh\s+giữa\s+(.+?)\s+và\s+(.+)$",
        r"^so\s+sánh\s+(.+?)\s+và\s+(.+)$",
        r"^so\s+sánh\s+(.+?)\s+với\s+(.+)$",
        r"^phân\s+biệt\s+(.+?)\s+và\s+(.+)$",
        r"^phân\s+biệt\s+(.+?)\s+với\s+(.+)$",
    ]

    for pattern in patterns:
        match = re.match(pattern, q)

        if not match:
            continue

        concept_a = match.group(1).strip()
        concept_b = match.group(2).strip()

        if concept_a and concept_b:
            return concept_a, concept_b

    return None


# ============================================================
# MATCHING HELPERS
# ============================================================

def keyword_coverage(
    phrase: str,
    text: str,
) -> float:
    """
    Tính tỉ lệ từ trong phrase xuất hiện trong text.

    Đây chỉ là tín hiệu phụ, không phải exact phrase.

    Ví dụ:
        phrase:
            "vi phạm hành chính"

        text có:
            "vi phạm ... hành chính"

    vẫn có coverage cao.
    """

    phrase = normalize_text(phrase)
    text = normalize_text(text)

    phrase_words = [
        word
        for word in phrase.split()
        if len(word) >= 2
    ]

    if not phrase_words:
        return 0.0

    text_words = set(text.split())

    matched = sum(
        1
        for word in phrase_words
        if word in text_words
    )

    return matched / len(phrase_words)


def contains_definition(
    subject: str,
    original_text: str,
) -> bool:
    """
    Kiểm tra chunk có chứa định nghĩa trực tiếp của subject.

    Tránh nhầm:

        "Chức năng của pháp luật là ..."

    thành định nghĩa:

        "Pháp luật là ..."
    """

    if not subject:
        return False

    subject = normalize_text(subject)

    text = normalize_text_keep_punctuation(
        original_text
    )

    escaped_subject = re.escape(subject)

    # Trường hợp nằm đầu chunk:
    #
    # "Pháp luật là..."
    start_pattern = (
        rf"^\s*"
        rf"{escaped_subject}"
        rf"\s+là\b"
    )

    if re.search(
        start_pattern,
        text,
        flags=re.IGNORECASE,
    ):
        return True

    # Trường hợp nằm sau dấu câu:
    #
    # "...đưa ra định nghĩa: Pháp luật là..."
    boundary_pattern = (
        rf"(?:[.!?:;]\s*|[\-–—]\s*)"
        rf"{escaped_subject}"
        rf"\s+là\b"
    )

    if re.search(
        boundary_pattern,
        text,
        flags=re.IGNORECASE,
    ):
        return True

    return False


def fuzzy_phrase_pattern(
    phrase: str,
) -> str:
    """
    Tạo regex chịu được lỗi PDF extraction.

    Ví dụ PDF có:
        "V i phạm hành chính"

    vẫn có thể match:
        "vi phạm hành chính"
    """

    phrase = normalize_text(phrase)

    words = phrase.split()

    if not words:
        return ""

    word_patterns: list[str] = []

    for word in words:

        chars = [
            re.escape(char)
            for char in word
        ]

        # "vi"
        # ->
        # v\s*i
        #
        # Cho phép PDF chèn space giữa ký tự.
        word_pattern = r"\s*".join(chars)

        word_patterns.append(
            word_pattern
        )

    # Giữa các từ phải có ít nhất một khoảng trắng.
    return r"\s+".join(
        word_patterns
    )


def fuzzy_phrase_match(
    phrase: str,
    text: str,
) -> bool:
    """
    Kiểm tra một cụm khái niệm có xuất hiện trong text,
    kể cả khi PDF extraction chèn khoảng trắng bất thường.

    Ví dụ:
        phrase:
            "vi phạm hành chính"

        PDF:
            "V i phạm hành chính"
    """

    if not phrase or not text:
        return False

    pattern = fuzzy_phrase_pattern(
        phrase
    )

    if not pattern:
        return False

    normalized_text = normalize_text(text)

    return (
        re.search(
            pattern,
            normalized_text,
            flags=re.IGNORECASE,
        )
        is not None
    )


def contains_concept_definition(
    concept: str,
    original_text: str,
) -> bool:
    """
    Kiểm tra chunk có chứa định nghĩa trực tiếp của concept.

    Ví dụ:

        "Vi phạm hành chính: là hành vi ..."

        "Vi phạm dân sự: là những hành vi ..."

    Đây là tín hiệu mạnh hơn việc concept chỉ được nhắc tới.
    """

    if not concept or not original_text:
        return False

    text = normalize_text_keep_punctuation(
        original_text
    )

    concept_pattern = fuzzy_phrase_pattern(
        concept
    )

    if not concept_pattern:
        return False

    # Match các dạng:
    #
    # vi phạm hành chính: là ...
    # vi phạm hành chính là ...
    # vi phạm hành chính được hiểu là ...
    pattern = (
        rf"{concept_pattern}"
        rf"\s*:?\s*"
        rf"(?:là|được\s+hiểu\s+là)\b"
    )

    return (
        re.search(
            pattern,
            text,
            flags=re.IGNORECASE,
        )
        is not None
    )


# ============================================================
# RERANKING
# ============================================================

def calculate_rerank_score(
    question: str,
    item: dict[str, Any],
) -> float:
    """
    Rerank candidate sau semantic search.

    semantic_score:
        điểm cosine similarity từ FAISS.

    bonus:
        điểm bổ sung dựa vào cấu trúc và nội dung câu hỏi.

    Mục tiêu:
        Semantic search vẫn là nền chính.
        Rule chỉ dùng để sửa các lỗi ranking rõ ràng.
    """

    semantic_score = float(
        item.get("score", 0.0)
    )

    original_text = str(
        item.get("text", "")
    )

    q = normalize_text(question)
    text = normalize_text(original_text)

    bonus = 0.0

    # ========================================================
    # 1. CÂU HỎI ĐỊNH NGHĨA
    # ========================================================

    is_definition_question = (
        "là gì" in q
        or q.startswith("định nghĩa ")
        or q.startswith("khái niệm ")
        or "nêu khái niệm" in q
    )

    if is_definition_question:

        subject = extract_subject(
            question
        )

        # Subject có xuất hiện trong chunk.
        if (
            subject
            and normalize_text(subject) in text
        ):
            bonus += 0.05

        # Chunk chứa đúng:
        #
        # "Pháp luật là..."
        #
        # thay vì chỉ:
        #
        # "Chức năng của pháp luật là..."
        if contains_definition(
            subject,
            original_text,
        ):
            bonus += 0.20

        # Giáo trình dùng cụm này ngay trước định nghĩa.
        if "có thể đưa ra định nghĩa" in text:
            bonus += 0.12

        elif "định nghĩa" in text:
            bonus += 0.05

    # ========================================================
    # 2. CẤU THÀNH VI PHẠM PHÁP LUẬT
    # ========================================================

    if "cấu thành vi phạm pháp luật" in q:

        if (
            "cấu thành vi phạm pháp luật"
            in text
        ):
            bonus += 0.18

        expected_terms = [
            "mặt khách quan",
            "khách thể",
            "mặt chủ quan",
            "chủ thể",
        ]

        matched_terms = sum(
            1
            for term in expected_terms
            if term in text
        )

        bonus += (
            matched_terms * 0.035
        )

    # ========================================================
    # 3. LỖI CỐ Ý TRỰC TIẾP
    # ========================================================

    if "lỗi cố ý trực tiếp" in q:

        if "lỗi cố ý trực tiếp" in text:
            bonus += 0.18

        expected_terms = [
            "nhận thức rõ",
            "thấy trước hậu quả",
            "mong muốn",
        ]

        matched_terms = sum(
            1
            for term in expected_terms
            if term in text
        )

        bonus += (
            matched_terms * 0.025
        )

    # ========================================================
    # 4. CÂU HỎI SO SÁNH / PHÂN BIỆT
    # ========================================================

    comparison = extract_comparison_concepts(
        question
    )

    if comparison is not None:

        concept_a, concept_b = comparison

        # ----------------------------------------------------
        # Keyword coverage
        # Chỉ là tín hiệu nhẹ.
        # ----------------------------------------------------

        coverage_a = keyword_coverage(
            concept_a,
            original_text,
        )

        coverage_b = keyword_coverage(
            concept_b,
            original_text,
        )

        bonus += coverage_a * 0.02
        bonus += coverage_b * 0.02

        # ----------------------------------------------------
        # Exact/fuzzy phrase
        # ----------------------------------------------------

        exact_a = fuzzy_phrase_match(
            concept_a,
            original_text,
        )

        exact_b = fuzzy_phrase_match(
            concept_b,
            original_text,
        )

        # Có nhắc đúng concept A.
        if exact_a:
            bonus += 0.04

        # Có nhắc đúng concept B.
        if exact_b:
            bonus += 0.04

        # ----------------------------------------------------
        # Quan trọng:
        # Có chứa định nghĩa trực tiếp không?
        # ----------------------------------------------------

        definition_a = (
            contains_concept_definition(
                concept_a,
                original_text,
            )
        )

        definition_b = (
            contains_concept_definition(
                concept_b,
                original_text,
            )
        )

        # Chunk định nghĩa A.
        if definition_a:
            bonus += 0.25

        # Chunk định nghĩa B.
        if definition_b:
            bonus += 0.25

        # Chunk định nghĩa cả A và B
        # cực kỳ hữu ích cho câu so sánh.
        if definition_a and definition_b:
            bonus += 0.35

        # Nếu chỉ nhắc cả A và B nhưng không định nghĩa,
        # giảm nhẹ.
        #
        # Ví dụ tránh:
        #
        # "trách nhiệm hành chính"
        # "trách nhiệm dân sự"
        #
        # đứng cao hơn chunk chứa:
        #
        # "vi phạm hành chính: là..."
        # "vi phạm dân sự: là..."
        elif exact_a and exact_b:
            bonus -= 0.08

    # RẤT QUAN TRỌNG:
    # Không được bỏ return này.
    return semantic_score + bonus


# ============================================================
# CANDIDATE MERGING
# ============================================================

def get_result_key(
    item: dict[str, Any],
) -> str:
    """
    Tạo key dùng để deduplicate chunk.
    """

    chunk_id = item.get("chunk_id")

    if chunk_id:
        return str(chunk_id)

    source = item.get(
        "source",
        "",
    )

    page_start = item.get(
        "page_start",
        "",
    )

    page_end = item.get(
        "page_end",
        "",
    )

    text_preview = str(
        item.get("text", "")
    )[:100]

    return (
        f"{source}|"
        f"{page_start}|"
        f"{page_end}|"
        f"{text_preview}"
    )


def merge_candidates(
    candidate_groups: list[
        list[dict[str, Any]]
    ],
) -> list[dict[str, Any]]:
    """
    Merge candidate từ nhiều search query.

    Nếu cùng một chunk xuất hiện nhiều lần,
    giữ semantic score cao nhất.
    """

    merged: dict[
        str,
        dict[str, Any],
    ] = {}

    for group in candidate_groups:

        for item in group:

            key = get_result_key(
                item
            )

            if key not in merged:

                merged[key] = dict(
                    item
                )

                continue

            old_score = float(
                merged[key].get(
                    "score",
                    0.0,
                )
            )

            new_score = float(
                item.get(
                    "score",
                    0.0,
                )
            )

            if new_score > old_score:

                merged[key]["score"] = (
                    new_score
                )

    return list(
        merged.values()
    )


# ============================================================
# NORMAL RETRIEVAL
# ============================================================

def retrieve_normal(
    question: str,
    final_k: int,
) -> list[dict[str, Any]]:
    """
    Retrieval cho:
    - định nghĩa
    - nhận định
    - tình huống
    - câu hỏi kiến thức bình thường
    """

    candidates = vector_store.search(
        question,
        top_k=CANDIDATE_K,
    )

    for item in candidates:

        item["rerank_score"] = (
            calculate_rerank_score(
                question,
                item,
            )
        )

    candidates.sort(
        key=lambda item: float(
            item.get(
                "rerank_score",
                item.get(
                    "score",
                    0.0,
                ),
            )
        ),
        reverse=True,
    )

    return candidates[:final_k]


# ============================================================
# COMPARISON RETRIEVAL
# ============================================================

def retrieve_comparison(
    question: str,
    concept_a: str,
    concept_b: str,
    final_k: int,
) -> list[dict[str, Any]]:
    """
    Retrieval riêng cho câu:

        So sánh A và B

    Không chỉ search câu hỏi gốc.

    Search:
        1. câu hỏi gốc
        2. concept A
        3. concept B

    Sau đó:
        merge
        deduplicate
        rerank
    """

    original_results = (
        vector_store.search(
            question,
            top_k=CANDIDATE_K,
        )
    )

    concept_a_results = (
        vector_store.search(
            concept_a,
            top_k=COMPARE_TERM_K,
        )
    )

    concept_b_results = (
        vector_store.search(
            concept_b,
            top_k=COMPARE_TERM_K,
        )
    )

    candidates = merge_candidates(
        [
            original_results,
            concept_a_results,
            concept_b_results,
        ]
    )

    for item in candidates:

        item["rerank_score"] = (
            calculate_rerank_score(
                question,
                item,
            )
        )

    candidates.sort(
        key=lambda item: float(
            item.get(
                "rerank_score",
                item.get(
                    "score",
                    0.0,
                ),
            )
        ),
        reverse=True,
    )

    return candidates[:final_k]


# ============================================================
# PUBLIC API
# ============================================================

def retrieve(
    question: str,
    final_k: int = 3,
) -> list[dict[str, Any]]:
    """
    API chính mà pipeline/backend sử dụng.

    Ví dụ:

        contexts = retrieve(
            "Pháp luật là gì?"
        )

    hoặc:

        contexts = retrieve(
            "So sánh vi phạm hành chính "
            "và vi phạm dân sự."
        )

    Trả về tối đa final_k chunks sau reranking.
    """

    question = question.strip()

    if not question:
        return []

    if final_k <= 0:
        return []

    comparison = (
        extract_comparison_concepts(
            question
        )
    )

    # ========================================================
    # SO SÁNH / PHÂN BIỆT
    # ========================================================

    if comparison is not None:

        concept_a, concept_b = (
            comparison
        )

        return retrieve_comparison(
            question=question,
            concept_a=concept_a,
            concept_b=concept_b,
            final_k=final_k,
        )

    # ========================================================
    # CÁC CÂU HỎI KHÁC
    # ========================================================

    return retrieve_normal(
        question=question,
        final_k=final_k,
    )