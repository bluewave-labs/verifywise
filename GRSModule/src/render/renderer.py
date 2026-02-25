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


def _infer_domain(blob: str, inputs: RenderInputs) -> str:
    """Return the first domain whose keywords appear in blob; default to ai_governance."""
    for dom in inputs.domains.domains:
        if any(kw in blob for kw in dom.keywords):
            return dom.domain_id
    return "ai_governance"


def render_base_scenarios(
    *,
    obligations: List[Obligation],
    inputs: RenderInputs,
    cfg: RenderConfig,
) -> List[Dict[str, Any]]:
    rng = random.Random(cfg.seed)

    roles = inputs.roles.roles
    org_ctxs = inputs.org_contexts.org_contexts
    activities_by_id = {a.activity_id: a for a in inputs.activities.activities}

    templates = inputs.templates.templates
    templates_by_domain: Dict[str, list] = {}
    for t in templates:
        templates_by_domain.setdefault(t.domain, []).append(t)

    rv = inputs.render_vars
    out: List[Dict[str, Any]] = []
    base_id = 0

    for obl in obligations:
        text_blob = " ".join(obl.must + obl.must_not).lower()
        src_blob = " ".join([
            getattr(obl.source, "source_type", "") or "",
            getattr(obl.source, "source_ref", "") or "",
            getattr(obl.source, "excerpt_id", "") or "",
        ]).lower()
        blob = f"{src_blob} {text_blob}"

        domain = _infer_domain(blob, inputs)
        dom_templates = templates_by_domain.get(domain) or templates

        for _ in range(cfg.per_obligation):
            t = _pick(rng, dom_templates)
            role = _pick(rng, roles)
            org = _pick(rng, org_ctxs)

            verb = "do"
            if t.activity_id in activities_by_id:
                verb = _pick(rng, activities_by_id[t.activity_id].verbs)

            if t.domain == "ai_governance":
                render_vars: Dict[str, Any] = {
                    "verb": verb,
                    "model_name": _pick(rng, rv.ai_governance.model_names),
                    "change_type": _pick(rng, rv.ai_governance.change_types),
                    "approval_role": _pick(rng, rv.ai_governance.approval_roles),
                    "log_artifact": _pick(rng, rv.ai_governance.log_artifacts),
                }
            elif t.domain == "content_integrity":
                render_vars = {
                    "verb": verb,
                    "vendor_type": _pick(rng, rv.content_integrity.vendor_types),
                    "content_type": _pick(rng, rv.content_integrity.content_types),
                    "data_subject": _pick(rng, rv.content_integrity.data_subjects),
                    "disclosure": _pick(rng, rv.content_integrity.disclosures),
                }
            else:
                render_vars = {"verb": verb}

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
                "render_vars": render_vars,
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
