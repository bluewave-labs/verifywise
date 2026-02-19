from __future__ import annotations

from typing import Any, Dict, List, Tuple


def build_pairs(
    *,
    scenarios: List[Dict[str, Any]],
    responses: List[Dict[str, Any]],
) -> List[Tuple[Dict[str, Any], Dict[str, Any]]]:
    scen_by_id = {s["scenario_id"]: s for s in scenarios if "scenario_id" in s}
    pairs: List[Tuple[Dict[str, Any], Dict[str, Any]]] = []
    for r in responses:
        sid = r.get("scenario_id")
        if isinstance(sid, str) and sid in scen_by_id:
            pairs.append((scen_by_id[sid], r))
    return pairs
