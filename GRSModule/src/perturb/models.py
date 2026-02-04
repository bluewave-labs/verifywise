from __future__ import annotations

from pydantic import BaseModel
from typing import Any, Dict, List


class MutationSpec(BaseModel):
    mutation_id: str
    family: str
    template: str
    params: Dict[str, Any]  # values can be lists or scalars


class MutationCatalog(BaseModel):
    version: str
    mutations: List[MutationSpec]
