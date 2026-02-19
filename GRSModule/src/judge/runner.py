from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple, Optional, Set
import traceback

from llm.base import ChatClient
from models.judge_score import JudgeScore, DimensionScore
from judge.prompt_builder import build_judge_messages
from judge.rubric import JudgeRubric
from llm.retry import retry_with_backoff, RetryConfig


@dataclass(frozen=True)
class JudgeConfig:
    judge_model_id: str
    judge_provider: str
    temperature: float = 0.0
    max_tokens: int = 800


def _weighted_mean(dim_scores: Dict[str, int], weights: Dict[str, float]) -> float:
    num = 0.0
    den = 0.0
    for k, w in weights.items():
        if k in dim_scores:
            num += float(dim_scores[k]) * float(w)
            den += float(w)
    return round(num / den, 4) if den > 0 else 0.0


def run_judging(
    *,
    pairs: List[Tuple[Dict[str, Any], Dict[str, Any]]],  # (scenario, response)
    client: ChatClient,
    rubric: JudgeRubric,
    cfg: JudgeConfig,
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    i = 0

    for scenario, response in pairs:
        i += 1
        messages = build_judge_messages(scenario=scenario, response=response, rubric=rubric)

        t0 = time.time()
        res = client.chat(messages=messages, temperature=cfg.temperature, max_tokens=cfg.max_tokens)
        latency_ms = int((time.time() - t0) * 1000)

        # Parse JSON (strict)
        data = json.loads(res.text)

        dim_list = []
        dim_map: Dict[str, int] = {}
        for d in data.get("dimension_scores", []):
            ds = DimensionScore.model_validate(d)
            dim_list.append(ds)
            dim_map[ds.dimension_id] = ds.score

        grs = data.get("grs_score")
        if grs is None:
            grs = _weighted_mean(dim_map, rubric.aggregation.weights)

        js = JudgeScore(
            judge_score_id=f"judge_{cfg.judge_model_id}_{i:06d}",
            scenario_id=scenario["scenario_id"],
            candidate_model_id=response["model_id"],
            candidate_provider=response["provider"],
            judge_model_id=cfg.judge_model_id,
            judge_provider=cfg.judge_provider,
            grs_score=float(grs),
            dimension_scores=dim_list,
            flags=data.get("flags", {}) or {},
            raw={"judge_raw": res.raw, "judge_parsed": data},
            meta={"latency_ms": latency_ms},
        )
        out.append(js.model_dump())

    return out


def run_judging_resumable(
    *,
    pairs: List[Tuple[Dict[str, Any], Dict[str, Any]]],  # (scenario, response)
    client: ChatClient,
    rubric: JudgeRubric,
    cfg: JudgeConfig,
    skip_keys: Optional[Set[tuple[str, str, str]]] = None,
    retry_max_attempts: int = 5,
) -> tuple[List[Dict[str, Any]], List[Dict[str, Any]], int]:
    """
    Returns (scores, failures, skipped_count).
    """
    skip_keys = skip_keys or set()
    retry_cfg = RetryConfig(max_attempts=retry_max_attempts)

    out: List[Dict[str, Any]] = []
    failures: List[Dict[str, Any]] = []
    skipped = 0
    i = 0

    for scenario, response in pairs:
        scenario_id = scenario["scenario_id"]
        cand_model = response.get("model_id", "unknown")
        key = (scenario_id, str(cand_model), cfg.judge_model_id)

        if key in skip_keys:
            skipped += 1
            continue

        i += 1
        messages = build_judge_messages(scenario=scenario, response=response, rubric=rubric)

        try:
            def _call():
                return client.chat(messages=messages, temperature=cfg.temperature, max_tokens=cfg.max_tokens)

            t0 = time.time()
            res = retry_with_backoff(_call, retry_cfg)
            latency_ms = int((time.time() - t0) * 1000)

            data = json.loads(res.text)

            dim_list = []
            dim_map: Dict[str, int] = {}
            for d in data.get("dimension_scores", []):
                ds = DimensionScore.model_validate(d)  # your evidence coercion fix handles schema drift
                dim_list.append(ds)
                dim_map[ds.dimension_id] = ds.score

            grs = data.get("grs_score")
            if grs is None:
                grs = _weighted_mean(dim_map, rubric.aggregation.weights)

            js = JudgeScore(
                judge_score_id=f"judge_{cfg.judge_model_id}_{i:06d}",
                scenario_id=scenario_id,
                candidate_model_id=response["model_id"],
                candidate_provider=response["provider"],
                judge_model_id=cfg.judge_model_id,
                judge_provider=cfg.judge_provider,
                grs_score=float(grs),
                dimension_scores=dim_list,
                flags=data.get("flags", {}) or {},
                raw={"judge_raw": res.raw, "judge_parsed": data},
                meta={"latency_ms": latency_ms},
            )
            out.append(js.model_dump())

        except Exception as e:
            failures.append(
                {
                    "scenario_id": scenario_id,
                    "candidate_model_id": response.get("model_id"),
                    "candidate_provider": response.get("provider"),
                    "judge_model_id": cfg.judge_model_id,
                    "judge_provider": cfg.judge_provider,
                    "error_type": type(e).__name__,
                    "error": str(e),
                    "traceback": traceback.format_exc(limit=3),
                }
            )

    return out, failures, skipped