from __future__ import annotations

from typing import Dict, List

# Small predefined lists to generate realistic placeholder values.
# Keep these stable for reproducibility across runs (seed controls selection).
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
