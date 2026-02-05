from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List
import time

from llm.base import ChatClient
from models.candidate_response import CandidateResponse


@dataclass(frozen=True)
class InferConfig:
    model_id: str
    provider: str
    temperature: float = 0.2
    max_tokens: int = 500


def build_messages_from_scenario(s: Dict[str, Any]) -> List[Dict[str, str]]:
    # simple: scenario.prompt is already a complete “chat-style” prompt
    return [{"role": "user", "content": s["prompt"]}]


def run_inference(
    *,
    scenarios: List[Dict[str, Any]],
    client: ChatClient,
    cfg: InferConfig,
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    i = 0
    for s in scenarios:
        i += 1
        messages = build_messages_from_scenario(s)

        t0 = time.time()
        res = client.chat(messages=messages, temperature=cfg.temperature, max_tokens=cfg.max_tokens)
        dt_ms = int((time.time() - t0) * 1000)

        resp = CandidateResponse(
            response_id=f"resp_{cfg.model_id}_{i:06d}",
            scenario_id=s["scenario_id"],
            model_id=cfg.model_id,
            provider=cfg.provider,
            prompt=s["prompt"],
            messages=messages,
            output_text=res.text,
            raw=res.raw,
            meta={
                "latency_ms": dt_ms,
                "temperature": cfg.temperature,
                "max_tokens": cfg.max_tokens,
            },
        )
        out.append(resp.model_dump())

    return out
