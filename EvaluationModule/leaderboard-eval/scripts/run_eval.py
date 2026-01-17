#!/usr/bin/env python3
"""
VerifyWise Arena - LLM Leaderboard Evaluation Runner

Usage:
    python -m scripts.run_eval              # Full run
    python -m scripts.run_eval --resume     # Resume from checkpoint
    python -m scripts.run_eval --providers groq,together  # Specific providers
    python -m scripts.run_eval --dry-run    # Test without API calls
"""

import os
import sys
import asyncio
import argparse
from datetime import datetime
from pathlib import Path

import yaml
from dotenv import load_dotenv

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.judge import GPT4Judge
from src.eval import EvaluationRunner
from src.export import export_for_verifywise
from src.export.to_verifywise import export_detailed_results


def load_config(config_path: Path) -> dict:
    """Load YAML configuration file."""
    with open(config_path) as f:
        return yaml.safe_load(f)


def filter_providers(models_config: dict, providers: list) -> dict:
    """Filter to only specified providers."""
    if not providers:
        return models_config
    
    filtered = {"providers": {}}
    for name, config in models_config.get("providers", {}).items():
        if name in providers or name == "judge":
            filtered["providers"][name] = config
    
    return filtered


def estimate_runtime(models_config: dict, eval_config: dict) -> dict:
    """Estimate runtime and cost."""
    # Count models
    total_models = 0
    for name, config in models_config.get("providers", {}).items():
        if name != "judge":
            total_models += len(config.get("models", []))
    
    # Count scenarios
    benchmark_config = eval_config.get("benchmark", {})
    max_per_type = benchmark_config.get("max_scenarios_per_type", 30)
    num_scenarios = max_per_type * 3  # 3 scenario types
    
    usecase_config = eval_config.get("usecase", {})
    num_usecase = len(usecase_config.get("metrics", [])) * usecase_config.get("samples_per_metric", 10)
    
    total_calls = total_models * (num_scenarios + num_usecase)
    judge_calls = total_calls
    
    # Get judge model for cost estimation
    judge_config = models_config.get("judge", {})
    judge_model = judge_config.get("model", "gpt-4o-mini")
    judge_rate_limit = judge_config.get("rate_limit", 500)
    
    # Estimate time (conservative)
    avg_rate_limit = 50  # requests per minute average
    model_time_min = total_calls / avg_rate_limit
    judge_time_min = judge_calls / judge_rate_limit
    
    total_time_min = max(model_time_min, judge_time_min)  # Parallel
    
    # Estimate cost based on judge model
    tokens_per_call = 1500  # avg in + out
    model_cost = (total_calls * tokens_per_call / 1_000_000) * 0.50  # $0.50/M avg
    
    # Judge cost varies by model
    if "groq" in judge_model:
        judge_cost = 0  # FREE
        judge_name = "Groq (FREE)"
    elif "gpt-4o-mini" in judge_model:
        judge_cost = (judge_calls * 1200 / 1_000_000) * 0.30  # ~$0.30/M blended
        judge_name = "GPT-4o-mini (~$8)"
    else:  # gpt-4o
        judge_cost = (judge_calls * 1200 / 1_000_000) * 5.00  # ~$5/M blended
        judge_name = "GPT-4o (~$135)"
    
    return {
        "total_models": total_models,
        "scenarios_per_model": num_scenarios + num_usecase,
        "total_api_calls": total_calls + judge_calls,
        "estimated_time_hours": round(total_time_min / 60, 1),
        "estimated_cost_usd": round(model_cost + judge_cost, 0),
        "judge_model": judge_name,
    }


