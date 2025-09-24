import io
import asyncio
import json
import yaml
import os
from pathlib import Path
from fastapi.responses import JSONResponse, Response
from fastapi import HTTPException
from crud.bias_and_fairness import (
    upload_model, upload_data, insert_metrics, get_metrics_by_id, 
    get_all_metrics_query, delete_metrics_by_id,
    insert_bias_fairness_evaluation, get_all_bias_fairness_evaluations,
    get_bias_fairness_evaluation_by_id, update_bias_fairness_evaluation_status,
    delete_bias_fairness_evaluation
)
from utils.run_bias_and_fairness_check import analyze_fairness
from utils.handle_files_uploads import process_files
from utils.process_evaluation import process_evaluation
from database.db import get_db
from fastapi import UploadFile, BackgroundTasks
from database.redis import get_next_job_id, get_job_status, delete_job_status

async def get_all_metrics(tenant: str):
    """
    Retrieve all fairness metrics.
    """
    try:
        async with get_db() as db:
            metrics = await get_all_metrics_query(db, tenant)
            return JSONResponse(
                status_code=200,
                content=[
                    {
                        "model_id": row.model_id,
                        "model_filename": row.model_filename,
                        "data_id": row.data_id,
                        "data_filename": row.data_filename,
                        "metrics_id": row.metrics_id
                    } for row in metrics
                ]
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve metrics, {str(e)}"
        )

async def get_metrics(id: int, tenant: str):
    """
    Retrieve metrics for a given fairness run ID.
    """
    try:
        async with get_db() as db:
            metrics = await get_metrics_by_id(id, db, tenant)
            if not metrics:
                raise HTTPException(
                    status_code=404,
                    detail=f"Metrics with ID {id} not found"
                )
            return JSONResponse(
                status_code=200,
                content={
                    "model_id": metrics.model_id,
                    "data_id": metrics.data_id,
                    "metrics_id": metrics.metrics_id,
                    "metrics": metrics.metrics
                }
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve metrics, {str(e)}"
        )

async def get_upload_status(job_id: int, tenant: str):
    value = await get_job_status(job_id)
    if value is None:
        return Response(status_code=204)
    await delete_job_status(job_id)
    return JSONResponse(
        status_code=200,
        content=value,
        media_type="application/json"
    )

async def handle_upload(background_tasks: BackgroundTasks, model: UploadFile, data: UploadFile, target_column: str, sensitive_column: str, tenant: str):
    """
    Handle file upload from the client.
    """
    job_id = await get_next_job_id()
    response = JSONResponse(status_code=202, content={
        "message": "Processing started", 
        "job_id": job_id,
        "model_filename": model.filename.replace(".gz", "") if model.filename else "",
        "data_filename": data.filename.replace(".gz", "") if data.filename else ""
    }, media_type="application/json")
    model_ = {
        "filename": model.filename,
        "content": await model.read()
    }
    data_ = {
        "filename": data.filename,
        "content": await data.read()
    }
    # create a job ID or use a unique identifier for the task
    background_tasks.add_task(process_files, job_id, model_, data_, target_column, sensitive_column, tenant)
    return response

# New controller functions for Bias and Fairness Module
async def handle_evaluation(
    background_tasks: BackgroundTasks, 
    model: UploadFile, 
    dataset: UploadFile, 
    target_column: str, 
    sensitive_columns: str,  # JSON string
    evaluation_metrics: str,  # JSON string
    fairness_threshold: float,
    bias_detection_methods: str,  # JSON string
    tenant: str
):
    """
    Handle advanced bias and fairness evaluation.
    """
    try:
        # Parse JSON strings
        sensitive_cols = json.loads(sensitive_columns)
        metrics = json.loads(evaluation_metrics)
        bias_methods = json.loads(bias_detection_methods)
        
        evaluation_id = f"eval_{tenant}_{int(asyncio.get_event_loop().time() * 1000)}"
        
        response = JSONResponse(status_code=202, content={
            "evaluationId": evaluation_id,
            "status": "pending",
            "message": "Evaluation started"
        }, media_type="application/json")
        
        model_ = {
            "filename": model.filename,
            "content": await model.read()
        }
        dataset_ = {
            "filename": dataset.filename,
            "content": await dataset.read()
        }
        
        # Add background task for evaluation
        background_tasks.add_task(
            process_evaluation, 
            evaluation_id, 
            model_, 
            dataset_, 
            target_column, 
            sensitive_cols, 
            metrics, 
            fairness_threshold, 
            bias_methods, 
            tenant
        )
        
        return response
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid JSON format: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start evaluation: {str(e)}"
        )

