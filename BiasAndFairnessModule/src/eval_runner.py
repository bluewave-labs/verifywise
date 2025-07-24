from pathlib import Path
from src.config import ConfigManager
from src.data_loader import DataLoader
from src.model_loader import load_sklearn_model, ModelLoader
from src.inference import ModelInferencePipeline
import json
import re
from textblob import TextBlob
from transformers import pipeline
import numpy as np
import pandas as pd
from datasets import load_dataset
from fairlearn.metrics import MetricFrame, demographic_parity_difference, equalized_odds_difference
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from langfair.metrics.toxicity import ToxicityMetrics
from langfair.metrics.stereotype import StereotypeMetrics
from collections import defaultdict


def evaluate_fairness(X, y, A, model):
    """Evaluate fairness and accuracy of a model on a dataset."""
    X_train, X_test, y_train, y_test, A_train, A_test = train_test_split(X, y, A, test_size=0.3, random_state=42, shuffle=True)
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    
    # Compute group fairness metrics
    metric_frame = MetricFrame(
        metrics={
            "Demographic Parity Difference": demographic_parity_difference,
            "Equalized Odds Difference": equalized_odds_difference
        },
        y_true=y_test,
        y_pred=y_pred,
        sensitive_features=A_test
    )
    group_metrics = metric_frame.overall
    
    return {
        "Accuracy": accuracy_score(y_test, y_pred),
        **group_metrics
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
    
    def __init__(self, df, model_loader=None, model_pipeline=None, config=None, inference_pipeline=None):
        """
        Initialize the evaluation runner.
        
        Args:
            df: DataFrame containing the dataset
            model_loader: ModelLoader instance for LLM evaluation
            model_pipeline: HuggingFace pipeline for LLM evaluation
            config: Configuration object
            inference_pipeline: ModelInferencePipeline instance
        """
        self.df = df
        self.model_loader = model_loader
        self.model_pipeline = model_pipeline
        self.config = config
        self.inference_pipeline = inference_pipeline
        self.results = {}
    
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
        
        self.results = evaluate_fairness(X, y, A, model)
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
    
    def get_results(self):
        """Get the evaluation results."""
        return self.results


def main():
    # Load config using the main module's config system
    config_manager = ConfigManager()
    config = config_manager.config

    # Check if HuggingFace model is enabled
    if hasattr(config.model, "huggingface") and config.model.huggingface.enabled:
        print("Running LLM fairness evaluation...")
        
        # Use the run_all_evaluations function from inference.py
        from src.inference import run_all_evaluations
        results = run_all_evaluations(limit_samples=16)
            
    else:
        print("Running tabular fairness evaluation...")
        
        # Load dataset using DataLoader (handles all platforms)
        data_loader = DataLoader(config.dataset)
        df = data_loader.load_data()
        print(f"Loaded dataset with {len(df)} samples")
        
        # Prepare data for tabular evaluation
        X = df.drop(columns=[config.dataset.target_column])
        y = df[config.dataset.target_column]
        A = df[config.dataset.protected_attributes[0]]
        
        # Load model using sklearn loader
        model_path = "model.joblib"  # Or use config.model.sklearn.model_path if available
        model = load_sklearn_model(model_path)
        
        # Use EvaluationRunner to orchestrate evaluations
        evaluator = EvaluationRunner(df, config=config)
        results = evaluator.run_all_evaluations("tabular", X=X, y=y, A=A, model=model)
        
        # Print tabular results
        for k, v in results.items():
            print(f"{k}: {v:.4f}")


if __name__ == "__main__":
    main() 