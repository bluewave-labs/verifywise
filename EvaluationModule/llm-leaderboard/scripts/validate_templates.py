#!/usr/bin/env python3
from __future__ import annotations

import argparse
import random
from pathlib import Path
from typing import Any, Dict, List

from src.templates.loader import load_templates, render_prompt
from src.templates.pools import POOLS
from src.templates.schema import ScenarioTemplate


def pick_values(t: ScenarioTemplate, rng: random.Random) -> Dict[str, Any]:
    vals: Dict[str, Any] = {}
    for name in t.placeholders:
        pool = POOLS.get(name)
        if pool:
            vals[name] = rng.choice(pool)
        else:
            # fail fast: we want controlled variation
            raise ValueError(f"Unknown placeholder '{name}'. Add it to POOLS or remove it from placeholders.")
    return vals


def main() -> int:
    ap = argparse.ArgumentParser(description="Validate scenario templates YAML files.")
    ap.add_argument("--version", default="v0.1", help="Template version folder under templates/")
    ap.add_argument("--seed", type=int, default=42, help="Seed used for sample rendering")
    args = ap.parse_args()

    rng = random.Random(args.seed)

    all_templates = load_templates(args.version, templates_root=Path("templates"))

    errors: List[str] = []

    for stype, tpls in all_templates.items():
        if len(tpls) < 10:
            errors.append(f"{stype}: expected at least 10 templates, found {len(tpls)}")

        for t in tpls:
            # Validate placeholders exist in pools
            for p in t.placeholders:
                if p not in POOLS:
                    errors.append(f"{stype}/{t.template_id}: unknown placeholder '{p}' (missing in POOLS)")

            # Try rendering once
            try:
                vals = pick_values(t, rng)
                _ = render_prompt(t, vals)
            except Exception as e:
                errors.append(f"{stype}/{t.template_id}: failed to render ({e})")

    if errors:
        print("TEMPLATE VALIDATION FAILED")
        for e in errors:
            print(f"- {e}")
        print(f"\nTotal errors: {len(errors)}")
        return 1

    print("TEMPLATE VALIDATION PASSED")
    for stype, tpls in all_templates.items():
        print(f"- {stype}: {len(tpls)} templates")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
