from __future__ import annotations

from typing import Optional

from backend.core.config import settings


class LegalLLM:
    """
    Loader cho Qwen2.5-7B-legal-vn.

    Model có thể:
    - preload khi FastAPI startup qua llm.load()
    - hoặc lazy load khi generate() được gọi
    """

    def __init__(self) -> None:
        self._tokenizer = None
        self._model = None

    @property
    def loaded(self) -> bool:
        return (
            settings.mock_llm
            or self._model is not None
        )

    # ============================================================
    # PUBLIC LOAD
    # ============================================================

    def load(self) -> None:
        """
        Public method để FastAPI preload model
        ngay khi backend startup.
        """
        self._load()

    # ============================================================
    # MODEL LOADING
    # ============================================================

    def _load(self) -> None:
        if settings.mock_llm:
            return

        if self._model is not None:
            return

        import torch

        from transformers import (
            AutoModelForCausalLM,
            AutoTokenizer,
        )

        print("\n========== LOADING LLM ==========")
        print("Model:", settings.model_id)
        print("LOAD_IN_4BIT:", settings.load_in_4bit)
        print("CUDA available:", torch.cuda.is_available())

        if torch.cuda.is_available():
            print(
                "GPU:",
                torch.cuda.get_device_name(0),
            )

        # ========================================================
        # TOKENIZER
        # ========================================================

        self._tokenizer = AutoTokenizer.from_pretrained(
            settings.model_id,
            trust_remote_code=True,
            fix_mistral_regex=True,
        )

        # ========================================================
        # MODEL CONFIG
        # ========================================================

        kwargs = {
            "device_map": "auto",
            "trust_remote_code": True,
            "low_cpu_mem_usage": True,
        }

        quantization_config: Optional[object] = None

        # ========================================================
        # 4-BIT
        # ========================================================

        if settings.load_in_4bit:

            if not torch.cuda.is_available():
                raise RuntimeError(
                    "LOAD_IN_4BIT=true nhưng PyTorch "
                    "không phát hiện CUDA GPU."
                )

            try:
                from transformers import (
                    BitsAndBytesConfig,
                )

                quantization_config = (
                    BitsAndBytesConfig(
                        load_in_4bit=True,
                        bnb_4bit_quant_type="nf4",
                        bnb_4bit_compute_dtype=(
                            torch.float16
                        ),
                        bnb_4bit_use_double_quant=True,
                    )
                )

                kwargs[
                    "quantization_config"
                ] = quantization_config

            except Exception as exc:
                raise RuntimeError(
                    "LOAD_IN_4BIT=true nhưng "
                    "bitsandbytes/4-bit không khả dụng. "
                    "Kiểm tra bitsandbytes và CUDA."
                ) from exc

        # ========================================================
        # NON-QUANTIZED
        # ========================================================

        else:
            kwargs["dtype"] = (
                torch.float16
                if torch.cuda.is_available()
                else torch.float32
            )

        # ========================================================
        # LOAD MODEL
        # ========================================================

        self._model = (
            AutoModelForCausalLM.from_pretrained(
                settings.model_id,
                **kwargs,
            )
        )

        self._model.eval()

        # ========================================================
        # DEBUG
        # ========================================================

        print("\n========== MODEL DEBUG ==========")
        print(
            "LOAD_IN_4BIT:",
            settings.load_in_4bit,
        )

        print(
            "CUDA available:",
            torch.cuda.is_available(),
        )

        if torch.cuda.is_available():
            print(
                "GPU:",
                torch.cuda.get_device_name(0),
            )

        print(
            "hf_device_map:",
            getattr(
                self._model,
                "hf_device_map",
                None,
            ),
        )

        if torch.cuda.is_available():
            print(
                "GPU allocated:",
                round(
                    torch.cuda.memory_allocated(0)
                    / 1024**3,
                    2,
                ),
                "GB",
            )

            print(
                "GPU reserved:",
                round(
                    torch.cuda.memory_reserved(0)
                    / 1024**3,
                    2,
                ),
                "GB",
            )

        print("Model đã load xong.")
        print("=================================\n")

    # ============================================================
    # GENERATION
    # ============================================================

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> str:

        if settings.mock_llm:
            return self._mock_answer(
                user_prompt
            )

        # Nếu đã preload thì dòng này return ngay.
        # Nếu chưa preload thì vẫn lazy load được.
        self._load()

        assert self._tokenizer is not None
        assert self._model is not None

        import torch

        messages = [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": user_prompt,
            },
        ]

        text = (
            self._tokenizer.apply_chat_template(
                messages,
                tokenize=False,
                add_generation_prompt=True,
            )
        )

        inputs = self._tokenizer(
            text,
            return_tensors="pt",
        )

        # Lấy device của embedding layer.
        # An toàn hơn next(model.parameters()).device
        # khi dùng device_map/quantization.
        model_device = (
            self._model
            .get_input_embeddings()
            .weight
            .device
        )

        inputs = {
            key: value.to(model_device)
            for key, value in inputs.items()
        }

        do_sample = (
            settings.temperature > 0
        )

        generation_kwargs = {
            "max_new_tokens": (
                settings.max_new_tokens
            ),
            "do_sample": do_sample,
            "repetition_penalty": 1.05,
            "pad_token_id": (
                self._tokenizer.eos_token_id
            ),
        }

        if do_sample:
            generation_kwargs.update(
                {
                    "temperature": (
                        settings.temperature
                    ),
                    "top_p": settings.top_p,
                }
            )

        with torch.inference_mode():
            outputs = self._model.generate(
                **inputs,
                **generation_kwargs,
            )

        input_length = (
            inputs["input_ids"].shape[1]
        )

        new_tokens = outputs[
            0,
            input_length:,
        ]

        answer = self._tokenizer.decode(
            new_tokens,
            skip_special_tokens=True,
        )

        return answer.strip()

    # ============================================================
    # MOCK
    # ============================================================

    @staticmethod
    def _mock_answer(
        user_prompt: str,
    ) -> str:
        return (
            "[MOCK MODE]\n\n"
            "API, Prompt Router và RAG đã hoạt động. "
            "Đây chưa phải câu trả lời từ "
            "Qwen2.5-7B-legal-vn.\n\n"
            "Đặt MOCK_LLM=false trong .env "
            "để dùng model thật.\n\n"
            "--- Prompt đã nhận ---\n"
            + user_prompt[:2500]
        )


llm = LegalLLM()