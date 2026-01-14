from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class Dataset:
    dataset_dir: Path
    manifest: Dict[str, Any]
    scenarios: List[Dict[str, Any]]
    candidates: List[Dict[str, Any]]


def _read_json(path: Path) -> Dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _read_jsonl(path: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            if not isinstance(obj, dict):
                raise ValueError(f"Expected JSON object at {path}:{i}")
            rows.append(obj)
    return rows


def resolve_dataset_dir(
    dataset_ref: str,
    *,
    datasets_root: Path = Path("datasets"),
) -> Path:
    """
    Accepts either:
      - "v0.1" (folder name)
      - "enterprise_poc_v0.1" (dataset_id)
    """
    # Try direct folder lookup first
    direct = datasets_root / dataset_ref
    if direct.exists() and direct.is_dir():
        return direct

    # Otherwise, scan for a manifest with dataset_id == dataset_ref
    for d in datasets_root.iterdir():
        if not d.is_dir():
            continue
        m = d / "manifest.json"
        if not m.exists():
            continue
        try:
            manifest = _read_json(m)
        except Exception:
            continue
        if manifest.get("dataset_id") == dataset_ref:
            return d

    raise FileNotFoundError(f"Could not resolve dataset_ref='{dataset_ref}' under {datasets_root}")


def load_dataset(
    dataset_ref: str,
    *,
    datasets_root: Path = Path("datasets"),
) -> Dataset:
    dataset_dir = resolve_dataset_dir(dataset_ref, datasets_root=datasets_root)

    manifest = _read_json(dataset_dir / "manifest.json")
    scenarios_file = dataset_dir / manifest["files"]["scenarios"]
    candidates_file = dataset_dir / manifest["files"]["candidates"]

    scenarios = _read_jsonl(scenarios_file)
    candidates = _read_jsonl(candidates_file)

    return Dataset(
        dataset_dir=dataset_dir,
        manifest=manifest,
        scenarios=scenarios,
        candidates=candidates,
    )
