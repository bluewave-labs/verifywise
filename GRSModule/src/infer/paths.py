from __future__ import annotations

import re
from pathlib import Path


_SAN_RE = re.compile(r"[^a-zA-Z0-9._-]+")


def sanitize_model_id(model_id: str) -> str:
    # openrouter model ids include "/" -> make filesystem-safe
    return _SAN_RE.sub("_", model_id)


def model_output_path(final_dir: Path, model_id: str) -> Path:
    return final_dir / "responses" / f"{sanitize_model_id(model_id)}.jsonl"
