from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

import pandas as pd
import streamlit as st


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    if not path.exists():
        return rows
    with path.open("r", encoding="utf-8") as f:
        for i, line in enumerate(f, start=1):
            line = line.strip()
            if not line:
                continue
            obj = json.loads(line)
            if not isinstance(obj, dict):
                raise ValueError(f"Expected JSON object at {path}:{i}")
            rows.append(obj)
    return rows


def build_index(
    scenarios: List[Dict[str, Any]],
    candidates: List[Dict[str, Any]],
    *,
    source_name: str,
) -> pd.DataFrame:
    scenario_by_id: Dict[str, Dict[str, Any]] = {s["scenario_id"]: s for s in scenarios}

    rows: List[Dict[str, Any]] = []
    for c in candidates:
        sid = c.get("scenario_id")
        s = scenario_by_id.get(sid, {})
        md_c = c.get("metadata") if isinstance(c.get("metadata"), dict) else {}
        md_s = s.get("metadata") if isinstance(s.get("metadata"), dict) else {}

        answer_text = c.get("answer_text") or ""
        rows.append(
            {
                "source": source_name,  # handcrafted / llm_tier1 / etc
                "scenario_id": sid,
                "answer_id": c.get("answer_id"),
                "label": c.get("label"),
                "scenario_type": s.get("scenario_type"),
                "risk_level": s.get("risk_level"),
                # LLM metadata (optional)
                "style_id": md_c.get("style_id"),
                "generator_model": md_c.get("generator_model"),
                "temperature": md_c.get("temperature"),
                # preview + full
                "answer_preview": answer_text[:140].replace("\n", " ") + ("…" if len(answer_text) > 140 else ""),
                "answer_text": answer_text,
                # raw for detail panes
                "_candidate": c,
                "_scenario": s,
                "_scenario_metadata": md_s,
                "_candidate_metadata": md_c,
            }
        )

    df = pd.DataFrame(rows)
    if df.empty:
        return df
    return df.sort_values(["scenario_type", "scenario_id", "label", "answer_id"], kind="stable")


