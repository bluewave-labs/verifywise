#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple

from src.templates.loader import load_templates, render_prompt
from src.templates.pools import POOLS
from src.templates.schema import ScenarioTemplate


_WS_RE = re.compile(r"\s+")


def normalize_prompt(s: str) -> str:
    s = s.strip().lower()
    s = _WS_RE.sub(" ", s)
    return s


def sha256_text(s: str) -> str:
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return f"sha256:{h.hexdigest()}"


def pick_values(template: ScenarioTemplate, rng) -> Dict[str, Any]:
    vals: Dict[str, Any] = {}
    for name in template.placeholders:
        pool = POOLS.get(name)
        if not pool:
            raise ValueError(f"Unknown placeholder '{name}' in template '{template.template_id}'. Add to POOLS.")
        vals[name] = rng.choice(pool)
    return vals


def choose_template(templates: List[ScenarioTemplate], rng) -> ScenarioTemplate:
    return rng.choice(templates)


def make_scenario(
    *,
    scenario_id: str,
    scenario_type: str,
    template: ScenarioTemplate,
    rendered_prompt: str,
    values: Dict[str, Any],
    template_version: str,
    seed: int,
) -> Dict[str, Any]:
    # Pull common metadata fields if present in placeholder values or template metadata
    industry = values.get("industry") or template.metadata.get("industry") or "general"
    jurisdiction = values.get("jurisdiction") or template.metadata.get("jurisdiction")

    md: Dict[str, Any] = {
        "industry": industry,
        "template_id": template.template_id,
        "template_version": template_version,
        "generation_seed": seed,
    }
    if jurisdiction:
        md["jurisdiction"] = jurisdiction
    # include a small subset of placeholder values for analysis (keep it small)
    for k in ("region", "product_name", "data_type", "vendor_location"):
        if k in values:
            md[k] = values[k]

    return {
        "scenario_id": scenario_id,
        "scenario_type": scenario_type,
        "prompt": rendered_prompt,
        "risk_level": template.risk_level,
        "expected_behavior": {
            "must": template.expected_behavior.must,
            "must_not": template.expected_behavior.must_not,
        },
        "metadata": md,
    }


def write_jsonl(path: Path, rows: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")


def main() -> int:
    ap = argparse.ArgumentParser(description="Generate deterministic synthetic scenarios from templates.")
    ap.add_argument("--version", default="v0.1", help="Template version (templates/<version>/...)")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="datasets/v0.1", help="Output dataset dir (e.g., datasets/v0.1)")
    ap.add_argument("--count-compliance", type=int, default=40)
    ap.add_argument("--count-ambiguous", type=int, default=30)
    ap.add_argument("--count-multi-step", type=int, default=30)
    ap.add_argument("--max-attempts-multiplier", type=int, default=50, help="Dedup retries factor (safe default).")
    args = ap.parse_args()

    import random
    rng = random.Random(args.seed)

    out_dir = Path(args.out)
    scenarios_path = out_dir / "scenarios.jsonl"
    manifest_path = out_dir / "manifest.json"
    report_path = out_dir / "sampling_report.json"

    templates_by_type = load_templates(args.version, templates_root=Path("templates"))

    # Map to your schema enums
    targets: List[Tuple[str, int]] = [
        ("compliance_policy", args.count_compliance),
        ("ambiguous_prompt", args.count_ambiguous),
        ("multi_step_reasoning", args.count_multi_step),
    ]

    # Dedup store
    seen_hashes: set[str] = set()

    scenarios: List[Dict[str, Any]] = []
    sampling_counts = {
        "scenario_type": Counter(),
        "risk_level": Counter(),
        "industry": Counter(),
        "template_id": Counter(),
    }

    for stype, target_n in targets:
        tpls = templates_by_type.get(stype, [])
        if not tpls:
            raise RuntimeError(f"No templates loaded for scenario_type={stype}")

        attempts = 0
        max_attempts = max(target_n * args.max_attempts_multiplier, 1000)

        produced = 0
        while produced < target_n:
            attempts += 1
            if attempts > max_attempts:
                raise RuntimeError(
                    f"Could not generate enough unique scenarios for {stype}. "
                    f"Produced {produced}/{target_n} after {attempts} attempts. "
                    f"Consider adding more templates or expanding POOLS."
                )

            tpl = choose_template(tpls, rng)
            values = pick_values(tpl, rng)
            prompt = render_prompt(tpl, values).strip()

            h = sha256_text(normalize_prompt(prompt))
            if h in seen_hashes:
                continue
            seen_hashes.add(h)

            scenario_id = f"{stype}_{produced:03d}"
            s = make_scenario(
                scenario_id=scenario_id,
                scenario_type=stype,
                template=tpl,
                rendered_prompt=prompt,
                values=values,
                template_version=args.version,
                seed=args.seed,
            )
            scenarios.append(s)
            produced += 1

            # sampling report counters
            sampling_counts["scenario_type"][stype] += 1
            sampling_counts["risk_level"][s["risk_level"]] += 1
            sampling_counts["industry"][s["metadata"].get("industry", "unknown")] += 1
            sampling_counts["template_id"][s["metadata"]["template_id"]] += 1

    # Write outputs
    out_dir.mkdir(parents=True, exist_ok=True)
    write_jsonl(scenarios_path, scenarios)

    # sampling report
    report = {
        "dataset_out": str(out_dir),
        "template_version": args.version,
        "seed": args.seed,
        "counts": {
            "by_scenario_type": dict(sampling_counts["scenario_type"]),
            "by_risk_level": dict(sampling_counts["risk_level"]),
            "by_industry": dict(sampling_counts["industry"]),
            "by_template_id": dict(sampling_counts["template_id"]),
        },
        "total_scenarios": len(scenarios),
    }
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    # manifest (minimal required + reproducibility params)
    manifest = {
        "dataset_name": "enterprise_poc",
        "dataset_version": out_dir.name,  # e.g., "v0.1"
        "created_at": datetime.now(timezone.utc).isoformat(),
        "generation": {
            "seed": args.seed,
            "scenario_counts": {
                "compliance_policy": args.count_compliance,
                "ambiguous_prompt": args.count_ambiguous,
                "multi_step_reasoning": args.count_multi_step,
            },
            "template_versions": {
                "compliance_policy": args.version,
                "ambiguous_prompt": args.version,
                "multi_step_reasoning": args.version,
            },
            "params": {
                "dedup": True,
                "normalize": "lower+collapse_whitespace",
                "max_attempts_multiplier": args.max_attempts_multiplier,
            },
        },
        "files": {
            "scenarios": "scenarios.jsonl",
            "candidates": "candidates.jsonl",
        },
        # checksums filled for scenario file now; candidates later (Task 1.4)
        "checksums": {
            "scenarios.jsonl": sha256_file(scenarios_path),
        },
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print("Generated scenarios")
    print(f"- out_dir: {out_dir}")
    print(f"- scenarios: {scenarios_path} ({len(scenarios)} rows)")
    print(f"- report: {report_path}")
    print(f"- manifest: {manifest_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
