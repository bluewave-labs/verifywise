from pathlib import Path
import sys
import os

# Add the project root directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.core.config import ConfigManager
from src.dataset_loader.data_loader import DataLoader
from src.model_loader.model_loader import load_sklearn_model, ModelLoader
from src.inference.inference import ModelInferencePipeline
from src.eval_engine.fairness_compass_engine import FairnessCompassEngine
from src.eval_engine.compass_router import route_metric, get_task_type_from_config, get_label_behavior_from_data
from src.eval_engine.evaluation_module import FairnessEvaluator
import json
import re
from textblob import TextBlob
from transformers import pipeline
import numpy as np
import pandas as pd
from datasets import load_dataset
from fairlearn.metrics import MetricFrame, demographic_parity_difference, equalized_odds_difference
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.model_selection import train_test_split
from langfair.metrics.toxicity import ToxicityMetrics
from langfair.metrics.stereotype import StereotypeMetrics
from collections import defaultdict
import logging
import argparse
from typing import Optional, Dict, Any, List, Union


def evaluate_fairness(X, y, A, model):
    """Evaluate fairness and accuracy of a model on a dataset using Fairlearn."""
    from sklearn.model_selection import train_test_split
    from fairlearn.metrics import MetricFrame, demographic_parity_difference, equalized_odds_difference
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    
    X_train, X_test, y_train, y_test, A_train, A_test = train_test_split(X, y, A, test_size=0.3, random_state=42, shuffle=True)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    # Compute comprehensive fairness metrics using Fairlearn's MetricFrame
    metrics = {
        "accuracy": accuracy_score,
        "precision": precision_score,
        "recall": recall_score,
        "f1": f1_score
    }
    
    metric_frame = MetricFrame(
        metrics=metrics,
        y_true=y_test,
        y_pred=y_pred,
        sensitive_features=A_test
    )
    
    # Calculate fairness metrics separately
    fairness_metrics = {}
    fairness_metrics["demographic_parity"] = demographic_parity_difference(
        y_true=y_test, y_pred=y_pred, sensitive_features=A_test
    )
    fairness_metrics["equalized_odds"] = equalized_odds_difference(
        y_true=y_test, y_pred=y_pred, sensitive_features=A_test
    )
    
    # Extract overall differences
    group_metrics = {}
    for metric_name in metrics.keys():
        if metric_name in metric_frame.overall:
            group_metrics[f"{metric_name}_difference"] = metric_frame.overall[metric_name]
    
    # Add fairness metrics
    group_metrics.update(fairness_metrics)
    
    # Add overall accuracy
    group_metrics["Accuracy"] = accuracy_score(y_test, y_pred)
    
    return group_metrics


def evaluate_fairness_compass(X, y, A, model, compass_config=None):
    """
    Evaluate fairness using the Fairness Compass Engine.
    
    Args:
        X: Features
        y: True labels
        A: Sensitive attributes
        model: Trained model
        compass_config: Configuration for Fairness Compass Engine
        
    Returns:
        Dict: Fairness compass metrics and recommendations
    """
    # Split data
    X_train, X_test, y_train, y_test, A_train, A_test = train_test_split(X, y, A, test_size=0.3, random_state=42, shuffle=True)
    
    # Train model if not already trained
    if hasattr(model, 'fit'):
        model.fit(X_train, y_train)
    
    # Get predictions
    y_pred = model.predict(X_test)
    
    # Get scores if available
    y_scores = None
    if hasattr(model, 'predict_proba'):
        y_scores = model.predict_proba(X_test)[:, 1]  # Probability of positive class
    
    # Create Fairness Compass Engine with default config if none provided
    if compass_config is None:
        compass_config = {
            "enforce_policy": False,
            "ground_truth_available": True,
            "output_type": "label",
            "fairness_focus": "precision"
        }
    
    engine = FairnessCompassEngine(**compass_config)
    
    # Get recommendations
    recommendations = engine.get_metric_recommendations()
    explanation = engine.explain()
    
    # Calculate fairness metrics
    fairness_metrics = engine.calculate_fairness_metrics(
        y_true=y_test,
        y_pred=y_pred,
        sensitive_attr=A_test,
        y_scores=y_scores
    )
    
    # Calculate accuracy
    accuracy = accuracy_score(y_test, y_pred)
    
    return {
        "accuracy": accuracy,
        "recommendations": recommendations,
        "fairness_metrics": fairness_metrics,
        "explanation": explanation
    }


