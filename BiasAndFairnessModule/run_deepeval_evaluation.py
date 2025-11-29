#!/usr/bin/env python3
"""
DeepEval Standalone Evaluation Runner

Comprehensive LLM evaluation using DeepEval's metrics framework.
Evaluates models on diverse prompts (coding, reasoning, creative writing, etc.)

Usage:
    python run_deepeval_evaluation.py
    python run_deepeval_evaluation.py --limit 5
    python run_deepeval_evaluation.py --categories coding mathematics
    python run_deepeval_evaluation.py --use-all-metrics

Documentation: https://docs.confident-ai.com/
"""

import sys
import os
import argparse
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add src directory to path
current_dir = Path(__file__).parent
src_dir = current_dir / "src"
sys.path.insert(0, str(src_dir))

from src.deepeval_engine import DeepEvalEvaluator, EvaluationDataset, ModelRunner
from deepeval.test_case import LLMTestCase


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Run DeepEval evaluation on diverse LLM prompts",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Basic evaluation (all prompts)
  python run_deepeval_evaluation.py

  # Evaluate specific categories
  python run_deepeval_evaluation.py --categories coding mathematics

  # Limit number of prompts
  python run_deepeval_evaluation.py --limit 10

  # Use all available metrics
  python run_deepeval_evaluation.py --use-all-metrics

  # Specific difficulty
  python run_deepeval_evaluation.py --difficulties easy medium

DeepEval Metrics:
  - Answer Relevancy: Measures if the answer is relevant to the input
  - Bias: Identifies potential biases in responses
  - Toxicity: Detects toxic or harmful content
  - Faithfulness: Checks if the answer is faithful to context
  - Hallucination: Detects fabricated information
  - Contextual Relevancy: Evaluates if context is relevant

