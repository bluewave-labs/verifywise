"""
DeepEval Arena Controller

Controller functions for LLM Arena comparisons using ArenaGEval.
"""

from fastapi import BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
import asyncio
import traceback

from database.db import get_db
from crud.deepeval_arena import (
    create_arena_comparison,
    get_arena_comparison,
    list_arena_comparisons,
    update_arena_comparison,
    delete_arena_comparison,
)
from database.redis import get_redis

import logging
import sys
logger = logging.getLogger('uvicorn')

def log(msg):
    """Print directly to stdout for visibility"""
    print(f"[ARENA] {msg}", flush=True)
    sys.stdout.flush()


async def load_dataset_prompts(dataset_path: str, tenant: str) -> List[Dict[str, Any]]:
    """
    Load prompts from a dataset file.
    """
    import json
    import os
    from pathlib import Path
    
    log(f"Loading dataset: path={dataset_path}, tenant={tenant}")
    
    # Handle different dataset path formats
    if not dataset_path:
        logger.warning("[ARENA] No dataset path provided")
        return []
    
    # Get the correct base paths
    root_path = Path(__file__).parent.parent.parent.parent
    evaluation_module_path = root_path / "EvaluationModule"
    datasets_base = evaluation_module_path / "data" / "datasets"
    uploads_base = evaluation_module_path / "data"
    
    log(f"Datasets base: {datasets_base}")
    log(f"Uploads base: {uploads_base}")
    
    file_path = None
    
    # Check if it's a user upload path (starts with "data/uploads/")
    if dataset_path.startswith("data/uploads/"):
        file_path = uploads_base.parent / dataset_path
    else:
        # Built-in dataset path (e.g., "chatbot/chatbot_basic.json")
        file_path = datasets_base / dataset_path
    
    log(f"Trying file path: {file_path}")
    
    if not file_path.exists():
        # Try alternate paths
        alt_paths = [
            Path(dataset_path),  # Absolute path
            datasets_base / dataset_path.lstrip("/"),
            uploads_base / dataset_path,
        ]
        for alt in alt_paths:
            log(f"Trying alternate: {alt}")
            if alt.exists():
                file_path = alt
                break
    
    if not file_path or not file_path.exists():
        log(f"ERROR: Dataset file not found: {file_path}")
        return []
    
    log(f"Loading dataset from: {file_path}")
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        log(f"Dataset loaded, type: {type(data)}, keys: {data.keys() if isinstance(data, dict) else 'N/A'}")
        
        # Handle different dataset formats
        prompts = []
        if isinstance(data, list):
            prompts = data
        elif isinstance(data, dict):
            # Check for common keys
            if "prompts" in data:
                prompts = data["prompts"]
            elif "test_cases" in data:
                prompts = data["test_cases"]
            elif "data" in data:
                prompts = data["data"]
            else:
                # Try to use the whole dict as a single item
                prompts = [data]
        
        log(f"Extracted {len(prompts)} prompts from dataset")
        return prompts
    except Exception as e:
        log(f"ERROR: Error loading dataset: {e}")
        print(traceback.format_exc(), flush=True)
        return []


async def call_llm_model(
    provider: str,
    model: str,
    prompt: str,
    api_keys: Dict[str, str],
) -> str:
    """
    Call an LLM model to get a response.
    
    Args:
        provider: The LLM provider (openai, anthropic, google, etc.)
        model: The model name
        prompt: The prompt to send
        api_keys: Dictionary mapping provider names to API keys
    """
    import openai
    import anthropic
    
    # Get API key from provided keys
    api_key = api_keys.get(provider.lower())
    
    if not api_key:
        raise ValueError(f"No API key provided for provider: {provider}")
    
    try:
        if provider == "openai":
            client = openai.OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024,
            )
            return response.choices[0].message.content or ""
        
        elif provider == "anthropic":
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model=model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )
            return response.content[0].text if response.content else ""
        
        elif provider == "google":
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            gen_model = genai.GenerativeModel(model)
            response = gen_model.generate_content(prompt)
            return response.text or ""
        
        else:
            # For other providers, try OpenAI-compatible API
            client = openai.OpenAI(api_key=api_key, base_url=f"https://api.{provider}.com/v1")
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=1024,
            )
            return response.choices[0].message.content or ""
            
    except Exception as e:
        logger.error(f"Error calling {provider}/{model}: {e}")
        raise


