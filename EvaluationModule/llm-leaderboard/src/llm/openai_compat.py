from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx


@dataclass(frozen=True)
class LLMResponse:
    text: str
    raw: Dict[str, Any]


class OpenAICompatibleClient:
    """
    Works with:
    - OpenAI Chat Completions compatible APIs
    - Many OpenAI-compatible providers (via base_url)
    """

    def __init__(
        self,
        *,
        base_url: str,
        api_key: str,
        model: str,
        timeout_s: float = 60.0,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._model = model
        self._timeout = timeout_s

    def chat(
        self,
        messages: List[Dict[str, str]],
        *,
        temperature: float,
        max_tokens: int = 400,
    ) -> LLMResponse:
        url = f"{self._base_url}/chat/completions"
        payload: Dict[str, Any] = {
            "model": self._model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }

        headers = {
            "Authorization": f"Bearer {self._api_key}",
            "Content-Type": "application/json",
        }

        with httpx.Client(timeout=self._timeout) as client:
            r = client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json()

        # OpenAI-style: choices[0].message.content
        try:
            text = data["choices"][0]["message"]["content"]
        except Exception as e:
            raise RuntimeError(f"Unexpected response schema: {data}") from e

        if not isinstance(text, str):
            raise RuntimeError(f"Expected string content, got: {type(text).__name__}")

        return LLMResponse(text=text.strip(), raw=data)
