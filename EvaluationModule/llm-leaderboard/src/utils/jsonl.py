from __future__ import annotations
import json
from pathlib import Path
from typing import Dict, Iterable, Tuple, Any

def iter_jsonl(path: Path) -> Iterable[Tuple[int, Dict[str, Any]]]:
    """
    Yields (line_number, obj) for each non-empty line.
    Line numbers are 1-based.
    """
    with path.open("r", encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except Exception as e:
                raise RuntimeError(f"Invalid JSON on {path}:{i} ({e})") from e
            if not isinstance(obj, dict):
                raise RuntimeError(f"Expected JSON object on {path}:{i}, got {type(obj).__name__}")
            yield i, obj
