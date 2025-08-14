from typing import Dict, List, Optional, Any, Union, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from fairlearn.metrics import (
    MetricFrame, demographic_parity_difference, equalized_odds_difference,
    equalized_odds_ratio, true_positive_rate_difference, false_positive_rate_difference,
    selection_rate_difference, accuracy_score_difference, precision_score_group_min,
    recall_score_group_min, f1_score_group_min
)
from textblob import TextBlob
import logging
from collections import defaultdict
import json

logger = logging.getLogger(__name__)


class FairnessEvaluator:
    """
    Comprehensive fairness evaluation module supporting both tabular and LLM models.
    Uses Fairlearn for robust metric calculations and implements custom metrics for LLM evaluation.
    """
    
    def __init__(self, task_type: str = "binary_classification"):
        """
        Initialize the fairness evaluator.
        
        Args:
            task_type: Type of task for metric selection
        """
        self.task_type = task_type
        self.available_metrics = self._get_available_metrics()
    
    def _get_available_metrics(self) -> List[str]:
        """Get list of available metrics for the current task type."""
        base_metrics = [
            "accuracy_difference", "precision_difference", "recall_difference", 
            "f1_difference", "demographic_parity", "equalized_odds"
        ]
        
        if self.task_type == "binary_classification":
            base_metrics.extend([
                "equalized_opportunity", "predictive_equality", "predictive_parity",
                "conditional_use_accuracy_equality"
            ])
        elif self.task_type == "regression":
            base_metrics.extend([
                "balance_for_positive_class", "balance_for_negative_class"
            ])
        elif self.task_type == "generation":
            base_metrics.extend([
                "toxicity_gap", "sentiment_gap", "stereotype_gap", 
                "exposure_disparity", "representation_disparity"
            ])
        
        return base_metrics
    
    def evaluate_tabular_model(
        self, 
        y_true: np.ndarray, 
        y_pred: np.ndarray, 
        sensitive_features: Union[np.ndarray, pd.Series],
        y_scores: Optional[np.ndarray] = None,
        metrics: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """
        Evaluate fairness for tabular models using Fairlearn.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            sensitive_features: Sensitive attribute values
            y_scores: Prediction scores (optional)
            metrics: List of metrics to compute (optional)
            
        Returns:
            Dict containing fairness metrics
        """
        if metrics is None:
            metrics = self.available_metrics
        
        results = {}
        
        # Basic performance metrics
        if "accuracy_difference" in metrics:
            results["accuracy_difference"] = accuracy_score_difference(
                y_true, y_pred, sensitive_features=sensitive_features
            )
        
        if "precision_difference" in metrics:
            results["precision_difference"] = precision_score_group_min(
                y_true, y_pred, sensitive_features=sensitive_features
            )
        
        if "recall_difference" in metrics:
            results["recall_difference"] = recall_score_group_min(
                y_true, y_pred, sensitive_features=sensitive_features
            )
        
        if "f1_difference" in metrics:
            results["f1_difference"] = f1_score_group_min(
                y_true, y_pred, sensitive_features=sensitive_features
            )
        
        # Fairness metrics
        if "demographic_parity" in metrics:
            results["demographic_parity"] = demographic_parity_difference(
                y_true, y_pred, sensitive_features=sensitive_features
            )
        
        if "equalized_odds" in metrics:
            results["equalized_odds"] = equalized_odds_difference(
                y_true, y_pred, sensitive_features=sensitive_features
            )
        
        if "equalized_opportunity" in metrics and self.task_type == "binary_classification":
            results["equalized_opportunity"] = true_positive_rate_difference(
                y_true, y_pred, sensitive_features=sensitive_features
            )
        
        if "predictive_equality" in metrics and self.task_type == "binary_classification":
            results["predictive_equality"] = false_positive_rate_difference(
                y_true, y_pred, sensitive_features=sensitive_features
            )
        
        # Score-based metrics for regression
        if y_scores is not None:
            if "balance_for_positive_class" in metrics:
                results["balance_for_positive_class"] = self._calculate_balance_for_positive_class(
                    y_scores, sensitive_features
                )
            
            if "balance_for_negative_class" in metrics:
                results["balance_for_negative_class"] = self._calculate_balance_for_negative_class(
                    y_scores, sensitive_features
                )
        
        # Comprehensive MetricFrame for detailed analysis
        metric_frame = MetricFrame(
            metrics={
                "accuracy": accuracy_score,
                "precision": precision_score,
                "recall": recall_score,
                "f1": f1_score
            },
            y_true=y_true,
            y_pred=y_pred,
            sensitive_features=sensitive_features
        )
        
        results["group_metrics"] = metric_frame.by_group.to_dict()
        results["overall_metrics"] = metric_frame.overall.to_dict()
        
        return results
    
    def evaluate_llm_responses(
        self,
        prompts: List[str],
        responses: List[str],
        sensitive_attributes: List[Dict[str, Any]],
        metrics: Optional[List[str]] = None
    ) -> Dict[str, float]:
        """
        Evaluate fairness for LLM responses.
        
        Args:
            prompts: List of input prompts
            responses: List of model responses
            sensitive_attributes: List of sensitive attribute dictionaries
            metrics: List of metrics to compute
            
        Returns:
            Dict containing fairness metrics
        """
        if metrics is None:
            metrics = [m for m in self.available_metrics if m in [
                "toxicity_gap", "sentiment_gap", "stereotype_gap", 
                "exposure_disparity", "representation_disparity"
            ]]
        
        results = {}
        
        # Calculate response characteristics
        response_metrics = self._calculate_response_metrics(responses)
        
        # Group by sensitive attributes
        groups = self._group_by_sensitive_attributes(
            response_metrics, sensitive_attributes
        )
        
        # Calculate fairness gaps
        for metric_name in metrics:
            if metric_name == "sentiment_gap":
                results["sentiment_gap"] = self._calculate_sentiment_gap(groups)
            elif metric_name == "toxicity_gap":
                results["toxicity_gap"] = self._calculate_toxicity_gap(groups)
            elif metric_name == "stereotype_gap":
                results["stereotype_gap"] = self._calculate_stereotype_gap(groups)
            elif metric_name == "exposure_disparity":
                results["exposure_disparity"] = self._calculate_exposure_disparity(groups)
            elif metric_name == "representation_disparity":
                results["representation_disparity"] = self._calculate_representation_disparity(groups)
        
        # Add detailed group metrics
        results["group_metrics"] = groups
        results["response_characteristics"] = response_metrics
        
        return results
    
    def _calculate_response_metrics(self, responses: List[str]) -> List[Dict[str, float]]:
        """Calculate various metrics for each response."""
        metrics = []
        
        for response in responses:
            # Sentiment analysis
            blob = TextBlob(response)
            sentiment_score = blob.sentiment.polarity
            
            # Toxicity estimation (simplified)
            toxic_words = ["hate", "kill", "stupid", "idiot", "racist", "sexist"]
            toxicity_score = sum(1 for word in toxic_words if word.lower() in response.lower()) / len(toxic_words)
            
            # Response length
            length = len(response.split())
            
            # Response complexity (simplified)
            complexity = len(set(response.lower().split())) / max(length, 1)
            
            metrics.append({
                "sentiment": sentiment_score,
                "toxicity": toxicity_score,
                "length": length,
                "complexity": complexity
            })
        
        return metrics
    
    def _group_by_sensitive_attributes(
        self, 
        response_metrics: List[Dict[str, float]], 
        sensitive_attributes: List[Dict[str, Any]]
    ) -> Dict[str, List[Dict[str, float]]]:
        """Group response metrics by sensitive attributes."""
        groups = defaultdict(list)
        
        for i, (metrics, attrs) in enumerate(zip(response_metrics, sensitive_attributes)):
            # Create group key from sensitive attributes
            group_key = "_".join([f"{k}={v}" for k, v in attrs.items()])
            groups[group_key].append(metrics)
        
        return dict(groups)
    
    def _calculate_sentiment_gap(self, groups: Dict[str, List[Dict[str, float]]]) -> float:
        """Calculate sentiment gap between groups."""
        group_sentiments = {}
        
        for group, metrics_list in groups.items():
            avg_sentiment = np.mean([m["sentiment"] for m in metrics_list])
            group_sentiments[group] = avg_sentiment
        
        if len(group_sentiments) < 2:
            return 0.0
        
        sentiments = list(group_sentiments.values())
        return max(sentiments) - min(sentiments)
    
    def _calculate_toxicity_gap(self, groups: Dict[str, List[Dict[str, float]]]) -> float:
        """Calculate toxicity gap between groups."""
        group_toxicities = {}
        
        for group, metrics_list in groups.items():
            avg_toxicity = np.mean([m["toxicity"] for m in metrics_list])
            group_toxicities[group] = avg_toxicity
        
        if len(group_toxicities) < 2:
            return 0.0
        
        toxicities = list(group_toxicities.values())
        return max(toxicities) - min(toxicities)
    
    def _calculate_stereotype_gap(self, groups: Dict[str, List[Dict[str, float]]]) -> float:
        """Calculate stereotype gap between groups."""
        # Simplified stereotype detection
        stereotype_words = ["doctor", "nurse", "engineer", "teacher", "CEO", "secretary"]
        
        group_stereotypes = {}
        for group, metrics_list in groups.items():
            # This is a simplified implementation
            # In practice, you'd use more sophisticated stereotype detection
            stereotype_score = 0.0  # Placeholder
            group_stereotypes[group] = stereotype_score
        
        if len(group_stereotypes) < 2:
            return 0.0
        
        stereotypes = list(group_stereotypes.values())
        return max(stereotypes) - min(stereotypes)
    
    def _calculate_exposure_disparity(self, groups: Dict[str, List[Dict[str, float]]]) -> float:
        """Calculate exposure disparity between groups."""
        group_exposures = {}
        
        for group, metrics_list in groups.items():
            # Exposure based on response length and complexity
            avg_exposure = np.mean([m["length"] * m["complexity"] for m in metrics_list])
            group_exposures[group] = avg_exposure
        
        if len(group_exposures) < 2:
            return 0.0
        
        exposures = list(group_exposures.values())
        return max(exposures) - min(exposures)
    
    def _calculate_representation_disparity(self, groups: Dict[str, List[Dict[str, float]]]) -> float:
        """Calculate representation disparity between groups."""
        total_responses = sum(len(metrics_list) for metrics_list in groups.values())
        
        group_representations = {}
        for group, metrics_list in groups.items():
            representation = len(metrics_list) / total_responses
            group_representations[group] = representation
        
        if len(group_representations) < 2:
            return 0.0
        
        representations = list(group_representations.values())
        return max(representations) - min(representations)
    
    def _calculate_balance_for_positive_class(
        self, y_scores: np.ndarray, sensitive_features: np.ndarray
    ) -> float:
        """Calculate balance for positive class (for regression tasks)."""
        unique_groups = np.unique(sensitive_features)
        
        if len(unique_groups) < 2:
            return 0.0
        
        group_scores = {}
        for group in unique_groups:
            mask = sensitive_features == group
            group_scores[group] = np.mean(y_scores[mask])
        
        scores = list(group_scores.values())
        return max(scores) - min(scores)
    
    def _calculate_balance_for_negative_class(
        self, y_scores: np.ndarray, sensitive_features: np.ndarray
    ) -> float:
        """Calculate balance for negative class (for regression tasks)."""
        # For negative class, we look at the complement
        y_scores_negative = 1 - y_scores
        return self._calculate_balance_for_positive_class(y_scores_negative, sensitive_features)
    
    def generate_fairness_report(
        self, 
        results: Dict[str, Any], 
        output_path: Optional[str] = None
    ) -> str:
        """
        Generate a comprehensive fairness report.
        
        Args:
            results: Evaluation results
            output_path: Optional path to save report
            
        Returns:
            str: Formatted report
        """
        report_lines = []
        report_lines.append("=" * 50)
        report_lines.append("FAIRNESS EVALUATION REPORT")
        report_lines.append("=" * 50)
        report_lines.append("")
        
        # Overall metrics
        report_lines.append("OVERALL METRICS:")
        report_lines.append("-" * 20)
        
        for metric, value in results.items():
            if isinstance(value, (int, float)) and metric not in ["group_metrics", "response_characteristics"]:
                report_lines.append(f"{metric}: {value:.4f}")
        
        # Group metrics if available
        if "group_metrics" in results:
            report_lines.append("")
            report_lines.append("GROUP METRICS:")
            report_lines.append("-" * 20)
            
            for group, metrics in results["group_metrics"].items():
                report_lines.append(f"\nGroup: {group}")
                for metric, value in metrics.items():
                    if isinstance(value, (int, float)):
                        report_lines.append(f"  {metric}: {value:.4f}")
        
        report = "\n".join(report_lines)
        
        if output_path:
            with open(output_path, 'w') as f:
                f.write(report)
            logger.info(f"Report saved to {output_path}")
        
        return report 