from __future__ import annotations

from pydantic import BaseModel, Field, field_validator
from typing import List, Literal


class SourceRef(BaseModel):
    source_type: Literal["internal_policy", "eu_ai_act", "iso_42001", "other"]
    source_ref: str
    excerpt_id: str


class Obligation(BaseModel):
    obligation_id: str
    source: SourceRef

    must: List[str] = Field(default_factory=list)
    must_not: List[str] = Field(default_factory=list)

    @field_validator("must", "must_not")
    @classmethod
    def _nonempty_strings(cls, v: List[str]) -> List[str]:
        cleaned = [s.strip() for s in v if s and s.strip()]
        return cleaned

    @field_validator("obligation_id")
    @classmethod
    def _id_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("obligation_id must not be blank")
        return v

    @field_validator("must_not")
    @classmethod
    def _at_least_one_rule(cls, v: List[str], info) -> List[str]:
        # Ensure at least one of must / must_not exists
        must = info.data.get("must", [])
        if not must and not v:
            raise ValueError("Each obligation must include at least one rule in must or must_not")
        return v