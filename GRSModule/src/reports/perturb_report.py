from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List


def build_perturb_report(
    *,
    mutation_catalog_version: str,
    mutated_candidates: List[dict],
) -> Dict[str, Any]:
    families = Counter(c["mutation"]["family"] for c in mutated_candidates)
    mutation_ids = Counter(c["mutation"]["mutation_id"] for c in mutated_candidates)
    domains = Counter(c.get("domain", "unknown") for c in mutated_candidates)

    return {
        "stage": "perturb",
        "mutation_catalog_version": mutation_catalog_version,
        "counts": {
            "mutated_candidates": len(mutated_candidates),
        },
        "by_family": dict(families),
        "by_mutation_id": dict(mutation_ids),
        "by_domain": dict(domains),
    }
