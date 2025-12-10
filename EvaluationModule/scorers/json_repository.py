from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from config_schema import (
    LLMJudgeScorerConfig,
    JudgeModelConfig,
    MessageTemplate,
    ChoiceConfig,
)


SCHEMA_VERSION = 1


@dataclass
class ScorerRecord:
    """
    Lightweight record returned after saving/loading a scorer.
    """

    name: str
    slug: str
    type: str
    path: Path
    created_at: datetime
    updated_at: datetime
    schema_version: int = SCHEMA_VERSION


class JsonScorerRepository:
    """
    JSON-based scorer repository.

    - Stores one JSON file per scorer, keyed by slug.
    - JSON structure: flattened config fields + timestamps + schema_version.
    """

    def __init__(self, base_dir: Path | str = Path("artifacts/scorers")) -> None:
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def save_scorer(self, config: LLMJudgeScorerConfig) -> ScorerRecord:
        """
        Serialize the given scorer config to JSON and write it to disk.

        File path: <base_dir>/<slug>.json
        """
        now = datetime.now(timezone.utc)

        payload: Dict[str, Any] = self._config_to_payload(config)
        payload["schema_version"] = SCHEMA_VERSION
        payload["created_at"] = now.isoformat()
        payload["updated_at"] = now.isoformat()

        path = self._path_for_slug(config.slug)
        path.parent.mkdir(parents=True, exist_ok=True)

        with path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2, ensure_ascii=False)

        return ScorerRecord(
            name=config.name,
            slug=config.slug,
            type=config.type,
            path=path,
            created_at=now,
            updated_at=now,
            schema_version=SCHEMA_VERSION,
        )

    def load_scorer(self, slug: str) -> LLMJudgeScorerConfig:
        """
        Read a scorer JSON file by slug and reconstruct the config dataclasses.
        """
        path = self._path_for_slug(slug)

        with path.open("r", encoding="utf-8") as f:
            raw = json.load(f)

        # Remove non-config fields
        raw.pop("schema_version", None)
        raw.pop("created_at", None)
        raw.pop("updated_at", None)

        return self._payload_to_config(raw)

    def _path_for_slug(self, slug: str) -> Path:
        return self.base_dir / f"{slug}.json"

    def _config_to_payload(self, config: LLMJudgeScorerConfig) -> Dict[str, Any]:
        """
        Convert config dataclass (nested) into a plain dict
        suitable for JSON serialization.
        """
        # asdict handles nested dataclasses for us
        return asdict(config)

    def _payload_to_config(self, raw: Dict[str, Any]) -> LLMJudgeScorerConfig:
        """
        Convert a raw dict (from JSON) back into LLMJudgeScorerConfig
        and nested dataclasses.
        """
        judge_raw = raw.get("judge_model", {}) or {}
        judge_model = JudgeModelConfig(
            provider=judge_raw.get("provider", "openai"),
            name=judge_raw.get("name", "gpt-4.1-mini"),
            params=judge_raw.get("params", {}) or {},
        )

        messages_raw: List[Dict[str, Any]] = raw.get("messages") or []
        messages = [
            MessageTemplate(role=m["role"], template=m["template"])
            for m in messages_raw
        ]

        choices_raw: List[Dict[str, Any]] = raw.get("choices") or []
        choices = [
            ChoiceConfig(label=c["label"], score=float(c["score"]))
            for c in choices_raw
        ]

        return LLMJudgeScorerConfig(
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