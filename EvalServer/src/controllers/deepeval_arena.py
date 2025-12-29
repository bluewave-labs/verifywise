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


async def run_arena_comparison_task(
    comparison_id: str,
    config_data: Dict[str, Any],
    tenant: str,
):
    """
    Background task to run the arena comparison using DeepEval's ArenaGEval.
    """
    try:
        from deepeval.test_case import ArenaTestCase, LLMTestCase, Contestant, LLMTestCaseParams
        from deepeval.metrics import ArenaGEval
        from deepeval import compare
        
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
        
        # Create ArenaGEval metric
        evaluation_params = []
        for param in metric_config.get("evaluationParams", ["input", "actual_output"]):
            if param == "input":
                evaluation_params.append(LLMTestCaseParams.INPUT)
            elif param == "actual_output":
                evaluation_params.append(LLMTestCaseParams.ACTUAL_OUTPUT)
            elif param == "expected_output":
                evaluation_params.append(LLMTestCaseParams.EXPECTED_OUTPUT)
            elif param == "context":
                evaluation_params.append(LLMTestCaseParams.CONTEXT)
            elif param == "retrieval_context":
                evaluation_params.append(LLMTestCaseParams.RETRIEVAL_CONTEXT)
        
        arena_metric = ArenaGEval(
            name=metric_config.get("name", "Arena Comparison"),
            criteria=metric_config.get("criteria", "Choose the winner based on overall quality"),
            evaluation_params=evaluation_params,
            model=judge_model,
        )
        
        # Process test cases - each test case becomes an arena
        # For simplicity, we'll assume each contestant has the same test cases
        # and we compare them pairwise
        
        all_results = []
        win_counts = {c["name"]: 0 for c in contestants_config}
        total_comparisons = len(contestants_config[0].get("testCases", [])) if contestants_config else 0
        
        for idx, test_case_data in enumerate(contestants_config[0].get("testCases", [])):
            # Update progress
            async with get_db() as db:
                await update_arena_comparison(
                    comparison_id,
                    tenant=tenant,
                    progress=f"Evaluating test case {idx + 1}/{total_comparisons}",
                    db=db,
                )
                await db.commit()
            
            # Create contestants for this test case
            contestants = []
            for contestant_config in contestants_config:
                test_cases = contestant_config.get("testCases", [])
                if idx < len(test_cases):
                    tc = test_cases[idx]
                    contestant = Contestant(
                        name=contestant_config["name"],
                        hyperparameters=contestant_config.get("hyperparameters", {}),
                        test_case=LLMTestCase(
                            input=tc.get("input", ""),
                            actual_output=tc.get("actualOutput", ""),
                            expected_output=tc.get("expectedOutput"),
                            context=tc.get("context"),
                            retrieval_context=tc.get("retrievalContext"),
                        ),
                    )
                    contestants.append(contestant)
            
            if len(contestants) < 2:
                continue
            
            # Create arena test case
            arena_test_case = ArenaTestCase(contestants=contestants)
            
            # Run comparison
            try:
                results = compare(test_cases=[arena_test_case], metric=arena_metric)
                
                # Parse results - results is a Counter object
                winner_name = None
                reason = "Comparison completed"
                
                if results:
                    # Get the winner (highest count)
                    winner_name = results.most_common(1)[0][0] if results.most_common(1) else None
                    if winner_name:
                        win_counts[winner_name] = win_counts.get(winner_name, 0) + 1
                
                all_results.append({
                    "testCaseIndex": idx,
                    "input": test_case_data.get("input", ""),
                    "winner": winner_name,
                    "reason": reason,
                    "contestants": [
                        {
                            "name": c["name"],
                            "output": c.get("testCases", [{}])[idx].get("actualOutput", "") if idx < len(c.get("testCases", [])) else ""
                        }
                        for c in contestants_config
                    ]
                })
                
            except Exception as e:
                logger.error(f"Error in arena comparison for test case {idx}: {e}")
                all_results.append({
                    "testCaseIndex": idx,
                    "input": test_case_data.get("input", ""),
                    "winner": None,
                    "reason": f"Error: {str(e)}",
                    "contestants": []
                })
        
        # Determine overall winner
        overall_winner = max(win_counts, key=win_counts.get) if win_counts else None
        
        # Update with final results
        async with get_db() as db:
            await update_arena_comparison(
                comparison_id,
                tenant=tenant,
                status="completed",
                progress=f"Completed {total_comparisons}/{total_comparisons} test cases",
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

