import unittest
import numpy as np
import pandas as pd
from ..eval_engine.compass_router import route_metric, get_task_type_from_config, get_label_behavior_from_data, validate_metric_availability


class TestCompassRouter(unittest.TestCase):
    """Test cases for the compass router functionality."""
    
    def test_route_metric_binary_classification(self):
        """Test metric routing for binary classification tasks."""
        metrics = route_metric("binary_classification", "binary")
        
        expected_metrics = [
            "demographic_parity", "equalized_odds", "equalized_opportunity",
            "predictive_equality", "predictive_parity", "conditional_use_accuracy_equality",
            "accuracy_difference", "precision_difference", "recall_difference", "f1_difference"
        ]
        
        for metric in expected_metrics:
            self.assertIn(metric, metrics)
    
    def test_route_metric_multiclass_classification(self):
        """Test metric routing for multiclass classification tasks."""
        metrics = route_metric("multiclass_classification", "categorical")
        
        expected_metrics = [
            "demographic_parity", "equalized_odds", "multiclass_demographic_parity",
            "multiclass_equalized_odds", "accuracy_difference", "precision_difference",
            "recall_difference", "f1_difference"
        ]
        
        for metric in expected_metrics:
            self.assertIn(metric, metrics)
    
    def test_route_metric_regression(self):
        """Test metric routing for regression tasks."""
        metrics = route_metric("regression", "continuous")
        
        expected_metrics = [
            "balance_for_positive_class", "balance_for_negative_class",
            "regression_demographic_parity", "accuracy_difference", "precision_difference",
            "recall_difference", "f1_difference"
        ]
        
        for metric in expected_metrics:
            self.assertIn(metric, metrics)
    
    def test_route_metric_generation(self):
        """Test metric routing for generation tasks."""
        metrics = route_metric("generation", "continuous")
        
        expected_metrics = [
            "toxicity_gap", "sentiment_gap", "stereotype_gap", "exposure_disparity",
            "representation_disparity", "prompt_fairness", "accuracy_difference",
            "precision_difference", "recall_difference", "f1_difference"
        ]
        
        for metric in expected_metrics:
            self.assertIn(metric, metrics)
    
    def test_route_metric_ranking(self):
        """Test metric routing for ranking tasks."""
        metrics = route_metric("ranking", "continuous")
        
        expected_metrics = [
            "ranking_demographic_parity", "ranking_equalized_odds", "exposure_disparity",
            "accuracy_difference", "precision_difference", "recall_difference", "f1_difference"
        ]
        
        for metric in expected_metrics:
            self.assertIn(metric, metrics)
    
    def test_route_metric_unknown_task(self):
        """Test metric routing for unknown task types."""
        metrics = route_metric("unknown_task", "binary")
        
        # Should fall back to default metrics
        expected_metrics = ["demographic_parity", "equalized_odds"]
        
        for metric in expected_metrics:
            self.assertIn(metric, metrics)
    
    def test_get_task_type_from_config(self):
        """Test task type determination from configuration."""
        # Test LLM model
        task_type = get_task_type_from_config("llm", "generation")
        self.assertEqual(task_type, "generation")
        
        # Test tabular classification
        task_type = get_task_type_from_config("tabular", "classification")
        self.assertEqual(task_type, "binary_classification")
        
        # Test tabular regression
        task_type = get_task_type_from_config("tabular", "regression")
        self.assertEqual(task_type, "regression")
        
        # Test ranking
        task_type = get_task_type_from_config("ranking", "ranking")
        self.assertEqual(task_type, "ranking")
        
        # Test unknown model type
        task_type = get_task_type_from_config("unknown", "classification")
        self.assertEqual(task_type, "binary_classification")
    
    def test_get_label_behavior_from_data(self):
        """Test label behavior determination from data."""
        # Test binary labels
        y_binary = [0, 1, 0, 1, 0]
        behavior = get_label_behavior_from_data(y_binary, "binary_classification")
        self.assertEqual(behavior, "binary")
        
        # Test categorical labels
        y_categorical = [0, 1, 2, 3, 4]
        behavior = get_label_behavior_from_data(y_categorical, "multiclass_classification")
        self.assertEqual(behavior, "categorical")
        
        # Test continuous labels
        y_continuous = [0.1, 0.5, 0.8, 0.2, 0.9, 0.3, 0.7, 0.4, 0.6, 0.0, 0.95]
        behavior = get_label_behavior_from_data(y_continuous, "regression")
        self.assertEqual(behavior, "continuous")
        
        # Test generation task
        behavior = get_label_behavior_from_data(None, "generation")
        self.assertEqual(behavior, "continuous")
        
        # Test None labels
        behavior = get_label_behavior_from_data(None, "binary_classification")
        self.assertEqual(behavior, "binary")
    
    def test_validate_metric_availability(self):
        """Test metric availability validation."""
        requested_metrics = ["demographic_parity", "equalized_odds", "unknown_metric"]
        available_metrics = ["demographic_parity", "equalized_odds", "accuracy_difference"]
        
        valid_metrics = validate_metric_availability(requested_metrics, available_metrics)
        
        expected_valid = ["demographic_parity", "equalized_odds"]
        self.assertEqual(valid_metrics, expected_valid)
    
    def test_validate_metric_availability_all_valid(self):
        """Test metric availability validation when all metrics are available."""
        requested_metrics = ["demographic_parity", "equalized_odds"]
        available_metrics = ["demographic_parity", "equalized_odds", "accuracy_difference"]
        
        valid_metrics = validate_metric_availability(requested_metrics, available_metrics)
        
        self.assertEqual(valid_metrics, requested_metrics)
    
    def test_validate_metric_availability_none_valid(self):
        """Test metric availability validation when no metrics are available."""
        requested_metrics = ["unknown_metric1", "unknown_metric2"]
        available_metrics = ["demographic_parity", "equalized_odds"]
        
        valid_metrics = validate_metric_availability(requested_metrics, available_metrics)
        
        self.assertEqual(valid_metrics, [])
    
    def test_route_metric_with_kwargs(self):
        """Test metric routing with additional keyword arguments."""
        metrics = route_metric("binary_classification", "binary", enforce_policy=True)
        
        # Should still include all expected metrics
        expected_metrics = ["demographic_parity", "equalized_odds"]
        
        for metric in expected_metrics:
            self.assertIn(metric, metrics)


if __name__ == "__main__":
    unittest.main() 