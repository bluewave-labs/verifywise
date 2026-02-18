from __future__ import annotations

from collections import Counter
from pathlib import Path
from typing import Any, Dict, Tuple

from io_utils.jsonl import read_jsonl


def compute_model_stats(success_path: Path, failure_path: Path) -> Dict[str, Any]:
    successes = 0
    latencies = []
    tokens_in = []
    tokens_out = []

    if success_path.exists():
        for r in read_jsonl(success_path):
            successes += 1
            raw = r.get("raw", {}) or {}
            meta = r.get("meta", {}) or {}

            # latency: prefer raw.latency_ms then meta.latency_ms
            latency = raw.get("latency_ms", meta.get("latency_ms"))
            if isinstance(latency, int):
                latencies.append(latency)

            usage = raw.get("usage", {}) or {}
            # OpenAI-style usage fields if present
            if isinstance(usage.get("prompt_tokens"), int):
                tokens_in.append(usage["prompt_tokens"])
            if isinstance(usage.get("completion_tokens"), int):
                tokens_out.append(usage["completion_tokens"])

    errors_counter = Counter()
    status_counter = Counter()
    failures = 0

    if failure_path.exists():
        for e in read_jsonl(failure_path):
            failures += 1
            errors_counter[e.get("error_type", "unknown")] += 1

            # Try to infer http status if it exists in string error message (best-effort)
            # We keep it optional; Step 5.6 can formalize error normalization.
            msg = str(e.get("error", ""))
            if "429" in msg:
                status_counter["429"] += 1
            elif "500" in msg:
                status_counter["500"] += 1

    def _avg(xs):
        return int(sum(xs) / len(xs)) if xs else None

    return {
        "successes": successes,
        "failures": failures,
        "latency_ms_avg": _avg(latencies),
        "tokens_prompt_avg": _avg(tokens_in),
        "tokens_completion_avg": _avg(tokens_out),
        "errors": [{"error_type": k, "count": v} for k, v in errors_counter.items()],
        "http_status": [{"http_status": k, "count": v} for k, v in status_counter.items()],
    }
