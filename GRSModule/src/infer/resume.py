from __future__ import annotations

from pathlib import Path
from typing import Set, Tuple

from io_utils.jsonl import read_jsonl


def load_completed_pairs(path: Path) -> Set[Tuple[str, str]]:
    """
    Returns {(scenario_id, model_id)} from an existing responses JSONL.
    """
    done: Set[Tuple[str, str]] = set()
    if not path.exists():
        return done

    for obj in read_jsonl(path):
        sid = obj.get("scenario_id")
        mid = obj.get("model_id")
        if isinstance(sid, str) and isinstance(mid, str):
            done.add((sid, mid))
    return done