def main() -> None:
    st.set_page_config(page_title="LLM Leaderboard Dataset Viewer", layout="wide")
    st.title("Dataset Viewer: Scenarios + Candidates")

    dataset_dir = Path(st.sidebar.text_input("Dataset dir", value="datasets/v0.1")).resolve()

    scenarios_path = dataset_dir / "scenarios.jsonl"
    candidates_path = dataset_dir / "candidates.jsonl"
    candidates_llm_path = dataset_dir / "candidates_llm.jsonl"

    st.sidebar.markdown("### Inputs")
    st.sidebar.write(f"Scenarios: `{scenarios_path}`")
    st.sidebar.write(f"Candidates (handcrafted): `{candidates_path}`")
    st.sidebar.write(f"Candidates (LLM Tier1): `{candidates_llm_path}`")

    include_llm = st.sidebar.checkbox("Include candidates_llm.jsonl", value=candidates_llm_path.exists())

    try:
        scenarios = read_jsonl(scenarios_path)
        candidates = read_jsonl(candidates_path)
        candidates_llm = read_jsonl(candidates_llm_path) if include_llm else []
    except Exception as e:
        st.error(f"Failed to load dataset: {e}")
        st.stop()

    if not scenarios:
        st.warning("No scenarios loaded. Check scenarios.jsonl path.")
        st.stop()

    df_hand = build_index(scenarios, candidates, source_name="handcrafted")
    df_llm = build_index(scenarios, candidates_llm, source_name="llm_tier1") if include_llm else pd.DataFrame()
    df = pd.concat([df_hand, df_llm], ignore_index=True) if not df_llm.empty else df_hand

    st.sidebar.markdown("### Filters")

    scenario_types = sorted([x for x in df["scenario_type"].dropna().unique().tolist() if x])
    risk_levels = sorted([x for x in df["risk_level"].dropna().unique().tolist() if x])
    labels = sorted([x for x in df["label"].dropna().unique().tolist() if x])
    sources = sorted(df["source"].dropna().unique().tolist())

    f_source = st.sidebar.multiselect("Source", options=sources, default=sources)
    f_type = st.sidebar.multiselect("Scenario type", options=scenario_types, default=scenario_types)
    f_risk = st.sidebar.multiselect("Risk level", options=risk_levels, default=risk_levels)
    f_label = st.sidebar.multiselect("Label", options=labels, default=labels)

    style_ids = sorted([x for x in df["style_id"].dropna().unique().tolist() if x])
    gen_models = sorted([x for x in df["generator_model"].dropna().unique().tolist() if x])

    f_style = st.sidebar.multiselect("Style ID (LLM)", options=style_ids, default=style_ids)
    f_model = st.sidebar.multiselect("Generator model (LLM)", options=gen_models, default=gen_models)

    search = st.sidebar.text_input("Search (scenario_id / answer_id / keyword)", value="").strip().lower()

    filtered = df.copy()
    if f_source:
        filtered = filtered[filtered["source"].isin(f_source)]
    if f_type:
        filtered = filtered[filtered["scenario_type"].isin(f_type)]
    if f_risk:
        filtered = filtered[filtered["risk_level"].isin(f_risk)]
    if f_label:
        filtered = filtered[filtered["label"].isin(f_label)]

    # Apply LLM filters only to LLM rows (keep handcrafted rows)
    if f_style:
        mask_llm = filtered["source"].str.contains("llm", na=False)
        filtered_llm = filtered[mask_llm]
        filtered_non = filtered[~mask_llm]
        filtered_llm = filtered_llm[filtered_llm["style_id"].isin(f_style)]
        filtered = pd.concat([filtered_non, filtered_llm], ignore_index=True)

    if f_model:
        mask_llm = filtered["source"].str.contains("llm", na=False)
        filtered_llm = filtered[mask_llm]
        filtered_non = filtered[~mask_llm]
        filtered_llm = filtered_llm[filtered_llm["generator_model"].isin(f_model)]
        filtered = pd.concat([filtered_non, filtered_llm], ignore_index=True)

    if search:
        filtered = filtered[
            filtered["scenario_id"].astype(str).str.lower().str.contains(search)
            | filtered["answer_id"].astype(str).str.lower().str.contains(search)
            | filtered["answer_text"].astype(str).str.lower().str.contains(search)
        ]

    st.subheader("Candidates")
    st.caption(f"Showing {len(filtered)} candidates (out of {len(df)})")

    table_cols = [
        "source", "scenario_type", "risk_level", "label",
        "scenario_id", "answer_id", "style_id", "generator_model",
        "temperature", "answer_preview"
    ]
    st.dataframe(filtered[table_cols], use_container_width=True, height=320)

    st.subheader("Inspect candidate")
    if len(filtered) == 0:
        st.info("No candidates match your filters.")
        st.stop()

    filtered = filtered.reset_index(drop=True)
    options = [
        f"[{i}] {row['scenario_id']} | {row['label']} | {row['source']} | {row.get('style_id') or ''} | {row['answer_id']}"
        for i, row in filtered.iterrows()
    ]
    pick = st.selectbox("Pick a candidate", options=options, index=0)
    idx = int(pick.split("]")[0].replace("[", ""))

    row = filtered.loc[idx]
    candidate = row["_candidate"]
    scenario = row["_scenario"]

    col1, col2 = st.columns([1, 1], gap="large")

    with col1:
        st.markdown("### Candidate answer")
        st.write(f"**answer_id:** `{candidate.get('answer_id')}`")
        st.write(f"**label:** `{candidate.get('label')}`  |  **source:** `{row['source']}`")
        st.write(f"**violation_tags:** `{candidate.get('violation_tags', [])}`")
        st.text_area("Answer text", value=candidate.get("answer_text", ""), height=320)

        with st.expander("Generator prompt sent to LLM (messages)"):
            md = candidate.get("metadata", {}) if isinstance(candidate.get("metadata"), dict) else {}
            msgs = md.get("prompt_messages", [])
            if not msgs:
                st.info("No prompt messages found in candidate.metadata.prompt_messages")
            else:
                for i, m in enumerate(msgs):
                    role = m.get("role", f"msg_{i}")
                    content = m.get("content", "")
                    st.markdown(f"**{role}**")
                    st.text_area(f"{role} content", value=content, height=160, key=f"msg_{idx}_{i}")

        with st.expander("Candidate metadata (raw JSON)"):
            st.json(candidate.get("metadata", {}), expanded=False)

        with st.expander("Candidate JSON (full)"):
            st.json(candidate, expanded=False)

    with col2:
        st.markdown("### Scenario")
        st.write(f"**scenario_id:** `{scenario.get('scenario_id')}`")
        st.write(f"**scenario_type:** `{scenario.get('scenario_type')}`  |  **risk_level:** `{scenario.get('risk_level')}`")
        st.text_area("Scenario prompt", value=scenario.get("prompt", ""), height=220)

        eb = scenario.get("expected_behavior", {})
        if isinstance(eb, dict):
            st.markdown("**Expected behavior**")
            st.write("**must:**", eb.get("must", []))
            st.write("**must_not:**", eb.get("must_not", []))

        with st.expander("Scenario tracking parameters (scenario.metadata)"):
            st.json(scenario.get("metadata", {}), expanded=False)

        with st.expander("Scenario JSON (full)"):
            st.json(scenario, expanded=False)


if __name__ == "__main__":
    main()
