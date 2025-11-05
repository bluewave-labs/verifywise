"""
Evaluation Runner - Executes DeepEval evaluations and stores results
"""

import os
import sys
import asyncio
import json
import traceback
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession

# Add EvaluationModule to path (use absolute path)
evaluation_module_path = Path(__file__).parent.parent.parent.parent / "EvaluationModule"
sys.path.insert(0, str((evaluation_module_path / "src").resolve()))

from crud import evaluation_logs as crud


async def run_evaluation(
    db: AsyncSession,
    experiment_id: str,
    config: Dict[str, Any],
    tenant: str,
) -> Dict[str, Any]:
    """
    Run a DeepEval evaluation based on experiment configuration.
    
    Args:
        db: Database session
        experiment_id: Experiment ID
        config: Experiment configuration with model, dataset, judge LLM, metrics
        tenant: Tenant ID
        
    Returns:
        Evaluation results
    """
    print(f"\n{'='*70}")
    print(f"Starting Evaluation: {experiment_id}")
    print(f"{'='*70}\n")
    
    # Debug: Print Python info
    print(f"🐍 Python version: {sys.version}")
    print(f"🐍 Python executable: {sys.executable}")
    print(f"📦 sys.path[0]: {sys.path[0]}")
    print(f"📦 EvaluationModule path added: {str((evaluation_module_path / 'src').resolve())}")
    print()
    
    try:
        # Helper: ensure Ollama model is locally available
        def ensure_ollama_model(model_name: str) -> None:
            try:
                # Check if model exists locally
                list_proc = subprocess.run(["ollama", "list"], capture_output=True, text=True, timeout=30)
                if list_proc.returncode == 0 and model_name in list_proc.stdout:
                    print(f"✓ Ollama model '{model_name}' is available locally")
                    return
                print(f"• Ollama model '{model_name}' not found locally; pulling...")
                pull_proc = subprocess.run(["ollama", "pull", model_name], text=True, timeout=600)
                if pull_proc.returncode == 0:
                    print(f"✓ Pulled Ollama model '{model_name}' successfully")
                else:
                    print(f"⚠️  Unable to pull Ollama model '{model_name}'. You may need to run 'ollama pull {model_name}' manually.")
            except Exception as _e:
                print(f"⚠️  Could not verify/pull Ollama model '{model_name}': {_e}")

        # Import DeepEval modules
        print("Importing deepeval_engine...")
        from deepeval_engine import ModelRunner, DeepEvalEvaluator
        print("✅ deepeval_engine imported")
        
        print("Importing deepeval.test_case...")
        from deepeval.test_case import LLMTestCase
        print("✅ deepeval imported")
        
        # Extract configuration
        model_config = config.get("model", {})
        judge_config = config.get("judgeLlm", {})
        dataset_config = config.get("dataset", {})
        metrics_config = config.get("metrics", {})
        thresholds_config = config.get("thresholds", {})
        
        # Set up API keys from config (if provided)
        # Judge LLM API keys (for DeepEval metrics)
        print(f"📝 Judge LLM config: provider={judge_config.get('provider')}, has_apiKey={bool(judge_config.get('apiKey'))}")
        if judge_config.get("apiKey") and judge_config["apiKey"] not in ["***", "", None]:
            provider = judge_config.get("provider", "").lower()
            print(f"🔑 Setting API key for judge provider: {provider}")
            if provider == "openai":
                os.environ["OPENAI_API_KEY"] = judge_config["apiKey"]
                print(f"✅ OPENAI_API_KEY set")
            elif provider == "anthropic":
                os.environ["ANTHROPIC_API_KEY"] = judge_config["apiKey"]
            elif provider == "gemini":
                os.environ["GEMINI_API_KEY"] = judge_config["apiKey"]
            elif provider == "xai":
                os.environ["XAI_API_KEY"] = judge_config["apiKey"]
            elif provider == "mistral":
                os.environ["MISTRAL_API_KEY"] = judge_config["apiKey"]
        
        # Model API keys (for the model being tested)
        if model_config.get("apiKey") and model_config["apiKey"] != "***":
            provider = model_config.get("accessMethod", "").lower()
            if provider == "openai":
                os.environ["OPENAI_API_KEY"] = model_config["apiKey"]
            elif provider == "anthropic":
                os.environ["ANTHROPIC_API_KEY"] = model_config["apiKey"]
            elif provider == "gemini":
                os.environ["GEMINI_API_KEY"] = model_config["apiKey"]
            elif provider == "xai":
                os.environ["XAI_API_KEY"] = model_config["apiKey"]
            elif provider == "mistral":
                os.environ["MISTRAL_API_KEY"] = model_config["apiKey"]
            elif provider == "custom_api":
                # For custom API, we'll set as OPENAI_API_KEY since we use OpenAI client
                os.environ["OPENAI_API_KEY"] = model_config["apiKey"]
                if model_config.get("endpointUrl"):
                    os.environ["OPENAI_API_BASE"] = model_config["endpointUrl"]
        
        # 1. Initialize Model Runner
        print(f"📦 Initializing model: {model_config.get('name', 'unknown')}")
        
        model_provider = model_config.get("accessMethod", "ollama").lower()
        model_name = model_config.get("name")
        
        # Map frontend provider names to ModelRunner names
        provider_mapping = {
            "local": "huggingface",    # Local files treated as HuggingFace models
            "custom_api": "openai",    # Custom API uses OpenAI client with custom base_url
            "openai": "openai",        # OpenAI API
            "anthropic": "anthropic",  # Anthropic API (now supported!)
            "gemini": "gemini",        # Gemini API (now supported!)
            "xai": "xai",              # xAI API (now supported!)
            "mistral": "mistral",      # Mistral API (now supported!)
            "huggingface": "huggingface",  # HuggingFace models
            "ollama": "ollama",        # Ollama local server
        }
        
        runner_provider = provider_mapping.get(model_provider, "ollama")
        
        # Set custom endpoint if provided
        if model_config.get("endpointUrl"):
            if runner_provider == "ollama":
                os.environ["OLLAMA_HOST"] = model_config["endpointUrl"]
            elif runner_provider == "openai":
                os.environ["OPENAI_API_BASE"] = model_config["endpointUrl"]
        
        try:
            model_runner = ModelRunner(
                model_name=model_name,
                provider=runner_provider,
            )
        except Exception as e:
            error_msg = f"Failed to initialize model: {str(e)}"
            print(f"❌ {error_msg}")
            await crud.update_experiment_status(
                db=db,
                experiment_id=experiment_id,
                tenant=tenant,
                status="failed",
                error_message=error_msg
            )
            return {"error": error_msg}
        
        # If using Ollama, proactively ensure the model exists locally before generation
        if runner_provider == "ollama" and isinstance(model_name, str):
            ensure_ollama_model(model_name)
        
        # 2. Load Dataset
        print(f"\n📊 Loading dataset: {dataset_config.get('count', 0)} prompts")
        
        prompts = dataset_config.get("prompts", [])
        if not prompts:
            error_msg = "No prompts in dataset"
            print(f"❌ {error_msg}")
            await crud.update_experiment_status(
                db=db,
                experiment_id=experiment_id,
                tenant=tenant,
                status="failed",
                error_message=error_msg
            )
            return {"error": error_msg}
        
        # 3. Generate Responses
        print(f"\n🤖 Generating {len(prompts)} responses...\n")
        
        test_cases_data = []
        
        for idx, prompt_data in enumerate(prompts, 1):
            try:
                print(f"  [{idx}/{len(prompts)}] Processing: {prompt_data['prompt'][:50]}...")
                
                start_time = datetime.now()
                
                # Generate response (first attempt)
                response = model_runner.generate(
                    prompt=prompt_data["prompt"],
                    max_tokens=2048,
                    temperature=0.7,
                )
                
                # If response is empty/whitespace, retry once with safer params
                if not response or not str(response).strip():
                    print("     • Empty response, retrying with higher max_tokens/lower temperature...")
                    try:
                        response = model_runner.generate(
                            prompt=prompt_data["prompt"],
                            max_tokens=2048,
                            temperature=0.2,
                        )
                    except Exception as retry_err:
                        print(f"     • Retry failed: {retry_err}")
                
                # If still empty, mark as error and continue
                if not response or not str(response).strip():
                    await crud.create_log(
                        db=db,
                        project_id=config.get("project_id"),
                        tenant=tenant,
                        experiment_id=experiment_id,
                        input_text=prompt_data["prompt"],
                        output_text="",
                        model_name=model_name,
                        latency_ms=int((datetime.now() - start_time).total_seconds() * 1000),
                        token_count=0,
                        status="error",
                        error_message="empty_output",
                    )
                    print("     ✗ Empty output after retry - logged as error")
                    continue
                
                latency_ms = int((datetime.now() - start_time).total_seconds() * 1000)
                
                # Create test case
                test_case = LLMTestCase(
                    input=prompt_data["prompt"],
                    actual_output=response,
                    expected_output=prompt_data.get("expected_output", ""),
                )
                
                # Log the interaction
                created_log = await crud.create_log(
                    db=db,
                    project_id=config.get("project_id"),
                    tenant=tenant,
                    experiment_id=experiment_id,
                    input_text=prompt_data["prompt"],
                    output_text=response,
                    model_name=model_name,
                    latency_ms=latency_ms,
                    token_count=len(response.split()) if isinstance(response, str) else 0,  # Rough estimate
                    status="success",
                )
                
                # Record latency metric
                await crud.create_metric(
                    db=db,
                    project_id=config.get("project_id"),
                    metric_name="latency",
                    metric_type="performance",
                    value=float(latency_ms),
                    tenant=tenant,
                    experiment_id=experiment_id,
                )
                
                test_cases_data.append({
                    "test_case": test_case,
                    "metadata": {
                        "sample_id": prompt_data.get("id"),
                        "category": prompt_data.get("category"),
                        "difficulty": prompt_data.get("difficulty"),
                        "log_id": created_log.get("id") if created_log else None,
                    }
                })
                
                print(f"     ✓ Generated ({latency_ms}ms)")
                
            except Exception as e:
                print(f"     ❌ Error: {e}")
                
                # Log the error
                await crud.create_log(
                    db=db,
                    project_id=config.get("project_id"),
                    tenant=tenant,
                    experiment_id=experiment_id,
                    input_text=prompt_data["prompt"],
                    model_name=model_name,
                    status="error",
                    error_message=str(e),
                )
                continue
        
        if not test_cases_data:
            error_msg = "No responses generated"
            await crud.update_experiment_status(
                db=db,
                experiment_id=experiment_id,
                tenant=tenant,
                status="failed",
                error_message=error_msg
            )
            return {"error": error_msg}
        
        # 4. Run DeepEval Metrics (if OpenAI key available)
        print(f"\n🔍 Running evaluation metrics...\n")
        
        # Create minimal config for evaluator
        class SimpleConfig:
            def __init__(self):
                self.model = type('obj', (object,), {'model_id': model_name})()
                self.dataset = type('obj', (object,), {'name': 'experiment_dataset'})()
        
        simple_config = SimpleConfig()
        config_manager = type('obj', (object,), {'config': simple_config})()
        
        evaluator = DeepEvalEvaluator(
            config_manager=config_manager,
            output_dir=str(evaluation_module_path / "artifacts" / "deepeval_results"),
            metric_thresholds=thresholds_config,
        )
        
        # Convert metrics config format
        deepeval_metrics_config = {
            "answer_relevancy": metrics_config.get("answerRelevancy", False),
            "bias": metrics_config.get("bias", False),
            "toxicity": metrics_config.get("toxicity", False),
            "faithfulness": metrics_config.get("faithfulness", False),
            "hallucination": metrics_config.get("hallucination", False),
            "contextual_relevancy": metrics_config.get("contextualRelevancy", False),
        }
        
        results = evaluator.run_evaluation(
            test_cases_data=test_cases_data,
            metrics_config=deepeval_metrics_config,
        )

        # 4.5 Persist per-log metric scores to log metadata
        try:
            for idx, result in enumerate(results):
                log_id = test_cases_data[idx]["metadata"].get("log_id")
                if log_id:
                    await crud.update_log_metadata(
                        db=db,
                        log_id=log_id,
                        tenant=tenant,
                        metadata={"metric_scores": result.get("metric_scores", {})},
                    )
        except Exception as e:
            print(f"⚠️ Failed to update log metadata with metric scores: {e}")
        
        # 5. Store Results
        print(f"\n💾 Storing results...")
        
        # Calculate summary statistics
        total_prompts = len(results)
        avg_scores = {}
        
        # Map snake_case keys to the display names used in evaluator results
        name_map = {
            "answer_relevancy": "Answer Relevancy",
            "bias": "Bias",
            "toxicity": "Toxicity",
            "faithfulness": "Faithfulness",
            "hallucination": "Hallucination",
            "contextual_relevancy": "Contextual Relevancy",
        }

        for metric_key, enabled in deepeval_metrics_config.items():
            if enabled:
                display_name = name_map.get(metric_key, metric_key)
                scores: list[float] = []
                for r in results:
                    score_obj = r.get("metric_scores", {}).get(display_name)
                    if isinstance(score_obj, dict):
                        score_val = score_obj.get("score")
                        if isinstance(score_val, (int, float)):
                            scores.append(float(score_val))
                if scores:
                    avg_score = sum(scores) / len(scores)
                    avg_scores[metric_key] = avg_score
                    await crud.create_metric(
                        db=db,
                        project_id=config.get("project_id"),
                        metric_name=metric_key,
                        metric_type="quality",
                        value=avg_score,
                        tenant=tenant,
                        experiment_id=experiment_id,
                    )
        
        # Update experiment with results
        experiment_results = {
            "total_prompts": total_prompts,
            "avg_scores": avg_scores,
            "detailed_results": results[:10],  # Store first 10 for preview
            "completed_at": datetime.now().isoformat(),
        }
        
        await crud.update_experiment_status(
            db=db,
            experiment_id=experiment_id,
            tenant=tenant,
            status="completed",
            results=experiment_results,
        )
        
        print(f"\n✅ Evaluation completed successfully!")
        print(f"   Total prompts: {total_prompts}")
        print(f"   Average scores: {avg_scores}")
        
        return experiment_results
        
    except Exception as e:
        error_msg = f"Evaluation failed: {str(e)}"
        print(f"\n❌ {error_msg}")
        traceback.print_exc()
        
        try:
            await crud.update_experiment_status(
                db=db,
                experiment_id=experiment_id,
                tenant=tenant,
                status="failed",
                error_message=error_msg,
            )
        except:
            pass
        
        return {"error": error_msg}

