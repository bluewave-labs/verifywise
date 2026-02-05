from __future__ import annotations

import os
import time
from dataclasses import dataclass
from typing import Any, Dict, List

import httpx

from llm.base import ChatResult


@dataclass
class OpenRouterChatClient:
    model_id: str
    timeout_s: float = 60.0

    def __post_init__(self) -> None:
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        if not self.api_key:
            raise RuntimeError("OPENROUTER_API_KEY is not set")

        self.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")

        self._client = httpx.Client(
            base_url=self.base_url,
            timeout=self.timeout_s,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                # Optional but recommended for OpenRouter analytics
                "HTTP-Referer": "https://grs-scenarios.local",
                "X-Title": "GRS Scenario Generator",
            },
        )

    def chat(
        self,
        *,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
    ) -> ChatResult:
        payload = {
            "model": self.model_id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        t0 = time.time()
        resp = self._client.post("/chat/completions", json=payload)
        latency_ms = int((time.time() - t0) * 1000)

        resp.raise_for_status()
        data = resp.json()

        choice = data["choices"][0]
        text = choice["message"]["content"]

        return ChatResult(
            text=text,
            raw={
                "latency_ms": latency_ms,
                "usage": data.get("usage", {}),
                "model": data.get("model"),
                "id": data.get("id"),
                "finish_reason": choice.get("finish_reason"),
            },
        )
