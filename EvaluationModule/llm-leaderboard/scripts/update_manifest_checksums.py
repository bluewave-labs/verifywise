#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return f"sha256:{h.hexdigest()}"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dataset-dir", default="datasets/v0.1")
    args = ap.parse_args()

    d = Path(args.dataset_dir)
    manifest_path = d / "manifest.json"
    scenarios = d / "scenarios.jsonl"
    candidates = d / "candidates.jsonl"

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    checksums = manifest.get("checksums")
    if not isinstance(checksums, dict):
        checksums = {}
        manifest["checksums"] = checksums

    if scenarios.exists():
        checksums["scenarios.jsonl"] = sha256_file(scenarios)
    if candidates.exists():
        checksums["candidates.jsonl"] = sha256_file(candidates)

    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("Updated manifest checksums")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
