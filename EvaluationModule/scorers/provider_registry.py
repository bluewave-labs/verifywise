from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from scorers.config_schema import JudgeModelConfig

@dataclass(frozen=True)
class ModelInfo:
    provider: str
    name: str


class SimpleLLMProviderRegistry:
    """
    Minimal v1 registry.

    - Only supports OpenAI gpt-4.1-mini.
    - Exposes ensure_model_available(JudgeModelConfig).
    """

    def __init__(self, allowed_models: Iterable[ModelInfo] | None = None) -> None:
        if allowed_models is None:
            allowed_models = [
                ModelInfo(provider="openai", name="gpt-4.1-mini"),
            ]
        self._models = {(m.provider, m.name): m for m in allowed_models}
    
    def ensure_model_available(self, cfg: JudgeModelConfig) -> None:
        """
        Ensure that the requested judge model is allowed/known.

        For v1, we simply raise a RuntimeError if it's not the single allowed model.
        """
        key = (cfg.provider, cfg.name)
        if key not in self._models:
            supported = ", ".join(f"{p}:{n}" for p, n in self._models.keys())
            raise RuntimeError(
                f"Judge model not supported in v1: {cfg.provider}:{cfg.name}. "
                f"Supported models: {supported}"
            )