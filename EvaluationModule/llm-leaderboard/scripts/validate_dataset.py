#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

from jsonschema import Draft202012Validator


@dataclass(frozen=True)
class ValidationErrorItem:
    file: str
    line: int
    message: str


def read_json(path: Path) -> Dict[str, Any]:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        raise RuntimeError(f"Failed to read JSON file: {path} ({e})") from e


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


def load_schema(schema_path: Path) -> Draft202012Validator:
    schema = read_json(schema_path)
    return Draft202012Validator(schema)


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return f"sha256:{h.hexdigest()}"


def validate_jsonl_against_schema(
    *,
    jsonl_path: Path,
    validator: Draft202012Validator,
) -> List[ValidationErrorItem]:
    errors: List[ValidationErrorItem] = []
    for line_no, obj in iter_jsonl(jsonl_path):
        for err in validator.iter_errors(obj):
            # Make message readable and include schema path hint
            schema_path = "/".join(str(p) for p in err.schema_path)
            instance_path = "/".join(str(p) for p in err.path)
            msg = f"{err.message}"
            if instance_path:
                msg += f" (at: {instance_path})"
            if schema_path:
                msg += f" (schema: {schema_path})"
            errors.append(ValidationErrorItem(file=str(jsonl_path), line=line_no, message=msg))
    return errors


def validate_json_against_schema(
    *,
    json_path: Path,
    validator: Draft202012Validator,
) -> List[ValidationErrorItem]:
    errors: List[ValidationErrorItem] = []
    obj = read_json(json_path)
    for err in validator.iter_errors(obj):
        schema_path = "/".join(str(p) for p in err.schema_path)
        instance_path = "/".join(str(p) for p in err.path)
        msg = f"{err.message}"
        if instance_path:
            msg += f" (at: {instance_path})"
        if schema_path:
            msg += f" (schema: {schema_path})"
        errors.append(ValidationErrorItem(file=str(json_path), line=1, message=msg))
    return errors


def cross_file_checks(
    *,
    scenarios_path: Path,
    candidates_path: Path,
    expected_candidates_per_scenario: int = 3,
) -> List[str]:
    """
    Returns list of human-readable error strings.
    """
    errors: List[str] = []

    # Load scenarios
    scenario_ids: set[str] = set()
    scenario_type_by_id: Dict[str, str] = {}

    for line_no, s in iter_jsonl(scenarios_path):
        sid = s.get("scenario_id")
        if not isinstance(sid, str) or not sid:
            errors.append(f"{scenarios_path}:{line_no}: scenario_id missing/invalid")
            continue
        if sid in scenario_ids:
            errors.append(f"{scenarios_path}:{line_no}: duplicate scenario_id '{sid}'")
        scenario_ids.add(sid)
        stype = s.get("scenario_type")
        if isinstance(stype, str):
            scenario_type_by_id[sid] = stype

    if not scenario_ids:
        errors.append(f"{scenarios_path}: no scenarios found")

    # Load candidates
    counts_by_scenario: Dict[str, int] = {}
    seen_pair: set[Tuple[str, str]] = set()

    for line_no, c in iter_jsonl(candidates_path):
        sid = c.get("scenario_id")
        aid = c.get("answer_id")

        if not isinstance(sid, str) or not sid:
            errors.append(f"{candidates_path}:{line_no}: scenario_id missing/invalid")
            continue
        if sid not in scenario_ids:
            errors.append(f"{candidates_path}:{line_no}: scenario_id '{sid}' not found in scenarios.jsonl")

        if not isinstance(aid, str) or not aid:
            errors.append(f"{candidates_path}:{line_no}: answer_id missing/invalid")
            continue

        pair = (sid, aid)
        if pair in seen_pair:
            errors.append(f"{candidates_path}:{line_no}: duplicate (scenario_id, answer_id)=({sid}, {aid})")
        seen_pair.add(pair)

        counts_by_scenario[sid] = counts_by_scenario.get(sid, 0) + 1

    # Ensure every scenario has exactly N candidates
    for sid in scenario_ids:
        n = counts_by_scenario.get(sid, 0)
        if n != expected_candidates_per_scenario:
            errors.append(
                f"{candidates_path}: scenario_id '{sid}' has {n} candidates; expected {expected_candidates_per_scenario}"
            )

    return errors


