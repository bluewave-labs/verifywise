from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List


def build_validate_report(*, accepted: List[dict], rejections: List[dict]) -> Dict[str, Any]:
    by_reason = Counter(r["reason_code"] for r in rejections)
    by_domain = Counter(s.get("domain", "unknown") for s in accepted)

    return {
        "stage": "validate",
        "counts": {
            "accepted": len(accepted),
            "rejected": len(rejections),
            "accept_rate": (len(accepted) / max(1, len(accepted) + len(rejections))),
        },
        "rejections_by_reason": dict(by_reason),
        "accepted_by_domain": dict(by_domain),
    }
