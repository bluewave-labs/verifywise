from __future__ import annotations

import random
from typing import Any, Dict, List

from perturb.models import MutationCatalog, MutationSpec


def _pick_param(rng: random.Random, v: Any) -> Any:
    if isinstance(v, list):
        return v[rng.randrange(0, len(v))]
    return v


def apply_mutations(
    *,
    base_scenarios: List[Dict[str, Any]],
    catalog: MutationCatalog,
    seed: int,
    k_per_base: int,
) -> List[Dict[str, Any]]:
    rng = random.Random(seed)

    out: List[Dict[str, Any]] = []
    cand_id = 0

    for base in base_scenarios:
        # choose k mutations per base deterministically
        specs = catalog.mutations
        if not specs:
            continue

        chosen = [specs[rng.randrange(0, len(specs))] for _ in range(k_per_base)]

        for spec in chosen:
            cand_id += 1

            params = {k: _pick_param(rng, v) for k, v in (spec.params or {}).items()}
            mutation_text = spec.template.format(**params) if params else spec.template

            mutated_prompt = base["prompt"].rstrip() + "\n\n" + mutation_text.strip() + "\n"

            out.append(
                {
                    "candidate_id": f"cand_{cand_id:06d}",
                    "base_scenario_id": base["base_scenario_id"],
                    "obligation_id": base["obligation_id"],
                    "domain": base.get("domain", "unknown"),
                    "role_context": base.get("role_context", {}),
                    "template_id": base.get("template_id"),
                    "render_vars": base.get("render_vars", {}),
                    "prompt_hash": base.get("prompt_hash"),
                    "mutation": {
                        "mutation_id": spec.mutation_id,
                        "family": spec.family,
                        "params": params,
                        "text": mutation_text,
                    },
                    "prompt": mutated_prompt,
                }
            )

    return out
