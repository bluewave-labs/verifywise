from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

from llm.base import ChatClient
from models.judge_score import JudgeScore, DimensionScore
from judge.prompt_builder import build_judge_messages
from judge.rubric import JudgeRubric


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
