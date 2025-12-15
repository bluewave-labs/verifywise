from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, List, Optional

from openai import OpenAI  

from .config_schema import (
    LLMJudgeScorerConfig,
    MessageTemplate,
)
from .json_repository import JsonScorerRepository

@dataclass
class JudgeResult:
    label: str          # e.g. "PASS"
    score: float        # numeric score from scorer config (e.g. 1.0)
    raw_response: str   # raw text from the judge model (for debugging)
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None

_PLACEHOLDER_PATTERN = re.compile(r"{{\s*([a-zA-Z0-9_]+)\s*}}")

def render_template(template: str, values: Dict[str, str]) -> str:
    """
    Replace {{placeholder}} occurrences with values[placeholder].

    If a placeholder is missing in `values`, it is replaced with an empty string.
    """

    def _sub(match: re.Match) -> str:
        key = match.group(1)
        return values.get(key, "")

    return _PLACEHOLDER_PATTERN.sub(_sub, template)

def render_messages(
    messages: List[MessageTemplate],
    values: Dict[str, str],
    ) -> List[Dict[str, str]]:
    """
    Convert MessageTemplate -> OpenAI-style messages:
    [{"role": "system", "content": "..."}, ...],
    with placeholders rendered.
    """
    rendered = []
    for m in messages:
        rendered.append(
            {
                "role": m.role,
                "content": render_template(m.template, values)
            }
        )
    return rendered


class LLMJudgeRunner:
    """
    Uses a stored scorer (JSON) to evaluate a single prediction.

    Flow:
      1) Load scorer config by slug.
      2) Render messages with {input, output, expected}.
      3) Call judge model (e.g. gpt-4o-mini) via OpenAI client.
      4) Parse label from response (e.g. "PASS"/"FAIL").
      5) Map label -> numeric score using scorer choices.
    """
    def __init__(
        self,
        repo: Optional[JsonScorerRepository] = None,
        openai_client: Optional[OpenAI] = None,
    ) -> None:
        self.repo = repo or JsonScorerRepository()
        self.client = openai_client or OpenAI()

    def judge(
            self,
        scorer_slug: str,
        *,
        input_text: str,
        output_text: str,
        expected_text: str | None = None,
        ) -> JudgeResult:
        """
        Evaluate a single (input, output, expected) triple using the scorer.

        expected_text can be None if you don't use it in your templates.
        """
        config = self.repo.load_scorer(scorer_slug)

        values = {
            "input": input_text,
            "output": output_text,
            "expected": expected_text or "",
        }

        messages = render_messages(config.messages, values)
        response = self._call_judge_model(config, messages)

        raw_text = response.choices[0].message.content.strip()
        label = self._extract_label(raw_text)

        score = self._label_to_score(label, config)

        usage = response.usage
        return JudgeResult(
            label=label,
            score=score,
            raw_response=raw_text,
            prompt_tokens=getattr(usage, "prompt_tokens", None),
            completion_tokens=getattr(usage, "completion_tokens", None),
            total_tokens=getattr(usage, "total_tokens", None),
        )

    def _call_judge_model(
        self,
        config: LLMJudgeScorerConfig,
        messages: List[Dict[str, str]],
    ):
        """
        Calls gpt-4.1-mini (or whatever is set in config.judge_model).
        """
        model_name = config.judge_model.name
        params = {
            "model": model_name,
            "messages": messages,
            "temperature": config.judge_model.params.get("temperature", 0.0),
            "max_tokens": config.judge_model.params.get("max_tokens", 256),
        }

        return self.client.chat.completions.create(**params)

    @staticmethod
    def _extract_label(raw_text: str) -> str:
        """
        Extract the label from the judge model's response.

        For v1, we assume the model either returns:
          - exactly "PASS" or "FAIL", or
          - text that starts with the label, e.g. "PASS: The summary is good..."

        We normalize to uppercase and strip.
        """
        # Take the first word, normalize, and keep only A-Z chars.
        first_line = raw_text.splitlines()[0]
        first_token = first_line.split()[0]
        label = "".join(ch for ch in first_token.upper() if ch.isalpha())
        return label

    @staticmethod
    def _label_to_score(label: str, config: LLMJudgeScorerConfig) -> float:
        """
        Map a label (e.g. "PASS") to its numeric score from the config.

        If label not found, default to 0.0.
        """
        for choice in config.choices:
            if choice.label.upper() == label.upper():
                return choice.score
        # Fallback: label not found
        return 0.0