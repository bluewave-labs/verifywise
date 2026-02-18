from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

from llm.base import ChatResult


@dataclass(frozen=True)
class MockChatClient:
    model_id: str = "mock-model"
    provider: str = "mock"

    def chat(self, *, messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> ChatResult:
        # deterministic, cheap “fake” response for pipeline testing
        user_text = ""
        for m in messages:
            if m.get("role") == "user":
                user_text = m.get("content", "")
        text = f"[MOCK RESPONSE]\nReceived {len(user_text)} chars. Provide a governed response here."
        return ChatResult(text=text, raw={"mock": True, "chars": len(user_text)})
