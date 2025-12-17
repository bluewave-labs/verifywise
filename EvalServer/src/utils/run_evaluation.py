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
from crud.deepeval_scorers import list_scorers
from deepeval_engine.gatekeeper import evaluate_gate
from utils.run_custom_scorer import run_custom_scorer, ScorerResult


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
        
        # Evaluation mode: "scorer" = custom only, "standard" = judge only, "both" = run both
        evaluation_mode = config.get("evaluationMode", "standard")
        print(f"📋 Evaluation mode: {evaluation_mode}")
        
        # Set up API keys from config (if provided)
        # Check for multi-provider API keys map (new format from backend)
        # These keys are used by CUSTOM SCORERS - each scorer uses its own configured provider
        # G_EVAL_PROVIDER is set later based on the Judge LLM config (user's explicit selection)
        scorer_api_keys = config.get("scorerApiKeys")
        if scorer_api_keys and isinstance(scorer_api_keys, dict):
            # Map provider names to environment variable names
            provider_env_map = {
                "openai": "OPENAI_API_KEY",
                "anthropic": "ANTHROPIC_API_KEY",
                "google": "GEMINI_API_KEY",
                "gemini": "GEMINI_API_KEY",
                "xai": "XAI_API_KEY",
                "mistral": "MISTRAL_API_KEY",
                "huggingface": "HF_API_KEY",
            }
            
            configured_count = 0
            for provider in list(scorer_api_keys.keys()):
                env_var = provider_env_map.get(provider.lower())
                key_value = scorer_api_keys.get(provider)
                if env_var and key_value:
                    os.environ[env_var] = key_value
                    configured_count += 1
        
        # Legacy: single scorer API key (backward compatibility)
        legacy_key = config.get("scorerApiKey")
        if legacy_key and not scorer_api_keys:
            os.environ["OPENAI_API_KEY"] = legacy_key
            os.environ["ANTHROPIC_API_KEY"] = legacy_key
            os.environ["GEMINI_API_KEY"] = legacy_key
            os.environ["XAI_API_KEY"] = legacy_key
            os.environ["MISTRAL_API_KEY"] = legacy_key
        
        # Judge LLM API keys (for DeepEval metrics - Standard Judge mode)
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
            # Expose judge provider/model for evaluator (provider-agnostic G‑Eval)
            if provider:
                os.environ["G_EVAL_PROVIDER"] = provider
            if judge_config.get("model"):
                os.environ["G_EVAL_MODEL"] = str(judge_config["model"])
            # Set max tokens for judge (default 512, but user can set higher)
            max_tokens = judge_config.get("maxTokens", 512)
            os.environ["G_EVAL_MAX_TOKENS"] = str(max_tokens)
            print(f"✅ G_EVAL_MAX_TOKENS set to {max_tokens}")
        
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
        
        # 2. Load Dataset (builtin by name, custom path, prompts, conversations, or benchmarks)
        print(f"\n📊 Loading dataset...")

        prompts = dataset_config.get("prompts", [])
        conversations = []  # list[dict]: { scenario?: str, turns: [{role, content}] }
        # Built-in preset by name (chatbot | rag | agent | safety)
        builtin_value = dataset_config.get("useBuiltin")
        if not prompts and isinstance(builtin_value, str):
            name = builtin_value.strip().lower()
            preset_map = {
                "chatbot": evaluation_module_path / "data" / "presets" / "chatbot_dataset.json",
                "rag": evaluation_module_path / "data" / "presets" / "rag_dataset.json",
                "agent": evaluation_module_path / "data" / "presets" / "agent_dataset.json",
                "safety": evaluation_module_path / "data" / "presets" / "safety_dataset.json",
            }
            preset_path = preset_map.get(name)
            if preset_path and preset_path.is_file():
                print(f"📦 Using built-in dataset: {name} -> {preset_path}")
                try:
                    with open(preset_path, "r", encoding="utf-8") as f:
                        loaded = json.load(f)
                        # Accept either prompts (single-turn) or conversational scenarios
                        if isinstance(loaded, list) and loaded and isinstance(loaded[0], dict) and "turns" in loaded[0]:
                            conversations = loaded
                        else:
                            prompts = loaded
                except Exception as e:
                    print(f"⚠️  Failed to load builtin dataset '{name}': {e}")
        # Custom dataset path if provided
        if not prompts and dataset_config.get("path"):
            custom_path = Path(dataset_config["path"])
            if not custom_path.is_absolute():
                custom_path = (evaluation_module_path / custom_path).resolve()
            print(f"📄 Using custom dataset: {custom_path}")
            try:
                with open(custom_path, "r", encoding="utf-8") as f:
                    loaded = json.load(f)
                    if isinstance(loaded, list) and loaded and isinstance(loaded[0], dict) and "turns" in loaded[0]:
                        conversations = loaded
                    else:
                        prompts = loaded
            except Exception as e:
                print(f"⚠️  Failed to load custom dataset '{custom_path}': {e}")
        # DeepEval benchmark (fallback)
        if not prompts and dataset_config.get("benchmark"):
            bench_name = str(dataset_config.get("benchmark")).strip().lower()
            print(f"• Attempting to load DeepEval benchmark: {bench_name}")
            try:
                # Try common loader patterns
                try:
                    from deepeval.benchmarks import load_benchmark  # type: ignore
                    bench = load_benchmark(bench_name)
                except Exception:
                    bench = None

                if bench is None:
                    # Fallback: some packages expose specific helpers, try minimal mapping
                    from importlib import import_module
                    mod = import_module("deepeval.benchmarks")
                    bench = getattr(mod, "load", None)
                    if callable(bench):
                        bench = bench(bench_name)

                # Convert benchmark to our prompts format
                extracted: list[dict[str, str]] = []
                if bench is not None and hasattr(bench, "to_test_cases"):
                    tcs = bench.to_test_cases()
                    for i, tc in enumerate(tcs, 1):
                        # tc likely resembles LLMTestCase
                        inp = getattr(tc, "input", "")
                        exp = getattr(tc, "expected_output", "")
                        extracted.append({
                            "id": f"bench_{bench_name}_{i}",
                            "category": bench_name,
                            "prompt": inp,
                            "expected_output": exp,
                            "difficulty": "benchmark",
                        })
                if extracted:
                    prompts = extracted
                    print(f"✓ Loaded {len(prompts)} prompts from benchmark '{bench_name}'")
                else:
                    print(f"⚠️  Could not extract prompts from benchmark '{bench_name}', falling back to provided prompts")
            except Exception as be:
                print(f"⚠️  Benchmark load failed: {be}")
        if not prompts and not conversations:
            error_msg = "No prompts or conversations in dataset"
            print(f"❌ {error_msg}")
            await crud.update_experiment_status(
                db=db,
                experiment_id=experiment_id,
                tenant=tenant,
                status="failed",
                error_message=error_msg
            )
            return {"error": error_msg}
        
        test_cases_data = []

        if conversations:
            # 3A. Conversational (multi-turn) evaluation: judge existing assistant replies per turn
            print(f"\n🗣️ Detected conversational dataset with {len(conversations)} scenarios. Building per-turn test cases...\n")
            sample_counter = 0
            for s_idx, convo in enumerate(conversations, 1):
                scenario = convo.get("scenario") or f"scenario_{s_idx}"
                turns = convo.get("turns") or []
                # Evaluate assistant turns; build history up to each assistant reply
                history: list[dict] = []
                for t_idx, t in enumerate(turns, 1):
                    role = (t.get("role") or "").lower()
                    content = t.get("content") or ""
                    if not content:
                        continue
                    # When we hit an assistant turn, create a test case using prior history
                    if role == "assistant":
                        # The last user message (if any) is the immediate input; include compact history for judge context
                        # Build a compact, readable transcript
                        history_text = []
                        for h in history[-6:]:  # keep the last few turns for brevity
                            history_text.append(f"{h['role'].capitalize()}: {h['content']}")
                        input_block = "\n".join(history_text) if history_text else ""
                        last_user = ""
                        if history and history[-1]["role"] == "user":
                            last_user = history[-1]["content"]
                        judge_input = f"{input_block}\n\nUser: {last_user}".strip() if last_user else input_block

                        test_case = LLMTestCase(
                            input=judge_input,
                            actual_output=content,
                            expected_output="",  # optional; can be set if gold assistant is provided separately
                        )
                        sample_counter += 1
                        test_cases_data.append({
                            "test_case": test_case,
                            "metadata": {
                                "sample_id": f"{scenario}#turn_{t_idx}",
                                "protected_attributes": {"category": scenario, "difficulty": "conversation"},
                            }
                        })
                    # Always extend history
                    history.append({"role": role, "content": content})
            print(f"✓ Built {len(test_cases_data)} assistant-turn test cases from conversations.")
        else:
            # 3B. Single-turn path (existing)
            print(f"\n🤖 Generating {len(prompts)} responses...\n")
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
        
        # 4. Run DeepEval Metrics (if keys available)
        print(f"\n🔍 Running evaluation metrics...\n")
        
        # Create minimal config for evaluator
        class SimpleConfig:
            def __init__(self):
                self.model = type('obj', (object,), {'model_id': model_name})()
                self.dataset = type('obj', (object,), {'name': 'experiment_dataset'})()
        
        simple_config = SimpleConfig()
        config_manager = type('obj', (object,), {'config': simple_config})()
        
        output_dir = evaluation_module_path / "artifacts" / "deepeval_results"
        evaluator = DeepEvalEvaluator(
            config_manager=config_manager,
            output_dir=str(output_dir),
            metric_thresholds=thresholds_config,
        )
        
        # Read UI-selected metrics from config
        ui_metrics = config.get("metrics") or {}
        task_type = (config.get("taskType") or config.get("task_type") or "").strip().lower()
        bundles = config.get("bundles") or {}
        
        # Map frontend metric names (camelCase) to backend metric names (snake_case)
        metric_name_map = {
            "answerRelevancy": "answer_relevancy",
            "bias": "bias",
            "toxicity": "toxicity",
            "faithfulness": "faithfulness",
            "hallucination": "hallucination",
            "contextualRelevancy": "contextual_relevancy",
            "knowledgeRetention": "knowledge_retention",
            "conversationRelevancy": "conversation_relevancy",
            "conversationCompleteness": "conversation_completeness",
            "roleAdherence": "role_adherence",
        }

        # Start with all metrics disabled
        deepeval_metrics_config = {
            # Standard G-Eval metrics (always available)
            "answer_relevancy": False,
            "bias": False,
            "toxicity": False,
            "faithfulness": False,
            "hallucination": False,
            "contextual_relevancy": False,
            # Chatbot-specific metrics
            "knowledge_retention": False,
            "conversation_relevancy": False,
            "conversation_completeness": False,
            "role_adherence": False,
        }
        
        # Enable metrics based on UI selection
        for ui_key, backend_key in metric_name_map.items():
            if ui_metrics.get(ui_key, False):
                deepeval_metrics_config[backend_key] = True
        
        # If no UI metrics provided (legacy/rerun), use defaults based on task type
        if not ui_metrics:
            # Default: enable general metrics for all
            deepeval_metrics_config["answer_relevancy"] = True
            deepeval_metrics_config["bias"] = True
            deepeval_metrics_config["toxicity"] = True
            
            if task_type == "rag":
                # RAG: enable context-dependent metrics
                deepeval_metrics_config.update({
                    "faithfulness": True,
                    "contextual_relevancy": True,
                    "hallucination": True,
                })
            elif task_type in ("agent", "agents"):
                deepeval_metrics_config.update({
                    "task_completion": True,
                    "tool_correctness": True,
                })
            elif task_type in ("chatbot", ""):
                # Chatbot: enable chatbot-specific metrics (NOT RAG metrics!)
                deepeval_metrics_config.update({
                    "knowledge_retention": True,
                    "conversation_completeness": True,
                    "conversation_relevancy": True,
                    "role_adherence": True,
                })
        
        # Log which metrics are enabled
        enabled_metrics = [k for k, v in deepeval_metrics_config.items() if v]
        print(f"📊 Enabled metrics: {enabled_metrics}")
        
        # 4. Run DeepEval metrics (only if mode is "standard" or "both")
        results = []
        if evaluation_mode in ("standard", "both"):
            print(f"\n🧪 Running DeepEval built-in metrics (mode: {evaluation_mode})")
            results = evaluator.run_evaluation(
                test_cases_data=test_cases_data,
                metrics_config=deepeval_metrics_config,
            )
        else:
            print(f"\n⏭️ Skipping DeepEval metrics (mode: {evaluation_mode})")
            # Still need to create empty results structure for consistency
            # test_cases_data is a list of {"test_case": LLMTestCase, "metadata": {...}}
            results = []
            for tc_data in test_cases_data:
                test_case = tc_data.get("test_case")
                if test_case:
                    results.append({
                        "input": getattr(test_case, "input", ""),
                        "output": getattr(test_case, "actual_output", ""),
                        "expected": getattr(test_case, "expected_output", None),
                        "context": getattr(test_case, "retrieval_context", None),
                        "metric_scores": {},
                    })

        # 4.1 Run Custom LLM Judge Scorers (if mode is "scorer" or "both")
        print(f"\n{'='*50}")
        print(f"🔍 CUSTOM SCORER EXECUTION")
        print(f"{'='*50}")
        
        project_id = config.get("project_id")
        custom_scorer_results: Dict[str, list] = {}  # scorer_id -> list of results per test case
        enabled_scorers: list = []  # Track for later use in storing results
        
        # Only run custom scorers if mode is "scorer" or "both"
        if evaluation_mode not in ("scorer", "both"):
            print(f"⏭️ Skipping custom scorers (mode: {evaluation_mode})")
        else:
            print(f"🎯 Running custom scorers (mode: {evaluation_mode})")
        
        # Note: Scorer API key is now set at the start of evaluation (see above)
        # This ensures DeepEval metrics also use the key
        
        if evaluation_mode in ("scorer", "both"):
            try:
                # Load enabled custom scorers for this project
                all_scorers = await list_scorers(tenant=tenant, db=db, project_id=project_id)
                enabled_scorers = [s for s in all_scorers if s.get("enabled") and s.get("type") == "llm"]
                
                print(f"📋 Found {len(all_scorers)} total scorers, {len(enabled_scorers)} enabled LLM scorers")
                
                if enabled_scorers:
                    for scorer in enabled_scorers:
                        scorer_id = scorer.get("id", "unknown")
                        scorer_name = scorer.get("name", "Unknown Scorer")
                        metric_key = scorer.get("metricKey", scorer_id)
                        scorer_config = scorer.get("config", {})
                        
                        print(f"\n🎯 Running Scorer: {scorer_name}")
                        print(f"   ID: {scorer_id}")
                        print(f"   Metric Key: {metric_key}")
                        print(f"   Judge Model: {scorer_config.get('judgeModel', 'NOT CONFIGURED')}")
                        print(f"   Messages: {len(scorer_config.get('messages', []))} template(s)")
                        print(f"   Choice Scores: {scorer_config.get('choiceScores', [])}")
                        print(f"   Threshold: {scorer.get('defaultThreshold', 0.5)}")
                        
                        scorer_scores = []
                        
                        for idx, tc_data in enumerate(test_cases_data):
                            test_case = tc_data.get("test_case")
                            if not test_case:
                                continue
                            
                            input_text = getattr(test_case, "input", "") or ""
                            output_text = getattr(test_case, "actual_output", "") or ""
                            expected_text = getattr(test_case, "expected_output", "") or ""
                            
                            print(f"   [{idx+1}/{len(test_cases_data)}] Evaluating...")
                            print(f"      Input: {input_text[:80]}...")
                            print(f"      Output: {output_text[:80]}...")
                            
                            try:
                                result: ScorerResult = await run_custom_scorer(
                                    scorer_config=scorer,
                                    input_text=input_text,
                                    output_text=output_text,
                                    expected_text=expected_text,
                                )
                                
                                scorer_scores.append({
                                    "test_case_idx": idx,
                                    "label": result.label,
                                    "score": result.score,
                                    "passed": result.passed,
                                    "raw_response": result.raw_response,
                                })
                                
                                status_icon = "✅" if result.passed else "❌"
                                print(f"      {status_icon} Result: {result.label} (score={result.score:.2f}, passed={result.passed})")
                                if result.total_tokens:
                                    print(f"      📊 Tokens: {result.total_tokens} (prompt={result.prompt_tokens}, completion={result.completion_tokens})")
                                
                                # Merge scorer result into test case results
                                if idx < len(results):
                                    if "metric_scores" not in results[idx]:
                                        results[idx]["metric_scores"] = {}
                                    results[idx]["metric_scores"][scorer_name] = {
                                        "score": result.score,
                                        "label": result.label,
                                        "passed": result.passed,
                                        "reason": result.raw_response[:200] if result.raw_response else "",
                                    }
                                
                            except Exception as scorer_err:
                                print(f"      ❌ Error: {scorer_err}")
                                scorer_scores.append({
                                    "test_case_idx": idx,
                                    "label": "ERROR",
                                    "score": 0.0,
                                    "passed": False,
                                    "raw_response": str(scorer_err),
                                })
                        
                        custom_scorer_results[scorer_id] = scorer_scores
                        
                        # Calculate average score for this scorer
                        if scorer_scores:
                            avg_score = sum(s["score"] for s in scorer_scores) / len(scorer_scores)
                            passed_count = sum(1 for s in scorer_scores if s["passed"])
                            print(f"\n   📈 Scorer Summary: avg_score={avg_score:.3f}, passed={passed_count}/{len(scorer_scores)}")
                else:
                    print("   ⚪ No enabled LLM scorers found for this project")
                    
            except Exception as scorer_load_err:
                print(f"⚠️ Error loading/running custom scorers: {scorer_load_err}")
                traceback.print_exc()
        
        print(f"\n{'='*50}\n")

        # 4.25 Run gatekeeper quality gate on the latest summary (if suite is available)
        gatekeeper_result: dict[str, Any] | None = None
        try:
            suite_path = evaluation_module_path / "suits" / "suite_core.yaml"
            latest_summary: Path | None = None

            try:
                summaries = list(Path(output_dir).glob("deepeval_summary_*.json"))
                if summaries:
                    latest_summary = max(summaries, key=lambda p: p.stat().st_mtime)
            except Exception:
                latest_summary = None

            if latest_summary and suite_path.is_file():
                print("\n🔒 Running gatekeeper quality gate...")
                gate_result = evaluate_gate(
                    summary_path=str(latest_summary),
                    suite_path=str(suite_path.resolve()),
                )
                gatekeeper_result = gate_result.to_dict()
                status = "PASSED" if gate_result.passed else "FAILED"
                print(f"[Gatekeeper] {status} — checked_metrics={gate_result.checked_metrics}")
                if gate_result.fail_reasons:
                    print("Fail reasons:")
                    for r in gate_result.fail_reasons:
                        print(f"  - {r}")
            else:
                if not latest_summary:
                    print("Gatekeeper skipped: no deepeval_summary_*.json found.")
                if not suite_path.is_file():
                    print(f"Gatekeeper skipped: suite file not found at {suite_path}")
        except Exception as ge:
            print(f"Gatekeeper error: {ge}")

        # 4.5 Persist per-log metric scores to log metadata
        # Map display names back to camelCase keys for frontend compatibility
        display_to_camel = {
            "Answer Relevancy": "answerRelevancy",
            "Faithfulness": "faithfulness",
            "Contextual Relevancy": "contextualRelevancy",
            "Contextual Recall": "contextualRecall",
            "Contextual Precision": "contextualPrecision",
            "Bias": "bias",
            "Toxicity": "toxicity",
            "Hallucination": "hallucination",
            "Answer Correctness": "answerCorrectness",
            "Coherence": "coherence",
            "Tonality": "tonality",
            "Safety": "safety",
            "Knowledge Retention": "knowledgeRetention",
            "Conversation Completeness": "conversationCompleteness",
            "Conversation Relevancy": "conversationRelevancy",
            "Role Adherence": "roleAdherence",
            "Task Completion": "taskCompletion",
            "Tool Correctness": "toolCorrectness",
            "Summarization": "summarization",
            "RAGAS": "ragas",
            # G-Eval variants
            "g_eval_correctness": "answerCorrectness",
            "g_eval_coherence": "coherence",
            "g_eval_tonality": "tonality",
            "g_eval_safety": "safety",
        }
        
        try:
            for idx, result in enumerate(results):
                log_id = test_cases_data[idx]["metadata"].get("log_id")
                if log_id:
                    # Normalize metric keys to camelCase
                    raw_scores = result.get("metric_scores", {})
                    normalized_scores = {}
                    for display_name, score_data in raw_scores.items():
                        camel_key = display_to_camel.get(display_name, display_name)
                        normalized_scores[camel_key] = score_data
                    
                    await crud.update_log_metadata(
                        db=db,
                        log_id=log_id,
                        tenant=tenant,
                        metadata={"metric_scores": normalized_scores},
                    )
        except Exception as e:
            print(f"⚠️ Failed to update log metadata with metric scores: {e}")
        
        # 5. Store Results
        print(f"\n💾 Storing results...")
        
        # Calculate summary statistics
        total_prompts = len(results)
        avg_scores = {}
        
        # Map snake_case config keys to display names AND camelCase frontend keys
        metric_config_map = {
            "answer_relevancy": {"display": "Answer Relevancy", "camel": "answerRelevancy"},
            "faithfulness": {"display": "Faithfulness", "camel": "faithfulness"},
            "contextual_relevancy": {"display": "Contextual Relevancy", "camel": "contextualRelevancy"},
            "contextual_recall": {"display": "Contextual Recall", "camel": "contextualRecall"},
            "contextual_precision": {"display": "Contextual Precision", "camel": "contextualPrecision"},
            "hallucination": {"display": "Hallucination", "camel": "hallucination"},
            "bias": {"display": "Bias", "camel": "bias"},
            "toxicity": {"display": "Toxicity", "camel": "toxicity"},
            "knowledge_retention": {"display": "Knowledge Retention", "camel": "knowledgeRetention"},
            "conversation_completeness": {"display": "Conversation Completeness", "camel": "conversationCompleteness"},
            "conversation_relevancy": {"display": "Conversation Relevancy", "camel": "conversationRelevancy"},
            "role_adherence": {"display": "Role Adherence", "camel": "roleAdherence"},
            "task_completion": {"display": "Task Completion", "camel": "taskCompletion"},
            "tool_correctness": {"display": "Tool Correctness", "camel": "toolCorrectness"},
            "summarization": {"display": "Summarization", "camel": "summarization"},
            "ragas": {"display": "RAGAS", "camel": "ragas"},
            # G-Eval variants
            "g_eval_correctness": {"display": "Answer Correctness", "camel": "answerCorrectness"},
            "g_eval_coherence": {"display": "Coherence", "camel": "coherence"},
            "g_eval_tonality": {"display": "Tonality", "camel": "tonality"},
            "g_eval_safety": {"display": "Safety", "camel": "safety"},
        }

        for metric_key, enabled in deepeval_metrics_config.items():
            if enabled:
                mapping = metric_config_map.get(metric_key, {"display": metric_key, "camel": metric_key})
                display_name = mapping["display"]
                camel_key = mapping["camel"]
                scores: list[float] = []
                for r in results:
                    score_obj = r.get("metric_scores", {}).get(display_name)
                    if isinstance(score_obj, dict):
                        score_val = score_obj.get("score")
                        if isinstance(score_val, (int, float)):
                            scores.append(float(score_val))
                if scores:
                    avg_score = sum(scores) / len(scores)
                    # Store with camelCase key for frontend compatibility
                    avg_scores[camel_key] = avg_score
                    await crud.create_metric(
                        db=db,
                        project_id=config.get("project_id"),
                        metric_name=camel_key,  # Use camelCase for DB too
                        metric_type="quality",
                        value=avg_score,
                        tenant=tenant,
                        experiment_id=experiment_id,
                    )
        
        # 5.1 Store Custom Scorer Results (same format as DeepEval metrics)
        if custom_scorer_results:
            print(f"💾 Storing custom scorer results...")
            for scorer_id, scorer_scores in custom_scorer_results.items():
                if scorer_scores:
                    # Find scorer info from enabled_scorers
                    scorer_name = scorer_id
                    metric_key = scorer_id
                    for s in enabled_scorers:
                        if s.get("id") == scorer_id:
                            scorer_name = s.get("name", scorer_id)
                            metric_key = s.get("metricKey", scorer_id)
                            break
                    
                    # Calculate average
                    avg_score = sum(s["score"] for s in scorer_scores) / len(scorer_scores)
                    passed_rate = sum(1 for s in scorer_scores if s["passed"]) / len(scorer_scores)
                    
                    # Store in avg_scores with metricKey (same as DeepEval metrics)
                    avg_scores[metric_key] = avg_score
                    
                    # Store as metric (same format as DeepEval metrics)
                    await crud.create_metric(
                        db=db,
                        project_id=config.get("project_id"),
                        metric_name=metric_key,
                        metric_type="quality",  # Same type as DeepEval metrics
                        value=avg_score,
                        tenant=tenant,
                        experiment_id=experiment_id,
                    )
                    print(f"   ✅ Saved {scorer_name} ({metric_key}): avg={avg_score:.3f}, pass_rate={passed_rate:.1%}")
        
        # Update experiment with results
        experiment_results: Dict[str, Any] = {
            "total_prompts": total_prompts,
            "avg_scores": avg_scores,  # Contains both DeepEval and custom scorer averages
            "detailed_results": results[:10],  # Store first 10 for preview (includes custom scorer scores in metric_scores)
            "completed_at": datetime.now().isoformat(),
        }
        if gatekeeper_result is not None:
            experiment_results["gatekeeper"] = gatekeeper_result
        
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

