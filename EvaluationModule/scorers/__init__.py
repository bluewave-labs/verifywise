"""LLM-as-a-Judge Scorer Service."""

from .config_schema import (
    LLMJudgeScorerConfig,
    JudgeModelConfig,
    MessageTemplate,
    ChoiceConfig,
    load_llm_judge_scorer_config,
)
from .scorer_service import ScorerService, ScorerSummary
from .judge_runner import LLMJudgeRunner, JudgeResult
from .json_repository import JsonScorerRepository, ScorerRecord
from .provider_registry import SimpleLLMProviderRegistry, ModelInfo
from .prompt_template import PromptTemplateNormalizer

__all__ = [
    # Config
    "LLMJudgeScorerConfig",
    "JudgeModelConfig",
    "MessageTemplate",
    "ChoiceConfig",
    "load_llm_judge_scorer_config",
    # Service
    "ScorerService",
    "ScorerSummary",
    # Runner
    "LLMJudgeRunner",
    "JudgeResult",
    # Repository
    "JsonScorerRepository",
    "ScorerRecord",
    # Registry
    "SimpleLLMProviderRegistry",
    "ModelInfo",
    # Template
    "PromptTemplateNormalizer",
]