def evaluate_toxicity(prompts, responses):
    """Evaluate toxicity of LLM responses using LangFair metrics."""
    tox = ToxicityMetrics()
    results = tox.evaluate(prompts=prompts, responses=responses)
    return results


def evaluate_stereotypes(prompts, responses):
    """Evaluate stereotypes in LLM responses using LangFair metrics."""
    stereo = StereotypeMetrics()
    results = stereo.evaluate(prompts=prompts, responses=responses)
    return results


def evaluate_holistic_bias(prompts, responses, descriptors):
    """Evaluate holistic bias by counting descriptor mentions in responses."""
    bias_counts = defaultdict(int)
    total = len(responses)
    for prompt, resp, desc in zip(prompts, responses, descriptors):
        if desc.lower() in resp.lower():
            bias_counts[desc] += 1
    return {f"Bias rate for {k}": v/total for k, v in bias_counts.items()}


def evaluate_langfair_fairness(model_loader, prompts, responses, max_new_tokens=50):
    """Compute LangFair toxicity and other fairness metrics for LLM responses."""
    results = {}
    # Toxicity (LangFair)
    print("Computing LangFair Toxicity...")
    toxicity_metric = ToxicityMetrics()
    toxicity_results = toxicity_metric.evaluate(
        prompts=prompts, 
        responses=responses,
    )
    results["LangFairToxicity"] = toxicity_results
    return results


def load_holistic_bias_dataset(split="sentences"):
    """Load the holistic bias dataset for fairness evaluation."""
    dataset = load_dataset("fairnlp/holistic-bias", split="test", name=split)
    print(dataset.column_names)
    if split == "nouns":
        prompts = [row["pattern"].replace("{descriptor}", row["noun_phrase"]) for row in dataset]
        descriptors = [row["noun_phrase"] for row in dataset]
    elif split == "sentences":
        prompts = [row["text"] for row in dataset]
        descriptors = [row["descriptor"] for row in dataset]
    else:
        raise ValueError(f"Unsupported split '{split}' for holistic-bias dataset.")
    return prompts, descriptors


def evaluate_sentiment(prompts, responses):
    """Evaluate sentiment using TextBlob."""
    sentiments = []
    for response in responses:
        blob = TextBlob(response)
        sentiments.append(blob.sentiment.polarity)
    return {
        "mean_sentiment": np.mean(sentiments),
        "sentiment_std": np.std(sentiments),
        "positive_ratio": sum(1 for s in sentiments if s > 0) / len(sentiments),
        "negative_ratio": sum(1 for s in sentiments if s < 0) / len(sentiments)
    }


def evaluate_keyword_hits(prompts, responses):
    """Evaluate keyword hits for discriminatory or biased terms."""
    # Define discriminatory keywords (expand as needed)
    discriminatory_keywords = [
        'racist', 'sexist', 'discriminatory', 'biased', 'stereotype',
        'inferior', 'superior', 'less capable', 'more capable',
        'should not', 'cannot', 'unable to', 'not suitable',
        'inappropriate', 'unprofessional', 'unqualified'
    ]
    
    keyword_counts = {}
    total_responses = len(responses)
    
    for keyword in discriminatory_keywords:
        count = sum(1 for response in responses if keyword.lower() in response.lower())
        keyword_counts[f"hits_{keyword}"] = count / total_responses if total_responses > 0 else 0
    
    return keyword_counts


