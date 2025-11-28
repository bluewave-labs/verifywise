#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import yaml  # type: ignore
except Exception:
    yaml = None


@dataclass
class GateResult:
    passed: bool
    fail_reasons: List[str]
    checked_metrics: int
    details: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "passed": self.passed,
            "fail_reasons": self.fail_reasons,
            "checked_metrics": self.checked_metrics,
            "details": self.details,
        }


def _load_summary(summary_path: str) -> Dict[str, Any]:
    with open(summary_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _load_suite_yaml(suite_path: str) -> Dict[str, Any]:
    if yaml is None:
        raise RuntimeError("PyYAML is not installed. Please install pyyaml to use the gatekeeper.")
    with open(suite_path, "r", encoding="utf-8") as f:
        content: Dict[str, Any] = yaml.safe_load(f) or {}
    return content


def _compare_value(
    metric_name: str,
    stat_name: str,
    value: float,
    threshold: float,
    comparison: str,
) -> Tuple[bool, Optional[str]]:
    """
    comparison: 'gte' (default) or 'lte'
    """
    if comparison not in ("gte", "lte"):
        comparison = "gte"
    if comparison == "gte":
        ok = value >= threshold
        if not ok:
            return False, f"{metric_name}.{stat_name}: {value:.3f} < threshold {threshold:.3f}"
        return True, None
    else:
        ok = value <= threshold
        if not ok:
            return False, f"{metric_name}.{stat_name}: {value:.3f} > threshold {threshold:.3f}"
        return True, None


def evaluate_gate(
    summary_path: str,
    suite_path: str,
) -> GateResult:
    """
    Evaluate the gate based on the DeepEval summary JSON and suite thresholds YAML.
    - Skips any threshold entries that are null/missing.
    - Defaults comparison to 'gte' unless overridden per metric in YAML.
    """
    summary = _load_summary(summary_path)
    suite = _load_suite_yaml(suite_path)

    metric_summaries: Dict[str, Any] = summary.get("metric_summaries", {}) or {}
    metrics_cfg: Dict[str, Any] = suite.get("metrics", {}) or {}

    fail_reasons: List[str] = []
    checked_metrics = 0
    details: Dict[str, Any] = {}

    for metric_name, cfg in metrics_cfg.items():
        comparison: str = (cfg or {}).get("comparison", "gte")
        thresholds: Dict[str, Optional[float]] = (cfg or {}).get("thresholds", {}) or {}

        # Only evaluate average_score as requested
        avg_threshold = thresholds.get("average_score")
        if avg_threshold is None:
            continue

        if metric_name not in metric_summaries:
            fail_reasons.append(f"{metric_name}.average_score: missing from summary")
            checked_metrics += 1
            details[metric_name] = {
                "comparison": comparison,
                "checks": [
                    {"stat": "average_score", "status": "missing", "threshold": avg_threshold}
                ],
                "passed": False,
            }
            continue

        metric_stats: Dict[str, Any] = metric_summaries[metric_name]
        per_metric = {"comparison": comparison, "checks": []}
        metric_failed = False
        # Evaluate only average_score
        if "average_score" not in metric_stats:
            fail_reasons.append(f"{metric_name}.average_score: missing from summary")
            metric_failed = True
            per_metric["checks"].append(
                {"stat": "average_score", "status": "missing", "threshold": avg_threshold}
            )
        else:
            try:
                value = float(metric_stats["average_score"])
            except Exception:
                fail_reasons.append(f"{metric_name}.average_score: non-numeric value in summary")
                metric_failed = True
                per_metric["checks"].append(
                    {"stat": "average_score", "status": "invalid", "threshold": avg_threshold}
                )
            else:
                ok, reason = _compare_value(
                    metric_name, "average_score", value, float(avg_threshold), comparison
                )
                per_metric["checks"].append(
                    {
                        "stat": "average_score",
                        "value": value,
                        "threshold": float(avg_threshold),
                        "comparison": comparison,
                        "passed": ok,
                    }
                )
                if not ok and reason:
                    fail_reasons.append(reason)
                    metric_failed = True

        checked_metrics += 1
        per_metric["passed"] = not metric_failed
        details[metric_name] = per_metric

    passed = len(fail_reasons) == 0
    return GateResult(
        passed=passed,
        fail_reasons=fail_reasons,
        checked_metrics=checked_metrics,
        details=details,
    )


def _parse_args() -> argparse.Namespace:
    default_summary = str(Path("artifacts/deepeval_results/deepeval_summary_20251112_130250.json").resolve())
    default_suite = str(Path("suits/suite_core.yaml").resolve())
    parser = argparse.ArgumentParser(description="Gatekeeper - evaluate DeepEval summary against suite thresholds")
    parser.add_argument("--summary", type=str, default=default_summary, help="Path to deepeval summary JSON")
    parser.add_argument("--suite", type=str, default=default_suite, help="Path to suite YAML with thresholds")
    parser.add_argument("--json", action="store_true", help="Output result as JSON")
    return parser.parse_args()


def main() -> int:
    args = _parse_args()
    try:
        result = evaluate_gate(summary_path=args.summary, suite_path=args.suite)
    except Exception as e:
        print(f"Gatekeeper error: {e}")
        return 2

    if args.json:
        print(json.dumps(result.to_dict(), indent=2))
    else:
        status = "PASSED" if result.passed else "FAILED"
        print(f"[Gatekeeper] {status} — checked_metrics={result.checked_metrics}")
        if result.fail_reasons:
            print("Fail reasons:")
            for r in result.fail_reasons:
                print(f"  - {r}")
    return 0 if result.passed else 2


if __name__ == "__main__":
    raise SystemExit(main())


