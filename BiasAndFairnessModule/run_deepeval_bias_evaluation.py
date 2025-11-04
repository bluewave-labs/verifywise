#!/usr/bin/env python3
"""
DeepEval Evaluation Runner for BiasAndFairnessModule

This script runs comprehensive LLM evaluation using DeepEval's metrics framework.
It integrates with the existing BiasAndFairnessModule infrastructure.

Usage:
    # Run with default settings (uses existing inference results)
    python run_deepeval_evaluation.py

    # Run with specific metrics enabled
    python run_deepeval_evaluation.py --use-answer-relevancy --use-bias --use-toxicity

    # Run with custom inference results path
    python run_deepeval_evaluation.py --inference-results path/to/results.csv

    # Run with all available metrics
    python run_deepeval_evaluation.py --use-all-metrics

Documentation: https://docs.confident-ai.com/docs/metrics-introduction
"""

import sys
import os
import argparse
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src directory to path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

from src.core.config import ConfigManager
from src.deepeval_engine.deepeval_evaluator import DeepEvalEvaluator
from src.deepeval_engine.deepeval_dataset import DeepEvalDatasetBuilder


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Run DeepEval evaluation on BiasAndFairnessModule results",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic usage with existing inference results
  python run_deepeval_evaluation.py

  # Enable specific metrics
  python run_deepeval_evaluation.py --use-answer-relevancy --use-bias

  # Use all available metrics (requires OpenAI API key)
  python run_deepeval_evaluation.py --use-all-metrics

  # Use custom inference results
  python run_deepeval_evaluation.py --inference-results artifacts/my_results.csv

  # Limit number of samples to evaluate
  python run_deepeval_evaluation.py --limit 20

DeepEval Metrics:
  - Answer Relevancy: Measures if the answer is relevant to the input
  - Faithfulness: Checks if the answer is faithful to the context
  - Contextual Relevancy: Evaluates if context is relevant to the input
  - Hallucination: Detects hallucinations in the output
  - Bias: Identifies potential biases in responses
  - Toxicity: Detects toxic or harmful content

