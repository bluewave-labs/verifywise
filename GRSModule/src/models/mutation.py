from pydantic import BaseModel
from typing import Dict, Any


class Mutation(BaseModel):
    mutation_id: str
    family: str
    params: Dict[str, Any]