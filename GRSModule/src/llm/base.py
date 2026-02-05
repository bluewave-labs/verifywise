from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Protocol


@dataclass(frozen=True)
class ChatResult:
    text: str
    raw: Dict[str, Any]


class ChatClient(Protocol):
    def chat(self, *, messages: List[Dict[str, str]], temperature: float, max_tokens: int) -> ChatResult:
        ...
