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
logger = logging.getLogger('uvicorn')


async def load_dataset_prompts(dataset_path: str, tenant: str) -> List[Dict[str, Any]]:
    """
    Load prompts from a dataset file.
    """
    import json
    import os
    
    # Handle different dataset path formats
    if not dataset_path:
        return []
    
    # Try to load from the artifacts directory
    base_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts", "datasets")
    
    # Check if it's a template dataset or user dataset
    if dataset_path.startswith("templates/"):
        file_path = os.path.join(base_path, dataset_path)
    else:
        # User uploaded dataset - stored in tenant directory
        file_path = os.path.join(base_path, tenant, dataset_path)
    
    if not os.path.exists(file_path):
        # Try alternate path
        file_path = dataset_path
    
    if not os.path.exists(file_path):
        logger.warning(f"Dataset file not found: {file_path}")
        return []
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Handle different dataset formats
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # Check for common keys
            if "prompts" in data:
                return data["prompts"]
            elif "test_cases" in data:
                return data["test_cases"]
            elif "data" in data:
                return data["data"]
        
        return []
    except Exception as e:
        logger.error(f"Error loading dataset: {e}")
        return []


async def call_llm_model(
    provider: str,
    model: str,
    prompt: str,
    tenant: str,
) -> str:
    """
    Call an LLM model to get a response.
    """
    import openai
    import anthropic
    
    # Get API keys from database
    from crud.deepeval_llm_keys import get_llm_api_key
    
    async with get_db() as db:
        api_key_record = await get_llm_api_key(provider, tenant=tenant, db=db)
    
    if not api_key_record:
        raise ValueError(f"No API key configured for provider: {provider}")
    
    api_key = api_key_record.get("apiKey") or api_key_record.get("api_key")
    
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
    try:
        from deepeval.test_case import LLMTestCase, LLMTestCaseParams
        from deepeval.metrics import GEval
        
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
        
        logger.info(f"Arena {comparison_id}: Loading dataset from {dataset_path}")
        
        # Load prompts from dataset
        prompts = await load_dataset_prompts(dataset_path, tenant)
        
        if not prompts:
            # If no dataset, check if testCases are provided directly
            if contestants_config and contestants_config[0].get("testCases"):
                prompts = [{"input": tc.get("input", "")} for tc in contestants_config[0]["testCases"]]
        
        if not prompts:
            raise ValueError("No prompts found. Please select a dataset or provide test cases.")
        
        logger.info(f"Arena {comparison_id}: Loaded {len(prompts)} prompts")
        
        # Limit prompts to avoid long-running tasks
        max_prompts = 10
        if len(prompts) > max_prompts:
            logger.info(f"Arena {comparison_id}: Limiting to {max_prompts} prompts")
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
            
            logger.info(f"Arena {comparison_id}: Processing prompt {idx + 1}/{total_prompts}")
            
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
                    response = await call_llm_model(provider, model, input_text, tenant)
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
                winner_response = await call_llm_model("openai", judge_model, comparison_prompt, tenant)
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
        
        logger.info(f"Arena comparison {comparison_id} completed. Winner: {overall_winner}")
        
    except Exception as e:
        logger.error(f"Arena comparison {comparison_id} failed: {e}")
        logger.error(traceback.format_exc())
        
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
        background_tasks.add_task(
            run_arena_comparison_task,
            comparison_id,
            config_data,
            tenant,
        )
        
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

