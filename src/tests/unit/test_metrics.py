#!/usr/bin/env python3
"""
Comprehensive unit tests for fairness metrics.
Tests all individual fairness metrics and the convert_metric_to_float utility function.
"""

import unittest
import numpy as np
from src.eval_engine.metrics import (
    demographic_parity,
    equalized_odds,
    equalized_opportunities,
    predictive_parity,
    predictive_equality,
    balance_positive_class,
    balance_negative_class,
    calibration,
    conditional_use_accuracy_equality,
    equal_selection_parity,
    conditional_statistical_parity,
    convert_metric_to_float
)

# Import test fixtures
from src.tests.fixtures.sample_data import create_metric_test_data


class TestMetrics(unittest.TestCase):
    """Test cases for individual fairness metrics."""
    
    def setUp(self):
        """Set up test data for metric testing.
        
        Creates synthetic data with known bias patterns to test fairness metrics.
        The data includes ground truth, predictions, and protected attributes.
        """
        self.n_samples = 1000
        
        # Create synthetic data with known bias patterns
        np.random.seed(42)
        
        # Protected attribute (0 = group 1, 1 = group 2)
        self.sensitive = np.random.choice([0, 1], self.n_samples, p=[0.4, 0.6])
        
        # Ground truth with bias (group 1 has higher positive rate)
        group_1_mask = (self.sensitive == 0)
        group_2_mask = (self.sensitive == 1)
        
        self.y_true = np.zeros(self.n_samples)
        self.y_true[group_1_mask] = np.random.binomial(1, 0.7, np.sum(group_1_mask))
        self.y_true[group_2_mask] = np.random.binomial(1, 0.3, np.sum(group_2_mask))
        
        # Predictions with some noise
        self.y_pred = np.random.binomial(1, 0.5, self.n_samples)
        
        # Scores for score-based metrics
        self.y_scores = np.random.random(self.n_samples)
    
    def test_demographic_parity(self):
        """Test demographic parity metric.
        
        Demographic parity measures whether the positive prediction rate is the same
        across different protected groups. A value of 0 indicates perfect fairness.
        """
        result = demographic_parity(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a float value
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
        
        # Test with equal predictions (should be fair)
        equal_pred = np.ones(self.n_samples)
        result_equal = demographic_parity(self.y_true, equal_pred, self.sensitive)
        self.assertEqual(result_equal, 0.0)
    
    def test_equalized_odds(self):
        """Test equalized odds metric.
        
        Equalized odds measures whether the true positive rate and false positive rate
        are the same across different protected groups. A value of 0 indicates perfect fairness.
        """
        result = equalized_odds(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a float value
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    def test_equalized_opportunities(self):
        """Test equalized opportunities metric.
        
        Equalized opportunities measures whether the true positive rate is the same
        across different protected groups. A value of 0 indicates perfect fairness.
        """
        result = equalized_opportunities(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a float value
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    def test_predictive_parity(self):
        """Test predictive parity metric.
        
        Predictive parity measures whether the positive predictive value is the same
        across different protected groups. A value of 0 indicates perfect fairness.
        """
        result = predictive_parity(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a float value
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    def test_predictive_equality(self):
        """Test predictive equality metric.
        
        Predictive equality measures whether the false positive rate is the same
        across different protected groups. A value of 0 indicates perfect fairness.
        """
        result = predictive_equality(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a float value
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    def test_balance_positive_class(self):
        """Test balance for positive class metric.
        
        Balance for positive class measures whether the average prediction score
        for the positive class is the same across different protected groups.
        """
        result = balance_positive_class(self.y_true, self.y_pred, self.sensitive, y_scores=self.y_scores)
        
        # Should return a float value
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    def test_balance_negative_class(self):
        """Test balance for negative class metric.
        
        Balance for negative class measures whether the average prediction score
        for the negative class is the same across different protected groups.
        """
        result = balance_negative_class(self.y_true, self.y_pred, self.sensitive, y_scores=self.y_scores)
        
        # Should return a float value
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    def test_calibration(self):
        """Test calibration metric.
        
        Calibration measures whether the predicted probabilities are well-calibrated
        across different protected groups. A value of 0 indicates perfect fairness.
        """
        result = calibration(self.y_true, self.y_pred, self.sensitive, y_scores=self.y_scores)
        
        # Should return a float value
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    def test_conditional_use_accuracy_equality(self):
        """Test conditional use accuracy equality metric.
        
        Conditional use accuracy equality measures whether the positive and negative
        predictive values are the same across different protected groups.
        """
        result = conditional_use_accuracy_equality(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a float value
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    def test_equal_selection_parity(self):
        """Test equal selection parity metric.
        
        Equal selection parity measures whether the selection rate is the same
        across different protected groups. A value of 0 indicates perfect fairness.
        """
        result = equal_selection_parity(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a float value
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    def test_conditional_statistical_parity(self):
        """Test conditional statistical parity metric.
        
        This metric requires legitimate attributes that match the length of predictions
        and protected attributes. It returns a list of dictionaries with disparity values.
        """
        # Create legitimate attributes with correct dimensions
        legitimate_attrs = np.random.randn(self.n_samples, 1)  # Single feature column
        
        result = conditional_statistical_parity(self.y_pred, self.sensitive, legitimate_attrs)
        
        # Should return a list of dicts
        self.assertIsInstance(result, list)
        if result:  # If list is not empty
            self.assertIsInstance(result[0], dict)
            self.assertIn('disparity', result[0])
    
    def test_convert_metric_to_float(self):
        """Test the convert_metric_to_float utility function.
        
        This function converts various metric result types (dict, MetricFrame, NamedTuple, etc.)
        into a single float value for consistent consumption by the Fairness Compass Engine.
        """
        
        # Test with float
        result = convert_metric_to_float(0.5, "test_metric")
        self.assertEqual(result, 0.5)
        
        # Test with int
        result = convert_metric_to_float(42, "test_metric")
        self.assertEqual(result, 42.0)
        
        # Test with MetricFrame
        from fairlearn.metrics import MetricFrame
        metric_frame = MetricFrame(
            metrics={'test': lambda y_true, y_pred: 0.8},
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_features=self.sensitive
        )
        result = convert_metric_to_float(metric_frame, "test_metric")
        self.assertIsInstance(result, float)
        
        # Test with dict
        dict_result = {0: 0.3, 1: 0.7}
        result = convert_metric_to_float(dict_result, "test_metric")
        self.assertAlmostEqual(result, 0.4, places=10)  # 0.7 - 0.3, use assertAlmostEqual for floating point
        
        # Test with list of dicts
        list_result = [{'disparity': 0.1}, {'disparity': 0.2}]
        result = convert_metric_to_float(list_result, "test_metric")
        self.assertEqual(result, 0.2)  # max disparity
        
        # Test with NamedTuple
        from collections import namedtuple
        TestResult = namedtuple('TestResult', ['field1', 'field2'])
        named_result = TestResult(0.1, 0.2)
        result = convert_metric_to_float(named_result, "test_metric")
        self.assertEqual(result, 0.2)  # max of fields
        
        # Test with empty dict
        result = convert_metric_to_float({}, "test_metric")
        self.assertEqual(result, 0.0)
        
        # Test with empty list
        result = convert_metric_to_float([], "test_metric")
        self.assertEqual(result, 0.0)
    
    def test_convert_metric_to_float_error_handling(self):
        """Test convert_metric_to_float error handling.
        
        The function should raise ValueError for unsupported types and None values.
        """
        
        # Test with unsupported type
        with self.assertRaises(ValueError):
            convert_metric_to_float("unsupported", "test_metric")
        
        # Test with None
        with self.assertRaises(ValueError):
            convert_metric_to_float(None, "test_metric")
    
    def test_metrics_with_edge_cases(self):
        """Test metrics with edge cases.
        
        Tests metrics with various edge cases like single samples, all-same predictions,
        and single-group data to ensure robustness.
        """
        
        # Test with all same predictions (should be fair)
        y_true_same = np.array([0, 0, 0, 0])
        y_pred_same = np.array([0, 0, 0, 0])
        sensitive_same = np.array([0, 0, 1, 1])
        
        result = demographic_parity(y_true_same, y_pred_same, sensitive_same)
        self.assertEqual(result, 0.0)  # No disparity when all predictions are same
        
        # Test with all same sensitive attribute (should be fair)
        y_true_mixed = np.array([0, 1, 0, 1])
        y_pred_mixed = np.array([0, 0, 1, 1])
        sensitive_mixed = np.array([0, 0, 0, 0])  # All same group
        
        result = demographic_parity(y_true_mixed, y_pred_mixed, sensitive_mixed)
        self.assertEqual(result, 0.0)  # No disparity when only one group
    
    def test_metrics_consistency(self):
        """Test that metrics are consistent across multiple runs.
        
        Fairness metrics should be deterministic and consistent when run multiple times
        on the same data with the same random seed.
        """
        
        # Run demographic parity multiple times
        results = []
        for _ in range(5):
            result = demographic_parity(self.y_true, self.y_pred, self.sensitive)
            results.append(result)
        
        # All results should be the same (deterministic)
        self.assertEqual(len(set(results)), 1)
    
    def test_metrics_with_different_data_sizes(self):
        """Test metrics with different data sizes.
        
        Metrics should work correctly with various dataset sizes, from small to large.
        """
        
        # Test with small dataset
        small_n = 100
        y_true_small = np.random.binomial(1, 0.3, small_n)
        y_pred_small = np.random.binomial(1, 0.35, small_n)
        sensitive_small = np.random.choice([0, 1], small_n)
        
        result_small = demographic_parity(y_true_small, y_pred_small, sensitive_small)
        self.assertIsInstance(result_small, float)
        self.assertGreaterEqual(result_small, 0.0)
        
        # Test with large dataset
        large_n = 5000
        y_true_large = np.random.binomial(1, 0.3, large_n)
        y_pred_large = np.random.binomial(1, 0.35, large_n)
        sensitive_large = np.random.choice([0, 1], large_n)
        
        result_large = demographic_parity(y_true_large, y_pred_large, sensitive_large)
        self.assertIsInstance(result_large, float)
        self.assertGreaterEqual(result_large, 0.0)


if __name__ == "__main__":
    unittest.main()
