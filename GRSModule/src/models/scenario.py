from pydantic import BaseModel, Field
from typing import List, Dict, Any
from .mutation import Mutation


class Scenario(BaseModel):
    scenario_id: str
    version: str

    domain: str
    industry: str
    risk_level: str
    risk_reasons: List[str]

    role_context: Dict[str, str]
    prompt: str

    constraints: Dict[str, Any]
    governance_triggers: Dict[str, bool]

    seed_trace: Dict[str, Any]
    mutation_trace: Dict[str, List[Mutation]]

    metadata: Dict[str, Any]