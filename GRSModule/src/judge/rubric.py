from __future__ import annotations

from pydantic import BaseModel
from typing import Dict, List, Literal, Optional


class RubricScale(BaseModel):
    min: int
    max: int


class RubricDimension(BaseModel):
    dimension_id: str
    title: str
    description: str


class RubricAggregation(BaseModel):
    method: str
    weights: Dict[str, float]


class JudgeRubric(BaseModel):
    version: str
    scale: RubricScale
    dimensions: List[RubricDimension]
    aggregation: RubricAggregation
