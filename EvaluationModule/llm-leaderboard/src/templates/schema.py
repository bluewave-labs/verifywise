from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator


ScenarioType = Literal["compliance_policy", "ambiguous_prompt", "multi_step_reasoning"]
RiskLevel = Literal["low", "medium", "high"]


class ExpectedBehavior(BaseModel):
    must: List[str] = Field(default_factory=list)
    must_not: List[str] = Field(default_factory=list)

    @field_validator("must", "must_not")
    @classmethod
    def non_empty_strings(cls, v: List[str]) -> List[str]:
        for s in v:
            if not isinstance(s, str) or not s.strip():
                raise ValueError("expected non-empty strings")
        return v


class ScenarioTemplate(BaseModel):
    template_id: str
    risk_level: RiskLevel
    prompt_template: str
    placeholders: List[str] = Field(default_factory=list)
    expected_behavior: ExpectedBehavior
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @field_validator("template_id")
    @classmethod
    def validate_template_id(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("template_id must be non-empty")
        # keep it strict-ish for nice IDs
        allowed = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-")
        if any(ch not in allowed for ch in v):
            raise ValueError("template_id contains invalid characters")
        return v

    @field_validator("prompt_template")
    @classmethod
    def validate_prompt_template(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("prompt_template must be non-empty")
        return v

    @field_validator("placeholders")
    @classmethod
    def unique_placeholders(cls, v: List[str]) -> List[str]:
        cleaned = [p.strip() for p in v if p and p.strip()]
        if len(set(cleaned)) != len(cleaned):
            raise ValueError("placeholders must be unique")
        return cleaned

    @model_validator(mode="after")
    def prompt_contains_placeholders(self) -> "ScenarioTemplate":
        # light sanity check: at least one placeholder referenced (optional, but helps catch mistakes)
        # If placeholders list is empty, we skip.
        if self.placeholders:
            missing = []
            for p in self.placeholders:
                token = "{" + p + "}"
                if token not in self.prompt_template:
                    missing.append(p)
            if missing:
                raise ValueError(f"prompt_template missing placeholder tokens for: {missing}")
        return self


class TemplateFile(BaseModel):
    version: str
    scenario_type: ScenarioType
    templates: List[ScenarioTemplate]

    @model_validator(mode="after")
    def unique_template_ids(self) -> "TemplateFile":
        ids = [t.template_id for t in self.templates]
        if len(set(ids)) != len(ids):
            raise ValueError("template_id values must be unique within a file")
        return self
