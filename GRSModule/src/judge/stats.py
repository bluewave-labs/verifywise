from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
from typing import Any, Dict, List

from io_utils.jsonl import read_jsonl


def compute_judge_stats(success_path: Path, failure_path: Path) -> Dict[str, Any]:
    scored = 0
    latencies = []
    grs_scores = []

    # per-dimension sums/counts
    dim_sum: dict[str, float] = defaultdict(float)
    dim_count: dict[str, int] = defaultdict(int)

    if success_path.exists():
        for obj in read_jsonl(success_path):
            scored += 1
            meta = obj.get("meta", {}) or {}
            latency = meta.get("latency_ms")
            if isinstance(latency, int):
                latencies.append(latency)

            gs = obj.get("grs_score")
            if isinstance(gs, (int, float)):
                grs_scores.append(float(gs))

            for d in obj.get("dimension_scores", []) or []:
                dim_id = d.get("dimension_id")
                score = d.get("score")
                if isinstance(dim_id, str) and isinstance(score, (int, float)):
                    dim_sum[dim_id] += float(score)
                    dim_count[dim_id] += 1

    errors_by_type = Counter()
    failures = 0

    if failure_path.exists():
        for e in read_jsonl(failure_path):
            failures += 1
            errors_by_type[e.get("error_type", "unknown")] += 1

    def _avg(xs):
        return round(sum(xs) / len(xs), 4) if xs else None

    dim_avg = {
        k: round(dim_sum[k] / dim_count[k], 4) for k in dim_sum.keys() if dim_count[k] > 0
    }

    return {
        "scored": scored,
        "failed": failures,
        "latency_ms_avg": int(sum(latencies) / len(latencies)) if latencies else None,
        "mean_grs_score": _avg(grs_scores),
        "mean_dimension_scores": dim_avg,
        "errors_by_type": dict(errors_by_type),
    }
