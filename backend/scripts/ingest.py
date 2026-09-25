from __future__ import annotations

import argparse
import json
import re
import unicodedata
from pathlib import Path

import faiss
import numpy as np
from pypdf import PdfReader

from backend.core.config import settings
from backend.rag.embedder import embed_texts


# ============================================================
# TEXT CLEANING
# ============================================================

def normalize_text(text: str) -> str:
    """
    Làm sạch text nhưng không thay đổi nội dung pháp luật.
    """
    if not text:
        return ""

    # Chuẩn hóa Unicode
    text = unicodedata.normalize("NFC", text)

    # Xóa null character
    text = text.replace("\x00", " ")

    # Chuẩn hóa xuống dòng
    text = text.replace("\r\n", "\n").replace("\r", "\n")

    # Xóa khoảng trắng thừa trong từng dòng
    lines = []
    for line in text.split("\n"):
        line = re.sub(r"[ \t]+", " ", line).strip()

        # Bỏ dòng chỉ chứa số trang
        if re.fullmatch(r"\d{1,3}", line):
            continue

        if line:
            lines.append(line)

    text = " ".join(lines)

    # Khoảng trắng thừa
    text = re.sub(r"\s+", " ", text)

    return text.strip()


# ============================================================
# SENTENCE SPLITTING
# ============================================================

def split_sentences(text: str) -> list[str]:
    """
    Tách tương đối theo câu để tránh cắt giữa câu.

    Không yêu cầu thư viện NLP bên ngoài.
    """

    if not text:
        return []

    # Tách sau dấu kết thúc câu.
    pieces = re.split(
        r"(?<=[.!?])\s+(?=[A-ZÀ-ỸĐ0-9\-])",
        text,
    )

    sentences = []

    for piece in pieces:
        piece = piece.strip()
        if piece:
            sentences.append(piece)

    return sentences


# ============================================================
# EXTRACT DOCUMENT
# ============================================================

def extract_units(reader: PdfReader) -> list[dict]:
    """
    Mỗi unit thường là một câu và giữ thông tin page.

    Quan trọng:
    Chúng ta KHÔNG chunk trong hàm này.
    Vì vậy chunk về sau có thể đi từ page 35 -> page 36.
    """

    units: list[dict] = []

    for page_number, page in enumerate(reader.pages, start=1):
        raw_text = page.extract_text() or ""
        text = normalize_text(raw_text)

        if not text:
            continue

        sentences = split_sentences(text)

        for sentence in sentences:
            units.append(
                {
                    "text": sentence,
                    "page": page_number,
                }
            )

    return units


# ============================================================
# CHUNKING
# ============================================================

def count_words(text: str) -> int:
    return len(text.split())


def split_long_unit(text: str, max_words: int) -> list[str]:
    """
    Fallback nếu một câu/đoạn cực dài vượt chunk size.
    """

    words = text.split()

    if len(words) <= max_words:
        return [text]

    result = []

    for start in range(0, len(words), max_words):
        piece = words[start:start + max_words]

        if piece:
            result.append(" ".join(piece))

    return result


def build_chunks(
    units: list[dict],
    chunk_words: int,
    overlap_words: int,
) -> list[dict]:
    """
    Chunk theo sentence/unit.
    Có thể đi xuyên qua nhiều trang.
    Luôn đảm bảo vòng lặp tiến về phía trước.
    """

    if overlap_words >= chunk_words:
        raise ValueError(
            "overlap_words phải nhỏ hơn chunk_words"
        )

    if not units:
        return []

    # --------------------------------------------------
    # Tách những unit quá dài
    # --------------------------------------------------

    expanded_units: list[dict] = []

    for unit in units:
        pieces = split_long_unit(
            unit["text"],
            chunk_words,
        )

        for piece in pieces:
            expanded_units.append(
                {
                    "text": piece,
                    "page": unit["page"],
                }
            )

    # Cache word count để khỏi tính lại liên tục
    word_counts = [
        count_words(unit["text"])
        for unit in expanded_units
    ]

    records: list[dict] = []

    start = 0
    chunk_number = 1
    total_units = len(expanded_units)

    # --------------------------------------------------
    # Sliding window an toàn
    # --------------------------------------------------

    while start < total_units:

        end = start
        total_words = 0

        # ----------------------------------------------
        # Tìm điểm kết thúc chunk
        # ----------------------------------------------

        while end < total_units:

            unit_words = word_counts[end]

            # Unit đầu tiên luôn phải được nhận
            if end == start:
                total_words += unit_words
                end += 1

                # Unit tự nó đã đủ lớn
                if total_words >= chunk_words:
                    break

                continue

            # Nếu thêm unit mới làm vượt giới hạn
            if total_words + unit_words > chunk_words:
                break

            total_words += unit_words
            end += 1

        selected_units = expanded_units[start:end]

        text = " ".join(
            unit["text"]
            for unit in selected_units
        ).strip()

        pages = [
            unit["page"]
            for unit in selected_units
        ]

        records.append(
            {
                "text": text,
                "page_start": min(pages),
                "page_end": max(pages),
                "chunk_id": chunk_number,
            }
        )

        chunk_number += 1

        # Đã tới cuối document
        if end >= total_units:
            break

        # ----------------------------------------------
        # Xác định overlap cho chunk kế tiếp
        # ----------------------------------------------

        next_start = end
        overlap_count = 0

        # Lấy các unit cuối chunk làm overlap
        # nhưng KHÔNG BAO GIỜ quay lại start cũ
        while next_start > start + 1:

            candidate_index = next_start - 1
            candidate_words = word_counts[candidate_index]

            if (
                overlap_count + candidate_words
                > overlap_words
            ):
                break

            overlap_count += candidate_words
            next_start -= 1

        # Safety guard:
        # start bắt buộc phải tăng
        if next_start <= start:
            next_start = start + 1

        start = next_start

    return records

