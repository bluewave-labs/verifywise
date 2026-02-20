from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from io_utils.checksums import sha256_file
from io_utils.manifest import write_manifest


def write_infer_manifest(
    *,
    out_path: Path,
    dataset_version: str,
    scenarios_path: Path,
    models_config_path: Path | None,
    temperature: float,
    max_tokens: int,
    retry_max_attempts: int,
    resume: bool,
    outputs: List[Dict[str, str]],
) -> None:
    manifest = {
        "stage": "infer",
        "dataset_version": dataset_version,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "inputs": {
            "scenarios_jsonl": str(scenarios_path),
            "scenarios_jsonl_sha256": sha256_file(scenarios_path),
            "models_config": str(models_config_path) if models_config_path else None,
            "models_config_sha256": sha256_file(models_config_path) if models_config_path else None,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "retry_max_attempts": retry_max_attempts,
            "resume": resume,
        },
        "outputs": outputs,
    }
    write_manifest(out_path, manifest)
