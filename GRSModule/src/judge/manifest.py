from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from io_utils.checksums import sha256_file
from io_utils.manifest import write_manifest


def write_judge_manifest(
    *,
    out_path: Path,
    dataset_version: str,
    scenarios_path: Path,
    responses_dir: Path,
    judge_out_dir: Path,
    judge_model_id: str,
    judge_rubric_path: Path,
    judge_temperature: float,
    judge_max_tokens: int,
    judge_retry_max_attempts: int,
    judge_resume: bool,
    outputs: List[Dict[str, Any]],
) -> None:
    manifest = {
        "stage": "judge",
        "dataset_version": dataset_version,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "inputs": {
            "scenarios_jsonl": str(scenarios_path),
            "scenarios_jsonl_sha256": sha256_file(scenarios_path),
            "responses_dir": str(responses_dir),
            "judge_out_dir": str(judge_out_dir),
            "judge_rubric": str(judge_rubric_path),
            "judge_rubric_sha256": sha256_file(judge_rubric_path),
            "judge_model_id": judge_model_id,
            "judge_temperature": judge_temperature,
            "judge_max_tokens": judge_max_tokens,
            "judge_retry_max_attempts": judge_retry_max_attempts,
            "judge_resume": judge_resume,
        },
        "outputs": outputs,
    }
    write_manifest(out_path, manifest)
