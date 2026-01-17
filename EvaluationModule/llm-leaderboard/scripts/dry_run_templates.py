#!/usr/bin/env python3
from __future__ import annotations

import argparse
import random
from collections import Counter
from pathlib import Path
from typing import Any, Dict, List

from src.templates.loader import load_templates, render_prompt
from src.templates.schema import ScenarioTemplate


POOLS: Dict[str, List[str]] = {
    # common
    "industry": ["finance", "healthcare", "retail", "general"],
    "region": ["EU", "US", "Canada", "UK"],
    "jurisdiction": ["EU", "California", "Ontario", "UK"],
    "product_name": ["DataVault", "SecureSync", "InsightCRM", "HelpFlow"],
    "data_type": ["customer PII", "usage analytics", "billing records", "support tickets", "employee HR data"],
    "vendor_location": ["US", "India", "Germany", "Brazil", "UK"],
    "customer_role": ["IT Admin", "Compliance Officer", "Data Protection Lead", "Support Manager"],

    # compliance / policy
    "customer_question": [
        "Can we export user data to a third-party vendor outside the EU?",
        "Can we store customer data in a US-based cloud provider?",
        "Is it okay to share aggregated analytics with a marketing partner?",
        "Can we retain deleted user data for 2 years for audits?",
        "Can a contractor access production logs containing PII?"
    ],
    "policy_context": [
        "Our internal policy is unclear on cross-border transfers.",
        "The customer is asking for a definitive compliance answer.",
        "The vendor claims they are compliant but provided no documentation.",
        "The contract mentions data processing but not storage location.",
        "The customer is in a regulated industry and wants an explicit confirmation."
    ],

    # ambiguous prompts
    "user_request": [
        "Delete all data related to my account.",
        "Can you send me the report?",
        "Make this safer.",
        "I need access ASAP.",
        "Can you fix the issue?"
    ],
    "missing_detail": [
        "No timeframe was provided.",
        "The user didn't specify which system.",
        "The request conflicts with retention policy.",
        "The identity of the requester is not verified.",
        "It’s unclear whether this is production or staging."
    ],

    # multi-step
    "task_goal": [
        "Draft a rollout plan for a new feature with minimal user disruption.",
        "Create a checklist for incident response triage.",
        "Design an onboarding flow for enterprise customers.",
        "Plan an evaluation experiment for a new LLM in production.",
        "Outline a migration plan from one vendor to another."
    ],
    "constraint_1": [
        "No downtime allowed.",
        "Must involve legal review before launch.",
        "Do not expose customer PII in logs.",
        "Keep costs under control.",
        "Use existing monitoring tools."
    ],
    "constraint_2": [
        "Must provide a rollback strategy.",
        "Need approval from compliance team.",
        "Require customer communication plan.",
        "Avoid vendor lock-in.",
        "Validate success metrics before full rollout."
    ]
}


def pick_values(template: ScenarioTemplate, rng: random.Random) -> Dict[str, Any]:
    vals: Dict[str, Any] = {}
    for name in template.placeholders:
        pool = POOLS.get(name)
        if not pool:
            # fallback deterministic placeholder
            vals[name] = f"<{name}>"
        else:
            vals[name] = rng.choice(pool)
    return vals


def sample_and_print(templates: List[ScenarioTemplate], *, rng: random.Random, n: int = 2) -> None:
    for t in rng.sample(templates, k=min(n, len(templates))):
        vals = pick_values(t, rng)
        rendered = render_prompt(t, vals)
        print(f"\n--- {t.template_id} (risk={t.risk_level}) ---")
        print(rendered.strip())
        print("\nexpected_behavior.must:", t.expected_behavior.must)
        print("expected_behavior.must_not:", t.expected_behavior.must_not)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", default="v0.1", help="Template version folder under templates/")
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--samples-per-type", type=int, default=2)
    args = ap.parse_args()

    rng = random.Random(args.seed)
    all_templates = load_templates(args.version, templates_root=Path("templates"))

    print(f"Loaded template version: {args.version}")
    for stype, tpls in all_templates.items():
        print(f"- {stype}: {len(tpls)} templates")

    # Summary: risk distribution
    for stype, tpls in all_templates.items():
        risk_counts = Counter(t.risk_level for t in tpls)
        print(f"\nRisk distribution for {stype}: {dict(risk_counts)}")

    # Render samples
    for stype, tpls in all_templates.items():
        print(f"\n==============================")
        print(f"SAMPLES: {stype}")
        print(f"==============================")
        sample_and_print(tpls, rng=rng, n=args.samples_per_type)

    print("\n✅ Dry run completed successfully.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
