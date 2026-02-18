from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Literal, Optional


class CandidateResponse(BaseModel):
    response_id: str
    scenario_id: str

    model_id: str 
    provider: str

    prompt: str
    messages: List[Dict[str, str]]

    output_text: str

    raw: Dict[str, Any] = Field(default_factory=dict)

    meta: Dict[str, Any] = Field(default_factory=dict)
