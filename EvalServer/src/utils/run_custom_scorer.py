"""
Custom Scorer Executor - Runs LLM judge scorers from database configs

This module connects the scorer configs stored in the database (via web UI)
to actual execution using OpenAI or other LLM providers.
"""

import re
import os
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

# OpenAI client
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


@dataclass
class ScorerResult:
    """Result from running a custom scorer."""
    scorer_id: str
    scorer_name: str
    label: str
    score: float
    raw_response: str
    passed: bool
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
    messages: List[Dict[str, str]],
    values: Dict[str, str],
) -> List[Dict[str, str]]:
    """
    Render message templates with placeholder values.
    
    Messages from DB have format: [{"role": "system", "content": "..."}]
    """
    rendered = []
    for msg in messages:
        # Support both 'content' (from frontend) and 'template' (from YAML)
        template = msg.get("content") or msg.get("template", "")
        rendered.append({
            "role": msg.get("role", "user"),
            "content": render_template(template, values),
        })
    return rendered


def extract_label(raw_text: str) -> str:
    """
    Extract the label from the judge model's response.
    
    Handles responses like:
    - "PASS" or "FAIL"
    - "PASS: The summary is good..."
    - "**PASS**"
    """
    if not raw_text:
        return "UNKNOWN"
    
    # Take the first line, first word
    first_line = raw_text.strip().splitlines()[0]
    first_token = first_line.split()[0] if first_line.split() else ""
    
    # Clean up and normalize
    label = "".join(ch for ch in first_token.upper() if ch.isalpha())
    return label or "UNKNOWN"


def label_to_score(label: str, choice_scores: List[Dict[str, Any]]) -> float:
    """
    Map a label (e.g. "PASS") to its numeric score from the config.
    If label not found, default to 0.0.
    """
    for choice in choice_scores:
        if choice.get("label", "").upper() == label.upper():
            return float(choice.get("score", 0.0))
    return 0.0


async def run_custom_scorer(
    scorer_config: Dict[str, Any],
    input_text: str,
    output_text: str,
    expected_text: str = "",
    metadata: Optional[Dict[str, Any]] = None,
) -> ScorerResult:
    """
    Execute a custom LLM judge scorer.
    
    Args:
        scorer_config: Scorer configuration from database, including:
            - id, name, metricKey
            - config.judgeModel: model name (e.g. "gpt-4o-mini")
            - config.messages: list of message templates
            - config.choiceScores: list of {label, score} mappings
            - defaultThreshold: pass/fail threshold
        input_text: The input/prompt given to the model
        output_text: The model's actual output to evaluate
        expected_text: Optional expected/reference output
        metadata: Optional additional context
        
    Returns:
        ScorerResult with label, score, and pass/fail status
    """
    if OpenAI is None:
        raise RuntimeError("OpenAI package not installed")
    
    scorer_id = scorer_config.get("id", "unknown")
    scorer_name = scorer_config.get("name", "Custom Scorer")
    config = scorer_config.get("config", {})
    
    # Get judge model settings
    judge_model = config.get("judgeModel", "gpt-4o-mini")
    messages_templates = config.get("messages", [])
    choice_scores = config.get("choiceScores", [])
    threshold = scorer_config.get("defaultThreshold", 0.5)
    
    if not messages_templates:
        raise ValueError(f"Scorer {scorer_name} has no message templates configured")
    
    # Render message templates with actual values
    values = {
        "input": input_text,
        "output": output_text,
        "expected": expected_text,
        **(metadata or {}),
    }
    
    rendered_messages = render_messages(messages_templates, values)
    
    # Call the judge model
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    
    client = OpenAI(api_key=api_key)
    
    try:
        response = client.chat.completions.create(
            model=judge_model,
            messages=rendered_messages,
            temperature=0.0,  # Deterministic for judging
            max_tokens=256,
        )
        
        raw_response = response.choices[0].message.content.strip()
        usage = response.usage
        
        # Extract label and map to score
        label = extract_label(raw_response)
        score = label_to_score(label, choice_scores)
        passed = score >= threshold if threshold is not None else True
        
        return ScorerResult(
            scorer_id=scorer_id,
            scorer_name=scorer_name,
            label=label,
            score=score,
            raw_response=raw_response,
            passed=passed,
            prompt_tokens=getattr(usage, "prompt_tokens", None),
            completion_tokens=getattr(usage, "completion_tokens", None),
            total_tokens=getattr(usage, "total_tokens", None),
        )
        
    except Exception as e:
        # Return a failed result on error
        return ScorerResult(
            scorer_id=scorer_id,
            scorer_name=scorer_name,
            label="ERROR",
            score=0.0,
            raw_response=f"Error calling judge model: {str(e)}",
            passed=False,
        )


async def run_custom_scorers_batch(
    scorer_configs: List[Dict[str, Any]],
    input_text: str,
    output_text: str,
    expected_text: str = "",
    metadata: Optional[Dict[str, Any]] = None,
) -> List[ScorerResult]:
    """
    Run multiple custom scorers on a single input/output pair.
    
    Args:
        scorer_configs: List of scorer configurations from database
        input_text: The input/prompt given to the model
        output_text: The model's actual output to evaluate
        expected_text: Optional expected/reference output
        metadata: Optional additional context
        
    Returns:
        List of ScorerResult for each scorer
    """
    results = []
    for config in scorer_configs:
        result = await run_custom_scorer(
            scorer_config=config,
            input_text=input_text,
            output_text=output_text,
            expected_text=expected_text,
            metadata=metadata,
        )
        results.append(result)
    return results