def verify_manifest_checksums(
    *,
    dataset_dir: Path,
    manifest: Dict[str, Any],
) -> List[str]:
    """
    If manifest.checksums exists, verify it. If missing, skip (POC-friendly).
    """
    errors: List[str] = []
    checksums = manifest.get("checksums")
    if not isinstance(checksums, dict) or not checksums:
        return errors  # no checksums to verify

    files = manifest.get("files")
    if not isinstance(files, dict):
        errors.append("manifest.json: 'files' missing/invalid; cannot verify checksums")
        return errors

    # Verify only keys present in manifest["checksums"]
    for fname, expected in checksums.items():
        if not isinstance(fname, str) or not isinstance(expected, str):
            errors.append("manifest.json: checksums must map string->string")
            continue
        fpath = dataset_dir / fname
        if not fpath.exists():
            errors.append(f"manifest.json: checksum file not found: {fname}")
            continue
        actual = sha256_file(fpath)
        if actual != expected:
            errors.append(f"checksum mismatch for {fname}: expected {expected}, got {actual}")

    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate dataset schema + integrity checks.")
    parser.add_argument(
        "dataset_dir",
        type=str,
        help="Path to dataset version directory (e.g., datasets/v0.1)",
    )
    parser.add_argument(
        "--expected-candidates-per-scenario",
        type=int,
        default=3,
        help="POC expects 3 candidates per scenario (good/risky/bad).",
    )
    args = parser.parse_args()

    dataset_dir = Path(args.dataset_dir)
    if not dataset_dir.exists() or not dataset_dir.is_dir():
        print(f"ERROR: dataset_dir is not a directory: {dataset_dir}", file=sys.stderr)
        return 2

    scenarios_path = dataset_dir / "scenarios.jsonl"
    candidates_path = dataset_dir / "candidates.jsonl"
    manifest_path = dataset_dir / "manifest.json"
    schema_dir = dataset_dir / "schema"

    required_paths = [scenarios_path, candidates_path, manifest_path, schema_dir]
    for p in required_paths:
        if not p.exists():
            print(f"ERROR: missing required path: {p}", file=sys.stderr)
            return 2

    # Load schemas
    scenario_schema = load_schema(schema_dir / "scenario.schema.json")
    candidate_schema = load_schema(schema_dir / "candidate.schema.json")
    manifest_schema = load_schema(schema_dir / "manifest.schema.json")

    errors: List[str] = []

    # 1) Schema validation
    schema_errors: List[ValidationErrorItem] = []
    schema_errors.extend(validate_jsonl_against_schema(jsonl_path=scenarios_path, validator=scenario_schema))
    schema_errors.extend(validate_jsonl_against_schema(jsonl_path=candidates_path, validator=candidate_schema))
    schema_errors.extend(validate_json_against_schema(json_path=manifest_path, validator=manifest_schema))

    for e in schema_errors:
        errors.append(f"{e.file}:{e.line}: {e.message}")

    # 2) Cross-file integrity checks
    errors.extend(
        cross_file_checks(
            scenarios_path=scenarios_path,
            candidates_path=candidates_path,
            expected_candidates_per_scenario=args.expected_candidates_per_scenario,
        )
    )

    # 3) Checksum verification (optional but recommended)
    manifest = read_json(manifest_path)
    errors.extend(verify_manifest_checksums(dataset_dir=dataset_dir, manifest=manifest))

    if errors:
        print("DATASET VALIDATION FAILED")
        for msg in errors:
            print(f"- {msg}")
        print(f"\nTotal errors: {len(errors)}")
        return 1

    print("DATASET VALIDATION PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
