from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Any, Optional


@dataclass
class PromptInput:
    instruction: str                # task instruction, short and model-agnostic
    features: Dict[str, Any]        # your tabular row
    system_prompt: Optional[str] = None
    assistant_preamble: Optional[str] = None  # e.g., "The predicted income is"


class PromptFormatter(ABC):
    """Returns the body your inference client needs (string or messages list)."""

    @abstractmethod
    def format(self, p: PromptInput) -> Any: ...


