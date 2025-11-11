#!/usr/bin/env python3
"""
Unified Evaluation Pipeline Entrypoint

This script runs the full evaluation pipeline end-to-end:
  1) Load prompts (built-in or from file)
  2) Generate model responses
  3) Build DeepEval test cases
  4) Run metrics (including optional G-Eval judge)
  5) Save results and print summary

Usage examples:
  # Run with the 4 G‑Eval metrics (Answer Correctness, Coherence, Tonality, Safety)
  python main.py --use-g-eval \
    --model gpt-4o-mini --provider openai --limit 5

  # Classic DeepEval metrics + G‑Eval
  python main.py --use-answer-relevancy --use-faithfulness --use-g-eval \
    --model TinyLlama/TinyLlama-1.1B-Chat-v1.0 --provider huggingface
"""

import os
import json
import argparse
from pathlib import Path
import sys
try:
    import yaml  # type: ignore
except Exception:
    yaml = None  # YAML optional; warn if missing
from typing import Any, Dict, List, Optional

from deepeval.test_case import LLMTestCase

from src.deepeval_engine.model_runner import ModelRunner
from src.deepeval_engine.deepeval_evaluator import DeepEvalEvaluator
from src.deepeval_engine.config_loader import build_runtime_config


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the unified evaluation pipeline")

    parser.add_argument("--prompts-file", type=str, default=None, help="Path to JSON file of prompts. Each item: {input, expected?}")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of prompts")
    parser.add_argument("--config", type=str, default=str(Path("configs/deepeval_config.yaml")), help="Path to YAML config (overridden by CLI flags)")

    parser.add_argument("--model", type=str, default=os.getenv("EVAL_MODEL", "gpt-4o-mini"), help="Model name/id for inference")
    parser.add_argument("--provider", type=str, default=os.getenv("EVAL_PROVIDER", "openai"), help="Provider: openai|huggingface|anthropic|gemini|xai|mistral|ollama")

    # Metric toggles
    parser.add_argument("--use-g-eval", action="store_true", help="Enable the 4 G‑Eval metrics (Correctness, Coherence, Tonality, Safety)")

    # Classic metrics (optional)
    parser.add_argument("--use-answer-relevancy", action="store_true")
    parser.add_argument("--use-faithfulness", action="store_true")
    parser.add_argument("--use-contextual-relevancy", action="store_true")
    parser.add_argument("--use-hallucination", action="store_true")
    parser.add_argument("--use-bias", action="store_true")
    parser.add_argument("--use-toxicity", action="store_true")

    parser.add_argument("--output-dir", type=str, default=str(Path("artifacts/deepeval_results").resolve()))

    return parser.parse_args()


def load_prompts_from_file(path: str) -> List[Dict[str, Any]]:
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("prompts file must be a JSON list of {input, expected?}")
    return data


def default_prompts() -> List[Dict[str, str]]:
    return [
        {"id": "ex1", "input": "Explain recursion with a simple example.", "expected": "A function calling itself with base case."},
        {"id": "ex2", "input": "Summarize the purpose of unit tests in one sentence.", "expected": "They verify code correctness automatically."},
        {"id": "ex3", "input": "Is the following statement toxic? 'You are terrible at this.'", "expected": "Yes, it is toxic or negative."},
    ]


def build_test_cases(
    prompts: List[Dict[str, Any]],
    responses: List[str],
) -> List[Dict[str, Any]]:
    test_cases_data: List[Dict[str, Any]] = []
    for i, (p, out) in enumerate(zip(prompts, responses), 1):
        # Include retrieval_context if provided (for RAG classics)
        retrieval_context = p.get("retrieval_context")
        if retrieval_context is not None and not isinstance(retrieval_context, list):
            retrieval_context = [str(retrieval_context)]
        tc = LLMTestCase(
            input=p.get("input", ""),
            actual_output=out or "",
            expected_output=p.get("expected") or "",
            retrieval_context=retrieval_context,
        )
        metadata = {
            "sample_id": p.get("id", f"sample_{i}"),
            "protected_attributes": {
                "category": p.get("category", "general"),
                "difficulty": p.get("difficulty", "unknown"),
            },
        }
        test_cases_data.append({"test_case": tc, "metadata": metadata})
    return test_cases_data


def main() -> int:
    args = parse_args()

    # Resolve runtime config from YAML + CLI (automatic load from configs/deepeval_config.yaml)
    runtime = build_runtime_config(args, config_path=args.config)

    # Load prompts with clear precedence:
    # 1) --prompts-file
    # 2) YAML dataset path (which can be resolved from a builtin name)
    # 3) Built-in defaults in code
    if args.prompts_file:
        print(f"Using prompts from CLI file: {args.prompts_file}")
        prompts = load_prompts_from_file(args.prompts_file)
    else:
        dataset_info = runtime.get("dataset") or {}
        dataset_path = dataset_info.get("path")
        if dataset_path:
            print(f"Using prompts from config: {dataset_path}")
            try:
                prompts = load_prompts_from_file(dataset_path)
            except FileNotFoundError:
                print(f"Config dataset file not found: {dataset_path}. Falling back to defaults.")
                prompts = default_prompts()
        else:
            print("No dataset path provided; using built-in default prompts.")
            prompts = default_prompts()
    if args.limit:
        prompts = prompts[: args.limit]

    print(f"Loaded {len(prompts)} prompts")
    model_name = runtime["model_name"]
    provider = runtime["provider"]
    print(f"Model: {model_name} | Provider: {provider}")

    # Generate responses
    try:
        runner = ModelRunner(model_name=model_name, provider=provider)
        max_tokens = int(runtime["generation"]["max_tokens"])  # from YAML or default
        temperature = float(runtime["generation"]["temperature"])  # from YAML or default
        responses = runner.generate_batch([p.get("input", "") for p in prompts], max_tokens=max_tokens, temperature=temperature)
    except Exception as e:
        print(f"Error generating responses: {e}")
        return 1

    if not responses:
        print("No responses generated; exiting")
        return 1

    # Build test cases for DeepEval
    test_cases_data = build_test_cases(prompts, responses)

    # Metrics configuration from runtime
    metrics_config = runtime["metrics_config"]

    # Minimal config manager shim for evaluator
    class _SimpleConfig:
        def __init__(self) -> None:
            self.model = type("obj", (object,), {"model_id": args.model})()
            self.dataset = type("obj", (object,), {"name": "evaluation_dataset"})()

    config_manager = type("obj", (object,), {"config": _SimpleConfig()})()

    evaluator = DeepEvalEvaluator(
        config_manager=config_manager,
        output_dir=runtime["output_dir"],
        metric_thresholds=runtime["thresholds"],
    )

    print("\nRunning evaluation with metrics:")
    enabled = [k for k, v in metrics_config.items() if v]
    print("  " + ", ".join(enabled) if enabled else "  (none)")

    try:
        results = evaluator.run_evaluation(test_cases_data=test_cases_data, metrics_config=metrics_config)
    except Exception as e:
        print(f"Evaluation error: {e}")
        return 1

    print("\nPipeline complete.")
    print(f"Saved outputs to: {args.output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