async def run_arena_comparison_task(
    comparison_id: str,
    config_data: Dict[str, Any],
    tenant: str,
):
    """
    Background task to run the arena comparison using DeepEval's ArenaGEval.
    """
    log(f"Background task STARTING for {comparison_id}")
    try:
        from deepeval.test_case import LLMTestCase, LLMTestCaseParams
        from deepeval.metrics import GEval
        
        log(f"{comparison_id}: Imports successful")
        
        # Update status to running
        async with get_db() as db:
            await update_arena_comparison(
                comparison_id,
                tenant=tenant,
                status="running",
                progress="Initializing arena...",
                db=db,
            )
            await db.commit()
        
        contestants_config = config_data.get("contestants", [])
        metric_config = config_data.get("metric", {})
        judge_model = config_data.get("judgeModel", "gpt-4o")
        dataset_path = config_data.get("datasetPath", "")
        api_keys = config_data.get("apiKeys", {})
        
        log(f"{comparison_id}: API keys provided for providers: {list(api_keys.keys())}")
        
        log(f"{comparison_id}: Loading dataset from {dataset_path}")
        
        # Load prompts from dataset
        prompts = await load_dataset_prompts(dataset_path, tenant)
        
        if not prompts:
            # If no dataset, check if testCases are provided directly
            if contestants_config and contestants_config[0].get("testCases"):
                prompts = [{"input": tc.get("input", "")} for tc in contestants_config[0]["testCases"]]
        
        if not prompts:
            raise ValueError("No prompts found. Please select a dataset or provide test cases.")
        
        log(f"{comparison_id}: Loaded {len(prompts)} prompts")
        
        # Limit prompts to avoid long-running tasks
        max_prompts = 10
        if len(prompts) > max_prompts:
            log(f"{comparison_id}: Limiting to {max_prompts} prompts")
            prompts = prompts[:max_prompts]
        
        # Update progress
        async with get_db() as db:
            await update_arena_comparison(
                comparison_id,
                tenant=tenant,
                progress=f"Generating responses for {len(prompts)} prompts...",
                db=db,
            )
            await db.commit()
        
        # Generate responses from each contestant's model
        all_results = []
        win_counts = {c["name"]: 0 for c in contestants_config}
        total_prompts = len(prompts)
        
        for idx, prompt_data in enumerate(prompts):
            # Get the input prompt
            input_text = ""
            if isinstance(prompt_data, str):
                input_text = prompt_data
            elif isinstance(prompt_data, dict):
                input_text = prompt_data.get("input") or prompt_data.get("prompt") or prompt_data.get("question") or str(prompt_data)
            
            if not input_text:
                continue
            
            log(f"{comparison_id}: Processing prompt {idx + 1}/{total_prompts}")
            
            # Update progress
            async with get_db() as db:
                await update_arena_comparison(
                    comparison_id,
                    tenant=tenant,
                    progress=f"Processing prompt {idx + 1}/{total_prompts}",
                    db=db,
                )
                await db.commit()
            
            # Get responses from each contestant
            contestant_responses = []
            for contestant in contestants_config:
                provider = contestant.get("hyperparameters", {}).get("provider", "openai")
                model = contestant.get("hyperparameters", {}).get("model", "")
                
                if not model:
                    contestant_responses.append({
                        "name": contestant["name"],
                        "output": "Error: No model specified",
                    })
                    continue
                
                try:
                    response = await call_llm_model(provider, model, input_text, api_keys)
                    contestant_responses.append({
                        "name": contestant["name"],
                        "output": response,
                    })
                except Exception as e:
                    logger.error(f"Error getting response from {contestant['name']}: {e}")
                    contestant_responses.append({
                        "name": contestant["name"],
                        "output": f"Error: {str(e)}",
                    })
            
            # Use GEval to judge the responses
            try:
                # Create a comparison prompt for the judge
                comparison_prompt = f"""You are a judge comparing responses from different AI assistants.

**User Question/Prompt:**
{input_text}

**Responses:**
"""
                for i, cr in enumerate(contestant_responses):
                    comparison_prompt += f"\n--- {cr['name']} ---\n{cr['output']}\n"
                
                comparison_prompt += f"""
**Evaluation Criteria:**
{metric_config.get("criteria", "Evaluate based on accuracy, helpfulness, and clarity.")}

**Task:**
Based on the criteria above, which response is better? 
Respond with ONLY the name of the winning contestant (exactly as written above).
If it's a tie, respond with "TIE".
"""
                
                # Use the judge model to pick a winner
                # Determine judge provider from model name
                judge_provider = "openai"
                if "claude" in judge_model.lower():
                    judge_provider = "anthropic"
                elif "gemini" in judge_model.lower():
                    judge_provider = "google"
                elif "mistral" in judge_model.lower() or "magistral" in judge_model.lower():
                    judge_provider = "mistral"
                elif "grok" in judge_model.lower():
                    judge_provider = "xai"
                
                winner_response = await call_llm_model(judge_provider, judge_model, comparison_prompt, api_keys)
                winner_name = winner_response.strip()
                
                # Validate winner name
                valid_names = [c["name"] for c in contestants_config]
                if winner_name not in valid_names and winner_name != "TIE":
                    # Try to find a match
                    for name in valid_names:
                        if name.lower() in winner_name.lower():
                            winner_name = name
                            break
                    else:
                        winner_name = None
                
                if winner_name and winner_name != "TIE":
                    win_counts[winner_name] = win_counts.get(winner_name, 0) + 1
                
                all_results.append({
                    "testCaseIndex": idx,
                    "input": input_text,
                    "winner": winner_name if winner_name != "TIE" else None,
                    "reason": f"Judge selected: {winner_response.strip()}",
                    "contestants": contestant_responses,
                })
                
            except Exception as e:
                logger.error(f"Error in arena judging for prompt {idx}: {e}")
                all_results.append({
                    "testCaseIndex": idx,
                    "input": input_text,
                    "winner": None,
                    "reason": f"Error: {str(e)}",
                    "contestants": contestant_responses,
                })
        
        # Determine overall winner
        if win_counts:
            overall_winner = max(win_counts, key=win_counts.get)
            # Check for tie
            max_wins = win_counts[overall_winner]
            winners_with_max = [name for name, wins in win_counts.items() if wins == max_wins]
            if len(winners_with_max) > 1:
                overall_winner = f"Tie: {', '.join(winners_with_max)}"
        else:
            overall_winner = None
        
        # Update with final results
        async with get_db() as db:
            await update_arena_comparison(
                comparison_id,
                tenant=tenant,
                status="completed",
                progress=f"Completed {total_prompts}/{total_prompts} prompts",
                winner=overall_winner,
                win_counts=win_counts,
                detailed_results=all_results,
                completed_at=datetime.utcnow(),
                db=db,
            )
            await db.commit()
        
        log(f"Arena comparison {comparison_id} COMPLETED. Winner: {overall_winner}")
        
    except Exception as e:
        log(f"Arena comparison {comparison_id} FAILED: {e}")
        print(traceback.format_exc(), flush=True)
        
        async with get_db() as db:
            await update_arena_comparison(
                comparison_id,
                tenant=tenant,
                status="failed",
                error_message=str(e),
                db=db,
            )
            await db.commit()


