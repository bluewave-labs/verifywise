from __future__ import annotations

from pathlib import Path
from typing import List


def list_response_files(responses_dir: Path) -> List[Path]:
    if not responses_dir.exists():
        return []
    files = sorted([p for p in responses_dir.glob("*.jsonl") if p.is_file()])
    # ignore failures files if they share suffix
    files = [p for p in files if not p.name.endswith(".failures.jsonl")]
    return files
