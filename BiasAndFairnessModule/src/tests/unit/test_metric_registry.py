#!/usr/bin/env python3
"""
Comprehensive unit tests for the metric registry system.
"""

import unittest
import numpy as np
import pandas as pd
from unittest.mock import patch, MagicMock
from src.eval_engine.metric_registry import register_metric, get_metric, list_metrics


class TestMetricRegistry(unittest.TestCase):
    """Test cases for the MetricRegistry class."""
    
    def setUp(self):
        """Set up test data."""
        np.random.seed(42)
        self.n_samples = 100
        
        # Create synthetic data
        self.y_true = np.random.binomial(1, 0.3, self.n_samples)
        self.y_pred = np.random.binomial(1, 0.35, self.n_samples)
        self.sensitive = np.random.choice([0, 1], self.n_samples)
        self.y_scores = np.random.random(self.n_samples)
        
        # Create test metric function
        def test_metric(y_true, y_pred, sensitive):
            return 0.5
        
        self.test_metric = test_metric
        
        # Store original registry state
        from src.eval_engine.metric_registry import METRIC_REGISTRY
        self.original_metrics = list(METRIC_REGISTRY.keys())
    
    def tearDown(self):
        """Restore original registry state."""
        from src.eval_engine.metric_registry import METRIC_REGISTRY
        # Remove any test metrics we added
        test_metrics = [key for key in METRIC_REGISTRY.keys() if key not in self.original_metrics]
        for metric in test_metrics:
            del METRIC_REGISTRY[metric]
    
    def test_metric_registry_initialization(self):
        """Test metric registry initialization."""
        # Check that registry exists and has metrics
        from src.eval_engine.metric_registry import METRIC_REGISTRY
        
        # Registry should have metrics from imports
        self.assertGreater(len(METRIC_REGISTRY), 0)
        
        # Should be able to list metrics
        metrics_list = list_metrics()
        self.assertEqual(len(metrics_list), len(METRIC_REGISTRY))
    
    def test_register_metric_decorator(self):
        """Test the register_metric decorator."""
        @register_metric("test_metric")
        def test_func(y_true, y_pred, sensitive):
            return 0.5
        
        # Check if metric was registered
        from src.eval_engine.metric_registry import METRIC_REGISTRY
        self.assertIn("test_metric", METRIC_REGISTRY)
        self.assertEqual(METRIC_REGISTRY["test_metric"], test_func)
    
    def test_register_metric_function(self):
        """Test registering a metric function directly."""
        # Use the decorator to register directly
        @register_metric("direct_metric")
        def direct_func(y_true, y_pred, sensitive):
            return 0.5
        
        from src.eval_engine.metric_registry import METRIC_REGISTRY
        self.assertIn("direct_metric", METRIC_REGISTRY)
        self.assertEqual(METRIC_REGISTRY["direct_metric"], direct_func)
    
    def test_get_metric_existing(self):
        """Test getting an existing metric."""
        @register_metric("existing_metric")
        def existing_func(y_true, y_pred, sensitive):
            return 0.5
        
        metric_func = get_metric("existing_metric")
        self.assertEqual(metric_func, existing_func)
    
    def test_get_metric_nonexistent(self):
        """Test getting a non-existent metric."""
        with self.assertRaises(KeyError):
            get_metric("nonexistent_metric")
    
    def test_list_metrics(self):
        """Test listing all registered metrics."""
        # Clear registry first
        from src.eval_engine.metric_registry import METRIC_REGISTRY
        METRIC_REGISTRY.clear()
        
        # Register some test metrics
        @register_metric("metric1")
        def func1(y_true, y_pred, sensitive):
            return 0.1
        
        @register_metric("metric2")
        def func2(y_true, y_pred, sensitive):
            return 0.2
        
        metrics = list_metrics()
        self.assertIn("metric1", metrics)
        self.assertIn("metric2", metrics)
        self.assertEqual(len(metrics), 2)
    
    def test_metric_execution(self):
        """Test that registered metrics can be executed."""
        @register_metric("executable_metric")
        def executable_func(y_true, y_pred, sensitive):
            return np.mean(y_true) - np.mean(y_pred)
        
        metric_func = get_metric("executable_metric")
        result = metric_func(self.y_true, self.y_pred, self.sensitive)
        
        self.assertIsInstance(result, (int, float))
        self.assertAlmostEqual(result, np.mean(self.y_true) - np.mean(self.y_pred))
    
    def test_duplicate_registration(self):
        """Test that duplicate registration raises an error."""
        @register_metric("duplicate_metric")
        def first_func(y_true, y_pred, sensitive):
            return 0.1
        
        # Second registration with same name should raise ValueError
        with self.assertRaises(ValueError):
            @register_metric("duplicate_metric")
            def second_func(y_true, y_pred, sensitive):
                return 0.2
        
        # First function should still be registered
        metric_func = get_metric("duplicate_metric")
        self.assertEqual(metric_func, first_func)
        
        # Execute to verify it's the first function
        result = metric_func(self.y_true, self.y_pred, self.sensitive)
        self.assertEqual(result, 0.1)
    
    def test_metric_with_different_signatures(self):
        """Test metrics with different parameter signatures."""
        @register_metric("three_param_metric")
        def three_param(y_true, y_pred, sensitive):
            return len(y_true)
        
        @register_metric("four_param_metric")
        def four_param(y_true, y_pred, sensitive, y_scores=None):
            return len(y_true) + (len(y_scores) if y_scores is not None else 0)
        
        # Test three parameter metric
        result1 = get_metric("three_param_metric")(self.y_true, self.y_pred, self.sensitive)
        self.assertEqual(result1, self.n_samples)
        
        # Test four parameter metric
        result2 = get_metric("four_param_metric")(self.y_true, self.y_pred, self.sensitive, self.y_scores)
        self.assertEqual(result2, self.n_samples * 2)
    
    def test_metric_registry_global_behavior(self):
        """Test that metric registry uses global state."""
        from src.eval_engine.metric_registry import METRIC_REGISTRY
        
        # Clear registry
        METRIC_REGISTRY.clear()
        
        # Register a metric
        @register_metric("global_test")
        def global_func(y_true, y_pred, sensitive):
            return 0.5
        
        # Check that it's available globally
        self.assertIn("global_test", METRIC_REGISTRY)
        self.assertEqual(METRIC_REGISTRY["global_test"], global_func)
    
    def test_metric_registry_clear(self):
        """Test clearing the metric registry."""
        from src.eval_engine.metric_registry import METRIC_REGISTRY
        
        # Store original count
        original_count = len(METRIC_REGISTRY)
        
        # Register some test metrics
        @register_metric("clear_test1")
        def clear_func1(y_true, y_pred, sensitive):
            return 0.1
        
        @register_metric("clear_test2")
        def clear_func2(y_true, y_pred, sensitive):
            return 0.2
        
        # Verify metrics are registered
        self.assertEqual(len(METRIC_REGISTRY), original_count + 2)
        
        # Remove test metrics
        del METRIC_REGISTRY["clear_test1"]
        del METRIC_REGISTRY["clear_test2"]
        
        # Should be back to original count
        self.assertEqual(len(METRIC_REGISTRY), original_count)
    
    def test_metric_registry_error_handling(self):
        """Test error handling in metric registry."""
        # Test that the decorator works with valid functions
        try:
            @register_metric("valid_metric")
            def valid_func(y_true, y_pred, sensitive):
                return 0.5
            self.assertTrue(True)  # Should not raise an error
        except Exception as e:
            self.fail(f"Valid metric registration failed: {e}")
        
        # Test duplicate registration (should raise ValueError)
        with self.assertRaises(ValueError):
            @register_metric("valid_metric")  # Same name again
            def duplicate_func(y_true, y_pred, sensitive):
                return 0.6
    
    def test_metric_registry_import_behavior(self):
        """Test that metrics are registered when modules are imported."""
        # Check that metrics are available (they should be registered from initial import)
        metrics_list = list_metrics()
        self.assertGreater(len(metrics_list), 0)
        
        # Verify some expected metrics are present
        expected_metrics = ['demographic_parity', 'equalized_odds', 'predictive_parity']
        found_metrics = 0
        for metric in expected_metrics:
            if metric in metrics_list:
                found_metrics += 1
        
        # At least some metrics should be found
        self.assertGreater(found_metrics, 0, f"Expected to find some of {expected_metrics}, but found none")
        
        # Test that we can actually get and use a metric
        try:
            metric_func = get_metric('demographic_parity')
            result = metric_func(self.y_true, self.y_pred, self.sensitive)
            self.assertIsInstance(result, (int, float))
        except Exception as e:
            self.fail(f"Failed to get and use metric: {e}")


if __name__ == '__main__':
    unittest.main()
