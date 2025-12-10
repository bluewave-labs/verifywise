from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from config_schema import (
    LLMJudgeScorerConfig,
    load_llm_judge_scorer_config,
)
from prompt_template import PromptTemplateNormalizer
from json_repository import (
    JsonScorerRepository,
    ScorerRecord,
)
from provider_registry import SimpleLLMProviderRegistry

@dataclass
class ScorerSummary:
    name: str
    slug: str
    type: str
    judge_model_name: str
    path: Path


class ScorerService:
    """
    v1 ScorerService.

    Responsibilities:
    - Load YAML config -> LLMJudgeScorerConfig.
    - Ensure the judge model is available (SimpleLLMProviderRegistry).
    - Normalize message templates (PromptTemplateNormalizer).
    - Persist scorer definition to JSON (JsonScorerRepository).
    - Return a simple ScorerSummary.
    """

    def __init__(
            self,
            repo: Optional[JsonScorerRepository] = None,
            provider_registry: Optional[SimpleLLMProviderRegistry] = None
            ) -> None:
        self.repo = repo or JsonScorerRepository()
        self.provider_registry = provider_registry or SimpleLLMProviderRegistry()

    def create_scorer_from_yaml(self, yaml_path: Path) -> ScorerSummary:
        """
        High-level flow:

        1) Load config from YAML.
        2) Ensure judge model is available.
        3) Normalize templates.
        4) Save to JSON repository.
        5) Return ScorerSummary.
        """
        config = load_llm_judge_scorer_config(yaml_path)
        self.provider_registry.ensure_model_available(config.judge_model)
        self._normalize_templates_inplace(config)

        record = self.repo.save_scorer(config)

        return self._to_summary(config, record)

    def load_scorer(self, slug: str) -> ScorerSummary:
        """
        Convenience method: load an existing scorer from JSON and return summary.
        """
        config = self.repo.load_scorer(slug)
        record = ScorerRecord(
            name=config.name,
            slug=config.slug,
            type=config.type,
            path=self.repo._path_for_slug(config.slug),  # internal helper use
            created_at=None,  # Unknown in this simple v1 path
            updated_at=None,
            schema_version=1,
        )

        return self._to_summary(config, record)
    
    def _normalize_templates_inplace(self, config: LLMJudgeScorerConfig) -> None:
        """
        Apply PromptTemplateNormalizer to the config's messages in-place.
        """
        normalizer = PromptTemplateNormalizer(config.placeholders)
        config.messages = normalizer.normalize_templates(config.messages)

    @staticmethod
    def _to_summary(
        config: LLMJudgeScorerConfig,
        record: ScorerRecord,
    ) -> ScorerSummary:
        return ScorerSummary(
            name=config.name,
            slug=config.slug,
            type=config.type,
            judge_model_name=config.judge_model,
            path=record.path,
        )
