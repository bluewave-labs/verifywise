#!/usr/bin/env python3
"""
Demo script for the LLM-as-a-Judge Scorer Service.

This script demonstrates:
1. Creating a scorer from a YAML config
2. Using the scorer to judge a summarization task
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

# Add the EvaluationModule to the path
sys.path.insert(0, str(Path(__file__).parent))

from dotenv import load_dotenv
load_dotenv()

# Set OpenAI API key from environment
if os.getenv("OPENAI_API_KEY"):
    os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")
else:
    print("WARNING: OPENAI_API_KEY not found in environment")
    print("Set it with: export OPENAI_API_KEY='your-key'")
    sys.exit(1)

from scorers import ScorerService, LLMJudgeRunner


def main() -> None:
    # Step 1: Create scorer from YAML config
    print("Creating scorer from YAML config...")
    service = ScorerService()
    
    yaml_path = Path("configs/scorers/summarization_quality.yaml")
    if not yaml_path.exists():
        print(f"ERROR: Config file not found: {yaml_path}")
        sys.exit(1)
    
    summary = service.create_scorer_from_yaml(yaml_path)
    print(f"  Created scorer: {summary.name}")
    print(f"  Slug: {summary.slug}")
    print(f"  Judge model: {summary.judge_model_name}")
    print(f"  Saved to: {summary.path}")
    print()

    # Step 2: Use the scorer to judge a summarization
    print("Running judge evaluation...")
    runner = LLMJudgeRunner()

    input_text = (
        "Machine learning is a field of study that gives computers the ability "
        "to learn without being explicitly programmed."
    )

    model_output = (
        "Machine learning lets computers learn from data instead of having "
        "all rules coded by hand."
    )

    expected_text = (
        "Machine learning is about algorithms that improve their performance "
        "at tasks through experience (data) rather than explicit instructions."
    )

    result = runner.judge(
        scorer_slug=summary.slug,
        input_text=input_text,
        output_text=model_output,
        expected_text=expected_text,
    )

    print()
    print("=" * 50)
    print("JUDGE RESULT")
    print("=" * 50)
    print(f"  Label: {result.label}")
    print(f"  Score: {result.score}")
    print()
    print("Raw judge response:")
    print("-" * 50)
    print(result.raw_response)
    print("-" * 50)
    
    if result.total_tokens is not None:
        print()
        print("Token usage:")
        print(f"  prompt_tokens: {result.prompt_tokens}")
        print(f"  completion_tokens: {result.completion_tokens}")
        print(f"  total_tokens: {result.total_tokens}")


if __name__ == "__main__":
    main()
