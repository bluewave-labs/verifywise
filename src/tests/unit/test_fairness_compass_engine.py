#!/usr/bin/env python3
"""
Comprehensive unit tests for the FairnessCompassEngine.
Tests the decision logic and metric calculation capabilities.
"""

import unittest
import numpy as np
from src.eval_engine.fairness_compass_engine import FairnessCompassEngine


class TestFairnessCompassEngine(unittest.TestCase):
    """Test cases for the FairnessCompassEngine class."""
    
    def setUp(self):
        """Set up test data for fairness compass engine tests."""
        self.n_samples = 1000
        
        # Create synthetic data with known bias patterns
        np.random.seed(42)
        
        # Protected attribute (0 = group 1, 1 = group 2)
        self.sensitive_attr = np.random.choice([0, 1], self.n_samples, p=[0.4, 0.6])
        
        # Ground truth with bias (group 1 has higher positive rate)
        group_1_mask = (self.sensitive_attr == 0)
        group_2_mask = (self.sensitive_attr == 1)
        
        self.y_true = np.zeros(self.n_samples)
        self.y_true[group_1_mask] = np.random.binomial(1, 0.7, np.sum(group_1_mask))
        self.y_true[group_2_mask] = np.random.binomial(1, 0.3, np.sum(group_2_mask))
        
        # Predictions with some noise
        self.y_pred = np.random.binomial(1, 0.5, self.n_samples)
        
        # Scores for score-based metrics
        self.y_scores = np.random.random(self.n_samples)
    
    def test_policy_enforced_equal_number(self):
        """Test case 1: Policy enforced with equal number representation."""
        engine = FairnessCompassEngine(
            enforce_policy=True,
            representation_type="equal_number"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["equal_selection_parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_policy_enforced_proportional(self):
        """Test case 1b: Policy enforced with proportional representation."""
        engine = FairnessCompassEngine(
            enforce_policy=True,
            representation_type="proportional"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["demographic_parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_ground_truth_unavailable_with_explaining_variables(self):
        """Test case 2: Ground truth unavailable with explaining variables present."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=False,
            explaining_variables_present=True
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["conditional_statistical_parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_ground_truth_unavailable_without_explaining_variables(self):
        """Test case 2b: Ground truth unavailable without explaining variables."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=False,
            explaining_variables_present=False
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["demographic_parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_label_bias_with_explaining_variables(self):
        """Test case 2c: Label bias with explaining variables present."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            label_bias=True,
            explaining_variables_present=True
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["conditional_statistical_parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_score_based_output_false_positive(self):
        """Test case 3: Score-based output with false positive sensitivity."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="score",
            error_sensitivity="false_positive"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["balance_negative_class"]
        
        self.assertEqual(recommendations, expected)
    
    def test_score_based_output_false_negative(self):
        """Test case 3b: Score-based output with false negative sensitivity."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="score",
            error_sensitivity="false_negative"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["balance_positive_class"]
        
        self.assertEqual(recommendations, expected)
    
    def test_score_based_output_no_error_sensitivity(self):
        """Test case 3c: Score-based output without specific error sensitivity."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="score"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["balance_positive_class", "balance_negative_class"]
        
        self.assertEqual(recommendations, expected)
    
    def test_label_output_precision_focus(self):
        """Test case: Label output with precision focus."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="label",
            fairness_focus="precision"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["conditional_use_accuracy_equality", "predictive_parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_label_output_recall_focus_false_negative(self):
        """Test case: Label output with recall focus and false negative sensitivity."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="label",
            fairness_focus="recall",
            error_sensitivity="false_negative"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["equalized_opportunities"]
        
        self.assertEqual(recommendations, expected)
    
    def test_label_output_recall_focus_false_positive(self):
        """Test case: Label output with recall focus and false positive sensitivity."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="label",
            fairness_focus="recall",
            error_sensitivity="false_positive"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["predictive_equality"]
        
        self.assertEqual(recommendations, expected)
    
    def test_base_rates_equal(self):
        """Test case: Equal base rates across groups."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            base_rates_equal=True
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["demographic_parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_default_fallback(self):
        """Test case: Default fallback when no specific conditions are met."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="label"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["demographic_parity", "equalized_odds"]
        
        self.assertEqual(recommendations, expected)
    
    def test_explain_method_comprehensive(self):
        """Test that the explain method returns comprehensive information."""
        engine = FairnessCompassEngine(
            enforce_policy=True,
            representation_type="equal_number"
        )
        
        explanation = engine.explain()
        
        self.assertIn("recommendations", explanation)
        self.assertIn("reasoning", explanation)
        self.assertIn("decision_path", explanation)
        self.assertIsInstance(explanation["recommendations"], list)
        self.assertIsInstance(explanation["reasoning"], str)
    
    def test_calculate_metric(self):
        """Test the calculate_metric method for individual metric calculation."""
        engine = FairnessCompassEngine(enforce_policy=False)
        
        result = engine.calculate_metric("demographic_parity", self.y_true, self.y_pred, self.sensitive_attr)
        
        self.assertIsInstance(result, float)
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
    
    def test_calculate_fairness_metrics_demographic_parity(self):
        """Test calculate_fairness_metrics with demographic parity recommendation."""
        engine = FairnessCompassEngine(
            enforce_policy=True,
            representation_type="proportional"
        )
        
        results = engine.calculate_fairness_metrics(
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_attr=self.sensitive_attr
        )
        
        self.assertIn("demographic_parity", results)
        self.assertIsInstance(results["demographic_parity"], float)
        self.assertGreaterEqual(results["demographic_parity"], 0.0)
    
    def test_calculate_fairness_metrics_score_based(self):
        """Test calculate_fairness_metrics with score-based recommendations."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="score",
            error_sensitivity="false_positive"
        )
        
        results = engine.calculate_fairness_metrics(
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_attr=self.sensitive_attr,
            y_scores=self.y_scores
        )
        
        self.assertIn("balance_negative_class", results)
        self.assertIsInstance(results["balance_negative_class"], float)
    
    def test_calculate_fairness_metrics_label_based(self):
        """Test calculate_fairness_metrics with label-based recommendations."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="label",
            fairness_focus="precision"
        )
        
        results = engine.calculate_fairness_metrics(
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_attr=self.sensitive_attr
        )
        
        self.assertIn("conditional_use_accuracy_equality", results)
        self.assertIn("predictive_parity", results)
        self.assertIsInstance(results["conditional_use_accuracy_equality"], float)
        self.assertIsInstance(results["predictive_parity"], float)
    
    def test_calculate_fairness_metrics_missing_data(self):
        """Test calculate_fairness_metrics with missing required data."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=False,
            output_type="label",
            fairness_focus="precision"
        )
        
        results = engine.calculate_fairness_metrics(
            y_true=None,  # Missing ground truth
            y_pred=self.y_pred,
            sensitive_attr=self.sensitive_attr
        )
        
        self.assertIn("conditional_use_accuracy_equality", results)
        self.assertIn("predictive_parity", results)
    
    def test_calculate_fairness_metrics_missing_scores(self):
        """Test calculate_fairness_metrics with missing scores for score-based metrics."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="score",
            error_sensitivity="false_positive"
        )
        
        results = engine.calculate_fairness_metrics(
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_attr=self.sensitive_attr,
            y_scores=None  # Missing scores
        )
        
        self.assertIn("balance_positive_class", results)
        self.assertIn("balance_negative_class", results)
    
    def test_calculate_comprehensive_fairness_metrics(self):
        """Test comprehensive fairness metrics calculation."""
        engine = FairnessCompassEngine(enforce_policy=False)
        
        results = engine.calculate_comprehensive_fairness_metrics(
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_attr=self.sensitive_attr,
            y_scores=self.y_scores
        )
        
        self.assertIsInstance(results, dict)
        self.assertGreater(len(results), 0)
        
        expected_metrics = ["demographic_parity", "equalized_odds", "predictive_parity"]
        for metric in expected_metrics:
            if metric in results:
                self.assertIsInstance(results[metric], (float, int))
                self.assertGreaterEqual(results[metric], 0.0)


if __name__ == "__main__":
    unittest.main()