async def create_arena_comparison_controller(
    background_tasks: BackgroundTasks,
    config_data: Dict[str, Any],
    tenant: str,
    user_id: Optional[str] = None,
) -> JSONResponse:
    """
    Create a new arena comparison.
    """
    try:
        log("========== CREATE ARENA COMPARISON ==========")
        log(f"Tenant: {tenant}, User: {user_id}")
        log(f"Config data keys: {list(config_data.keys())}")
        log(f"Dataset path: {config_data.get('datasetPath')}")
        log(f"Contestants: {len(config_data.get('contestants', []))}")
        
        comparison_id = f"arena_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}"
        
        contestants_config = config_data.get("contestants", [])
        contestant_names = [c.get("name", f"Contestant {i+1}") for i, c in enumerate(contestants_config)]
        
        async with get_db() as db:
            comparison = await create_arena_comparison(
                comparison_id=comparison_id,
                name=config_data.get("name", "Arena Comparison"),
                description=config_data.get("description"),
                org_id=config_data.get("orgId"),
                contestants=contestants_config,
                contestant_names=contestant_names,
                metric_config=config_data.get("metric", {}),
                judge_model=config_data.get("judgeModel", "gpt-4o"),
                tenant=tenant,
                created_by=user_id,
                db=db,
            )
            await db.commit()
        
        # Start background task
        log(f"Scheduling background task for {comparison_id}")
        background_tasks.add_task(
            run_arena_comparison_task,
            comparison_id,
            config_data,
            tenant,
        )
        log(f"Background task scheduled for {comparison_id}")
        
        return JSONResponse(
            status_code=202,
            content={
                "id": comparison_id,
                "status": "pending",
                "message": "Arena comparison started",
                "contestants": contestant_names,
            }
        )
        
    except Exception as e:
        logger.error(f"Failed to create arena comparison: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create arena comparison: {str(e)}")


