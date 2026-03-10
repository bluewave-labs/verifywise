from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

from render.dedup import prompt_hash
from validate import reason_codes as R
from validate.signals import DIMENSION_PATTERNS, SIGNAL_PATTERNS


def _has_dimension_trigger(prompt: str) -> bool:
    """Returns True if the prompt matches at least one DIMENSION_PATTERNS entry."""
    for patterns in DIMENSION_PATTERNS.values():
        for p in patterns:
            if p.search(prompt):
                return True
    return False


def _has_signal_gate(prompt: str) -> bool:
    """Returns True if prompt has pressure, uncertainty, or constraint_or_bypass."""
    for key in ("pressure", "uncertainty", "constraint_or_bypass"):
        for p in SIGNAL_PATTERNS[key]:
            if p.search(prompt):
                return True
    return False


@dataclass(frozen=True)
class ValidateConfig:
    max_prompt_chars: int = 1800


def validate_candidates(
    *,
    candidates: List[Dict[str, Any]],
    cfg: ValidateConfig,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Returns (accepted_scenarios, rejections).
    accepted_scenarios are converted into final Scenario-like records.

    Minimum validity rule: a scenario is valid iff
      1. len(prompt) <= max_prompt_chars
      2. Not a duplicate
      3. Matches >= 1 DIMENSION_PATTERNS entry
      4. Matches >= 1 of pressure | uncertainty | constraint_or_bypass from SIGNAL_PATTERNS
    """
    rejections: List[Dict[str, Any]] = []
    accepted: List[Dict[str, Any]] = []

    seen_hashes: set[str] = set()

    for c in candidates:
        prompt = c.get("prompt", "")
        cid = c.get("candidate_id", "unknown")

        # Check 1: length hygiene
        if len(prompt) > cfg.max_prompt_chars:
            rejections.append({"candidate_id": cid, "reason_code": R.QUAL_TOO_LONG, "notes": "prompt too long"})
            continue

        # Check 2: deduplication
        h = prompt_hash(prompt)
        if h in seen_hashes:
            rejections.append({"candidate_id": cid, "reason_code": R.QUAL_DUPLICATE_NEAR_DUPLICATE, "notes": "duplicate prompt"})
            continue
        seen_hashes.add(h)

        # Check 3: at least one governance dimension trigger
        if not _has_dimension_trigger(prompt):
            rejections.append({"candidate_id": cid, "reason_code": R.TRIG_NO_DIMENSION_TRIGGER, "notes": "no governance dimension pattern matched"})
            continue

        # Check 4: at least one motivating signal (pressure / uncertainty / constraint_or_bypass)
        if not _has_signal_gate(prompt):
            rejections.append({"candidate_id": cid, "reason_code": R.TRIG_NO_SIGNAL_GATE, "notes": "no pressure/uncertainty/constraint_or_bypass signal"})
            continue

        # Build governance_triggers map from dimension matches
        governance_triggers = {
            dim: any(p.search(prompt) for p in patterns)
            for dim, patterns in DIMENSION_PATTERNS.items()
        }

        accepted.append(
            {
                "scenario_id": c["candidate_id"].replace("cand_", "grs_"),
                "version": "grs_scenarios_v0.1",
                "domain": c.get("domain", "unknown"),
                "industry": "general",
                "role_context": c.get("role_context", {}),
                "prompt": prompt,
                "constraints": {
                    "must": [],
                    "must_not": [],
                    "format": {"required": False, "type": "none", "notes": ""},
                },
                "governance_triggers": governance_triggers,
                "seed_trace": {"obligation_ids": [c.get("obligation_id")]},
                "mutation_trace": {
                    "base_scenario_id": c.get("base_scenario_id"),
                    "mutations": [
                        {
                            "mutation_id": c.get("mutation", {}).get("mutation_id"),
                            "family": c.get("mutation", {}).get("family"),
                            "params": c.get("mutation", {}).get("params", {}),
                        }
                    ],
                },
                "metadata": {"prompt_hash": h},
            }
        )

    return accepted, rejections
