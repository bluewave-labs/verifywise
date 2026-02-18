from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from models.obligation import Obligation


@dataclass(frozen=True)
class ObligationIndex:
    by_id: Dict[str, Obligation]

    @classmethod
    def from_list(cls, obligations: List[Obligation]) -> "ObligationIndex":
        return cls(by_id={o.obligation_id: o for o in obligations})

    def get(self, obligation_id: str) -> Obligation | None:
        return self.by_id.get(obligation_id)
