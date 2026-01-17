"""Export results in VerifyWise import format."""

import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from dataclasses import asdict


def export_for_verifywise(
    results: List[Any],
    run_id: str,
    output_path: Path,
) -> Dict[str, Any]:
    """
    Export evaluation results in VerifyWise import format.
    
    Args:
        results: List of ModelResult objects
        run_id: Unique identifier for this evaluation run
        output_path: Path to save the JSON file
    
    Returns:
        The exported data structure
    """
    
    # Filter successful results
    successful = [r for r in results if r.aggregated and len(r.errors) < 10]
    
    # Build export structure
    export_data = {
        "version": "1.0",
        "run_id": run_id,
        "created_at": datetime.now().isoformat(),
        "total_models": len(successful),
        "evaluation_config": {
            "benchmark_version": "v0.1",
            "judge_model": "gpt-4o",
        },
        "models": []
    }
    
    # Add each model's results
    for result in successful:
        model_entry = {
            "model": result.model_name,
            "model_id": result.model_id,
            "provider": result.provider,
            "scores": {
                # Benchmark scores
                "compliance": result.aggregated.get("compliance", 0),
                "ambiguity": result.aggregated.get("ambiguity", 0),
                "reasoning": result.aggregated.get("reasoning", 0),
                # Use-case scores
                "correctness": result.aggregated.get("correctness", 0),
                "completeness": result.aggregated.get("completeness", 0),
                "relevancy": result.aggregated.get("relevancy", 0),
                # Safety scores (already inverted in runner)
                "bias": result.aggregated.get("bias", 0),
                "toxicity": result.aggregated.get("toxicity", 0),
                "hallucination": result.aggregated.get("hallucination", 0),
            },
            "overall_score": result.aggregated.get("overall", 0),
            "eval_count": (
                sum(len(v) for v in result.benchmark_scores.values()) +
                sum(len(v) for v in result.usecase_scores.values())
            ),
            "evaluated_at": result.completed_at,
        }
        export_data["models"].append(model_entry)
    
    # Sort by overall score (descending)
    export_data["models"].sort(key=lambda x: x["overall_score"], reverse=True)
    
    # Add rankings
    for i, model in enumerate(export_data["models"]):
        model["rank"] = i + 1
    
    # Save to file
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(export_data, f, indent=2)
    
    print(f"Exported {len(successful)} models to {output_path}")
    
    return export_data


def export_detailed_results(
    results: List[Any],
    output_path: Path,
) -> None:
    """Export full detailed results including all individual scores."""
    
    detailed = []
    for result in results:
        detailed.append({
            "model_id": result.model_id,
            "model_name": result.model_name,
            "provider": result.provider,
            "benchmark_scores": result.benchmark_scores,
            "usecase_scores": result.usecase_scores,
            "aggregated": result.aggregated,
            "errors": result.errors,
            "completed_at": result.completed_at,
        })
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(detailed, f, indent=2)
    
    print(f"Exported detailed results to {output_path}")
