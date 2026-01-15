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
    ap = argparse.ArgumentParser(description="Verify file checksums declared in manifest.json")
    ap.add_argument("--dataset-dir", default="datasets/v0.1")
    args = ap.parse_args()

    d = Path(args.dataset_dir)
    manifest = json.loads((d / "manifest.json").read_text(encoding="utf-8"))
    checksums = manifest.get("checksums") or {}

    if not checksums:
        print("No checksums found in manifest.json (nothing to verify).")
        return 0

    errors = 0
    for fname, expected in checksums.items():
        fpath = d / fname
        if not fpath.exists():
            print(f"Missing file listed in checksums: {fname}")
            errors += 1
            continue
        actual = sha256_file(fpath)
        if actual != expected:
            print(f"Checksum mismatch for {fname}")
            print(f"   expected: {expected}")
            print(f"   actual:   {actual}")
            errors += 1
        else:
            print(f"{fname}: OK")

    if errors:
        print(f"\nChecksum verification failed: {errors} issue(s)")
        return 1

    print("\nAll checksums verified")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
