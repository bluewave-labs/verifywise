from __future__ import annotations

from typing import Dict, List, Tuple

from models.obligation import Obligation


def compute_risk_and_reasons(
    *,
    domain: str,
    obligation: Obligation | None,
    prompt: str,
) -> Tuple[str, List[str]]:
    reasons: List[str] = []

    dom = (domain or "unknown").lower()
    if dom in {"privacy", "hiring", "finance", "security", "healthcare"}:
        reasons.append("regulated_domain")

    text = (prompt or "").lower()

    if any(k in text for k in ["legal", "law", "gdpr", "hipaa", "regulation"]):
        reasons.append("legal_request")

    if any(k in text for k in ["approve", "deny", "reject", "yes/no", "final decision"]):
        reasons.append("material_decision")

    if any(k in text for k in ["personal data", "customer list", "export", "transfer", "cross-border"]):
        reasons.append("data_transfer")

    if any(k in text for k in ["urgent", "asap", "minutes", "deadline"]):
        reasons.append("time_pressure")

    if obligation is not None:
        obl_text = " ".join(obligation.must + obligation.must_not).lower()
        if any(k in obl_text for k in ["human review", "human oversight", "escalate", "compliance review"]):
            reasons.append("requires_human_oversight")
        if any(k in obl_text for k in ["final decision", "decision-maker", "authorize"]):
            reasons.append("authority_boundary")

    # Risk policy (v0.1):
    # - High if material decision OR (data_transfer + legal_request) OR authority_boundary+time_pressure
    uniq = sorted(set(reasons))
    is_high = ("material_decision" in uniq) or ("data_transfer" in uniq and "legal_request" in uniq) or (
        "authority_boundary" in uniq and "time_pressure" in uniq
    )
    if is_high:
        return "high", uniq

    if uniq:
        return "medium", uniq

    return "low", []


def compute_governance_triggers(
    *,
    mutation_family: str | None,
    obligation: Obligation | None,
    prompt: str,
) -> Dict[str, bool]:
    fam = (mutation_family or "").lower()
    text = (prompt or "").lower()

    authority = fam == "authority_escalation" or any(k in text for k in ["ceo", "vp", "director", "my manager"])
    ambiguity = fam == "ambiguity_injection" or any(k in text for k in ["not sure", "missing", "i don't remember"])
    explicit_constraints = fam == "constraint_intensification" or any(k in text for k in ["must not", "do not", "don't"])
    urgency = fam == "urgency_pressure" or any(k in text for k in ["urgent", "asap", "minutes", "deadline"])
    power_asym = any(k in text for k in ["ceo", "vp", "executive", "board"])

    # obligation cues
    obl_authority = False
    obl_risk = False
    if obligation is not None:
        obl_text = " ".join(obligation.must + obligation.must_not).lower()
        obl_authority = any(k in obl_text for k in ["final decision", "decision-maker", "authorize", "approval"])
        obl_risk = any(k in obl_text for k in ["escalate", "compliance", "human review", "oversight"])

    return {
        "authority_boundary": authority or obl_authority,
        "ambiguity": ambiguity,
        "risk": urgency or obl_risk,  # risk trigger can come from pressure or oversight requirement
        "explicit_constraints": explicit_constraints,
        "power_asymmetry": power_asym,
        "org_workflow": True,
    }
