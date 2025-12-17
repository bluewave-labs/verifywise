"""
Custom Scorer Executor - Runs LLM judge scorers from database configs

This module connects the scorer configs stored in the database (via web UI)
to actual execution using OpenAI or other LLM providers.

Supports multiple providers: OpenAI, Anthropic, Mistral, xAI, Google (Gemini), etc.
"""

import re
import os
from typing import Dict, Any, List, Optional, Tuple, Union
from dataclasses import dataclass

# OpenAI client (used for OpenAI-compatible APIs)
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


# Provider detection and configuration
PROVIDER_CONFIG = {
    "openai": {
        "env_var": "OPENAI_API_KEY",
        "base_url": None,  # Use default
    },
    "anthropic": {
        "env_var": "ANTHROPIC_API_KEY",
        "base_url": "https://api.anthropic.com/v1",
    },
    "mistral": {
        "env_var": "MISTRAL_API_KEY",
        "base_url": "https://api.mistral.ai/v1",
    },
    "xai": {
        "env_var": "XAI_API_KEY",
        "base_url": "https://api.x.ai/v1",
    },
    "google": {
        "env_var": "GEMINI_API_KEY",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
    },
    "gemini": {
        "env_var": "GEMINI_API_KEY",
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai",
    },
    "huggingface": {
        "env_var": "HF_API_KEY",
        "base_url": "https://api-inference.huggingface.co/v1",
    },
}

def get_provider_from_config(judge_model_config: Any) -> str:
    """
    Get the provider from the judge model configuration.
    
    The user explicitly selects both provider and model in the UI,
    so we use the provider from the config directly.
    
    Args:
        judge_model_config: The judgeModel config - can be dict or string
        
    Returns:
        Provider name (lowercase)
    """
    if isinstance(judge_model_config, dict):
        # New format: { name, provider, params }
        provider = judge_model_config.get("provider")
        if provider:
            return provider.lower()
    
    # Default to OpenAI if no provider specified
    return "openai"


def get_provider_client(provider: str) -> Tuple[Any, str]:
    """
    Get the appropriate API client and key for a provider.
    
    Args:
        provider: Provider name (e.g., "openai", "mistral")
        
    Returns:
        Tuple of (OpenAI client, api_key)
        
    Raises:
        RuntimeError: If API key is not set for the provider
    """
    if OpenAI is None:
        raise RuntimeError("OpenAI package not installed")
    
    config = PROVIDER_CONFIG.get(provider, PROVIDER_CONFIG["openai"])
    env_var = config["env_var"]
    base_url = config["base_url"]
    
    api_key = os.getenv(env_var)
    if not api_key:
        raise RuntimeError(f"{env_var} environment variable not set")
    
    # Create OpenAI client with appropriate base_url
    if base_url:
        client = OpenAI(api_key=api_key, base_url=base_url)
    else:
        client = OpenAI(api_key=api_key)
    
    return client, api_key


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
            - config.judgeModel: model config object with name/params/provider
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
    
    # Get judge model settings - handle both object and string formats
    judge_model_config = config.get("judgeModel", {})
    if isinstance(judge_model_config, dict):
        model_name = judge_model_config.get("name")
        model_params = judge_model_config.get("params", {})
    else:
        # Legacy: judgeModel is just a string
        model_name = judge_model_config
        model_params = {}
    
    if not model_name:
        raise ValueError(f"Scorer {scorer_name} has no judge model configured")
    
    # Get the provider from config (user explicitly selects provider + model)
    provider = get_provider_from_config(judge_model_config)
    print(f"   🔍 Using provider: {provider} for model: {model_name}")
    
    # Get temperature and max_tokens from params, with defaults
    temperature = model_params.get("temperature", 0.0)
    max_tokens = model_params.get("max_tokens", 256)
    
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
    
    # Get the appropriate client for this provider
    try:
        client, api_key = get_provider_client(provider)
        print(f"   ✅ Using {provider.upper()} API client")
    except RuntimeError as e:
        return ScorerResult(
            scorer_id=scorer_id,
            scorer_name=scorer_name,
            label="ERROR",
            score=0.0,
            raw_response=f"Failed to initialize model: {str(e)}",
            passed=False,
        )
    
    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=rendered_messages,
            temperature=temperature,
            max_tokens=max_tokens,
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
            raw_response=f"Error calling judge model ({provider}): {str(e)}",
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

