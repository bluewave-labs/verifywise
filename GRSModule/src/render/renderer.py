from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List
import random

from models.obligation import Obligation
from render.load_catalogs import RenderInputs


@dataclass(frozen=True)
class RenderConfig:
    seed: int
    per_obligation: int = 2  # how many base scenarios to create per obligation


def _pick(rng: random.Random, items: List[Any]) -> Any:
    return items[rng.randrange(0, len(items))]


def render_base_scenarios(
    *,
    obligations: List[Obligation],
    inputs: RenderInputs,
    cfg: RenderConfig,
) -> List[Dict[str, Any]]:
    rng = random.Random(cfg.seed)

    roles = inputs.roles.roles
    org_ctxs = inputs.org_contexts.org_contexts
    activities_by_domain = {}
    for a in inputs.activities.activities:
        activities_by_domain.setdefault(a.domain, []).append(a)

    templates = inputs.templates.templates
    templates_by_domain = {}
    for t in templates:
        templates_by_domain.setdefault(t.domain, []).append(t)

    out: List[Dict[str, Any]] = []
    base_id = 0

    # Basic variables for placeholder filling
    data_subjects = ["EU", "French", "German", "customer"]
    vendor_types = ["support", "analytics", "CRM"]
    vendor_locations = ["the US", "Canada", "a non-EU country", "Singapore"]
    criteria = ["2+ years of experience", "a degree requirement", "a minimum score threshold"]

    for obl in obligations:
        domain = "general"
        text_blob = " ".join(obl.must + obl.must_not).lower()
        if any(k in text_blob for k in ["gdpr", "data", "export", "privacy", "cross-border"]):
            domain = "privacy"
        elif any(k in text_blob for k in ["recruit", "resume", "hiring", "candidate", "screen"]):
            domain = "hiring"
        elif any(k in text_blob for k in ["loan", "credit", "finance"]):
            domain = "finance"

        dom_templates = templates_by_domain.get(domain) or templates
        for _ in range(cfg.per_obligation):
            t = _pick(rng, dom_templates)
            role = _pick(rng, roles)
            org = _pick(rng, org_ctxs)

            verb = "do"
            acts = activities_by_domain.get(t.domain, [])
            if acts:
                act = _pick(rng, acts)
                verb = _pick(rng, act.verbs)

            base_id += 1
            scenario = {
                "base_scenario_id": f"base_{base_id:06d}",
                "obligation_id": obl.obligation_id,
                "domain": t.domain,
                "role_context": {
                    "assistant_role": role.assistant_role,
                    "user_role": role.user_role,
                    "org_context": org.org_context,
                },
                "template_id": t.template_id,
                "render_vars": {
                    "verb": verb,
                    "data_subject": _pick(rng, data_subjects),
                    "vendor_type": _pick(rng, vendor_types),
                    "vendor_location": _pick(rng, vendor_locations),
                    "criterion": _pick(rng, criteria),
                },
            }

            prompt = t.template.format(
                assistant_role=scenario["role_context"]["assistant_role"],
                user_role=scenario["role_context"]["user_role"],
                org_context=scenario["role_context"]["org_context"],
                **scenario["render_vars"],
            )
            scenario["prompt"] = prompt

            out.append(scenario)

    return out
