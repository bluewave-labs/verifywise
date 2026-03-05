from __future__ import annotations

from typing import Any, Dict, List


def build_judge_report(
    *,
    judge_model_id: str,
    rubric_version: str,
    per_candidate: List[Dict[str, Any]],
) -> Dict[str, Any]:
    total_scored = sum(int(x.get("scored", 0)) for x in per_candidate)
    total_failed = sum(int(x.get("failed", 0)) for x in per_candidate)

    return {
        "stage": "judge",
        "judge_model_id": judge_model_id,
        "rubric_version": rubric_version,
        "totals": {
            "scored": total_scored,
            "failed": total_failed,
        },
        "per_candidate": per_candidate,
    }
