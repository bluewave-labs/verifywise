from pydantic import BaseModel, Field
from typing import List


class Obligation(BaseModel):
    obligation_id: str
    must: List[str] = Field(default_factory=list)
    must_not: List[str] = Field(default_factory=list)

    source_type: str
    source_ref: str
    excerpt_id: str