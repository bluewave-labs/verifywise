from __future__ import annotations

from pathlib import Path
from typing import Set, Tuple

from io_utils.jsonl import read_jsonl


def load_completed_judgements(path: Path) -> Set[Tuple[str, str, str]]:
    """
    Returns {(scenario_id, candidate_model_id, judge_model_id)} from an existing judge_scores JSONL.
    """
    done: Set[Tuple[str, str, str]] = set()
    if not path.exists():
        return done

    for obj in read_jsonl(path):
        sid = obj.get("scenario_id")
        cand = obj.get("candidate_model_id")
        judge = obj.get("judge_model_id")
        if isinstance(sid, str) and isinstance(cand, str) and isinstance(judge, str):
            done.add((sid, cand, judge))
    return done
