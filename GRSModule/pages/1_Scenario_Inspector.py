"""GRS Scenario Inspector — full lifecycle view for a single scenario.

Launch (from GRSModule/):
    uv run streamlit run viewer.py
Then navigate to "1 Scenario Inspector" in the sidebar.
"""

from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT / "src"))

from io_utils.jsonl import read_jsonl  # noqa: E402
from judge.load_rubric import load_judge_rubric  # noqa: E402
from judge.prompt_builder import build_judge_messages  # noqa: E402

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

DATASETS_DIR = ROOT / "datasets"
RUBRIC_PATH = ROOT / "configs" / "judge_rubric.yaml"

DIMENSIONS = [
    "boundary_management",
    "constraint_adherence",
    "clarity_and_questions",
    "escalation_and_controls",
]

DIMENSION_WEIGHTS = {
    "boundary_management": 30,
    "constraint_adherence": 35,
    "clarity_and_questions": 15,
    "escalation_and_controls": 20,
}

# ---------------------------------------------------------------------------
# Styling helpers (copied from viewer.py)
# ---------------------------------------------------------------------------


def risk_badge(risk: str) -> str:
    colors = {"low": "#2d7a2d", "medium": "#b8860b", "high": "#b22222"}
    bg = colors.get(risk, "#555")
    return f'<span style="background:{bg};color:#fff;padding:2px 8px;border-radius:4px;font-size:0.8em">{risk.upper()}</span>'


def grs_color(score: float | None) -> str:
    if score is None:
        return "#888"
    if score < 1.5:
        return "#b22222"
    if score < 2.5:
        return "#b8860b"
    return "#2d7a2d"


def pill(text: str, color: str) -> str:
    return (
        f'<span style="background:{color};color:#fff;padding:2px 10px;'
        f'border-radius:12px;font-size:0.8em;margin:2px;display:inline-block">{text}</span>'
    )


# ---------------------------------------------------------------------------
# Discovery helpers
# ---------------------------------------------------------------------------


def discover_versions() -> list[str]:
    if not DATASETS_DIR.exists():
        return []
    return sorted(d.name for d in DATASETS_DIR.iterdir() if d.is_dir())


def discover_models(version: str) -> list[str]:
    resp_dir = DATASETS_DIR / version / "final" / "responses"
    if not resp_dir.exists():
        return []
    return sorted(
        f.stem
        for f in resp_dir.glob("*.jsonl")
        if not f.name.endswith(".failures.jsonl")
    )


# ---------------------------------------------------------------------------
# Data loading (cached)
# ---------------------------------------------------------------------------


@st.cache_data(show_spinner="Loading intermediate data…")
def load_intermediate(version: str) -> tuple[dict, dict, dict]:
    """Load obligations, base scenarios, and mutated candidates."""
    inter = DATASETS_DIR / version / "intermediate"

    obligations: dict[str, dict] = {}
    obl_path = inter / "behavioral_obligations.jsonl"
    if obl_path.exists():
        obligations = {r["obligation_id"]: r for r in read_jsonl(obl_path)}

    base_scenarios: dict[str, dict] = {}
    base_path = inter / "base_scenarios_deduped.jsonl"
    if base_path.exists():
        base_scenarios = {r["base_scenario_id"]: r for r in read_jsonl(base_path)}

    # Index mutated candidates by (base_scenario_id, mutation_id)
    mutated: dict[tuple[str, str], dict] = {}
    mut_path = inter / "mutated_candidates.jsonl"
    if mut_path.exists():
        for r in read_jsonl(mut_path):
            key = (r["base_scenario_id"], r["mutation"]["mutation_id"])
            mutated[key] = r

    return obligations, base_scenarios, mutated


@st.cache_data(show_spinner="Loading final data…")
def load_final(version: str, model_stem: str) -> tuple[dict, dict, dict]:
    """Load final scenarios, responses, and judge scores."""
    base = DATASETS_DIR / version / "final"

    scenarios = {r["scenario_id"]: r for r in read_jsonl(base / "scenarios.jsonl")}

    responses: dict[str, dict] = {}
    resp_path = base / "responses" / f"{model_stem}.jsonl"
    if resp_path.exists():
        responses = {r["scenario_id"]: r for r in read_jsonl(resp_path)}

    judge_scores: dict[str, dict] = {}
    judge_path = base / "judge_scores" / f"{model_stem}.jsonl"
    if judge_path.exists():
        judge_scores = {r["scenario_id"]: r for r in read_jsonl(judge_path)}

    return scenarios, responses, judge_scores


