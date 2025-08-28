#!/usr/bin/env python3
"""
Comprehensive unit tests for the metric registry system.
Tests the registration, retrieval, and management of fairness metrics.
"""

import unittest
import sys
from unittest.mock import patch, MagicMock

# Import the registry functions
from src.eval_engine.metric_registry import (
    METRIC_REGISTRY,
    register_metric,
    get_metric,
    list_metrics
)


class TestMetricRegistry(unittest.TestCase):
    """Test cases for the metric registry."""

    def setUp(self):
        """Set up test environment for metric registry tests."""
        self.initial_registry = METRIC_REGISTRY.copy()
        METRIC_REGISTRY.clear()

    def tearDown(self):
        """Clean up after each test."""
        METRIC_REGISTRY.clear()
        METRIC_REGISTRY.update(self.initial_registry)

    def test_metric_registry_initialization(self):
        """Test metric registry initialization."""
        # Registry should start empty after clearing
        self.assertEqual(len(METRIC_REGISTRY), 0)

    def test_register_metric_decorator(self):
        """Test the register_metric decorator."""
        @register_metric("test_metric_decorator")
        def test_metric_func(y_true, y_pred, sensitive_features):
            return 0.5
        
        self.assertIn("test_metric_decorator", METRIC_REGISTRY)
        self.assertEqual(METRIC_REGISTRY["test_metric_decorator"], test_metric_func)

    def test_register_metric_function(self):
        """Test registering a metric function directly."""
        def test_metric_func(y_true, y_pred, sensitive_features):
            return 0.5
        
        register_metric("test_metric_manual")(test_metric_func)
        
        self.assertIn("test_metric_manual", METRIC_REGISTRY)
        self.assertEqual(METRIC_REGISTRY["test_metric_manual"], test_metric_func)

    def test_duplicate_registration(self):
        """Test that duplicate registration raises an error."""
        def test_metric_func(y_true, y_pred, sensitive_features):
            return 0.5
        
        register_metric("test_duplicate")(test_metric_func)
        
        with self.assertRaises(ValueError):
            register_metric("test_duplicate")(test_metric_func)
        
        self.assertIn("test_duplicate", METRIC_REGISTRY)
        self.assertEqual(METRIC_REGISTRY["test_duplicate"], test_metric_func)

    def test_get_metric_existing(self):
        """Test getting an existing metric."""
        def test_metric_func(y_true, y_pred, sensitive_features):
            return 0.5
        
        register_metric("test_get_existing")(test_metric_func)
        retrieved_metric = get_metric("test_get_existing")
        
        self.assertEqual(retrieved_metric, test_metric_func)

    def test_get_metric_nonexistent(self):
        """Test getting a non-existent metric."""
        with self.assertRaises(KeyError):
            get_metric("nonexistent_metric")

    def test_list_metrics(self):
        """Test listing all registered metrics."""
        METRIC_REGISTRY.clear()  # Clear registry for this test
        
        @register_metric("test_metric_1")
        def test_metric_1(y_true, y_pred, sensitive_features):
            return 0.1
        
        @register_metric("test_metric_2")
        def test_metric_2(y_true, y_pred, sensitive_features):
            return 0.2
        
        metrics_list = list_metrics()
        
        self.assertIsInstance(metrics_list, list)
        self.assertIn("test_metric_1", metrics_list)
        self.assertIn("test_metric_2", metrics_list)
        self.assertEqual(len(metrics_list), 2)

    def test_metric_execution(self):
        """Test that registered metrics can be executed."""
        @register_metric("test_executable_metric")
        def test_executable_metric(y_true, y_pred, sensitive_features):
            return len(y_true)
        
        y_true = [1, 2, 3, 4, 5]
        y_pred = [1, 0, 1, 0, 1]
        sensitive = [0, 1, 0, 1, 0]
        
        result = test_executable_metric(y_true, y_pred, sensitive)
        self.assertEqual(result, 5)

    def test_metric_registry_clear(self):
        """Test clearing the metric registry."""
        @register_metric("test_clear_1")
        def test_clear_1(y_true, y_pred, sensitive_features):
            return 0.1
        
        @register_metric("test_clear_2")
        def test_metric_2(y_true, y_pred, sensitive_features):
            return 0.2
        
        self.assertEqual(len(METRIC_REGISTRY), 2)
        
        METRIC_REGISTRY.clear()
        self.assertEqual(len(METRIC_REGISTRY), 0)

    def test_metric_registry_error_handling(self):
        """Test error handling in metric registry."""
        # Test with invalid metric name (empty string)
        with self.assertRaises(ValueError):
            @register_metric("")
            def invalid_metric(y_true, y_pred, sensitive_features):
                return 0.5
        
        # Test with None metric name
        with self.assertRaises(ValueError):
            @register_metric(None)
            def invalid_metric(y_true, y_pred, sensitive_features):
                return 0.5

    def test_metric_registry_global_behavior(self):
        """Test that metric registry uses global state."""
        @register_metric("test_global_metric")
        def test_global_metric(y_true, y_pred, sensitive_features):
            return 0.5
        
        self.assertIn("test_global_metric", METRIC_REGISTRY)
        
        retrieved_metric = get_metric("test_global_metric")
        self.assertEqual(retrieved_metric, test_global_metric)

    def test_metric_registry_import_behavior(self):
        """Test that metrics are registered when modules are imported."""
        # Import the metrics module to trigger registration
        import src.eval_engine.metrics
        
        # Get the list of available metrics
        metrics_list = list_metrics()
        
        # Should have some metrics available
        self.assertIsInstance(metrics_list, list)
        # Note: The exact number depends on what's in the metrics module

    def test_metric_with_different_signatures(self):
        """Test metrics with different parameter signatures."""
        # Test metric with minimal parameters
        @register_metric("minimal_metric")
        def minimal_metric(y_true, y_pred):
            return 0.5
        
        # Test metric with extra parameters
        @register_metric("extra_params_metric")
        def extra_params_metric(y_true, y_pred, sensitive_features, extra_param=None):
            return 0.5
        
        # Both should be registered
        self.assertIn("minimal_metric", METRIC_REGISTRY)
        self.assertIn("extra_params_metric", METRIC_REGISTRY)
        
        # Both should be callable
        self.assertTrue(callable(METRIC_REGISTRY["minimal_metric"]))
        self.assertTrue(callable(METRIC_REGISTRY["extra_params_metric"]))


if __name__ == "__main__":
    unittest.main()
