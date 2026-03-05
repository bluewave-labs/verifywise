from __future__ import annotations

from pathlib import Path
from typing import List


def list_judge_score_files(judge_scores_dir: Path) -> List[Path]:
    if not judge_scores_dir.exists():
        return []
    files = sorted([p for p in judge_scores_dir.glob("*.jsonl") if p.is_file()])
    files = [p for p in files if not p.name.endswith(".failures.jsonl")]
    return files
