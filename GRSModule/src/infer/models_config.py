from __future__ import annotations

from pydantic import BaseModel
from typing import List, Literal


class ModelSpec(BaseModel):
    provider: str
    model_id: str


class ModelsConfig(BaseModel):
    version: str
    models: List[ModelSpec]