Note: Most metrics require an OpenAI API key (OPENAI_API_KEY environment variable).
        """
    )
    
    # Dataset options
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Limit number of prompts to evaluate"
    )
    parser.add_argument(
        "--categories",
        type=str,
        nargs="+",
        default=None,
        help="Filter by categories (e.g., coding mathematics reasoning)"
    )
    parser.add_argument(
        "--difficulties",
        type=str,
        nargs="+",
        default=None,
        help="Filter by difficulty (easy, medium, hard)"
    )
    parser.add_argument(
        "--ids",
        type=str,
        nargs="+",
        default=None,
        help="Evaluate specific prompt IDs"
    )
    
    # Model options
    parser.add_argument(
        "--model",
        type=str,
        default="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        help="Model name (HuggingFace ID, OpenAI model, etc.)"
    )
    parser.add_argument(
        "--provider",
        type=str,
        default="huggingface",
        choices=["huggingface", "openai", "ollama"],
        help="Model provider"
    )
    
    # Generation options
    parser.add_argument(
        "--max-tokens",
        type=int,
        default=500,
        help="Maximum tokens to generate"
    )
    parser.add_argument(
        "--temperature",
        type=float,
        default=0.7,
        help="Sampling temperature"
    )
    
    # Output options
    parser.add_argument(
        "--output-dir",
        type=str,
        default="artifacts/deepeval_results",
        help="Output directory for results"
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
        default=True,
        help="Enable Answer Relevancy metric (default: True)"
    )
    parser.add_argument(
        "--use-bias",
        action="store_true",
        default=True,
        help="Enable Bias Detection metric (default: True)"
    )
    parser.add_argument(
        "--use-toxicity",
        action="store_true",
        default=True,
        help="Enable Toxicity Detection metric (default: True)"
    )
    parser.add_argument(
        "--use-faithfulness",
        action="store_true",
        help="Enable Faithfulness metric"
    )
    parser.add_argument(
        "--use-hallucination",
        action="store_true",
        help="Enable Hallucination Detection metric"
    )
    parser.add_argument(
        "--use-contextual-relevancy",
        action="store_true",
        help="Enable Contextual Relevancy metric"
    )
    
    return parser.parse_args()


def check_prerequisites():
    """Check if prerequisites are met."""
    print("🔍 Checking prerequisites...")
    
    # Check for OpenAI API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("⚠️  WARNING: OPENAI_API_KEY not found in environment")
        print("   DeepEval metrics require an OpenAI API key.")
        print("   Set it in your .env file or export it:")
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
    print("DeepEval Standalone LLM Evaluation")
    print("="*70)
    print("\nEvaluating LLM on diverse prompts:")
    print("  • Coding tasks")
    print("  • Mathematical reasoning")
    print("  • Logical reasoning")
    print("  • Creative writing")
    print("  • Knowledge & facts")
    print("  • Language understanding")
    print("  • Common sense")
    print("  • Open-ended questions")
    print("\n" + "-"*70 + "\n")
    
    # Check prerequisites
    has_openai_key = check_prerequisites()
    
    # Load evaluation dataset
    print("📦 Loading evaluation dataset...")
    dataset = EvaluationDataset()
    
    # Get prompts
    prompts = dataset.get_all_prompts()
    
    # Apply filters
    if args.categories:
        prompts = [p for p in prompts if p["category"] in args.categories]
        print(f"  Filtered by categories: {', '.join(args.categories)}")
    
    if args.difficulties:
        prompts = [p for p in prompts if p["difficulty"] in args.difficulties]
        print(f"  Filtered by difficulties: {', '.join(args.difficulties)}")
    
    if args.ids:
        prompts = [p for p in prompts if p["id"] in args.ids]
        print(f"  Filtered by IDs: {', '.join(args.ids)}")
    
    if args.limit:
        prompts = prompts[:args.limit]
        print(f"  Limited to {args.limit} prompts")
    
    print(f"✓ Loaded {len(prompts)} prompts for evaluation")
    
    # Display dataset statistics
    stats = dataset.get_statistics()
    print(f"\n📊 Dataset Statistics:")
    print(f"  Total prompts in dataset: {stats['total_prompts']}")
    print(f"  Categories: {', '.join(stats['category_list'])}")
    print(f"  Evaluating: {len(prompts)} prompts\n")
    
    # Initialize model runner
    print(f"🤖 Initializing model runner...")
    print(f"  Model: {args.model}")
    print(f"  Provider: {args.provider}")
    
    try:
        model_runner = ModelRunner(
            model_name=args.model,
            provider=args.provider
        )
    except Exception as e:
        print(f"\n❌ Error initializing model: {e}")
        print("\n💡 Tips:")
        print("  - For HuggingFace: Ensure model is downloaded")
        print("  - For OpenAI: Set OPENAI_API_KEY")
        print("  - For Ollama: Ensure Ollama is running")
        return 1
    
    # Generate responses
    print(f"\n🔄 Generating responses for {len(prompts)} prompts...")
    print("-"*70)
    
    test_cases_data = []
    
    for i, prompt_data in enumerate(prompts, 1):
        print(f"[{i}/{len(prompts)}] {prompt_data['id']} ({prompt_data['category']}, {prompt_data['difficulty']})")
        print(f"  Prompt: {prompt_data['prompt'][:80]}...")
        
        try:
            # Generate response
            response = model_runner.generate(
                prompt=prompt_data['prompt'],
                max_tokens=args.max_tokens,
                temperature=args.temperature,
            )
            
            print(f"  Response: {response[:100]}...")
            
            # Create DeepEval test case
            test_case = LLMTestCase(
                input=prompt_data['prompt'],
                actual_output=response,
                expected_output=prompt_data['expected_output'],
                context=[
                    f"Category: {prompt_data['category']}",
                    f"Difficulty: {prompt_data['difficulty']}",
                ],
                retrieval_context=[prompt_data['expected_output']]
            )
            
            # Format metadata to match evaluator expectations
            metadata = {
                "sample_id": prompt_data['id'],  # Use 'id' from prompt as 'sample_id'
                "category": prompt_data['category'],
                "difficulty": prompt_data['difficulty'],
                "prompt": prompt_data['prompt'],
                "expected_output": prompt_data['expected_output'],
                "expected_keywords": prompt_data.get('expected_keywords', []),
                "protected_attributes": {
                    "category": prompt_data['category'],
                    "difficulty": prompt_data['difficulty']
                }  # For reporting purposes
            }
            
            test_cases_data.append({
                "test_case": test_case,
                "metadata": metadata
            })
            
        except Exception as e:
            print(f"  ❌ Error generating response: {e}")
            continue
    
    print("-"*70)
    print(f"✓ Generated {len(test_cases_data)} responses\n")
    
    if not test_cases_data:
        print("❌ No responses generated. Exiting.")
        return 1
    
    # Determine metrics configuration
    if args.use_all_metrics:
        metrics_config = {
            "answer_relevancy": True,
            "faithfulness": True,
            "contextual_relevancy": True,
            "hallucination": True,
            "bias": True,
            "toxicity": True,
        }
    else:
        metrics_config = {
            "answer_relevancy": args.use_answer_relevancy,
            "faithfulness": args.use_faithfulness,
            "contextual_relevancy": args.use_contextual_relevancy,
            "hallucination": args.use_hallucination,
            "bias": args.use_bias,
            "toxicity": args.use_toxicity,
        }
    
    enabled_metrics = [name for name, enabled in metrics_config.items() if enabled]
    print(f"✓ Enabled metrics: {', '.join(enabled_metrics)}")
    
    if not has_openai_key:
        print("\n⚠️  Note: Metrics will not run without OpenAI API key")
        print("   Only basic response statistics will be provided.\n")
    
    # Initialize evaluator (using a simple config-like dict)
    print(f"\n🚀 Initializing DeepEval evaluator...")
    
    # Create a minimal config object
    class SimpleConfig:
        def __init__(self):
            self.model = type('obj', (object,), {'model_id': args.model})()
            self.dataset = type('obj', (object,), {'name': 'evaluation_dataset'})()
    
    simple_config = SimpleConfig()
    
    evaluator = DeepEvalEvaluator(
        config_manager=type('obj', (object,), {'config': simple_config})(),
        output_dir=args.output_dir,
    )
    
    print(f"  Output directory: {args.output_dir}")
    print(f"  OpenAI API available: {has_openai_key}")
    
    # Run evaluation
    print(f"\n🔍 Starting DeepEval evaluation...\n")
    
    try:
        results = evaluator.run_evaluation(
            test_cases_data=test_cases_data,
            metrics_config=metrics_config
        )
        
        print(f"\n✅ Evaluation completed successfully!")
        print(f"   Evaluated {len(results)} prompts")
        print(f"   Results saved to: {args.output_dir}")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Evaluation failed: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())

