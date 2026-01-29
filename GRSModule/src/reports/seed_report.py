from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List

from models.obligation import Obligation


def build_seed_report(*, obligations_version: str, obligations: List[Obligation]) -> Dict[str, Any]:
    source_types = Counter(o.source.source_type for o in obligations)
    must_counts = [len(o.must) for o in obligations]
    must_not_counts = [len(o.must_not) for o in obligations]

    return {
        "stage": "seeds",
        "obligations_version": obligations_version,
        "obligations_count": len(obligations),
        "by_source_type": dict(source_types),
        "rules_stats": {
            "must_min": min(must_counts) if must_counts else 0,
            "must_max": max(must_counts) if must_counts else 0,
            "must_not_min": min(must_not_counts) if must_not_counts else 0,
            "must_not_max": max(must_not_counts) if must_not_counts else 0,
        },
    }