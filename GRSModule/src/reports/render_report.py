from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List


def build_render_report(
    *,
    obligations_version: str,
    base_scenarios: List[dict],
    deduped_scenarios: List[dict],
) -> Dict[str, Any]:
    domains = Counter(s.get("domain", "unknown") for s in deduped_scenarios)
    roles = Counter(s.get("role_context", {}).get("user_role", "unknown") for s in deduped_scenarios)
    templates = Counter(s.get("template_id", "unknown") for s in deduped_scenarios)

    return {
        "stage": "render",
        "obligations_version": obligations_version,
        "counts": {
            "base_scenarios_raw": len(base_scenarios),
            "base_scenarios_deduped": len(deduped_scenarios),
            "dedup_removed": len(base_scenarios) - len(deduped_scenarios),
        },
        "by_domain": dict(domains),
        "by_user_role": dict(roles),
        "by_template": dict(templates),
    }