async def get_evaluation_status(evaluation_id: str, tenant: str):
    """Get the status (and results if available) of an evaluation from DB."""
    try:
        async with get_db() as db:
            from crud.bias_and_fairness import get_bias_fairness_evaluation_by_id
            row = await get_bias_fairness_evaluation_by_id(evaluation_id, db, tenant)
            if not row:
                raise HTTPException(status_code=404, detail=f"Evaluation with ID {evaluation_id} not found")

            return JSONResponse(
                status_code=200,
                content={
                    "evaluationId": row.eval_id,
                    "status": row.status or "pending",
                    "results": row.results,
                    "model_name": row.model_name,
                    "dataset_name": row.dataset_name,
                    "updated_at": str(row.updated_at) if row.updated_at else None,
                }
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get evaluation status: {str(e)}"
        )

async def get_evaluation_results(evaluation_id: str, tenant: str):
    """
    Get the results of a completed evaluation.
    """
    try:
        # This would typically fetch from database
        # For now, return mock results
        return JSONResponse(
            status_code=200,
            content={
                "evaluationId": evaluation_id,
                "results": {
                    "fairness_metrics": {},
                    "bias_analysis": {},
                    "recommendations": []
                }
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get evaluation results: {str(e)}"
        )

async def get_all_evaluations(tenant: str):
    """
    Get all evaluations for a tenant.
    """
    try:
        # This would typically fetch from database
        # For now, return empty list
        return JSONResponse(
            status_code=200,
            content=[]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get evaluations: {str(e)}"
        )

async def cancel_evaluation(evaluation_id: str, tenant: str):
    """
    Cancel a running evaluation.
    """
    try:
        # This would typically update database/Redis status
        return JSONResponse(
            status_code=200,
            content={"message": "Evaluation cancelled successfully"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel evaluation: {str(e)}"
        )

async def delete_metrics(id: int, tenant: str):
    """
    Delete metrics for a given fairness run ID.
    """
    try:
        async with get_db() as db:
            delete = await delete_metrics_by_id(id, db, tenant)
            if not delete:
                raise HTTPException(
                    status_code=404,
                    detail=f"Metrics with ID {id} not found"
                )
            await db.commit()
            return Response(status_code=204)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete metrics, {str(e)}"
        )

async def create_config_and_run_evaluation(background_tasks: BackgroundTasks, config_data: dict, tenant: str):
    """
    Create config.yaml file and run bias and fairness evaluation.
    """
    print(f"Creating config and running evaluation for tenant: {tenant}")
    try:
        # Create config directory outside server src to avoid uvicorn --reload restarts
        # when writing files. Determine repo root from current file path.
        repo_root = Path(__file__).resolve().parents[3]
        config_dir = repo_root / "BiasAndFairnessModule" / "configs"
        config_dir.mkdir(parents=True, exist_ok=True)
        
        # Create config.yaml with frontend values and defaults
        # Normalize incoming payload shapes to support both array and object formats
        def normalize_metrics_section(section, default_enabled: bool, default_metrics: list):
            # section can be dict {enabled, metrics} or list [..]
            print(f"Normalizing metrics section: {section}")
            if isinstance(section, dict):
                enabled = section.get("enabled", default_enabled)
                metrics_list = section.get("metrics", default_metrics)
                if not isinstance(metrics_list, list):
                    metrics_list = default_metrics
            elif isinstance(section, list):
                enabled = True
                metrics_list = section
            else:
                enabled = default_enabled
                metrics_list = default_metrics
            return {"enabled": enabled, "metrics": metrics_list}

        metrics_input = (config_data.get("metrics") or {})
        fairness_norm = normalize_metrics_section(
            metrics_input.get("fairness", {}),
            True,
            ["demographic_parity", "equalized_odds", "predictive_parity"],
        )
        performance_norm = normalize_metrics_section(
            metrics_input.get("performance", {}),
            False,
            ["accuracy", "precision"],
        )

        dataset_input = (config_data.get("dataset") or {})
        # Support top-level sampling as a fallback if dataset.sampling is not provided
        sampling_input = (dataset_input.get("sampling") or config_data.get("sampling") or {})
        sampling_norm = {
            "enabled": bool((sampling_input or {}).get("enabled", True)),
            "n_samples": int((sampling_input or {}).get("n_samples", 50)),
            "random_seed": int((sampling_input or {}).get("random_seed", 42)),
        }

        model_input = (config_data.get("model") or {})
        # Allow model_id to be provided directly under model or under model.huggingface
        model_hf_input = (model_input.get("huggingface") or {})
        resolved_model_id = model_input.get("model_id") or model_hf_input.get("model_id") or "TinyLlama/TinyLlama-1.1B-Chat-v1.0"

        config = {
            "dataset": {
                "name": dataset_input.get("name", "adult-census-income"),
                "source": dataset_input.get("source", "scikit-learn/adult-census-income"),
                "split": dataset_input.get("split", "train"),
                "platform": dataset_input.get("platform", "huggingface"),
                "protected_attributes": dataset_input.get("protected_attributes", ["sex", "race"]),
                "target_column": dataset_input.get("target_column", "income"),
                "sampling": sampling_norm,
            },
            "post_processing": {
                "binary_mapping": {
                    "favorable_outcome": (config_data.get("post_processing", {}).get("binary_mapping") or {}).get("favorable_outcome", ">50K"),
                    "unfavorable_outcome": (config_data.get("post_processing", {}).get("binary_mapping") or {}).get("unfavorable_outcome", "<=50K"),
                },
                "attribute_groups": (config_data.get("post_processing") or {}).get("attribute_groups") or {
                    "sex": {"privileged": ["Male"], "unprivileged": ["Female"]},
                    "race": {"privileged": ["White"], "unprivileged": ["Black", "Other"]},
                },
            },
            "model": {
                "model_task": model_input.get("model_task", "binary_classification"),
                "label_behavior": model_input.get("label_behavior", "binary"),
                "huggingface": {
                    "enabled": model_hf_input.get("enabled", True),
                    "model_id": resolved_model_id,
                    "device": model_hf_input.get("device", "cpu"),
                    "max_new_tokens": model_hf_input.get("max_new_tokens", 50),
                    "temperature": model_hf_input.get("temperature", 0.7),
                    "top_p": model_hf_input.get("top_p", 0.9),
                    "system_prompt": model_hf_input.get(
                        "system_prompt",
                        "You are a strict classifier. You must answer with exactly one of these two strings: '>50K' or '<=50K'. No explanation. No formatting.",
                    ),
                },
            },
            "metrics": {
                "fairness": fairness_norm,
                "performance": performance_norm,
            },
            "artifacts": {
                "inference_results_path": (config_data.get("artifacts") or {}).get("inference_results_path", "artifacts/cleaned_inference_results.csv"),
                "postprocessed_results_path": (config_data.get("artifacts") or {}).get("postprocessed_results_path", "artifacts/postprocessed_results.csv"),
            },
        }

        
        # Write config to file
        config_path = config_dir / "config.yaml"
        print(f"Config path: {config_path}")
        # Basic debug logs to help trace path issues
        print("[create_config_and_run_evaluation] CWD:", os.getcwd(), flush=True)
        print("[create_config_and_run_evaluation] Writing config to:", str(config_path), flush=True)
        with open(config_path, 'w') as f:
            yaml.dump(config, f, default_flow_style=False, indent=2)

        # Optional debug path: allow clients to request write-only to verify creation
        if (config_data or {}).get("debug_write_only") is True:
            return JSONResponse(
                status_code=202,
                content={
                    "message": "Configuration created (debug write-only)",
                    "config_path": str(config_path)
                }
            )
        
        # Create job ID for tracking
        job_id = await get_next_job_id()
        
        # Generate unique evaluation ID
        eval_id = f"eval_{int(job_id)}_{int(asyncio.get_event_loop().time())}"
        
        # Save evaluation to database
        async with get_db() as db:
            await insert_bias_fairness_evaluation(
                eval_id=eval_id,
                model_name=model_input.get("model_id", resolved_model_id) or "Unknown Model",
                dataset_name=config_data.get("dataset", {}).get("name", "Unknown Dataset"),
                model_task=config_data.get("model", {}).get("model_task", "binary_classification"),
                label_behavior=config_data.get("model", {}).get("label_behavior", "binary"),
                config_data=json.dumps(config),
                tenant=tenant,
                db=db
            )
            # Persist the newly created evaluation row
            await db.commit()
        
        # Start background task to run evaluation
        background_tasks.add_task(
            run_bias_fairness_evaluation, 
            job_id, 
            str(config_path), 
            eval_id,
            tenant
        )
        
        return JSONResponse(
            status_code=202,
            content={
                "message": "Configuration created and evaluation started",
                "job_id": job_id,
                "eval_id": eval_id,
                "config_path": str(config_path)
            }
        )
        
    except Exception as e:
        import traceback
        print("[create_config_and_run_evaluation] ERROR:", repr(e), flush=True)
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create config and start evaluation: {str(e)}"
        )

