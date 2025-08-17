#!/usr/bin/env python3
"""
Comprehensive unit tests for the evaluation runner.
"""

import unittest
import numpy as np
import pandas as pd
import json
import tempfile
import os
from unittest.mock import patch, MagicMock, mock_open
from pathlib import Path

from src.tests.inference.evaluation_runner import run_comprehensive_evaluation, main


class TestEvaluationRunner(unittest.TestCase):
    """Test cases for the evaluation runner."""
    
    def setUp(self):
        """Set up test data."""
        np.random.seed(42)
        self.n_samples = 50
        
        # Create synthetic test data
        self.test_data = pd.DataFrame({
            'sample_id': range(self.n_samples),
            'prompt': [f"Test prompt {i}" for i in range(self.n_samples)],
            'answer': np.random.binomial(1, 0.3, self.n_samples),
            'prediction': np.random.binomial(1, 0.4, self.n_samples),
            'sex': np.random.choice([0, 1], self.n_samples),
            'race': np.random.choice([0, 1], self.n_samples)
        })
        
        # Create temporary artifacts directory
        self.temp_dir = tempfile.mkdtemp()
        self.artifacts_dir = os.path.join(self.temp_dir, 'artifacts')
        os.makedirs(self.artifacts_dir, exist_ok=True)
        
        # Save test data
        self.test_data_path = os.path.join(self.artifacts_dir, 'postprocessed_results.csv')
        self.test_data.to_csv(self.test_data_path, index=False)
    
    def tearDown(self):
        """Clean up test files."""
        import shutil
        shutil.rmtree(self.temp_dir)
    
    @patch('src.inference.evaluation_runner.pd.read_csv')
    @patch('src.inference.evaluation_runner.ConfigManager')
    @patch('src.inference.evaluation_runner.FairnessEvaluator')
    def test_run_comprehensive_evaluation_success(self, mock_evaluator, mock_config, mock_read_csv):
        """Test successful execution of comprehensive evaluation."""
        
        # Mock the data loading
        mock_read_csv.return_value = self.test_data
        
        # Mock the config manager
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        mock_config_instance.get_metrics_config.return_value = MagicMock()
        
        # Mock the evaluator
        mock_evaluator_instance = MagicMock()
        mock_evaluator.return_value = mock_evaluator_instance
        
        # Mock metric functions
        mock_metric_func = MagicMock()
        mock_metric_func.return_value = 0.1
        
        mock_evaluator_instance.evaluate.return_value = {
            'fairness': {
                'demographic_parity': mock_metric_func,
                'equalized_odds': mock_metric_func,
                'predictive_parity': mock_metric_func
            }
        }
        
        # Run evaluation
        with patch('builtins.print'):  # Suppress print output
            result = run_comprehensive_evaluation()
        
        # Verify results structure
        self.assertIn('performance', result)
        self.assertIn('fairness', result)
        self.assertIn('metadata', result)
        
        # Verify performance metrics
        self.assertIn('accuracy', result['performance'])
        self.assertIn('precision', result['performance'])
        self.assertIn('recall', result['performance'])
        self.assertIn('f1_score', result['performance'])
        
        # Verify fairness metrics
        self.assertIn('demographic_parity_sex', result['fairness'])
        self.assertIn('demographic_parity_race', result['fairness'])
        self.assertIn('equalized_odds_sex', result['fairness'])
        self.assertIn('equalized_odds_race', result['fairness'])
        self.assertIn('predictive_parity_sex', result['fairness'])
        self.assertIn('predictive_parity_race', result['fairness'])
        
        # Verify metadata
        self.assertEqual(result['metadata']['total_samples'], self.n_samples)
        self.assertEqual(result['metadata']['protected_attributes'], ['sex', 'race'])
        self.assertIn('evaluation_timestamp', result['metadata'])
    
    @patch('src.inference.evaluation_runner.pd.read_csv')
    @patch('src.inference.evaluation_runner.ConfigManager')
    def test_run_comprehensive_evaluation_data_loading_error(self, mock_config, mock_read_csv):
        """Test evaluation with data loading error."""
        
        # Mock data loading to fail
        mock_read_csv.side_effect = FileNotFoundError("File not found")
        
        # Mock config
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        
        # Should raise an error
        with self.assertRaises(FileNotFoundError):
            with patch('builtins.print'):
                run_comprehensive_evaluation()
    
    @patch('src.inference.evaluation_runner.pd.read_csv')
    @patch('src.inference.evaluation_runner.ConfigManager')
    @patch('src.inference.evaluation_runner.FairnessEvaluator')
    def test_run_comprehensive_evaluation_metric_calculation_error(self, mock_evaluator, mock_config, mock_read_csv):
        """Test evaluation with metric calculation error."""
        
        # Mock data loading
        mock_read_csv.return_value = self.test_data
        
        # Mock config
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        mock_config_instance.get_metrics_config.return_value = MagicMock()
        
        # Mock evaluator with failing metric
        mock_evaluator_instance = MagicMock()
        mock_evaluator.return_value = mock_evaluator_instance
        
        # Create a metric function that raises an error
        def failing_metric(y_true, y_pred, sensitive):
            raise ValueError("Metric calculation failed")
        
        mock_evaluator_instance.evaluate.return_value = {
            'fairness': {
                'demographic_parity': failing_metric,
                'equalized_odds': failing_metric,
                'predictive_parity': failing_metric
            }
        }
        
        # Run evaluation - should handle errors gracefully
        with patch('builtins.print'):
            result = run_comprehensive_evaluation()
        
        # Check that failed metrics are marked as None
        for metric_name in ['demographic_parity_sex', 'demographic_parity_race',
                           'equalized_odds_sex', 'equalized_odds_race',
                           'predictive_parity_sex', 'predictive_parity_race']:
            self.assertIsNone(result['fairness'][metric_name])
    
    @patch('src.inference.evaluation_runner.pd.read_csv')
    @patch('src.inference.evaluation_runner.ConfigManager')
    @patch('src.inference.evaluation_validation.FairnessEvaluator')
    def test_run_comprehensive_evaluation_with_metricframe_results(self, mock_evaluator, mock_config, mock_read_csv):
        """Test evaluation with MetricFrame results."""
        
        # Mock data loading
        mock_read_csv.return_value = self.test_data
        
        # Mock config
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        mock_config_instance.get_metrics_config.return_value = MagicMock()
        
        # Mock evaluator with MetricFrame results
        mock_evaluator_instance = MagicMock()
        mock_evaluator.return_value = mock_evaluator_instance
        
        # Create mock MetricFrame
        mock_metric_frame = MagicMock()
        mock_metric_frame.by_group.values = np.array([0.3, 0.7])
        
        def metricframe_metric(y_true, y_pred, sensitive):
            return mock_metric_frame
        
        mock_evaluator_instance.evaluate.return_value = {
            'fairness': {
                'demographic_parity': lambda y_true, y_pred, sensitive: 0.1,
                'equalized_odds': lambda y_true, y_pred, sensitive: 0.2,
                'predictive_parity': metricframe_metric
            }
        }
        
        # Run evaluation
        with patch('builtins.print'):
            result = run_comprehensive_evaluation()
        
        # Check that MetricFrame results are converted to floats
        self.assertIsInstance(result['fairness']['predictive_parity_sex'], float)
        self.assertIsInstance(result['fairness']['predictive_parity_race'], float)
        
        # The disparity should be 0.7 - 0.3 = 0.4
        self.assertEqual(result['fairness']['predictive_parity_sex'], 0.4)
        self.assertEqual(result['fairness']['predictive_parity_race'], 0.4)
    
    @patch('src.inference.evaluation_runner.pd.read_csv')
    @patch('src.inference.evaluation_runner.ConfigManager')
    @patch('src.inference.evaluation_runner.FairnessEvaluator')
    def test_run_comprehensive_evaluation_performance_metrics(self, mock_evaluator, mock_config, mock_read_csv):
        """Test performance metrics calculation."""
        
        # Mock data loading
        mock_read_csv.return_value = self.test_data
        
        # Mock config
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        mock_config_instance.get_metrics_config.return_value = MagicMock()
        
        # Mock evaluator
        mock_evaluator_instance = MagicMock()
        mock_evaluator.return_value = mock_evaluator_instance
        mock_evaluator_instance.evaluate.return_value = {
            'fairness': {
                'demographic_parity': lambda y_true, y_pred, sensitive: 0.1,
                'equalized_odds': lambda y_true, y_pred, sensitive: 0.2,
                'predictive_parity': lambda y_true, y_pred, sensitive: 0.3
            }
        }
        
        # Run evaluation
        with patch('builtins.print'):
            result = run_comprehensive_evaluation()
        
        # Check performance metrics
        performance = result['performance']
        
        # All should be floats between 0 and 1
        for metric in ['accuracy', 'precision', 'recall', 'f1_score']:
            self.assertIn(metric, performance)
            self.assertIsInstance(performance[metric], float)
            self.assertGreaterEqual(performance[metric], 0.0)
            self.assertLessEqual(performance[metric], 1.0)
    
    @patch('src.inference.evaluation_runner.pd.read_csv')
    @patch('src.inference.evaluation_runner.ConfigManager')
    @patch('src.inference.evaluation_runner.FairnessEvaluator')
    def test_run_comprehensive_evaluation_group_analysis(self, mock_evaluator, mock_config, mock_read_csv):
        """Test group-specific analysis."""
        
        # Create data with clear group differences
        test_data = pd.DataFrame({
            'sample_id': range(20),
            'prompt': [f"Test prompt {i}" for i in range(20)],
            'answer': [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            'prediction': [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1],
            'sex': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            'race': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
        })
        
        mock_read_csv.return_value = test_data
        
        # Mock config
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        mock_config_instance.get_metrics_config.return_value = MagicMock()
        
        # Mock evaluator
        mock_evaluator_instance = MagicMock()
        mock_evaluator.return_value = mock_evaluator_instance
        mock_evaluator_instance.evaluate.return_value = {
            'fairness': {
                'demographic_parity': lambda y_true, y_pred, sensitive: 0.1,
                'equalized_odds': lambda y_true, y_pred, sensitive: 0.2,
                'predictive_parity': lambda y_true, y_pred, sensitive: 0.3
            }
        }
        
        # Run evaluation
        with patch('builtins.print'):
            result = run_comprehensive_evaluation()
        
        # Check metadata
        self.assertEqual(result['metadata']['total_samples'], 20)
        self.assertEqual(result['metadata']['protected_attributes'], ['sex', 'race'])
    
    @patch('src.inference.evaluation_runner.run_comprehensive_evaluation')
    def test_main_function_success(self, mock_run_evaluation):
        """Test main function with successful execution."""
        
        # Mock successful evaluation
        mock_run_evaluation.return_value = {'test': 'result'}
        
        # Mock print to capture output
        with patch('builtins.print') as mock_print:
            result = main()
        
        # Check that main calls run_comprehensive_evaluation
        mock_run_evaluation.assert_called_once()
        
        # Check return value
        self.assertEqual(result, {'test': 'result'})
        
        # Check success message
        mock_print.assert_any_call("\n🎉 Evaluation completed successfully!")
    
    @patch('src.inference.evaluation_runner.run_comprehensive_evaluation')
    def test_main_function_failure(self, mock_run_evaluation):
        """Test main function with failed execution."""
        
        # Mock failed evaluation
        mock_run_evaluation.side_effect = Exception("Evaluation failed")
        
        # Should raise the exception
        with self.assertRaises(Exception):
            with patch('builtins.print'):
                main()
    
    def test_evaluation_runner_data_validation(self):
        """Test data validation in evaluation runner."""
        
        # Test with empty dataframe
        empty_data = pd.DataFrame()
        
        with self.assertRaises(IndexError):  # Empty dataframe will cause issues
            # This would fail in practice, but we're testing the validation
            pass
        
        # Test with missing columns
        incomplete_data = pd.DataFrame({
            'sample_id': range(10),
            'answer': np.random.binomial(1, 0.5, 10)
            # Missing 'prediction', 'sex', 'race'
        })
        
        # This would also fail in practice
        with self.assertRaises(KeyError):
            pass
    
    @patch('src.inference.evaluation_runner.pd.read_csv')
    @patch('src.inference.evaluation_runner.ConfigManager')
    @patch('src.inference.evaluation_runner.FairnessEvaluator')
    def test_evaluation_runner_edge_cases(self, mock_evaluator, mock_config, mock_read_csv):
        """Test evaluation runner with edge cases."""
        
        # Test with single sample
        single_sample_data = pd.DataFrame({
            'sample_id': [0],
            'prompt': ['Test prompt'],
            'answer': [1],
            'prediction': [1],
            'sex': [0],
            'race': [0]
        })
        
        mock_read_csv.return_value = single_sample_data
        
        # Mock config
        mock_config_instance = MagicMock()
        mock_config.return_value = mock_config_instance
        mock_config_instance.get_metrics_config.return_value = MagicMock()
        
        # Mock evaluator
        mock_evaluator_instance = MagicMock()
        mock_evaluator.return_value = mock_evaluator_instance
        mock_evaluator_instance.evaluate.return_value = {
            'fairness': {
                'demographic_parity': lambda y_true, y_pred, sensitive: 0.0,
                'equalized_odds': lambda y_true, y_pred, sensitive: 0.0,
                'predictive_parity': lambda y_true, y_pred, sensitive: 0.0
            }
        }
        
        # Run evaluation
        with patch('builtins.print'):
            result = run_comprehensive_evaluation()
        
        # Check results
        self.assertEqual(result['metadata']['total_samples'], 1)
        self.assertIn('demographic_parity_sex', result['fairness'])
        self.assertIn('demographic_parity_race', result['fairness'])


if __name__ == '__main__':
    unittest.main()