@st.cache_data(show_spinner="Loading rubric…")
def load_rubric() -> object:
    if RUBRIC_PATH.exists():
        return load_judge_rubric(RUBRIC_PATH)
    return None


# ---------------------------------------------------------------------------
# Stage renderers
# ---------------------------------------------------------------------------


def render_stage_1(obligation: dict | None, obl_id: str) -> None:
    st.markdown("## Stage 1 — Source Obligation")
    if obligation is None:
        st.warning(f"Obligation `{obl_id}` not found in intermediate data.")
        return

    src = obligation.get("source", {})
    col1, col2 = st.columns([2, 3])
    with col1:
        st.markdown(f"**Obligation ID:** `{obl_id}`")
        st.markdown(f"**Source type:** {src.get('source_type', '—')}")
        st.markdown(f"**Source ref:** {src.get('source_ref', '—')}")
        st.markdown(f"**Excerpt ID:** `{src.get('excerpt_id', '—')}`")
    with col2:
        musts = obligation.get("must", [])
        must_nots = obligation.get("must_not", [])
        if musts:
            st.markdown("**MUST**")
            st.markdown(" ".join(pill(m, "#2d7a2d") for m in musts), unsafe_allow_html=True)
        if must_nots:
            st.markdown("**MUST NOT**")
            st.markdown(" ".join(pill(m, "#b22222") for m in must_nots), unsafe_allow_html=True)


def render_stage_2(base: dict | None, base_id: str) -> None:
    st.markdown("## Stage 2 — Base Scenario")
    if base is None:
        st.warning(f"Base scenario `{base_id}` not found in intermediate data.")
        return

    col1, col2, col3 = st.columns(3)
    col1.markdown(f"**Base ID:** `{base.get('base_scenario_id', '—')}`")
    col2.markdown(f"**Template:** `{base.get('template_id', '—')}`")
    col3.markdown(f"**Obligation:** `{base.get('obligation_id', '—')}`")

    role_ctx = base.get("role_context", {})
    st.markdown("**Assistant role:** " + role_ctx.get("assistant_role", "—"))
    st.markdown("**User role:** " + role_ctx.get("user_role", "—"))
    st.markdown("**Org context:** " + role_ctx.get("org_context", "—"))

    st.markdown("**Original prompt:**")
    st.text_area(
        label="base_prompt",
        value=base.get("prompt", ""),
        height=150,
        disabled=True,
        label_visibility="collapsed",
    )


def render_stage_3(candidate: dict | None, scenario: dict) -> None:
    st.markdown("## Stage 3 — Perturbation Applied")
    mutations = scenario.get("mutation_trace", {}).get("mutations", [])
    if not mutations:
        st.info("No mutation recorded for this scenario.")
        return

    mut_info = mutations[0]
    family = mut_info.get("family", "—")
    mut_id = mut_info.get("mutation_id", "—")

    col1, col2 = st.columns([1, 2])
    col1.markdown(
        pill(family.replace("_", " "), "#6a4c93") + "&nbsp;&nbsp;" + f"`{mut_id}`",
        unsafe_allow_html=True,
    )

    if candidate is not None:
        injected_text = candidate.get("mutation", {}).get("text", "")
        if injected_text:
            st.markdown("**Injected text:**")
            st.info(injected_text)

        st.markdown("**Side-by-side comparison:**")
        c_base, c_mut = st.columns(2)
        with c_base:
            st.markdown("*Base prompt*")
            base_prompt = candidate.get("prompt", "").replace(injected_text, "").rstrip()
            st.text_area(
                label="base_cmp",
                value=base_prompt,
                height=200,
                disabled=True,
                label_visibility="collapsed",
            )
        with c_mut:
            st.markdown("*Mutated prompt*")
            st.text_area(
                label="mutated_cmp",
                value=candidate.get("prompt", ""),
                height=200,
                disabled=True,
                label_visibility="collapsed",
            )
    else:
        st.warning("Mutated candidate record not found. Showing final scenario prompt.")
        st.text_area(
            label="mutated_fallback",
            value=scenario.get("prompt", ""),
            height=150,
            disabled=True,
            label_visibility="collapsed",
        )


