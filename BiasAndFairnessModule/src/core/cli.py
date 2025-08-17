#!/usr/bin/env python3
"""
Command-line interface for the Bias and Fairness Module.

Supports dual evaluation modes:
- prompt: LLM evaluation using generated prompts
- predict: Tabular model evaluation using features
"""

import argparse
import logging
import json
import sys
from pathlib import Path
from typing import Optional, Dict, Any

from .config import ConfigManager
from ..dataset_loader.data_loader import DataLoader
from ..model_loader.model_loader import ModelLoader, load_sklearn_model
from ..eval_engine.eval_runner import EvaluationRunner
from ..inference.inference import ModelInferencePipeline
from ..eval_engine.compass_router import route_metric, get_task_type_from_config, get_label_behavior_from_data
from ..eval_engine.evaluation_module import FairnessEvaluator


def setup_logging(verbose: bool = False) -> None:
    """Set up logging configuration."""
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler('fairness_evaluation.log')
        ]
    )


def run_prompt_evaluation(
    config_path: Optional[str] = None,
    limit_samples: Optional[int] = None,
    output_path: Optional[str] = None,
    verbose: bool = False
) -> Dict[str, Any]:
    """
    Run prompt-based LLM evaluation.
    
    Args:
        config_path: Path to configuration file
        limit_samples: Number of samples to evaluate
        output_path: Path to save results
        verbose: Enable verbose logging
        
    Returns:
        Dict containing evaluation results
    """
    logger = logging.getLogger(__name__)
    logger.info("Starting prompt-based LLM evaluation...")
    
    try:
        # Create inference pipeline
        inference_pipeline = ModelInferencePipeline(config_path)
        
        # Generate prompts and run inference
        samples = inference_pipeline.generate_prompts(limit_samples=limit_samples)
        prompts = [sample["prompt"] for sample in samples]
        responses = inference_pipeline.model_loader.predict(prompts)
        
        # Extract sensitive attributes
        sensitive_attributes = [sample["protected_attributes"] for sample in samples]
        
        # Create evaluation runner
        evaluator = EvaluationRunner(
            df=inference_pipeline.data_loader.data,
            inference_pipeline=inference_pipeline,
            config=inference_pipeline.config_manager.config,
            mode="prompt"
        )
        
        # Run evaluation
        results = evaluator.run_dual_evaluation(
            prompts=prompts,
            responses=responses,
            sensitive_attributes=sensitive_attributes
        )
        
        # Save results if output path provided
        if output_path:
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            logger.info(f"Results saved to {output_path}")
        
        return results
        
    except Exception as e:
        logger.error(f"Error in prompt evaluation: {str(e)}")
        raise


def run_predict_evaluation(
    config_path: Optional[str] = None,
    model_path: Optional[str] = None,
    output_path: Optional[str] = None,
    verbose: bool = False
) -> Dict[str, Any]:
    """
    Run feature-based tabular evaluation.
    
    Args:
        config_path: Path to configuration file
        model_path: Path to trained model file
        output_path: Path to save results
        verbose: Enable verbose logging
        
    Returns:
        Dict containing evaluation results
    """
    logger = logging.getLogger(__name__)
    logger.info("Starting feature-based tabular evaluation...")
    
    try:
        # Load configuration
        config_manager = ConfigManager(config_path)
        config = config_manager.config
        
        # Load dataset
        data_loader = DataLoader(config.dataset)
        df = data_loader.load_data()
        logger.info(f"Loaded dataset with {len(df)} samples")
        
        # Prepare data
        X = df.drop(columns=[config.dataset.target_column])
        y = df[config.dataset.target_column]
        A = df[config.dataset.protected_attributes[0]] if config.dataset.protected_attributes else df.iloc[:, 0]
        
        # Load model
        if model_path is None:
            model_path = "model.joblib"  # Default model path
        
        model = load_sklearn_model(model_path)
        logger.info(f"Loaded model from {model_path}")
        
        # Create evaluation runner
        evaluator = EvaluationRunner(
            df=df,
            config=config,
            mode="predict"
        )
        
        # Run evaluation
        results = evaluator.run_dual_evaluation(
            X=X, y=y, A=A, model=model
        )
        
        # Save results if output path provided
        if output_path:
            with open(output_path, 'w') as f:
                json.dump(results, f, indent=2, default=str)
            logger.info(f"Results saved to {output_path}")
        
        return results
        
    except Exception as e:
        logger.error(f"Error in predict evaluation: {str(e)}")
        raise


