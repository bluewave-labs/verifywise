from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional

import yaml  # Require pyyaml; no try/except per request


def _default_config_path() -> Path:
    # EvaluationModule/src/deepeval_engine/config_loader.py
    # -> EvaluationModule/configs/deepeval_config.yaml
    return Path(__file__).parents[2] / "configs" / "deepeval_config.yaml"


def load_yaml_config(config_path: Optional[str] = None) -> Dict[str, Any]:
    """
    Load YAML config. If config_path is None, load from the default path.
    Returns an empty dict if the file does not exist or is empty.
    """
    path = Path(config_path) if config_path else _default_config_path()
    if not path.is_file():
        return {}
    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}
    return data if isinstance(data, dict) else {}


def build_runtime_config(
    args: Any,
    config_path: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Compose runtime configuration by merging YAML config with CLI flags.
    CLI overrides YAML.
    Returns a dict with:
      - model_name: str
      - provider: str
      - generation: { max_tokens: int, temperature: float }
      - metrics_config: Dict[str, bool]
      - thresholds: Dict[str, float]
      - output_dir: str
    """
    cfg = load_yaml_config(config_path)

    model_cfg = cfg.get("model", {}) if isinstance(cfg.get("model", {}), dict) else {}
    gen_cfg = model_cfg.get("generation", {}) if isinstance(model_cfg.get("generation", {}), dict) else {}
    metrics_cfg = cfg.get("metrics", {}) if isinstance(cfg.get("metrics", {}), dict) else {}
    thresholds_cfg = metrics_cfg.get("thresholds", {}) if isinstance(metrics_cfg.get("thresholds", {}), dict) else {}
    geval_cfg = metrics_cfg.get("g_eval", {}) if isinstance(metrics_cfg.get("g_eval", {}), dict) else {}
    output_cfg = cfg.get("output", {}) if isinstance(cfg.get("output", {}), dict) else {}

    # Resolve model + provider (CLI overrides)
    model_name = getattr(args, "model", None) or model_cfg.get("name") or os.getenv("EVAL_MODEL", "gpt-4o-mini")
    provider = getattr(args, "provider", None) or model_cfg.get("provider") or os.getenv("EVAL_PROVIDER", "openai")

    # Generation params
    generation = {
        "max_tokens": int(gen_cfg.get("max_tokens", 500)),
        "temperature": float(gen_cfg.get("temperature", 0.7)),
    }

    # Metrics booleans
    use_g_eval_flag = bool(getattr(args, "use_g_eval", False))
    metrics_config: Dict[str, bool] = {
        # G‑Eval (enabled by YAML metrics.g_eval.* or --use-g-eval)
        "g_eval_correctness": bool(geval_cfg.get("correctness", False)) or use_g_eval_flag,
        "g_eval_coherence": bool(geval_cfg.get("coherence", False)) or use_g_eval_flag,
        "g_eval_tonality": bool(geval_cfg.get("tonality", False)) or use_g_eval_flag,
        "g_eval_safety": bool(geval_cfg.get("safety", False)) or use_g_eval_flag,
        # Classic metrics (CLI overrides YAML)
        "answer_relevancy": bool(getattr(args, "use_answer_relevancy", False)) or bool(metrics_cfg.get("answer_relevancy", False)),
        "faithfulness": bool(getattr(args, "use_faithfulness", False)) or bool(metrics_cfg.get("faithfulness", False)),
        "contextual_relevancy": bool(getattr(args, "use_contextual_relevancy", False)) or bool(metrics_cfg.get("contextual_relevancy", False)),
        "hallucination": bool(getattr(args, "use_hallucination", False)) or bool(metrics_cfg.get("hallucination", False)),
        "bias": bool(getattr(args, "use_bias", False)) or bool(metrics_cfg.get("bias", False)),
        "toxicity": bool(getattr(args, "use_toxicity", False)) or bool(metrics_cfg.get("toxicity", False)),
    }

    # Category/bundle auto-selection
    task_type = (cfg.get("task_type") or cfg.get("category") or "").strip().lower()
    # Optional bundles section for fine-grained toggles
    bundles = cfg.get("bundles", {}) if isinstance(cfg.get("bundles", {}), dict) else {}

    def enable(key: str) -> None:
        metrics_config[key] = True

    if task_type == "rag":
        # RAG bundle
        enable("answer_relevancy")
        enable("faithfulness")
        enable("contextual_relevancy")
        # GEval approximations for recall/precision/ragas when requested
        if bool(bundles.get("contextual_recall", True)):
            enable("contextual_recall")
        if bool(bundles.get("contextual_precision", True)):
            enable("contextual_precision")
        if bool(bundles.get("ragas", False)):
            enable("ragas")
        # Others commonly used with RAG
        if bool(bundles.get("hallucination", True)):
            enable("hallucination")
    elif task_type == "agent" or task_type == "agents":
        # Agentic bundle
        enable("task_completion")
        enable("tool_correctness")
        # Safety often relevant for agents
        enable("g_eval_safety")
    elif task_type == "chatbot" or task_type == "chatbots":
        # Conversational bundle
        enable("knowledge_retention")
        enable("conversation_completeness")
        enable("conversation_relevancy")
        enable("role_adherence")
        # Tone and coherence are also relevant
        enable("g_eval_coherence")
        enable("g_eval_tonality")

    # Others bundle (available regardless of task_type via YAML.bundles)
    if bool(bundles.get("summarization", False)):
        enable("summarization")
    if bool(bundles.get("bias", False)):
        enable("bias")
    if bool(bundles.get("toxicity", False)):
        enable("toxicity")

    output_dir = str(Path(output_cfg.get("dir", getattr(args, "output_dir", "artifacts/deepeval_results"))).resolve())
    dataset_cfg = cfg.get("dataset", {}) if isinstance(cfg.get("dataset", {}), dict) else {}
    builtin_value = dataset_cfg.get("use_builtin", True)
    builtin_name: str | None = None
    builtin_path: str | None = None
    # Map built-in dataset names to preset files
    preset_map = {
        "chatbot": "data/presets/chatbot_dataset.json",
        "rag": "data/presets/rag_dataset.json",
        "agent": "data/presets/agent_dataset.json",
        "safety": "data/presets/safety_dataset.json",
    }
    if isinstance(builtin_value, str):
        builtin_name = builtin_value.strip().lower()
        if builtin_name in preset_map:
            builtin_path = preset_map[builtin_name]
        else:
            # Unknown name; leave path None so defaults/CLI can take over
            builtin_path = None
        use_builtin_flag = True
    else:
        use_builtin_flag = bool(builtin_value)
        builtin_path = dataset_cfg.get("path")
    dataset = {
        "use_builtin": use_builtin_flag,
        "name": builtin_name,
        "path": builtin_path or dataset_cfg.get("path"),
    }

    return {
        "model_name": model_name,
        "provider": provider,
        "generation": generation,
        "metrics_config": metrics_config,
        "thresholds": thresholds_cfg if isinstance(thresholds_cfg, dict) else {},
        "output_dir": output_dir,
        "dataset": dataset,
    }