def render_stage_4(scenario: dict) -> None:
    st.markdown("## Stage 4 — Validated Scenario")

    risk = scenario.get("risk_level", "")
    col1, col2 = st.columns([1, 3])
    with col1:
        st.markdown(risk_badge(risk), unsafe_allow_html=True)
    with col2:
        reasons = scenario.get("risk_reasons", [])
        if reasons:
            st.markdown("**Risk reasons:** " + ", ".join(f"`{r}`" for r in reasons))

    triggers = scenario.get("governance_triggers", {})
    active = [k for k, v in triggers.items() if v]
    inactive = [k for k, v in triggers.items() if not v]
    st.markdown("**Governance triggers:**")
    pills_html = ""
    if active:
        pills_html += " ".join(pill(t.replace("_", " "), "#1a6ab5") for t in active)
    if inactive:
        pills_html += " " + " ".join(
            f'<span style="background:#ccc;color:#555;padding:2px 10px;border-radius:12px;'
            f'font-size:0.8em;margin:2px;display:inline-block">{t.replace("_", " ")}</span>'
            for t in inactive
        )
    if pills_html:
        st.markdown(pills_html, unsafe_allow_html=True)

    constraints = scenario.get("constraints", {})
    musts = constraints.get("must", [])
    must_nots = constraints.get("must_not", [])
    fmt = constraints.get("format", {})

    if musts:
        st.markdown("**MUST**")
        st.markdown(" ".join(pill(m, "#2d7a2d") for m in musts), unsafe_allow_html=True)
    if must_nots:
        st.markdown("**MUST NOT**")
        st.markdown(" ".join(pill(m, "#b22222") for m in must_nots), unsafe_allow_html=True)
    if fmt.get("required"):
        st.markdown(f"**Format required:** `{fmt.get('type', '')}` — {fmt.get('notes', '')}")


def render_stage_5(response: dict | None) -> None:
    st.markdown("## Stage 5 — Model Response")
    if not response:
        st.info("No response recorded for this scenario.")
        return

    raw = response.get("raw", {})
    usage = raw.get("usage", {})

    col1, col2, col3 = st.columns(3)
    col1.markdown(f"**Model:** `{response.get('model_id', '—')}`")
    col2.markdown(f"**Provider:** {response.get('provider', '—')}")
    col3.markdown(f"**Finish reason:** {raw.get('finish_reason', '—')}")

    latency_ms = raw.get("latency_ms")
    prompt_tokens = usage.get("prompt_tokens")
    completion_tokens = usage.get("completion_tokens")
    cost = usage.get("cost")

    m1, m2, m3, m4 = st.columns(4)
    m1.metric("Latency", f"{latency_ms} ms" if latency_ms is not None else "—")
    m2.metric("Prompt tokens", prompt_tokens if prompt_tokens is not None else "—")
    m3.metric("Completion tokens", completion_tokens if completion_tokens is not None else "—")
    m4.metric("Cost", f"${cost:.6f}" if cost is not None else "—")

    st.markdown("**Model output:**")
    st.text_area(
        label="model_output",
        value=response.get("output_text", ""),
        height=250,
        disabled=True,
        label_visibility="collapsed",
    )


def render_stage_6(judge: dict | None, scenario: dict, response: dict | None, rubric: object) -> None:
    st.markdown("## Stage 6 — Judge Evaluation")
    if not judge:
        st.info("No evaluation recorded for this scenario.")
        return

    grs = judge.get("grs_score")
    color = grs_color(grs)
    grs_display = f"{grs:.2f}" if grs is not None else "N/A"
    st.markdown(
        f'<p style="font-size:2.5em;font-weight:bold;color:{color}">'
        f"GRS {grs_display} <span style='font-size:0.5em;color:#888'>/ 4.00</span></p>",
        unsafe_allow_html=True,
    )
    if grs is not None:
        st.progress(min(grs / 4.0, 1.0))

    judge_raw = judge.get("raw", {}).get("judge_raw", {})
    judge_usage = judge_raw.get("usage", {})
    judge_latency = judge_raw.get("latency_ms")
    judge_cost = judge_usage.get("cost")

    col1, col2, col3 = st.columns(3)
    col1.markdown(f"**Judge model:** `{judge.get('judge_model_id', '—')}`")
    col2.metric("Judge latency", f"{judge_latency} ms" if judge_latency is not None else "—")
    col3.metric("Judge cost", f"${judge_cost:.6f}" if judge_cost is not None else "—")

    # Build dim_map
    dim_map: dict[str, dict] = {}
    for ds in judge.get("dimension_scores", []):
        dim_map[ds["dimension_id"]] = ds

    st.markdown("#### Dimension Breakdown")
    for dim in DIMENSIONS:
        ds = dim_map.get(dim, {})
        score = ds.get("score")
        rationale = ds.get("rationale", "")
        evidence = ds.get("evidence", [])
        weight = DIMENSION_WEIGHTS.get(dim, 0)
        title = dim.replace("_", " ").title()

        score_str = f"{score}/4" if score is not None else "N/A"
        st.markdown(f"**{title}** (weight: {weight}%) — {score_str}")
        if score is not None:
            st.progress(score / 4.0)
        with st.expander("Rationale"):
            if rationale:
                st.markdown(rationale)
            else:
                st.markdown("_No rationale provided._")
            if evidence:
                st.markdown("**Evidence:**")
                for e in evidence:
                    st.markdown(f"- {e}")

    flags = judge.get("flags", {})
    if flags:
        st.markdown("#### Flags")
        st.json(flags)

    # Judge prompt reconstruction
    if rubric is not None and response is not None:
        with st.expander("Judge Prompt (reconstructed)"):
            try:
                messages = build_judge_messages(
                    scenario=scenario,
                    response=response,
                    rubric=rubric,
                )
                for msg in messages:
                    role = msg.get("role", "").upper()
                    content = msg.get("content", "")
                    st.markdown(f"**[{role}]**")
                    st.text(content)
                    st.markdown("---")
            except Exception as exc:
                st.error(f"Could not reconstruct judge prompt: {exc}")
    elif rubric is None:
        with st.expander("Judge Prompt (reconstructed)"):
            st.warning(f"Rubric not found at `{RUBRIC_PATH}`. Cannot reconstruct judge prompt.")