Note: Most metrics require an OpenAI API key. Set OPENAI_API_KEY in your .env file.
        """
    )
    
    # Input/output options
    parser.add_argument(
        "--inference-results",
        type=str,
        default=None,
        help="Path to inference results CSV (default: from config)"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default=None,
        help="Output directory for results (default: artifacts/deepeval_results)"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of samples to evaluate (default: all)"
    )
    
    # Metric selection
    parser.add_argument(
        "--use-all-metrics",
        action="store_true",
        help="Enable all available DeepEval metrics"
    )
    parser.add_argument(
        "--use-answer-relevancy",
        action="store_true",
        help="Enable Answer Relevancy metric"
    )
    parser.add_argument(
        "--use-faithfulness",
        action="store_true",
        help="Enable Faithfulness metric (requires context)"
    )
    parser.add_argument(
        "--use-contextual-relevancy",
        action="store_true",
        help="Enable Contextual Relevancy metric"
    )
    parser.add_argument(
        "--use-hallucination",
        action="store_true",
        help="Enable Hallucination Detection metric"
    )
    parser.add_argument(
        "--use-bias",
        action="store_true",
        help="Enable Bias Detection metric"
    )
    parser.add_argument(
        "--use-toxicity",
        action="store_true",
        help="Enable Toxicity Detection metric"
    )
    
    # Metric thresholds
    parser.add_argument(
        "--threshold-answer-relevancy",
        type=float,
        default=0.5,
        help="Threshold for Answer Relevancy metric (default: 0.5)"
    )
    parser.add_argument(
        "--threshold-faithfulness",
        type=float,
        default=0.5,
        help="Threshold for Faithfulness metric (default: 0.5)"
    )
    parser.add_argument(
        "--threshold-contextual-relevancy",
        type=float,
        default=0.5,
        help="Threshold for Contextual Relevancy metric (default: 0.5)"
    )
    parser.add_argument(
        "--threshold-hallucination",
        type=float,
        default=0.5,
        help="Threshold for Hallucination metric (default: 0.5)"
    )
    parser.add_argument(
        "--threshold-bias",
        type=float,
        default=0.5,
        help="Threshold for Bias metric (default: 0.5)"
    )
    parser.add_argument(
        "--threshold-toxicity",
        type=float,
        default=0.5,
        help="Threshold for Toxicity metric (default: 0.5)"
    )
    
    return parser.parse_args()


def check_prerequisites():
    """Check if prerequisites are met."""
    print("🔍 Checking prerequisites...")
    
    # Check for OpenAI API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️  WARNING: OPENAI_API_KEY not found in environment")
        print("   DeepEval metrics require an OpenAI API key to function.")
        print("   Add it to your .env file or export it:")
        print("   export OPENAI_API_KEY='your-api-key-here'")
        print("\n   Continuing with basic evaluation only...\n")
        return False
    else:
        print("✓ OpenAI API key found")
        return True


def main():
    """Main execution function."""
    args = parse_args()
    
    print("="*70)
    print("DeepEval Evaluation for BiasAndFairnessModule")
    print("="*70)
    print("\nDeepEval provides comprehensive LLM evaluation metrics:")
    print("  • Answer Relevancy - Measures relevance of responses")
    print("  • Bias Detection - Identifies potential biases")
    print("  • Toxicity Detection - Flags harmful content")
    print("  • Faithfulness - Checks context adherence")
    print("  • Hallucination Detection - Identifies fabricated info")
    print("  • Contextual Relevancy - Evaluates context relevance")
    print("\n" + "-"*70 + "\n")
    
    # Check prerequisites
    has_openai_key = check_prerequisites()
    
    # Initialize configuration
    print("📋 Loading configuration...")
    config_manager = ConfigManager()
    config = config_manager.config
    print(f"✓ Loaded configuration for dataset: {config.dataset.name}")
    
    # Get model_id safely
    model_id = getattr(config.model, 'model_id', None)
    if model_id is None and hasattr(config.model, 'huggingface'):
        model_id = getattr(config.model.huggingface, 'model_id', 'unknown')
    print(f"  Model: {model_id or 'unknown'}")
    
    # Determine metrics configuration
    metrics_config = {}
    
    if args.use_all_metrics:
        print("\n📊 Enabling all DeepEval metrics...")
        metrics_config = {
            "answer_relevancy": True,
            "faithfulness": True,
            "contextual_relevancy": True,
            "hallucination": True,
            "bias": True,
            "toxicity": True,
        }
    else:
        # Use individual flags or defaults
        metrics_config = {
            "answer_relevancy": args.use_answer_relevancy or True,  # Default to True
            "faithfulness": args.use_faithfulness,
            "contextual_relevancy": args.use_contextual_relevancy,
            "hallucination": args.use_hallucination,
            "bias": args.use_bias or True,  # Default to True
            "toxicity": args.use_toxicity or True,  # Default to True
        }
    
    # Build metric thresholds
    metric_thresholds = {
        "answer_relevancy": args.threshold_answer_relevancy,
        "faithfulness": args.threshold_faithfulness,
        "contextual_relevancy": args.threshold_contextual_relevancy,
        "hallucination": args.threshold_hallucination,
        "bias": args.threshold_bias,
        "toxicity": args.threshold_toxicity,
    }
    
    # Display enabled metrics
    enabled_metrics = [name for name, enabled in metrics_config.items() if enabled]
    print(f"\n✓ Enabled metrics: {', '.join(enabled_metrics)}")
    
    if not has_openai_key:
        print("\n⚠️  Note: Metrics will not run without OpenAI API key")
        print("   Only basic accuracy evaluation will be performed.")
    
    # Initialize dataset builder
    print(f"\n📦 Loading dataset...")
    dataset_builder = DeepEvalDatasetBuilder(
        config_manager=config_manager,
        limit_samples=args.limit
    )
    
    # Build test cases from inference results
    print(f"\n🏗️  Building test cases from inference results...")
    try:
        test_cases_data = dataset_builder.build_test_cases_from_inference_results(
            inference_results_path=args.inference_results
        )
        print(f"✓ Built {len(test_cases_data)} test cases")
        
        # Apply limit if specified
        if args.limit and len(test_cases_data) > args.limit:
            test_cases_data = test_cases_data[:args.limit]
            print(f"  Limited to {args.limit} test cases")
        
    except FileNotFoundError as e:
        print(f"\n❌ Error: {e}")
        print("\n💡 To generate inference results, run:")
        print("   python run_full_evaluation.py")
        return 1
    except Exception as e:
        print(f"\n❌ Error building test cases: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Initialize evaluator
    print(f"\n🚀 Initializing DeepEval evaluator...")
    evaluator = DeepEvalEvaluator(
        config_manager=config_manager,
        output_dir=args.output_dir,
        metric_thresholds=metric_thresholds
    )
    
    # Run evaluation
    print(f"\n🔍 Starting evaluation...")
    try:
        results = evaluator.run_evaluation(
            test_cases_data=test_cases_data,
            metrics_config=metrics_config
        )
        
        print(f"\n✅ Evaluation completed successfully!")
        print(f"   Evaluated {len(results)} samples")
        print(f"   Results saved to: {evaluator.output_dir}")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Evaluation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