async def run_bias_fairness_evaluation(job_id: int, config_path: str, eval_id: str, tenant: str):
    """
    Run the bias and fairness evaluation using the created config.
    """
    try:
        # Update status to running
        async with get_db() as db:
            await update_bias_fairness_evaluation_status(eval_id, "running", None, db, tenant)
            await db.commit()
        
        # Prepare to run the evaluation using the module's virtualenv python if available
        import subprocess
        import sys
        # Determine repo root from current file path (same as in create_config_and_run_evaluation)
        repo_root = Path(__file__).resolve().parents[3]
        module_dir = repo_root / "BiasAndFairnessModule"
        module_python = module_dir / "venv" / "bin" / "python"
        
        # Check if module directory exists
        if not module_dir.exists():
            raise Exception(f"BiasAndFairnessModule directory not found at {module_dir}")
        
        # Check if config file exists
        if not Path(config_path).exists():
            raise Exception(f"Config file not found at {config_path}")
        
        # Use module's python if available, otherwise use system python
        python_exec = str(module_python) if module_python.exists() else sys.executable
        print(f"Using Python executable: {python_exec}")
        print(f"Working directory: {module_dir}")
        print(f"Config path: {config_path}")

        # Run the evaluation using the complete pipeline in the module directory
        result = subprocess.run(
            [python_exec, "run_full_evaluation.py"],
            capture_output=True,
            text=True,
            cwd=str(module_dir),
            timeout=1800  # 30 minute timeout
        )
        
        if result.returncode == 0:
            # Read the results
            results_path = Path(module_dir) / "artifacts" / "clean_results.json"
            if results_path.exists():
                with open(results_path, 'r') as f:
                    results = json.load(f)
                
                # Update status to completed with results
                async with get_db() as db:
                    await update_bias_fairness_evaluation_status(eval_id, "completed", results, db, tenant)
                    await db.commit()
                
                # Update job status
                await update_job_status(job_id, {
                    "status": "completed",
                    "eval_id": eval_id,
                    "results": results,
                    "message": "Evaluation completed successfully"
                })
            else:
                # Check if there are any existing results files we can use as fallback
                fallback_paths = [
                    Path(module_dir) / "artifacts" / "fairness_compass_results.json",
                    Path(module_dir) / "artifacts" / "inference_results.csv"
                ]
                
                fallback_results = None
                for fallback_path in fallback_paths:
                    if fallback_path.exists():
                        print(f"Using fallback results from {fallback_path}")
                        if fallback_path.suffix == '.json':
                            with open(fallback_path, 'r') as f:
                                fallback_results = json.load(f)
                        else:
                            # For CSV files, create a basic result structure
                            fallback_results = {
                                "message": "Evaluation completed with fallback results",
                                "source_file": str(fallback_path),
                                "status": "completed_with_fallback"
                            }
                        break
                
                if fallback_results:
                    # Update status to completed with fallback results
                    async with get_db() as db:
                        await update_bias_fairness_evaluation_status(eval_id, "completed", fallback_results, db, tenant)
                        await db.commit()
                    
                    await update_job_status(job_id, {
                        "status": "completed",
                        "eval_id": eval_id,
                        "results": fallback_results,
                        "message": "Evaluation completed with fallback results"
                    })
                else:
                    # Update status to failed
                    async with get_db() as db:
                        await update_bias_fairness_evaluation_status(eval_id, "failed", None, db, tenant)
                        await db.commit()
                    
                    await update_job_status(job_id, {
                        "status": "failed",
                        "eval_id": eval_id,
                        "error": "Results file not found",
                        "message": "Evaluation failed - results file not generated"
                    })
        else:
            # Log detailed error information
            error_details = {
                "return_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "python_exec": python_exec,
                "working_dir": str(module_dir),
                "config_path": config_path
            }
            print(f"Evaluation failed with return code {result.returncode}")
            print(f"STDOUT: {result.stdout}")
            print(f"STDERR: {result.stderr}")
            
            # Update status to failed
            async with get_db() as db:
                await update_bias_fairness_evaluation_status(eval_id, "failed", None, db, tenant)
                await db.commit()
            
            await update_job_status(job_id, {
                "status": "failed",
                "eval_id": eval_id,
                "error": result.stderr,
                "error_details": error_details,
                "message": f"Evaluation failed - CLI execution error (return code: {result.returncode})"
            })
            
    except Exception as e:
        # Log the exception details
        print(f"Exception in run_bias_fairness_evaluation: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Update status to failed
        async with get_db() as db:
            await update_bias_fairness_evaluation_status(eval_id, "failed", None, db, tenant)
            await db.commit()
        
        await update_job_status(job_id, {
            "status": "failed",
            "eval_id": eval_id,
            "error": str(e),
            "message": f"Evaluation failed: {str(e)}"
        })

async def update_job_status(job_id: int, status_data: dict):
    """
    Update the job status in Redis.
    """
    try:
        from database.redis import set_job_status
        await set_job_status(job_id, status_data)
    except Exception as e:
        print(f"Failed to update job status: {e}")

async def get_all_bias_fairness_evaluations_controller(tenant: str):
    """Get all bias and fairness evaluations for a tenant."""
    try:
        async with get_db() as db:
            evaluations = await get_all_bias_fairness_evaluations(db, tenant)
            # Convert RowMapping objects to dictionaries for JSON serialization
            evaluations_list = []
            for evaluation in evaluations:
                eval_dict = {
                    'id': evaluation.id,
                    'eval_id': evaluation.eval_id,
                    'model_name': evaluation.model_name,
                    'dataset_name': evaluation.dataset_name,
                    'model_task': evaluation.model_task,
                    'label_behavior': evaluation.label_behavior,
                    'config_data': evaluation.config_data,
                    'status': evaluation.status,
                    'results': evaluation.results,
                    'created_at': evaluation.created_at.isoformat() if evaluation.created_at else None,
                    'updated_at': evaluation.updated_at.isoformat() if evaluation.updated_at else None
                }
                evaluations_list.append(eval_dict)
            
            return JSONResponse(
                status_code=200,
                content=evaluations_list
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve evaluations: {str(e)}"
        )

async def get_bias_fairness_evaluation_by_id_controller(eval_id: str, tenant: str):
    """Get a specific bias and fairness evaluation by eval_id."""
    try:
        async with get_db() as db:
            evaluation = await get_bias_fairness_evaluation_by_id(eval_id, db, tenant)
            if not evaluation:
                raise HTTPException(
                    status_code=404,
                    detail=f"Evaluation with ID {eval_id} not found"
                )
            
            # Convert RowMapping object to dictionary for JSON serialization
            eval_dict = {
                'id': evaluation.id,
                'eval_id': evaluation.eval_id,
                'model_name': evaluation.model_name,
                'dataset_name': evaluation.dataset_name,
                'model_task': evaluation.model_task,
                'label_behavior': evaluation.label_behavior,
                'config_data': evaluation.config_data,
                'status': evaluation.status,
                'results': evaluation.results,
                'created_at': evaluation.created_at.isoformat() if evaluation.created_at else None,
                'updated_at': evaluation.updated_at.isoformat() if evaluation.updated_at else None
            }
            
            return JSONResponse(
                status_code=200,
                content=eval_dict
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve evaluation: {str(e)}"
        )

async def delete_bias_fairness_evaluation_controller(eval_id: str, tenant: str):
    """Delete a bias and fairness evaluation."""
    try:
        async with get_db() as db:
            result = await delete_bias_fairness_evaluation(eval_id, db, tenant)
            if not result:
                raise HTTPException(
                    status_code=404,
                    detail=f"Evaluation with ID {eval_id} not found"
                )
            await db.commit()  # Commit the deletion
            return JSONResponse(
                status_code=200,
                content={"message": f"Evaluation {eval_id} deleted successfully"}
            )
    except HTTPException as he:
        raise he
    except Exception as e:
        # Rollback the transaction if something went wrong
        async with get_db() as db:
            await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete evaluation: {str(e)}"
        )
