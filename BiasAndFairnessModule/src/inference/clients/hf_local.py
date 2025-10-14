from typing import List

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, GenerationConfig

from .base import LLMClient, Prompt


class HFLocalClient(LLMClient):
    """LLM client for local Hugging Face causal language models.

    Loads tokenizer and model locally and exposes a uniform generate() API.
    """

    def __init__(self, model_id: str, device: str = "cuda") -> None:
        # Resolve device preference against availability
        if device == "cuda" and not torch.cuda.is_available():
            device = "cpu"

        self.model_id = model_id
        self.device = device

        # Tokenizer
        tokenizer = AutoTokenizer.from_pretrained(self.model_id)
        if getattr(tokenizer, "pad_token_id", None) is None:
            if getattr(tokenizer, "eos_token", None) is not None:
                tokenizer.pad_token = tokenizer.eos_token
            else:
                raise ValueError("Tokenizer must have either pad_token or eos_token")
        self.tokenizer = tokenizer

        # Model
        dtype = torch.float16 if self.device == "cuda" else torch.float32
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id,
            torch_dtype=dtype,
            trust_remote_code=True,
        ).to(self.device)

    def generate(
        self,
        prompt: str,
        *,
        max_new_tokens: int,
        temperature: float,
        top_p: float,
    ) -> str:
        assert isinstance(prompt, str), "HFLocalClient expects a string prompt"

        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            padding=False,
            truncation=True,
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        gen_cfg = GenerationConfig(
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
            pad_token_id=self.tokenizer.pad_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
        )

        with torch.no_grad():
            output_ids = self.model.generate(**inputs, generation_config=gen_cfg)

        text = self.tokenizer.decode(output_ids[0], skip_special_tokens=True)
        # Extract only the assistant's portion if present (TinyLlama chat formatting)
        if "<|assistant|>" in text:
            return text.split("<|assistant|>")[-1].strip()
        return text.strip()

    def generate_batch(
        self,
        prompts: List[Prompt],
        *,
        max_new_tokens: int,
        temperature: float,
        top_p: float,
    ) -> List[str]:
        # HF local client supports only raw string prompts
        if not all(isinstance(p, str) for p in prompts):
            raise AssertionError("HFLocalClient expects string prompts in generate_batch")

        inputs = self.tokenizer(
            prompts,  # type: ignore[arg-type]
            return_tensors="pt",
            padding=True,
            padding_side="left",
            truncation=True,
        )
        inputs = {k: v.to(self.device) for k, v in inputs.items()}

        gen_cfg = GenerationConfig(
            max_new_tokens=max_new_tokens,
            temperature=temperature,
            top_p=top_p,
            do_sample=True,
            pad_token_id=self.tokenizer.pad_token_id,
            eos_token_id=self.tokenizer.eos_token_id,
        )

        with torch.no_grad():
            output_ids = self.model.generate(**inputs, generation_config=gen_cfg)

        texts = self.tokenizer.batch_decode(output_ids, skip_special_tokens=True)
        cleaned: List[str] = []
        for text in texts:
            if "<|assistant|>" in text:
                cleaned.append(text.split("<|assistant|>")[-1].strip())
            else:
                cleaned.append(text.strip())
        return cleaned