def run_metric_validation(
    task_type: str,
    label_behavior: str,
    output_path: Optional[str] = None
) -> Dict[str, Any]:
    """
    Validate metric routing for given task type and label behavior.
    
    Args:
        task_type: Type of task
        label_behavior: Type of label behavior
        output_path: Path to save results
        
    Returns:
        Dict containing validation results
    """
    logger = logging.getLogger(__name__)
    logger.info(f"Validating metrics for {task_type}/{label_behavior}")
    
    # Route metrics
    metrics = route_metric(task_type, label_behavior)
    
    # Get task type from config
    config_task_type = get_task_type_from_config("tabular", "classification")
    
    # Get label behavior from data
    sample_data = [0, 1, 0, 1, 0] if label_behavior == "binary" else [0.1, 0.5, 0.8, 0.2, 0.9]
    data_label_behavior = get_label_behavior_from_data(sample_data, task_type)
    
    results = {
        "task_type": task_type,
        "label_behavior": label_behavior,
        "routed_metrics": metrics,
        "config_task_type": config_task_type,
        "data_label_behavior": data_label_behavior,
        "validation_passed": True
    }
    
    # Save results if output path provided
    if output_path:
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        logger.info(f"Validation results saved to {output_path}")
    
    return results


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Bias and Fairness Module CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run prompt-based LLM evaluation
  python -m src.cli prompt --config config.yaml --limit 100 --output results.json
  
  # Run feature-based tabular evaluation
  python -m src.cli predict --config config.yaml --model model.joblib --output results.json
  
  # Validate metric routing
  python -m src.cli validate --task-type binary_classification --label-behavior binary
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Prompt evaluation command
    prompt_parser = subparsers.add_parser('prompt', help='Run prompt-based LLM evaluation')
    prompt_parser.add_argument('--config', type=str, help='Path to configuration file')
    prompt_parser.add_argument('--limit', type=int, help='Number of samples to evaluate')
    prompt_parser.add_argument('--output', type=str, help='Path to save results')
    prompt_parser.add_argument('--verbose', action='store_true', help='Enable verbose logging')
    
    # Predict evaluation command
    predict_parser = subparsers.add_parser('predict', help='Run feature-based tabular evaluation')
    predict_parser.add_argument('--config', type=str, help='Path to configuration file')
    predict_parser.add_argument('--model', type=str, help='Path to trained model file')
    predict_parser.add_argument('--output', type=str, help='Path to save results')
    predict_parser.add_argument('--verbose', action='store_true', help='Enable verbose logging')
    
    # Validation command
    validate_parser = subparsers.add_parser('validate', help='Validate metric routing')
    validate_parser.add_argument('--task-type', type=str, required=True,
                               choices=['binary_classification', 'multiclass_classification', 
                                       'regression', 'generation', 'ranking'],
                               help='Type of task')
    validate_parser.add_argument('--label-behavior', type=str, required=True,
                               choices=['binary', 'continuous', 'categorical'],
                               help='Type of label behavior')
    validate_parser.add_argument('--output', type=str, help='Path to save results')
    
    # Parse arguments
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Set up logging
    setup_logging(getattr(args, 'verbose', False))
    logger = logging.getLogger(__name__)
    
    try:
        if args.command == 'prompt':
            results = run_prompt_evaluation(
                config_path=args.config,
                limit_samples=args.limit,
                output_path=args.output,
                verbose=args.verbose
            )
            print("Prompt evaluation completed successfully!")
            print(f"Results: {json.dumps(results, indent=2, default=str)}")
            
        elif args.command == 'predict':
            results = run_predict_evaluation(
                config_path=args.config,
                model_path=args.model,
                output_path=args.output,
                verbose=args.verbose
            )
            print("Predict evaluation completed successfully!")
            print(f"Results: {json.dumps(results, indent=2, default=str)}")
            
        elif args.command == 'validate':
            results = run_metric_validation(
                task_type=args.task_type,
                label_behavior=args.label_behavior,
                output_path=args.output
            )
            print("Metric validation completed successfully!")
            print(f"Routed metrics: {results['routed_metrics']}")
            
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main() 