async def main():
    parser = argparse.ArgumentParser(description="VerifyWise Arena Evaluation")
    parser.add_argument("--resume", action="store_true", help="Resume from checkpoint")
    parser.add_argument("--providers", type=str, help="Comma-separated list of providers to run")
    parser.add_argument("--dry-run", action="store_true", help="Show estimates without running")
    parser.add_argument("--output-dir", type=str, help="Custom output directory")
    args = parser.parse_args()
    
    # Load environment variables
    load_dotenv()
    
    # Check required API key for judge
    judge_config = load_config(config_dir / "models.yaml").get("judge", {})
    judge_model = judge_config.get("model", "gpt-4o-mini")
    judge_api_key_env = judge_config.get("api_key_env", "OPENAI_API_KEY")
    
    if not os.getenv(judge_api_key_env) and not args.dry_run:
        print(f"ERROR: API key not found for {judge_model} judge")
        print(f"Please set the required API key environment variable in your .env file")
        sys.exit(1)
    
    # Load configurations
    config_dir = Path(__file__).parent.parent / "configs"
    models_config = load_config(config_dir / "models.yaml")
    eval_config = load_config(config_dir / "eval_config.yaml")
    
    # Filter providers if specified
    if args.providers:
        providers = [p.strip() for p in args.providers.split(",")]
        models_config = filter_providers(models_config, providers)
        print(f"Running with providers: {providers}")
    
    # Estimate runtime
    estimates = estimate_runtime(models_config, eval_config)
    
    print("=" * 60)
    print("  VerifyWise Arena - LLM Leaderboard Evaluation")
    print("=" * 60)
    print(f"\n📊 Evaluation Summary:")
    print(f"   Models to evaluate: {estimates['total_models']}")
    print(f"   Scenarios per model: {estimates['scenarios_per_model']}")
    print(f"   Total API calls: {estimates['total_api_calls']:,}")
    print(f"   Judge: {estimates['judge_model']}")
    print(f"\n⏱️  Estimated time: {estimates['estimated_time_hours']} hours")
    print(f"💰 Estimated cost: ~${estimates['estimated_cost_usd']}")
    
    if args.dry_run:
        print("\n[DRY RUN] Exiting without running evaluation.")
        return
    
    # Confirm before running
    print("\n" + "-" * 60)
    response = input("Start evaluation? [y/N]: ").strip().lower()
    if response != "y":
        print("Aborted.")
        return
    
    # Setup output directory
    run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    if args.output_dir:
        output_dir = Path(args.output_dir)
    else:
        output_dir = Path(__file__).parent.parent / "results" / f"run_{run_id}"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n📁 Output directory: {output_dir}")
    
    # Initialize judge
    judge_config = models_config.get("judge", {})
    judge_model = judge_config.get("model", "gpt-4o-mini")
    judge_api_key_env = judge_config.get("api_key_env", "OPENAI_API_KEY")
    judge_rate_limit = judge_config.get("rate_limit", 500)
    
    judge = GPT4Judge(
        api_key=os.getenv(judge_api_key_env),
        model=judge_model,
        rate_limit=judge_rate_limit,
    )
    
    print(f"🔍 Judge: {judge_model}")
    
    # Initialize runner
    runner = EvaluationRunner(
        models_config=models_config,
        eval_config=eval_config,
        judge=judge,
        output_dir=output_dir,
    )
    
    # Run evaluation
    print("\n🚀 Starting evaluation...")
    start_time = datetime.now()
    
    results = await runner.run(resume=args.resume)
    
    end_time = datetime.now()
    duration = end_time - start_time
    
    # Export results
    print("\n📤 Exporting results...")
    
    # VerifyWise import format
    vw_path = output_dir / "verifywise_import.json"
    export_for_verifywise(results, run_id, vw_path)
    
    # Detailed results
    detailed_path = output_dir / "detailed_results.json"
    export_detailed_results(results, detailed_path)
    
    # Summary
    successful = len([r for r in results if r.aggregated])
    failed = len([r for r in results if not r.aggregated])
    
    print("\n" + "=" * 60)
    print("  ✅ EVALUATION COMPLETE")
    print("=" * 60)
    print(f"\n📊 Results:")
    print(f"   Successful: {successful}")
    print(f"   Failed: {failed}")
    print(f"   Duration: {duration}")
    print(f"\n📁 Files:")
    print(f"   {vw_path}")
    print(f"   {detailed_path}")
    print(f"\n💡 Import {vw_path.name} to VerifyWise LLM Arena")


if __name__ == "__main__":
    asyncio.run(main())
