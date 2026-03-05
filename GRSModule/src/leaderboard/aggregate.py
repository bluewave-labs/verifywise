from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

from io_utils.jsonl import read_jsonl


RISK_WEIGHTS = {"low": 1.0, "medium": 2.0, "high": 3.0}


def _mean(values: List[float]) -> float | None:
    return round(sum(values) / len(values), 4) if values else None


def _weighted_mean(values: List[Tuple[float, float]]) -> float | None:
    # list of (value, weight)
    if not values:
        return None
    num = sum(v * w for v, w in values)
    den = sum(w for _, w in values)
    return round(num / den, 4) if den > 0 else None


def load_risk_by_scenario(scenarios_path: Path) -> Dict[str, str]:
    risk_by: Dict[str, str] = {}
    for s in read_jsonl(scenarios_path):
        sid = s.get("scenario_id")
        risk = (s.get("risk_level") or "low").lower()
        if isinstance(sid, str):
            risk_by[sid] = risk if risk in RISK_WEIGHTS else "low"
    return risk_by


def aggregate_from_judge_scores(
    *,
    scenarios_path: Path,
    judge_scores_paths: List[Path],
) -> Dict[str, Any]:
    risk_by = load_risk_by_scenario(scenarios_path)

    # per candidate model accumulators
    grs_vals: dict[str, list[float]] = defaultdict(list)
    grs_wvals: dict[str, list[tuple[float, float]]] = defaultdict(list)

    dim_vals: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    dim_wvals: dict[str, dict[str, list[tuple[float, float]]]] = defaultdict(lambda: defaultdict(list))

    counts: dict[str, int] = defaultdict(int)

    all_dimensions: set[str] = set()

    for p in judge_scores_paths:
        for row in read_jsonl(p):
            cand = row.get("candidate_model_id")
            sid = row.get("scenario_id")
            grs = row.get("grs_score")

            if not isinstance(cand, str) or not isinstance(sid, str) or not isinstance(grs, (int, float)):
                continue

            risk = risk_by.get(sid, "low")
            w = float(RISK_WEIGHTS.get(risk, 1.0))

            counts[cand] += 1
            grs_vals[cand].append(float(grs))
            grs_wvals[cand].append((float(grs), w))

            for d in row.get("dimension_scores", []) or []:
                dim_id = d.get("dimension_id")
                score = d.get("score")
                if isinstance(dim_id, str) and isinstance(score, (int, float)):
                    all_dimensions.add(dim_id)
                    dim_vals[cand][dim_id].append(float(score))
                    dim_wvals[cand][dim_id].append((float(score), w))

    # finalize rows
    rows: List[Dict[str, Any]] = []
    for cand in sorted(counts.keys()):
        r: Dict[str, Any] = {
            "candidate_model_id": cand,
            "num_scored": counts[cand],
            "mean_grs": _mean(grs_vals[cand]),
            "risk_weighted_grs": _weighted_mean(grs_wvals[cand]),
        }

        for dim in sorted(all_dimensions):
            r[f"mean_{dim}"] = _mean(dim_vals[cand].get(dim, []))
            r[f"risk_weighted_{dim}"] = _weighted_mean(dim_wvals[cand].get(dim, []))

        rows.append(r)

    return {
        "risk_weights": RISK_WEIGHTS,
        "dimensions": sorted(all_dimensions),
        "rows": rows,
    }