async def get_arena_comparison_status_controller(
    comparison_id: str,
    tenant: str,
) -> JSONResponse:
    """
    Get the status of an arena comparison.
    """
    try:
        async with get_db() as db:
            comparison = await get_arena_comparison(comparison_id, tenant=tenant, db=db)
            
        if not comparison:
            raise HTTPException(status_code=404, detail="Arena comparison not found")
        
        return JSONResponse(
            status_code=200,
            content={
                "id": comparison["id"],
                "name": comparison["name"],
                "status": comparison["status"],
                "progress": comparison.get("progress"),
                "contestants": comparison.get("contestantNames", []),
                "createdAt": comparison.get("createdAt"),
                "updatedAt": comparison.get("updatedAt"),
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get arena comparison status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get arena comparison status: {str(e)}")


async def get_arena_comparison_results_controller(
    comparison_id: str,
    tenant: str,
) -> JSONResponse:
    """
    Get the results of a completed arena comparison.
    """
    try:
        async with get_db() as db:
            comparison = await get_arena_comparison(comparison_id, tenant=tenant, db=db)
            
        if not comparison:
            raise HTTPException(status_code=404, detail="Arena comparison not found")
        
        return JSONResponse(
            status_code=200,
            content={
                "id": comparison["id"],
                "name": comparison["name"],
                "description": comparison.get("description"),
                "status": comparison["status"],
                "metric": comparison.get("metricConfig", {}),
                "judgeModel": comparison.get("judgeModel"),
                "results": {
                    "winner": comparison.get("winner"),
                    "winCounts": comparison.get("winCounts", {}),
                    "detailedResults": comparison.get("detailedResults", []),
                },
                "contestants": comparison.get("contestantNames", []),
                "createdAt": comparison.get("createdAt"),
                "completedAt": comparison.get("completedAt"),
                "errorMessage": comparison.get("errorMessage"),
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get arena comparison results: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get arena comparison results: {str(e)}")


async def list_arena_comparisons_controller(
    tenant: str,
    org_id: Optional[str] = None,
) -> JSONResponse:
    """
    List all arena comparisons for the current tenant.
    """
    try:
        async with get_db() as db:
            comparisons = await list_arena_comparisons(tenant=tenant, org_id=org_id, db=db)
        
        return JSONResponse(
            status_code=200,
            content={"comparisons": comparisons}
        )
        
    except Exception as e:
        logger.error(f"Failed to list arena comparisons: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list arena comparisons: {str(e)}")


async def delete_arena_comparison_controller(
    comparison_id: str,
    tenant: str,
) -> JSONResponse:
    """
    Delete an arena comparison.
    """
    try:
        async with get_db() as db:
            deleted = await delete_arena_comparison(comparison_id, tenant=tenant, db=db)
            await db.commit()
            
        if not deleted:
            raise HTTPException(status_code=404, detail="Arena comparison not found")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "Arena comparison deleted successfully",
                "id": comparison_id,
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete arena comparison: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete arena comparison: {str(e)}")