# ============================================================
# INGEST
# ============================================================

def ingest(
    pdf_path: Path,
    chunk_words: int,
    overlap_words: int,
) -> None:

    if not pdf_path.exists():
        raise FileNotFoundError(
            f"Không tìm thấy PDF: {pdf_path}"
        )

    print(f"Đọc PDF: {pdf_path}")

    reader = PdfReader(str(pdf_path))

    print(f"Số trang PDF: {len(reader.pages)}")

    # --------------------------------------------------------
    # 1. Extract toàn document
    # --------------------------------------------------------

    units = extract_units(reader)

    if not units:
        raise RuntimeError(
            "Không trích xuất được text từ PDF. "
            "Nếu PDF là ảnh scan thì cần OCR trước."
        )

    print(
        f"Đã trích xuất {len(units)} sentence/units."
    )

    # --------------------------------------------------------
    # 2. Chunk xuyên trang
    # --------------------------------------------------------

    chunks = build_chunks(
        units=units,
        chunk_words=chunk_words,
        overlap_words=overlap_words,
    )

    records: list[dict] = []

    for index, chunk in enumerate(chunks, start=1):
        records.append(
            {
                "text": chunk["text"],
                "source": pdf_path.stem,
                "page_start": chunk["page_start"],
                "page_end": chunk["page_end"],
                "chunk_id": f"chunk_{index:04d}",
            }
        )

    print(f"Đã tạo {len(records)} chunks.")

    # Thống kê nhanh
    word_counts = [
        count_words(record["text"])
        for record in records
    ]

    print(
        "Chunk size: "
        f"min={min(word_counts)}, "
        f"avg={sum(word_counts) / len(word_counts):.1f}, "
        f"max={max(word_counts)} words"
    )

    cross_page = sum(
        1
        for record in records
        if record["page_start"] != record["page_end"]
    )

    print(
        f"Chunks đi qua nhiều trang: {cross_page}"
    )

    # --------------------------------------------------------
    # 3. Embedding
    # --------------------------------------------------------

    print("Đang embedding...")

    vectors = embed_texts(
        [record["text"] for record in records]
    )

    vectors = np.asarray(
        vectors,
        dtype="float32",
    )

    # Quan trọng nếu dùng IndexFlatIP để cosine search
    faiss.normalize_L2(vectors)

    # --------------------------------------------------------
    # 4. FAISS
    # --------------------------------------------------------

    dimension = vectors.shape[1]

    index = faiss.IndexFlatIP(dimension)
    index.add(vectors)

    # --------------------------------------------------------
    # 5. Save
    # --------------------------------------------------------

    output_dir = settings.vector_store_dir
    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    faiss_path = output_dir / "index.faiss"
    metadata_path = output_dir / "metadata.json"

    faiss.write_index(
        index,
        str(faiss_path),
    )

    metadata_path.write_text(
        json.dumps(
            records,
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    print()
    print("========== HOÀN TẤT ==========")
    print(f"Vector store: {output_dir}")
    print(f"FAISS vectors: {index.ntotal}")
    print(f"Metadata: {metadata_path}")


# ============================================================
# CLI
# ============================================================

def main() -> None:

    parser = argparse.ArgumentParser(
        description=(
            "Ingest PDF Pháp luật đại cương "
            "vào FAISS"
        )
    )

    parser.add_argument(
        "--pdf",
        required=True,
        help="Đường dẫn tới file PDF",
    )

    parser.add_argument(
        "--chunk-words",
        type=int,
        default=400,
    )

    parser.add_argument(
        "--overlap-words",
        type=int,
        default=80,
    )

    args = parser.parse_args()

    ingest(
        Path(args.pdf),
        args.chunk_words,
        args.overlap_words,
    )


if __name__ == "__main__":
    main()