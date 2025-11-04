"""
DeepEval Evaluator for BiasAndFairnessModule

Comprehensive LLM evaluation using DeepEval's metrics framework.
Documentation: https://docs.confident-ai.com/docs/metrics-introduction
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional

import pandas as pd
from deepeval.metrics import (
    AnswerRelevancyMetric,
    FaithfulnessMetric,
    ContextualRelevancyMetric,
    HallucinationMetric,
    BiasMetric,
    ToxicityMetric,
)
from deepeval import evaluate
from deepeval.dataset import EvaluationDataset

from ..core.config import ConfigManager


class DeepEvalEvaluator:
    """
    Comprehensive evaluator using DeepEval's metrics for LLM evaluation.
    
    DeepEval provides various metrics to evaluate LLM outputs:
    - AnswerRelevancyMetric: Measures if the answer is relevant to the input
    - FaithfulnessMetric: Checks if the answer is faithful to the context
    - ContextualRelevancyMetric: Evaluates if context is relevant to the input
    - HallucinationMetric: Detects hallucinations in the output
    - BiasMetric: Identifies potential biases in responses
    - ToxicityMetric: Detects toxic or harmful content
    """
    
    def __init__(
        self,
        config_manager: ConfigManager,
        output_dir: Optional[str] = None,
        metric_thresholds: Optional[Dict[str, float]] = None,
    ):
        """
        Initialize DeepEval evaluator.
        
        Args:
            config_manager: Configuration manager instance
            output_dir: Directory to save results (defaults to artifacts/deepeval_results)
            metric_thresholds: Optional dict of metric name -> threshold value
        """
        self.config_manager = config_manager
        self.config = config_manager.config
        
        # Set output directory
        if output_dir is None:
            output_dir = "artifacts/deepeval_results"
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Get DeepEval configuration
        deepeval_config = getattr(self.config, 'deepeval', None)
        
        # Metric thresholds
        self.metric_thresholds = metric_thresholds or {}
        if deepeval_config and hasattr(deepeval_config, 'metric_thresholds'):
            self.metric_thresholds.update(deepeval_config.metric_thresholds)
        
        # Set default thresholds if not provided
        default_thresholds = {
            "answer_relevancy": 0.5,
            "faithfulness": 0.5,
            "contextual_relevancy": 0.5,
            "hallucination": 0.5,
            "bias": 0.5,
            "toxicity": 0.5,
        }
        for key, value in default_thresholds.items():
            if key not in self.metric_thresholds:
                self.metric_thresholds[key] = value
        
        # Check for OpenAI API key (required for some metrics)
        self.has_openai_key = bool(os.getenv("OPENAI_API_KEY"))
        
        if not self.has_openai_key:
            print("\n⚠️  NOTE: Some DeepEval metrics require OPENAI_API_KEY")
            print("    Add to your .env file for full functionality")
            print("    Continuing with available metrics only...\n")
        
        print(f"✓ Initialized DeepEval evaluator")
        print(f"  Output directory: {self.output_dir}")
        print(f"  OpenAI API available: {self.has_openai_key}")
    
    def evaluate_test_cases(
        self,
        test_cases_data: List[Dict[str, Any]],
        metrics_config: Optional[Dict[str, bool]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Evaluate test cases using DeepEval metrics.
        
        Args:
            test_cases_data: List of test case dictionaries with 'test_case' and 'metadata'
            metrics_config: Optional dict of metric names -> enabled (True/False)
            
        Returns:
            List of evaluation results with scores
        """
        # Default metrics configuration
        if metrics_config is None:
            metrics_config = {
                "answer_relevancy": True,
                "faithfulness": False,  # Requires context
                "contextual_relevancy": False,  # Requires context
                "hallucination": False,  # Requires context
                "bias": True,
                "toxicity": True,
            }
        
        # If no OpenAI key, disable metrics that require it
        if not self.has_openai_key:
            metrics_config = {k: False for k in metrics_config}
            print("⚠️ All DeepEval metrics disabled (no OpenAI API key)")
            return self._evaluate_without_deepeval(test_cases_data)
        
        print("\n" + "="*70)
        print("Running DeepEval Metrics Evaluation")
        print("="*70)
        
        # Initialize metrics based on configuration
        metrics_to_use = self._initialize_metrics(metrics_config)
        
        print(f"\n✓ Initialized {len(metrics_to_use)} metrics: {', '.join([m[0] for m in metrics_to_use])}")
        
        results = []
        
        for i, tc_data in enumerate(test_cases_data, 1):
            test_case = tc_data["test_case"]
            metadata = tc_data["metadata"]
            
            print(f"\n{'='*70}")
            print(f"[{i}/{len(test_cases_data)}] Evaluating Sample: {metadata['sample_id']}")
            print(f"Protected Attributes: {metadata['protected_attributes']}")
            print(f"{'='*70}")
            print(f"Input (truncated): {test_case.input[:200]}...")
            print(f"\nActual Output: {test_case.actual_output}")
            print(f"Expected Output: {test_case.expected_output}")
            print(f"\n{'-'*70}")
            
            # Store metric scores
            metric_scores = {}
            
            # Evaluate with each metric
            for metric_name, metric in metrics_to_use:
                try:
                    print(f"  Evaluating {metric_name}...", end=" ")
                    metric.measure(test_case)
                    score = metric.score
                    passed = metric.is_successful()
                    
                    metric_scores[metric_name] = {
                        "score": round(score, 3) if score is not None else None,
                        "passed": passed,
                        "threshold": metric.threshold,
                        "reason": getattr(metric, 'reason', 'N/A')
                    }
                    
                    status = "✓ PASS" if passed else "✗ FAIL"
                    print(f"{status} (score: {score:.3f})")
                    
                except Exception as e:
                    print(f"✗ Error: {str(e)}")
                    metric_scores[metric_name] = {
                        "score": None,
                        "passed": False,
                        "threshold": metric.threshold,
                        "error": str(e)
                    }
            
            # Calculate basic statistics
            response_length = len(test_case.actual_output)
            word_count = len(test_case.actual_output.split())
            
            result = {
                "sample_id": metadata["sample_id"],
                "protected_attributes": metadata["protected_attributes"],
                "input": test_case.input,
                "actual_output": test_case.actual_output,
                "expected_output": test_case.expected_output,
                "response_length": response_length,
                "word_count": word_count,
                "metric_scores": metric_scores,
                "timestamp": datetime.now().isoformat()
            }
            
            results.append(result)
            
            # Print metric summary
            print(f"\n{'-'*70}")
            print(f"Basic Stats: {word_count} words")
            print(f"Metric Summary:")
            for metric_name, score_data in metric_scores.items():
                if score_data['score'] is not None:
                    status = "✓" if score_data['passed'] else "✗"
                    print(f"  {status} {metric_name}: {score_data['score']:.3f} (threshold: {score_data['threshold']})")
        
        return results
    
    def _initialize_metrics(
        self,
        metrics_config: Dict[str, bool]
    ) -> List[tuple]:
        """Initialize DeepEval metrics based on configuration."""
        metrics_to_use = []
        
        if metrics_config.get("answer_relevancy", False):
            metrics_to_use.append((
                "Answer Relevancy",
                AnswerRelevancyMetric(
                    threshold=self.metric_thresholds.get("answer_relevancy", 0.5)
                )
            ))
        
        if metrics_config.get("faithfulness", False):
            metrics_to_use.append((
                "Faithfulness",
                FaithfulnessMetric(
                    threshold=self.metric_thresholds.get("faithfulness", 0.5)
                )
            ))
        
        if metrics_config.get("contextual_relevancy", False):
            metrics_to_use.append((
                "Contextual Relevancy",
                ContextualRelevancyMetric(
                    threshold=self.metric_thresholds.get("contextual_relevancy", 0.5)
                )
            ))
        
        if metrics_config.get("hallucination", False):
            metrics_to_use.append((
                "Hallucination",
                HallucinationMetric(
                    threshold=self.metric_thresholds.get("hallucination", 0.5)
                )
            ))
        
        if metrics_config.get("bias", False):
            metrics_to_use.append((
                "Bias",
                BiasMetric(
                    threshold=self.metric_thresholds.get("bias", 0.5)
                )
            ))
        
        if metrics_config.get("toxicity", False):
            metrics_to_use.append((
                "Toxicity",
                ToxicityMetric(
                    threshold=self.metric_thresholds.get("toxicity", 0.5)
                )
            ))
        
        return metrics_to_use
    
    def _evaluate_without_deepeval(
        self,
        test_cases_data: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Fallback evaluation without DeepEval metrics.
        
        This provides basic evaluation metrics when DeepEval is not available.
        """
        print("\n" + "="*70)
        print("Running Basic Evaluation (DeepEval metrics unavailable)")
        print("="*70)
        
        results = []
        
        for i, tc_data in enumerate(test_cases_data, 1):
            test_case = tc_data["test_case"]
            metadata = tc_data["metadata"]
            
            print(f"[{i}/{len(test_cases_data)}] Evaluating Sample: {metadata['sample_id']}")
            
            # Basic metrics
            response_length = len(test_case.actual_output)
            word_count = len(test_case.actual_output.split())
            
            result = {
                "sample_id": metadata["sample_id"],
                "protected_attributes": metadata["protected_attributes"],
                "input": test_case.input,
                "actual_output": test_case.actual_output,
                "expected_output": test_case.expected_output,
                "response_length": response_length,
                "word_count": word_count,
                "metric_scores": {},
                "timestamp": datetime.now().isoformat()
            }
            
            results.append(result)
        
        return results
    
    def print_summary(self, results: List[Dict[str, Any]]):
        """
        Print comprehensive evaluation summary.
        
        Args:
            results: List of evaluation results
        """
        total = len(results)
        
        if total == 0:
            print("\nNo results to summarize.")
            return
        
        print("\n" + "="*70)
        print("DEEPEVAL EVALUATION SUMMARY")
        print("="*70)
        
        # Basic statistics
        avg_length = sum(r["response_length"] for r in results) / total
        avg_words = sum(r["word_count"] for r in results) / total
        
        print(f"\nTotal samples evaluated: {total}")
        print(f"Average response length: {avg_length:.0f} characters")
        print(f"Average word count: {avg_words:.1f} words")
        
        # Metric statistics
        print(f"\n{'-'*70}")
        print("METRIC SCORES SUMMARY")
        print(f"{'-'*70}")
        
        # Collect all metric names
        all_metrics = set()
        for r in results:
            all_metrics.update(r["metric_scores"].keys())
        
        if not all_metrics:
            print("No DeepEval metrics were evaluated.")
        else:
            for metric_name in sorted(all_metrics):
                scores = []
                passes = 0
                
                for r in results:
                    if metric_name in r["metric_scores"]:
                        score_data = r["metric_scores"][metric_name]
                        if score_data["score"] is not None:
                            scores.append(score_data["score"])
                            if score_data["passed"]:
                                passes += 1
                
                if scores:
                    avg_score = sum(scores) / len(scores)
                    pass_rate = passes / len(scores) * 100
                    print(f"\n{metric_name}:")
                    print(f"  Average Score: {avg_score:.3f}")
                    print(f"  Pass Rate: {pass_rate:.1f}% ({passes}/{len(scores)})")
                    print(f"  Score Range: {min(scores):.3f} - {max(scores):.3f}")
        
        # Protected attributes / grouping breakdown
        print(f"\n{'-'*70}")
        print("GROUPING BREAKDOWN")
        print(f"{'-'*70}")
        
        # Group by category (if available)
        category_groups = {}
        for r in results:
            category = r["protected_attributes"].get("category", "Unknown")
            if category not in category_groups:
                category_groups[category] = []
            category_groups[category].append(r)
        
        if len(category_groups) > 1 or "Unknown" not in category_groups:
            print("\nBy Category:")
            for category, group_results in sorted(category_groups.items()):
                # Calculate average metric scores for this category
                if all_metrics:
                    print(f"  {category} ({len(group_results)} samples):")
                    for metric_name in sorted(all_metrics):
                        cat_scores = []
                        for r in group_results:
                            if metric_name in r["metric_scores"]:
                                score = r["metric_scores"][metric_name]["score"]
                                if score is not None:
                                    cat_scores.append(score)
                        if cat_scores:
                            avg_score = sum(cat_scores) / len(cat_scores)
                            print(f"    {metric_name}: {avg_score:.3f}")
                else:
                    print(f"  {category}: {len(group_results)} samples")
        
        # Group by difficulty (if available)
        difficulty_groups = {}
        for r in results:
            difficulty = r["protected_attributes"].get("difficulty", "Unknown")
            if difficulty not in difficulty_groups:
                difficulty_groups[difficulty] = []
            difficulty_groups[difficulty].append(r)
        
        if len(difficulty_groups) > 1 or "Unknown" not in difficulty_groups:
            print("\nBy Difficulty:")
            for difficulty, group_results in sorted(difficulty_groups.items()):
                # Calculate average metric scores for this difficulty
                if all_metrics:
                    print(f"  {difficulty} ({len(group_results)} samples):")
                    for metric_name in sorted(all_metrics):
                        diff_scores = []
                        for r in group_results:
                            if metric_name in r["metric_scores"]:
                                score = r["metric_scores"][metric_name]["score"]
                                if score is not None:
                                    diff_scores.append(score)
                        if diff_scores:
                            avg_score = sum(diff_scores) / len(diff_scores)
                            print(f"    {metric_name}: {avg_score:.3f}")
                else:
                    print(f"  {difficulty}: {len(group_results)} samples")
        
        print("\n" + "="*70)
    
    def save_results(self, results: List[Dict[str, Any]]):
        """
        Save evaluation results to files.
        
        Args:
            results: List of evaluation results
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save detailed results as JSON
        json_file = self.output_dir / f"deepeval_results_{timestamp}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"\n✓ Detailed results saved to: {json_file}")
        
        # Save summary as JSON
        summary = self.generate_summary_dict(results)
        summary_file = self.output_dir / f"deepeval_summary_{timestamp}.json"
        with open(summary_file, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        print(f"✓ Summary saved to: {summary_file}")
        
        # Save as CSV
        csv_data = []
        for result in results:
            row = {
                "sample_id": result["sample_id"],
                "category": result["protected_attributes"].get("category", "Unknown"),
                "difficulty": result["protected_attributes"].get("difficulty", "Unknown"),
                "word_count": result["word_count"],
                "response_length": result["response_length"],
                "actual_output": result["actual_output"],
                "expected_output": result["expected_output"],
            }
            
            # Add metric scores
            for metric_name, score_data in result["metric_scores"].items():
                row[f"{metric_name}_score"] = score_data["score"]
                row[f"{metric_name}_passed"] = score_data["passed"]
            
            csv_data.append(row)
        
        df = pd.DataFrame(csv_data)
        csv_file = self.output_dir / f"deepeval_results_{timestamp}.csv"
        df.to_csv(csv_file, index=False, encoding='utf-8')
        print(f"✓ CSV results saved to: {csv_file}")
        
        # Save human-readable report
        report_file = self.output_dir / f"deepeval_report_{timestamp}.txt"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write("="*80 + "\n")
            f.write("DEEPEVAL EVALUATION REPORT\n")
            f.write("="*80 + "\n\n")
            
            # Get model_id safely
            model_id = getattr(self.config.model, 'model_id', None)
            if model_id is None and hasattr(self.config.model, 'huggingface'):
                model_id = getattr(self.config.model.huggingface, 'model_id', 'unknown')
            
            f.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Model: {model_id or 'unknown'}\n")
            f.write(f"Total Evaluations: {len(results)}\n\n")
            
            f.write("="*80 + "\n")
            f.write("SUMMARY STATISTICS\n")
            f.write("="*80 + "\n\n")
            
            # Write summary stats
            avg_words = sum(r['word_count'] for r in results) / len(results) if results else 0
            avg_length = sum(r['response_length'] for r in results) / len(results) if results else 0
            f.write(f"Average Word Count: {avg_words:.1f}\n")
            f.write(f"Average Response Length: {avg_length:.0f} characters\n\n")
            
            f.write("="*80 + "\n")
            f.write("DETAILED RESULTS\n")
            f.write("="*80 + "\n\n")
            
            for i, result in enumerate(results, 1):
                f.write(f"\n[{i}] Sample {result['sample_id']}\n")
                f.write("-"*80 + "\n")
                f.write(f"Grouping: {result['protected_attributes']}\n")
                f.write(f"Input (truncated): {result['input'][:200]}...\n\n")
                f.write(f"ACTUAL OUTPUT: {result['actual_output']}\n")
                f.write(f"EXPECTED OUTPUT: {result['expected_output']}\n\n")
                
                if result['metric_scores']:
                    f.write("METRICS:\n")
                    for metric_name, score_data in result['metric_scores'].items():
                        status = "PASS" if score_data['passed'] else "FAIL"
                        score = score_data['score']
                        score_str = f"{score:.3f}" if score is not None else "N/A"
                        f.write(f"  {metric_name}: {score_str} [{status}]\n")
                
                f.write("-"*80 + "\n")
        
        print(f"✓ Human-readable report saved to: {report_file}")
        print(f"\n✓ All results saved to: {self.output_dir}/")
    
    def generate_summary_dict(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate summary statistics as a dictionary."""
        total = len(results)
        
        if total == 0:
            return {}
        
        # Collect all metrics
        all_metrics = set()
        for r in results:
            all_metrics.update(r["metric_scores"].keys())
        
        metric_summaries = {}
        for metric_name in all_metrics:
            scores = []
            passes = 0
            
            for r in results:
                if metric_name in r["metric_scores"]:
                    score_data = r["metric_scores"][metric_name]
                    if score_data["score"] is not None:
                        scores.append(score_data["score"])
                        if score_data["passed"]:
                            passes += 1
            
            if scores:
                metric_summaries[metric_name] = {
                    "average_score": round(sum(scores) / len(scores), 3),
                    "pass_rate": round(passes / len(scores) * 100, 1),
                    "min_score": round(min(scores), 3),
                    "max_score": round(max(scores), 3),
                    "total_evaluated": len(scores)
                }
        
        # Get model_id safely
        model_id = getattr(self.config.model, 'model_id', None)
        if model_id is None and hasattr(self.config.model, 'huggingface'):
            model_id = getattr(self.config.model.huggingface, 'model_id', 'unknown')
        
        return {
            "model": model_id or 'unknown',
            "dataset": self.config.dataset.name,
            "total_samples": total,
            "timestamp": datetime.now().isoformat(),
            "metric_summaries": metric_summaries,
            "avg_word_count": round(sum(r["word_count"] for r in results) / total, 1),
            "avg_response_length": round(sum(r["response_length"] for r in results) / total, 1),
        }
    
    def run_evaluation(
        self,
        test_cases_data: List[Dict[str, Any]],
        metrics_config: Optional[Dict[str, bool]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Run full evaluation workflow.
        
        Args:
            test_cases_data: List of test case dictionaries
            metrics_config: Optional dict of metric names -> enabled
            
        Returns:
            List of evaluation results
        """
        print("\n" + "="*70)
        print("DeepEval Comprehensive Evaluation")
        print("="*70)
        
        # Run evaluation with metrics
        results = self.evaluate_test_cases(test_cases_data, metrics_config)
        
        # Print summary
        self.print_summary(results)
        
        # Save results
        self.save_results(results)
        
        print("\n" + "="*70)
        print("Evaluation Complete!")
        print("="*70)
        
        return results

