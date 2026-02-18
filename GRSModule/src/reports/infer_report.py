from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Any, Dict, List


def build_infer_report(
    *,
    models: List[dict],
    per_model_stats: List[dict],
    total_scenarios: int,
) -> Dict[str, Any]:
    failures_by_type = Counter()
    failures_by_status = Counter()

    for m in per_model_stats:
        for e in m.get("errors", []):
            failures_by_type[e.get("error_type", "unknown")] += e.get("count", 0)
            failures_by_status[str(e.get("http_status", "unknown"))] += e.get("count", 0)

    return {
        "stage": "infer",
        "total_scenarios": total_scenarios,
        "models": models,
        "per_model": per_model_stats,
        "failure_summary": {
            "by_error_type": dict(failures_by_type),
            "by_http_status": dict(failures_by_status),
        },
    }