def evaluate_prompt_flipping_fairness(prompts, responses, model_loader):
    """Evaluate fairness using prompt flipping technique."""
    # This is a simplified version - you might want to implement more sophisticated prompt flipping
    flipped_prompts = []
    for prompt in prompts:
        # Simple gender flipping (replace he/she, his/her, etc.)
        flipped = re.sub(r'\bhe\b', 'SHE_PLACEHOLDER', prompt, flags=re.IGNORECASE)
        flipped = re.sub(r'\bshe\b', 'HE_PLACEHOLDER', flipped, flags=re.IGNORECASE)
        flipped = re.sub(r'\bhis\b', 'HER_PLACEHOLDER', flipped, flags=re.IGNORECASE)
        flipped = re.sub(r'\bher\b', 'HIS_PLACEHOLDER', flipped, flags=re.IGNORECASE)
        flipped = re.sub(r'SHE_PLACEHOLDER', 'she', flipped)
        flipped = re.sub(r'HE_PLACEHOLDER', 'he', flipped)
        flipped = re.sub(r'HER_PLACEHOLDER', 'her', flipped)
        flipped = re.sub(r'HIS_PLACEHOLDER', 'his', flipped)
        flipped_prompts.append(flipped)
    
    # Get responses for flipped prompts
    flipped_responses = model_loader.predict(flipped_prompts)
    
    # Compare original vs flipped responses (simplified comparison)
    response_differences = []
    for orig, flipped in zip(responses, flipped_responses):
        # Simple similarity measure (you might want to use more sophisticated metrics)
        orig_words = set(orig.lower().split())
        flipped_words = set(flipped.lower().split())
        similarity = len(orig_words.intersection(flipped_words)) / len(orig_words.union(flipped_words)) if orig_words.union(flipped_words) else 0
        response_differences.append(1 - similarity)  # Difference score
    
    return {
        "mean_response_difference": np.mean(response_differences),
        "response_difference_std": np.std(response_differences),
        "high_difference_ratio": sum(1 for d in response_differences if d > 0.5) / len(response_differences)
    }