# ---------------------------------------------------------------------------
# Main app
# ---------------------------------------------------------------------------


def main() -> None:
    st.title("GRS Scenario Inspector")
    st.caption("Full pipeline lifecycle view: obligation → base → mutation → validation → response → judge")

    # ------------------------------------------------------------------
    # Sidebar
    # ------------------------------------------------------------------
    with st.sidebar:
        st.header("Dataset")

        versions = discover_versions()
        if not versions:
            st.error(f"No dataset versions found in `{DATASETS_DIR}`.")
            st.stop()

        version = st.selectbox("Version", versions, index=len(versions) - 1)

        models = discover_models(version)
        if not models:
            st.warning("No model response files found for this version.")
            st.stop()

        model_stem = st.selectbox("Model", models)

        st.divider()
        st.header("Scenario")

    # ------------------------------------------------------------------
    # Load data
    # ------------------------------------------------------------------
    obligations, base_scenarios, mutated_candidates = load_intermediate(version)
    scenarios, responses, judge_scores = load_final(version, model_stem)
    rubric = load_rubric()

    if not scenarios:
        st.warning("No scenarios found for this version.")
        st.stop()

    scenario_ids = sorted(scenarios.keys())

    with st.sidebar:
        selected_id = st.selectbox("Scenario ID", scenario_ids)

    # ------------------------------------------------------------------
    # Look up all data for the selected scenario
    # ------------------------------------------------------------------
    scenario = scenarios.get(selected_id, {})
    response = responses.get(selected_id)
    judge = judge_scores.get(selected_id)

    seed_trace = scenario.get("seed_trace", {})
    mutation_trace = scenario.get("mutation_trace", {})

    obl_ids = seed_trace.get("obligation_ids", [])
    obl_id = obl_ids[0] if obl_ids else ""
    obligation = obligations.get(obl_id) if obl_id else None

    base_id = mutation_trace.get("base_scenario_id", "")
    base_scenario = base_scenarios.get(base_id) if base_id else None

    mutations = mutation_trace.get("mutations", [])
    mutation_id = mutations[0].get("mutation_id", "") if mutations else ""
    candidate = mutated_candidates.get((base_id, mutation_id)) if base_id and mutation_id else None

    # ------------------------------------------------------------------
    # Header summary
    # ------------------------------------------------------------------
    risk = scenario.get("risk_level", "")
    c1, c2, c3, c4 = st.columns(4)
    c1.markdown(f"**Scenario:** `{selected_id}`")
    c2.markdown(risk_badge(risk), unsafe_allow_html=True)
    c3.markdown(f"**Domain:** {scenario.get('domain', '—')}")
    c4.markdown(f"**Industry:** {scenario.get('industry', '—')}")

    # ------------------------------------------------------------------
    # 6 pipeline stages
    # ------------------------------------------------------------------
    st.divider()
    render_stage_1(obligation, obl_id)

    st.divider()
    render_stage_2(base_scenario, base_id)

    st.divider()
    render_stage_3(candidate, scenario)

    st.divider()
    render_stage_4(scenario)

    st.divider()
    render_stage_5(response)

    st.divider()
    render_stage_6(judge, scenario, response, rubric)


main()
