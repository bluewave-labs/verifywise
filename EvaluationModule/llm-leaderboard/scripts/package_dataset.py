#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Dict, List


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            if not isinstance(obj, dict):
                raise ValueError(f"Expected JSON object in {path}")
            rows.append(obj)
    return rows


def main() -> int:
    ap = argparse.ArgumentParser(description="Package dataset into a single JSON bundle.")
    ap.add_argument("--dataset-dir", default="datasets/v0.1")
    ap.add_argument("--out", default=None, help="Output path (default: <dataset-dir>/dataset_bundle.json)")
    args = ap.parse_args()

    d = Path(args.dataset_dir)
    manifest = json.loads((d / "manifest.json").read_text(encoding="utf-8"))

    scenarios_path = d / manifest["files"]["scenarios"]
    candidates_path = d / manifest["files"]["candidates"]

    bundle = {
        "dataset_id": manifest.get("dataset_id"),
        "dataset_version": manifest.get("dataset_version"),
        "manifest": manifest,
        "scenarios": read_jsonl(scenarios_path),
        "candidates": read_jsonl(candidates_path),
    }

    out_path = Path(args.out) if args.out else (d / "dataset_bundle.json")
    out_path.write_text(json.dumps(bundle, indent=2), encoding="utf-8")

    print("Wrote dataset bundle")
    print(f"- out: {out_path}")
    print(f"- scenarios: {len(bundle['scenarios'])}")
    print(f"- candidates: {len(bundle['candidates'])}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