class EvaluationRunner:
    """Orchestrates evaluation by calling metric functions"""
    
    def __init__(self, df, model_loader=None, model_pipeline=None, config=None, inference_pipeline=None, mode="prompt"):
        """
        Initialize the evaluation runner.
        
        Args:
            df: DataFrame containing the dataset
            model_loader: ModelLoader instance for LLM evaluation
            model_pipeline: HuggingFace pipeline for LLM evaluation
            config: Configuration object
            inference_pipeline: ModelInferencePipeline instance
            mode: Evaluation mode ("prompt" for LLM, "predict" for tabular)
        """
        self.df = df
        self.model_loader = model_loader
        self.model_pipeline = model_pipeline
        self.config = config
        self.inference_pipeline = inference_pipeline
        self.mode = mode
        self.results = {}
        self.logger = logging.getLogger(__name__)
        
        # Initialize fairness evaluator based on mode
        if self.mode == "predict":
            self.fairness_evaluator = FairnessEvaluator(task_type="binary_classification")
        else:
            self.fairness_evaluator = FairnessEvaluator(task_type="generation")
    
    def run_llm_evaluations(self, prompts, responses):
        """Run all LLM evaluation metrics."""
        print("Running LLM fairness evaluation...")
        
        # Evaluate all metrics
        print("Evaluating toxicity...")
        self.results["toxicity"] = evaluate_toxicity(prompts, responses)
        
        print("Evaluating stereotypes...")
        self.results["stereotypes"] = evaluate_stereotypes(prompts, responses)
        
        print("Evaluating holistic bias...")
        if self.config and hasattr(self.config, 'metrics') and "holistic_bias" in self.config.metrics.disparity:
            holistic_prompts, descriptors = load_holistic_bias_dataset("sentences")
            holistic_prompts = holistic_prompts[:10]
            descriptors = descriptors[:10]
            if self.inference_pipeline:
                holistic_responses = self.inference_pipeline.model_loader.predict(holistic_prompts)
            elif self.model_loader:
                holistic_responses = self.model_loader.predict(holistic_prompts)
            else:
                raise ValueError("Either inference_pipeline or model_loader must be provided")
            self.results["holistic_bias"] = evaluate_holistic_bias(holistic_prompts, holistic_responses, descriptors)
        
        print("Evaluating LangFair fairness...")
        if self.inference_pipeline:
            self.results["langfair_fairness"] = evaluate_langfair_fairness(self.inference_pipeline.model_loader, prompts, responses)
        elif self.model_loader:
            self.results["langfair_fairness"] = evaluate_langfair_fairness(self.model_loader, prompts, responses)
        else:
            raise ValueError("Either inference_pipeline or model_loader must be provided")
        
        print("Evaluating sentiment...")
        self.results["sentiment"] = evaluate_sentiment(prompts, responses)
        
        print("Evaluating keyword hits...")
        self.results["keyword_hits"] = evaluate_keyword_hits(prompts, responses)
        
        print("Evaluating prompt flipping fairness...")
        if self.inference_pipeline:
            self.results["prompt_flipping_fairness"] = evaluate_prompt_flipping_fairness(prompts, responses, self.inference_pipeline.model_loader)
        elif self.model_loader:
            self.results["prompt_flipping_fairness"] = evaluate_prompt_flipping_fairness(prompts, responses, self.model_loader)
        else:
            raise ValueError("Either inference_pipeline or model_loader must be provided")
        
        return self.results
    
    def run_tabular_evaluations(self, X, y, A, model):
        """Run tabular fairness evaluation."""
        print("Running tabular fairness evaluation...")
        
        # Run traditional fairness evaluation
        traditional_results = evaluate_fairness(X, y, A, model)
        
        # Run fairness compass evaluation
        print("Running Fairness Compass evaluation...")
        compass_results = evaluate_fairness_compass(X, y, A, model)
        
        # Combine results
        self.results = {
            "traditional_fairness": traditional_results,
            "fairness_compass": compass_results
        }
        
        return self.results
    
    def run_all_evaluations(self, evaluation_type="llm", **kwargs):
        """
        Run all evaluations based on the evaluation type.
        
        Args:
            evaluation_type: "llm" or "tabular"
            **kwargs: Additional arguments for specific evaluation types
        """
        if evaluation_type == "llm":
            prompts = kwargs.get("prompts")
            responses = kwargs.get("responses")
            if not prompts or not responses:
                raise ValueError("prompts and responses are required for LLM evaluation")
            return self.run_llm_evaluations(prompts, responses)
        
        elif evaluation_type == "tabular":
            X = kwargs.get("X")
            y = kwargs.get("y")
            A = kwargs.get("A")
            model = kwargs.get("model")
            if not all([X is not None, y is not None, A is not None, model is not None]):
                raise ValueError("X, y, A, and model are required for tabular evaluation")
            return self.run_tabular_evaluations(X, y, A, model)
        
        else:
            raise ValueError(f"Unsupported evaluation type: {evaluation_type}")
    
    def run_dual_evaluation(self, **kwargs):
        """
        Run evaluation in dual mode (prompt or predict).
        
        Args:
            **kwargs: Arguments for the specific mode
            
        Returns:
            Dict: Evaluation results
        """
        if self.mode == "prompt":
            return self._run_prompt_evaluation(**kwargs)
        elif self.mode == "predict":
            return self._run_predict_evaluation(**kwargs)
        else:
            raise ValueError(f"Unknown mode: {self.mode}")
    
    def _run_prompt_evaluation(self, prompts=None, responses=None, sensitive_attributes=None):
        """Run prompt-based LLM evaluation."""
        self.logger.info("Running prompt-based LLM evaluation...")
        
        if prompts is None or responses is None:
            raise ValueError("Prompts and responses must be provided for prompt evaluation")
        
        if sensitive_attributes is None:
            # Generate default sensitive attributes if not provided
            sensitive_attributes = [{"gender": "unknown"} for _ in prompts]
        
        # Use the fairness evaluator for LLM responses
        results = self.fairness_evaluator.evaluate_llm_responses(
            prompts=prompts,
            responses=responses,
            sensitive_attributes=sensitive_attributes
        )
        
        # Add traditional LLM metrics
        results.update(self.run_llm_evaluations(prompts, responses))
        
        return results
    
    def _run_predict_evaluation(self, X=None, y=None, A=None, model=None):
        """Run feature-based tabular evaluation."""
        self.logger.info("Running feature-based tabular evaluation...")
        
        if X is None or y is None or A is None or model is None:
            raise ValueError("X, y, A, and model must be provided for predict evaluation")
        
        # Use the fairness evaluator for tabular models
        results = self.fairness_evaluator.evaluate_tabular_model(
            y_true=y,
            y_pred=model.predict(X),
            sensitive_features=A,
            y_scores=model.predict_proba(X)[:, 1] if hasattr(model, 'predict_proba') else None
        )
        
        # Add traditional tabular metrics
        tabular_results = self.run_tabular_evaluations(X, y, A, model)
        results.update(tabular_results)
        
        return results
    
    def get_results(self):
        """Get the evaluation results."""
        return self.results


