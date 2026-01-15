#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import random
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Tuple
from tqdm import tqdm

import yaml

from src.llm.openai_compat import OpenAICompatibleClient
from src.utils.jsonl import iter_jsonl, write_jsonl


@dataclass(frozen=True)
class Style:
    style_id: str
    label: str  # good/risky/bad
    temperature: float
    system: str
    instructions: str


def load_styles(path: Path) -> List[Style]:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict) or "styles" not in raw:
        raise ValueError("Invalid styles YAML: expected top-level mapping with 'styles'")

    styles_raw = raw["styles"]
    if not isinstance(styles_raw, list) or not styles_raw:
        raise ValueError("Invalid styles YAML: 'styles' must be a non-empty list")

    styles: List[Style] = []
    for s in styles_raw:
        if not isinstance(s, dict):
            raise ValueError("Invalid style entry (expected mapping)")
        styles.append(
            Style(
                style_id=str(s["style_id"]),
                label=str(s["label"]),
                temperature=float(s["temperature"]),
                system=str(s["system"]),
                instructions=str(s["instructions"]),
            )
        )
    return styles


def style_violation_tags(style_id: str) -> List[str]:
    """
    Lightweight tagging by style. Later you can make this scenario-aware.
    """
    mapping = {
        "careful_enterprise": [],
        "overconfident_no_escalation": ["overconfident_policy", "no_escalation", "no_clarifying_question"],
        "plausible_but_invented_policy": ["hallucination", "invented_policy", "no_escalation"],
        "refusal_too_strict": ["over_refusal", "low_helpfulness"],
        "helpful_but_boundary_slip": ["implicit_approval", "boundary_slip"],
    }
    return mapping.get(style_id, [])


def build_messages(*, scenario: Dict[str, Any], style: Style) -> List[Dict[str, str]]:
    prompt = scenario["prompt"]
    scenario_type = scenario.get("scenario_type", "unknown")
    risk_level = scenario.get("risk_level", "unknown")

    user = (
        f"Scenario type: {scenario_type}\n"
        f"Risk level: {risk_level}\n\n"
        f"Scenario:\n{prompt}\n\n"
        f"Instructions:\n{style.instructions}\n"
    )

    return [
        {"role": "system", "content": style.system},
        {"role": "user", "content": user},
    ]


def enforce_basic_heuristics(text: str) -> None:
    # POC sanity bounds
    if len(text) < 80:
        raise ValueError("answer too short (<80 chars)")
    if len(text) > 2500:
        raise ValueError("answer too long (>2500 chars)")


def main() -> int:
    ap = argparse.ArgumentParser(description="Tier 1: Generate candidates using one LLM + multiple prompt styles.")
    ap.add_argument("--dataset-dir", default="datasets/v0.1")
    ap.add_argument("--styles", default="configs/generators/tier1_styles_v0.1.yaml")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--max-items", type=int, default=0, help="If >0, limit scenarios processed (quick test).")

    ap.add_argument("--base-url", default=os.getenv("GEN_BASE_URL", "https://api.openai.com/v1"))
    ap.add_argument("--api-key", default=os.getenv("GEN_API_KEY", ""))
    ap.add_argument("--model", default=os.getenv("GEN_MODEL", "gpt-4o-mini"))

    ap.add_argument("--out", default=None, help="Output JSONL (default: <dataset-dir>/candidates_llm.jsonl)")
    ap.add_argument("--max-tokens", type=int, default=400)
    args = ap.parse_args()

    if not args.api_key:
        raise SystemExit("Missing API key. Set GEN_API_KEY or pass --api-key.")

    rng = random.Random(args.seed)

    dataset_dir = Path(args.dataset_dir)
    scenarios_path = dataset_dir / "scenarios.jsonl"
    if not scenarios_path.exists():
        raise FileNotFoundError(f"Missing scenarios.jsonl: {scenarios_path}")
    
    scenario_rows = [s for _, s in iter_jsonl(scenarios_path)]
    if args.max_items:
        scenario_rows = scenario_rows[: args.max_items]

    out_path = Path(args.out) if args.out else (dataset_dir / "candidates_llm.jsonl")

    styles = load_styles(Path(args.styles))
    client = OpenAICompatibleClient(base_url=args.base_url, api_key=args.api_key, model=args.model)

    total_scenarios = len(scenario_rows)
    total_calls = total_scenarios * len(styles)

    rows: List[Dict[str, Any]] = []

    pbar = tqdm(total=total_calls, desc="Generating LLM candidates", unit="call")

    processed_scenarios = 0
    for scenario in scenario_rows:
        processed_scenarios += 1
        sid = scenario["scenario_id"]

        for style in styles:
            messages = build_messages(scenario=scenario, style=style)

            # show where we are (nice in long runs)
            pbar.set_postfix_str(
                f"scenario={sid} style={style.style_id} model={args.model}"
            )

            resp = client.chat(
                messages,
                temperature=style.temperature,
                max_tokens=args.max_tokens,
            )
            text = resp.text
            enforce_basic_heuristics(text)

            answer_id = f"{sid}_llm_{style.style_id}_{args.model.replace('/', '_')}"

            rows.append(
                {
                    "scenario_id": sid,
                    "answer_id": answer_id,
                    "answer_text": text,
                    "label": style.label,
                    "violation_tags": style_violation_tags(style.style_id),
                    "metadata": {
                        "generation_method": "llm_tier1",
                        "generator_provider": "openai_compatible",
                        "generator_base_url": args.base_url,
                        "generator_model": args.model,
                        "style_id": style.style_id,
                        "temperature": style.temperature,
                        "seed": args.seed,
                        "max_tokens": args.max_tokens,
                        "generated_at": datetime.now(timezone.utc).isoformat(),
                        "prompt_messages": messages,
                    },
                }
            )

            pbar.update(1)

    pbar.close()

    write_jsonl(out_path, rows)
    print("Generated LLM candidates (Tier 1)")
    print(f"- scenarios processed: {total_scenarios}")
    print(f"- styles: {len(styles)}")
    print(f"- output rows: {len(rows)}")
    print(f"- out: {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
