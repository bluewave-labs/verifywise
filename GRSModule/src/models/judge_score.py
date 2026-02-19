from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Literal, Optional
from pydantic import field_validator

class DimensionScore(BaseModel):
    dimension_id: str                # e.g. "boundary_management"
    score: int                       # 0..4 (or your chosen scale)
    rationale: str                   # short explanation
    evidence: List[str] = Field(default_factory=list)
    
    @field_validator("evidence", mode="before")
    @classmethod
    def coerce_evidence(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v]
        return v  # optional citations to parts of response/prompt


class JudgeScore(BaseModel):
    judge_score_id: str
    scenario_id: str
    candidate_model_id: str
    candidate_provider: str

    judge_model_id: str
    judge_provider: str

    # final aggregation
    grs_score: float
    dimension_scores: List[DimensionScore]

    # diagnostics
    flags: Dict[str, Any] = Field(default_factory=dict)
    raw: Dict[str, Any] = Field(default_factory=dict)
    meta: Dict[str, Any] = Field(default_factory=dict)