def main():
    """Main entry point for the evaluation runner."""
    try:
        print("🚀 Starting Fairness Evaluation Runner")
        print("=" * 50)
        
        # Load config using the main module's config system
        config_manager = ConfigManager()
        config = config_manager.config
        
        print(f"✅ Configuration loaded successfully")
        print(f"   Dataset: {config.dataset.name}")
        print(f"   Model: {config.model.huggingface.model_id if config.model.huggingface.enabled else 'sklearn'}")
        print(f"   Model Task: {getattr(config.model, 'model_task', 'Not specified')}")
        print(f"   Label Behavior: {getattr(config.model, 'label_behavior', 'Not specified')}")
        print(f"   Current Fairness metrics: {config.metrics.fairness.metrics}")
        
        # Initialize results dictionary
        results = {
            "metadata": {
                "evaluation_type": "fairness_compass_analysis",
                "dataset": config.dataset.name,
                "model": config.model.huggingface.model_id if config.model.huggingface.enabled else "sklearn",
                "model_task": getattr(config.model, 'model_task', 'Not specified'),
                "label_behavior": getattr(config.model, 'label_behavior', 'Not specified'),
                "evaluation_timestamp": pd.Timestamp.now().isoformat()
            },
            "compass_system": {},
            "metric_routing": {},
            "recommendations": {},
            "intelligent_metric_selection": {}
        }
        
        # Use Fairness Compass to intelligently select metrics
        print("\n🧭 Using Fairness Compass for Intelligent Metric Selection:")
        
        try:
            # Get task type and label behavior from config
            model_task = getattr(config.model, 'model_task', 'binary_classification')
            label_behavior = getattr(config.model, 'label_behavior', 'binary')
            
            print(f"   Task Type: {model_task}")
            print(f"   Label Behavior: {label_behavior}")
            
            # Use the compass router to get appropriate metrics
            recommended_metrics = route_metric(model_task, label_behavior)
            print(f"   ✅ Compass Recommended Metrics: {recommended_metrics}")
            
            # Compare with current config metrics
            current_metrics = config.metrics.fairness.metrics
            print(f"   Current Config Metrics: {current_metrics}")
            
            # Find metrics that are recommended but not in current config
            missing_recommended = [m for m in recommended_metrics if m not in current_metrics]
            if missing_recommended:
                print(f"   ⚠️  Missing Recommended Metrics: {missing_recommended}")
            
            # Find metrics in current config that aren't recommended
            extra_current = [m for m in current_metrics if m not in recommended_metrics]
            if extra_current:
                print(f"   ⚠️  Extra Current Metrics: {extra_current}")
            
            # Store the intelligent metric selection results
            results["intelligent_metric_selection"] = {
                "task_type": model_task,
                "label_behavior": label_behavior,
                "compass_recommended": recommended_metrics,
                "current_config": current_metrics,
                "missing_recommended": missing_recommended,
                "extra_current": extra_current,
                "recommendation_quality": "optimal" if not missing_recommended and not extra_current else "suboptimal"
            }
            
        except Exception as e:
            print(f"   ❌ Error in intelligent metric selection: {str(e)}")
            results["intelligent_metric_selection"]["error"] = str(e)
        
        # Check if HuggingFace model is enabled
        if hasattr(config.model, "huggingface") and config.model.huggingface.enabled:
            print("\n🤖 Running LLM fairness evaluation...")
            
            # For now, just show what would be done
            print("   Note: LLM evaluation requires additional setup")
            print("   Use the main evaluation_runner.py for LLM evaluation")
            
            results["compass_system"]["llm_evaluation"] = {
                "status": "requires_setup",
                "note": "Use main evaluation_runner.py for LLM evaluation"
            }
            
        else:
            print("\n📊 Running tabular fairness evaluation...")
            
            # Load dataset using DataLoader (handles all platforms)
            try:
                data_loader = DataLoader(config.dataset)
                df = data_loader.load_data()
                print(f"   ✅ Loaded dataset with {len(df)} samples")
                
                # Show dataset info
                print(f"   Columns: {list(df.columns)}")
                if config.dataset.protected_attributes:
                    print(f"   Protected attributes: {config.dataset.protected_attributes}")
                print(f"   Target column: {config.dataset.target_column}")
                
                # Add dataset info to results
                results["compass_system"]["dataset_info"] = {
                    "total_samples": len(df),
                    "columns": list(df.columns),
                    "protected_attributes": config.dataset.protected_attributes,
                    "target_column": config.dataset.target_column
                }
                
            except Exception as e:
                print(f"   ❌ Error loading dataset: {str(e)}")
                print("   Note: Dataset loading requires additional setup")
                results["compass_system"]["dataset_info"] = {
                    "status": "error",
                    "error": str(e)
                }
        
        print("\n🎯 Fairness Compass System Status:")
        print("   ✅ Compass Router: Available")
        print("   ✅ Fairness Compass Engine: Available")
        print("   ✅ Metric Registry: Available")
        
        results["compass_system"]["status"] = "available"
        
        # Test the compass routing with the configured task type
        print("\n🧭 Testing Fairness Compass Routing with Config:")
        try:
            model_task = getattr(config.model, 'model_task', 'binary_classification')
            label_behavior = getattr(config.model, 'label_behavior', 'binary')
            
            # Test the configured task type
            configured_metrics = route_metric(model_task, label_behavior)
            print(f"   ✅ {model_task}/{label_behavior}: {configured_metrics}")
            
            # Test other task types for comparison
            other_tasks = [
                ("binary_classification", "binary"),
                ("generation", "continuous"),
                ("regression", "continuous"),
                ("multiclass_classification", "categorical")
            ]
            
            for task, behavior in other_tasks:
                if (task, behavior) != (model_task, label_behavior):
                    metrics = route_metric(task, behavior)
                    print(f"   📊 {task}/{behavior}: {len(metrics)} metrics")
            
            # Add routing results to output
            results["metric_routing"] = {
                "configured_task": {
                    "task_type": model_task,
                    "label_behavior": label_behavior,
                    "metrics": configured_metrics
                },
                "other_tasks": {}
            }
            
            for task, behavior in other_tasks:
                if (task, behavior) != (model_task, label_behavior):
                    results["metric_routing"]["other_tasks"][f"{task}_{behavior}"] = route_metric(task, behavior)
            
        except Exception as e:
            print(f"   ❌ Error testing compass routing: {str(e)}")
            results["metric_routing"]["error"] = str(e)
        
        # Test Fairness Compass Engine with different configurations
        print("\n🔧 Testing Fairness Compass Engine:")
        try:
            # Test different compass configurations
            test_configs = [
                {
                    "name": "policy_enforcement_equal",
                    "config": {"enforce_policy": True, "representation_type": "equal_number"}
                },
                {
                    "name": "policy_enforcement_proportional", 
                    "config": {"enforce_policy": True, "representation_type": "proportional"}
                },
                {
                    "name": "no_ground_truth",
                    "config": {"enforce_policy": False, "ground_truth_available": False, "label_bias": True}
                },
                {
                    "name": "base_rates_equal",
                    "config": {"enforce_policy": False, "base_rates_equal": True}
                },
                {
                    "name": "output_scores_false_positive",
                    "config": {"enforce_policy": False, "output_type": "score", "error_sensitivity": "false_positive"}
                },
                {
                    "name": "output_labels_precision_focus",
                    "config": {"enforce_policy": False, "output_type": "label", "fairness_focus": "precision"}
                }
            ]
            
            compass_results = {}
            for test_config in test_configs:
                try:
                    engine = FairnessCompassEngine(**test_config["config"])
                    recommendations = engine.get_metric_recommendations()
                    explanation = engine.explain()
                    
                    compass_results[test_config["name"]] = {
                        "recommendations": recommendations,
                        "explanation": explanation
                    }
                    
                    print(f"   ✅ {test_config['name']}: {recommendations}")
                    
                except Exception as e:
                    print(f"   ❌ {test_config['name']}: Error - {str(e)}")
                    compass_results[test_config["name"]] = {
                        "error": str(e)
                    }
            
            results["recommendations"] = compass_results
            
        except Exception as e:
            print(f"   ❌ Error testing compass engine: {str(e)}")
            results["recommendations"]["error"] = str(e)
        
        # Save results to JSON file
        print("\n💾 Saving results...")
        output_path = Path('artifacts/fairness_compass_results.json')
        output_path.parent.mkdir(exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        print(f"✅ Results saved to {output_path}")
        
        print("\n✅ Fairness Evaluation Runner completed successfully!")
        return results
        
    except Exception as e:
        print(f"\n❌ Evaluation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    main() 