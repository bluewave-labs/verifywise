#!/usr/bin/env python3
"""
Comprehensive unit tests for the metrics module.
"""

import unittest
import numpy as np
import pandas as pd
from unittest.mock import patch, MagicMock
from src.eval_engine.metrics import (
    demographic_parity, equalized_odds, predictive_parity,
    equalized_opportunities, predictive_equality,
    balance_positive_class, balance_negative_class,
    calibration, conditional_use_accuracy_equality,
    equal_selection_parity, conditional_statistical_parity,
    convert_metric_to_float
)


class TestMetrics(unittest.TestCase):
    """Test cases for all fairness metrics."""
    
    def setUp(self):
        """Set up test data."""
        np.random.seed(42)
        self.n_samples = 100
        
        # Create balanced synthetic data
        self.y_true = np.random.binomial(1, 0.5, self.n_samples)
        self.y_pred = np.random.binomial(1, 0.5, self.n_samples)
        self.sensitive = np.random.choice([0, 1], self.n_samples)
        self.y_scores = np.random.random(self.n_samples)
        
        # Create imbalanced data for testing
        self.y_true_imbalanced = np.array([0] * 80 + [1] * 20)
        self.y_pred_imbalanced = np.array([0] * 70 + [1] * 30)
        self.sensitive_imbalanced = np.array([0] * 50 + [1] * 50)
        
        # Create data with clear bias
        self.y_true_bias = np.array([0, 1, 0, 1, 0, 1, 0, 1, 0, 1])
        self.y_pred_bias = np.array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1])
        self.sensitive_bias = np.array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1])
    
    def test_demographic_parity(self):
        """Test demographic parity metric."""
        result = demographic_parity(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a float
        self.assertIsInstance(result, float)
        
        # Should be between 0 and 1
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
        
        # Test with biased data
        result_bias = demographic_parity(self.y_true_bias, self.y_pred_bias, self.sensitive_bias)
        self.assertGreater(result_bias, 0.0)  # Should detect bias
    
    def test_equalized_odds(self):
        """Test equalized odds metric."""
        result = equalized_odds(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a float
        self.assertIsInstance(result, float)
        
        # Should be between 0 and 1
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
        
        # Test with biased data
        result_bias = equalized_odds(self.y_true_bias, self.y_pred_bias, self.sensitive_bias)
        self.assertGreater(result_bias, 0.0)  # Should detect bias
    
    def test_predictive_parity(self):
        """Test predictive parity metric."""
        result = predictive_parity(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a MetricFrame
        from fairlearn.metrics import MetricFrame
        self.assertIsInstance(result, MetricFrame)
        
        # Should have by_group attribute
        self.assertTrue(hasattr(result, 'by_group'))
        
        # Test with biased data
        result_bias = predictive_parity(self.y_true_bias, self.y_pred_bias, self.sensitive_bias)
        self.assertIsInstance(result_bias, MetricFrame)
    
    def test_equalized_opportunities(self):
        """Test equalized opportunities metric."""
        result = equalized_opportunities(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a MetricFrame
        from fairlearn.metrics import MetricFrame
        self.assertIsInstance(result, MetricFrame)
        
        # Should have by_group attribute
        self.assertTrue(hasattr(result, 'by_group'))
    
    def test_predictive_equality(self):
        """Test predictive equality metric."""
        result = predictive_equality(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a MetricFrame
        from fairlearn.metrics import MetricFrame
        self.assertIsInstance(result, MetricFrame)
        
        # Should have by_group attribute
        self.assertTrue(hasattr(result, 'by_group'))
    
    def test_balance_positive_class(self):
        """Test balance for positive class metric."""
        result = balance_positive_class(self.y_true, self.y_scores, self.sensitive)
        
        # Should return a MetricFrame
        from fairlearn.metrics import MetricFrame
        self.assertIsInstance(result, MetricFrame)
        
        # Should have by_group attribute
        self.assertTrue(hasattr(result, 'by_group'))
    
    def test_balance_negative_class(self):
        """Test balance for negative class metric."""
        result = balance_negative_class(self.y_true, self.y_scores, self.sensitive)
        
        # Should return a MetricFrame
        from fairlearn.metrics import MetricFrame
        self.assertIsInstance(result, MetricFrame)
        
        # Should have by_group attribute
        self.assertTrue(hasattr(result, 'by_group'))
    
    def test_calibration(self):
        """Test calibration metric."""
        result = calibration(self.y_true, self.y_scores, self.sensitive)
        
        # Should return a MetricFrame
        from fairlearn.metrics import MetricFrame
        self.assertIsInstance(result, MetricFrame)
        
        # Should have by_group attribute
        self.assertTrue(hasattr(result, 'by_group'))
    
    def test_conditional_use_accuracy_equality(self):
        """Test conditional use accuracy equality metric."""
        result = conditional_use_accuracy_equality(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a NamedTuple
        self.assertTrue(hasattr(result, '_fields'))
        
        # Should have NPV and PPV fields
        self.assertIn('npv', result._fields)
        self.assertIn('ppv', result._fields)
    
    def test_equal_selection_parity(self):
        """Test equal selection parity metric."""
        result = equal_selection_parity(self.y_true, self.y_pred, self.sensitive)
        
        # Should return a dict
        self.assertIsInstance(result, dict)
        
        # Should have entries for each sensitive group
        unique_groups = np.unique(self.sensitive)
        for group in unique_groups:
            self.assertIn(group, result)
            self.assertIsInstance(result[group], (int, float))
    
    def test_conditional_statistical_parity(self):
        """Test conditional statistical parity metric."""
        # Create legitimate attributes for this metric
        legitimate_attrs = np.random.randn(self.n_samples, 2)
        
        result = conditional_statistical_parity(self.y_pred, self.sensitive, legitimate_attrs)
        
        # Should return a list of dicts
        self.assertIsInstance(result, list)
        if result:  # If list is not empty
            self.assertIsInstance(result[0], dict)
            self.assertIn('disparity', result[0])
    
    def test_convert_metric_to_float(self):
        """Test the convert_metric_to_float utility function."""
        
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
        self.assertEqual(result, 0.4)  # 0.7 - 0.3
        
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
        """Test convert_metric_to_float error handling."""
        
        # Test with unsupported type
        with self.assertRaises(ValueError):
            convert_metric_to_float("unsupported", "test_metric")
        
        # Test with None
        with self.assertRaises(ValueError):
            convert_metric_to_float(None, "test_metric")
    
    def test_metrics_with_edge_cases(self):
        """Test metrics with edge cases."""
        
        # Test with single sample
        y_true_single = np.array([1])
        y_pred_single = np.array([1])
        sensitive_single = np.array([0])
        
        result = demographic_parity(y_true_single, y_pred_single, sensitive_single)
        self.assertIsInstance(result, float)
        
        # Test with all same predictions
        y_true_same = np.array([0, 0, 0, 0])
        y_pred_same = np.array([0, 0, 0, 0])
        sensitive_same = np.array([0, 0, 1, 1])
        
        result = demographic_parity(y_true_same, y_pred_same, sensitive_same)
        self.assertEqual(result, 0.0)  # No disparity when all predictions are same
        
        # Test with all same sensitive attribute
        y_true_mixed = np.array([0, 1, 0, 1])
        y_pred_mixed = np.array([0, 0, 1, 1])
        sensitive_mixed = np.array([0, 0, 0, 0])  # All same group
        
        result = demographic_parity(y_true_mixed, y_pred_mixed, sensitive_mixed)
        self.assertEqual(result, 0.0)  # No disparity when only one group
    
    def test_metrics_consistency(self):
        """Test that metrics are consistent across multiple runs."""
        
        # Run demographic parity multiple times
        results = []
        for _ in range(5):
            result = demographic_parity(self.y_true, self.y_pred, self.sensitive)
            results.append(result)
        
        # All results should be the same (deterministic)
        self.assertEqual(len(set(results)), 1)
        
        # Run equalized odds multiple times
        results = []
        for _ in range(5):
            result = equalized_odds(self.y_true, self.y_pred, self.sensitive)
            results.append(result)
        
        # All results should be the same (deterministic)
        self.assertEqual(len(set(results)), 1)
    
    def test_metrics_with_different_data_sizes(self):
        """Test metrics with different data sizes."""
        
        sizes = [10, 50, 100, 200]
        
        for size in sizes:
            y_true = np.random.binomial(1, 0.5, size)
            y_pred = np.random.binomial(1, 0.5, size)
            sensitive = np.random.choice([0, 1], size)
            
            # All metrics should work with different sizes
            result_dp = demographic_parity(y_true, y_pred, sensitive)
            result_eo = equalized_odds(y_true, y_pred, sensitive)
            result_pp = predictive_parity(y_true, y_pred, sensitive)
            
            # Should return expected types
            self.assertIsInstance(result_dp, float)
            self.assertIsInstance(result_eo, float)
            self.assertIsInstance(result_pp, type(predictive_parity(self.y_true, self.y_pred, self.sensitive)))


if __name__ == '__main__':
    unittest.main()
