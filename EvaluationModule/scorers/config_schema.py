from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

@dataclass
class JudgeModelConfig:
    """Configuration for the judge LLM model."""

    provider: str = "openai"
    name: str = "gpt-4.1-mini"
    params: Dict[str, Any] = field(default_factory=dict)


@dataclass
class MessageTemplate:
    """One message in the LLM judge prompt (system/user/etc.)."""

    role: str  # e.g. "system", "user"
    template: str


@dataclass
class ChoiceConfig:
    """A label and its numeric score."""

    label: str   # e.g. "PASS"
    score: float # e.g. 1.0


@dataclass
class LLMJudgeScorerConfig:
    """
    Top-level configuration for an LLM-as-a-judge scorer.

    For v1 we assume:
    - type is always "llm_judge"
    - judge_model.name is always "gpt-4.1-mini"
    """

    name: str
    slug: str
    type: str = "llm_judge"

    description: Optional[str] = None

    judge_model: JudgeModelConfig = field(default_factory=JudgeModelConfig)
    use_chain_of_thought: bool = False

    # Optional list of allowed placeholders (for future normalization/validation)
    placeholders: List[str] = field(default_factory=list)

    messages: List[MessageTemplate] = field(default_factory=list)
    choices: List[ChoiceConfig] = field(default_factory=list)

    pass_threshold: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

def load_llm_judge_scorer_config(path: Path) -> LLMJudgeScorerConfig:
    with path.open("r", encoding="utf-8") as f:
        raw = yaml.safe_load(f)

    # Build nested objects manually (keeps things explicit and testable)
    judge_model_raw = raw.get("judge_model", {}) or {}

    judge_model = JudgeModelConfig(
        provider=judge_model_raw.get("provider", "openai"),
        name=judge_model_raw.get("name", "gpt-4.1-mini"),
        params=judge_model_raw.get("params", {}) or {},
    )

    messages = [
        MessageTemplate(role=m["role"], template=m["template"])
        for m in (raw.get("messages") or [])
    ]

    choices = [
        ChoiceConfig(label=c["label"], score=float(c["score"]))
        for c in (raw.get("choices") or [])
    ]

    config = LLMJudgeScorerConfig(
        name=raw["name"],
        slug=raw["slug"],
        type=raw.get("type", "llm_judge"),
        description=raw.get("description"),
        judge_model=judge_model,
        use_chain_of_thought=bool(raw.get("use_chain_of_thought", False)),
        placeholders=list(raw.get("placeholders") or []),
        messages=messages,
        choices=choices,
        pass_threshold=(
            float(raw["pass_threshold"])
            if "pass_threshold" in raw and raw["pass_threshold"] is not None
            else None
        ),
        metadata=dict(raw.get("metadata") or {}),
    )

    return config