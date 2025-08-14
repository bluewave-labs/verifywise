import unittest
import numpy as np
from src.eval_engine.fairness_compass_engine import FairnessCompassEngine


class TestFairnessCompassEngine(unittest.TestCase):
    """Test cases for the FairnessCompassEngine class."""
    
    def setUp(self):
        """Set up test data."""
        # Create sample data for testing
        np.random.seed(42)
        self.n_samples = 1000
        
        # Create synthetic data with bias
        self.sensitive_attr = np.random.choice([0, 1], size=self.n_samples, p=[0.7, 0.3])
        self.y_true = np.random.choice([0, 1], size=self.n_samples, p=[0.6, 0.4])
        
        # Create biased predictions (group 1 has higher positive rate)
        self.y_pred = np.zeros(self.n_samples)
        for i in range(self.n_samples):
            if self.sensitive_attr[i] == 0:
                self.y_pred[i] = np.random.choice([0, 1], p=[0.8, 0.2])
            else:
                self.y_pred[i] = np.random.choice([0, 1], p=[0.6, 0.4])
        
        # Create continuous scores
        self.y_scores = np.random.random(self.n_samples)
        self.y_scores[self.sensitive_attr == 1] += 0.2  # Bias towards higher scores for group 1
    
    def test_policy_enforced_equal_number(self):
        """Test case 1: Policy enforced with equal number representation."""
        engine = FairnessCompassEngine(
            enforce_policy=True,
            representation_type="equal_number"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["Equal Selection Parity"]
        
        self.assertEqual(recommendations, expected)
        
        # Test explain method
        explanation = engine.explain()
        self.assertIn("Equal Selection Parity", explanation["recommendations"])
        self.assertTrue(explanation["configuration"]["enforce_policy"])
        self.assertEqual(explanation["configuration"]["representation_type"], "equal_number")
    
    def test_policy_enforced_proportional(self):
        """Test case 1b: Policy enforced with proportional representation."""
        engine = FairnessCompassEngine(
            enforce_policy=True,
            representation_type="proportional"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["Demographic Parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_ground_truth_unavailable_with_explaining_variables(self):
        """Test case 2: Ground truth unavailable with explaining variables present."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=False,
            explaining_variables_present=True
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["Conditional Statistical Parity"]
        
        self.assertEqual(recommendations, expected)
        
        # Test explain method
        explanation = engine.explain()
        self.assertIn("Conditional Statistical Parity", explanation["recommendations"])
        self.assertFalse(explanation["configuration"]["ground_truth_available"])
        self.assertTrue(explanation["configuration"]["explaining_variables_present"])
    
    def test_ground_truth_unavailable_without_explaining_variables(self):
        """Test case 2b: Ground truth unavailable without explaining variables."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=False,
            explaining_variables_present=False
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["Demographic Parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_label_bias_with_explaining_variables(self):
        """Test case 2c: Label bias with explaining variables present."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            label_bias=True,
            explaining_variables_present=True
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["Conditional Statistical Parity"]
        
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
        expected = ["Balance for Negative Class"]
        
        self.assertEqual(recommendations, expected)
        
        # Test explain method
        explanation = engine.explain()
        self.assertIn("Balance for Negative Class", explanation["recommendations"])
        self.assertEqual(explanation["configuration"]["output_type"], "score")
        self.assertEqual(explanation["configuration"]["error_sensitivity"], "false_positive")
    
    def test_score_based_output_false_negative(self):
        """Test case 3b: Score-based output with false negative sensitivity."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="score",
            error_sensitivity="false_negative"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["Balance for Positive Class"]
        
        self.assertEqual(recommendations, expected)
    
    def test_score_based_output_no_error_sensitivity(self):
        """Test case 3c: Score-based output without specific error sensitivity."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="score"
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["Balance for Positive Class", "Balance for Negative Class"]
        
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
        expected = ["Conditional Use Accuracy Equality", "Predictive Parity"]
        
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
        expected = ["Equalized Opportunity"]
        
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
        expected = ["Predictive Equality"]
        
        self.assertEqual(recommendations, expected)
    
    def test_base_rates_equal(self):
        """Test case: Equal base rates across groups."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            base_rates_equal=True
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["Demographic Parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_default_fallback(self):
        """Test case: Default fallback when no specific conditions are met."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            base_rates_equal=False
        )
        
        recommendations = engine.get_metric_recommendations()
        expected = ["Demographic Parity"]
        
        self.assertEqual(recommendations, expected)
    
    def test_explain_method_comprehensive(self):
        """Test that the explain method returns comprehensive information."""
        engine = FairnessCompassEngine(
            enforce_policy=True,
            representation_type="equal_number",
            ground_truth_available=True,
            output_type="label",
            fairness_focus="precision"
        )
        
        explanation = engine.explain()
        
        # Check that all configuration values are present
        config = explanation["configuration"]
        self.assertIn("enforce_policy", config)
        self.assertIn("representation_type", config)
        self.assertIn("ground_truth_available", config)
        self.assertIn("output_type", config)
        self.assertIn("fairness_focus", config)
        
        # Check that recommendations are present
        self.assertIn("recommendations", explanation)
        self.assertIsInstance(explanation["recommendations"], list)
        
        # Check that reasoning is present
        self.assertIn("reasoning", explanation)
        self.assertIsInstance(explanation["reasoning"], str)
    
    def test_calculate_demographic_parity(self):
        """Test demographic parity calculation using Fairlearn."""
        engine = FairnessCompassEngine(enforce_policy=False)
        
        # Test with biased data
        result = engine.calculate_demographic_parity(self.y_pred, self.sensitive_attr)
        
        # Should detect bias (group 1 has higher positive rate)
        self.assertGreater(result, 0.0)
        self.assertLessEqual(result, 1.0)
        
        # Test with equal predictions
        equal_pred = np.ones(self.n_samples)
        result_equal = engine.calculate_demographic_parity(equal_pred, self.sensitive_attr)
        self.assertEqual(result_equal, 0.0)
    
    def test_calculate_equalized_odds(self):
        """Test equalized odds calculation using Fairlearn."""
        engine = FairnessCompassEngine(enforce_policy=False)
        
        result = engine.calculate_equalized_odds(self.y_true, self.y_pred, self.sensitive_attr)
        
        self.assertIn("tpr_diff", result)
        self.assertIn("fpr_diff", result)
        self.assertGreaterEqual(result["tpr_diff"], 0.0)
        self.assertGreaterEqual(result["fpr_diff"], 0.0)
        self.assertLessEqual(result["tpr_diff"], 1.0)
        self.assertLessEqual(result["fpr_diff"], 1.0)
    
    def test_calculate_balance_metrics(self):
        """Test balance metrics calculation using Fairlearn."""
        engine = FairnessCompassEngine(enforce_policy=False)
        
        # Test balance for positive class
        result_positive = engine.calculate_balance_for_positive_class(self.y_scores, self.sensitive_attr)
        self.assertGreaterEqual(result_positive, 0.0)
        
        # Test balance for negative class
        result_negative = engine.calculate_balance_for_negative_class(self.y_scores, self.sensitive_attr)
        self.assertGreaterEqual(result_negative, 0.0)
    
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
        
        self.assertIn("Demographic Parity", results)
        self.assertIsInstance(results["Demographic Parity"], float)
        self.assertGreaterEqual(results["Demographic Parity"], 0.0)
    
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
        
        self.assertIn("Balance for Negative Class", results)
        self.assertIsInstance(results["Balance for Negative Class"], float)
    
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
        
        self.assertIn("Conditional Use Accuracy Equality", results)
        self.assertIn("Predictive Parity", results)
        self.assertIsInstance(results["Conditional Use Accuracy Equality"], float)
        self.assertIsInstance(results["Predictive Parity"], float)
    
    def test_calculate_fairness_metrics_missing_data(self):
        """Test calculate_fairness_metrics with missing required data."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="label",
            fairness_focus="precision"
        )
        
        # Test without y_true (should return NaN for metrics that require it)
        results = engine.calculate_fairness_metrics(
            y_true=None,
            y_pred=self.y_pred,
            sensitive_attr=self.sensitive_attr
        )
        
        self.assertIn("Conditional Use Accuracy Equality", results)
        self.assertTrue(np.isnan(results["Conditional Use Accuracy Equality"]))
    
    def test_calculate_fairness_metrics_missing_scores(self):
        """Test calculate_fairness_metrics with missing scores for score-based metrics."""
        engine = FairnessCompassEngine(
            enforce_policy=False,
            ground_truth_available=True,
            output_type="score"
        )
        
        # Test without y_scores (should return NaN for balance metrics)
        results = engine.calculate_fairness_metrics(
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_attr=self.sensitive_attr,
            y_scores=None
        )
        
        self.assertIn("Balance for Positive Class", results)
        self.assertTrue(np.isnan(results["Balance for Positive Class"]))
    
    def test_calculate_conditional_statistical_parity(self):
        """Test conditional statistical parity calculation using Fairlearn."""
        engine = FairnessCompassEngine(enforce_policy=False)
        
        # Create conditioning variables
        conditioning_vars = np.random.choice([0, 1, 2], size=self.n_samples)
        
        result = engine.calculate_conditional_statistical_parity(
            self.y_pred, 
            self.sensitive_attr, 
            conditioning_vars
        )
        
        self.assertGreaterEqual(result, 0.0)
        self.assertLessEqual(result, 1.0)
        
        # Test without conditioning variables (should fall back to demographic parity)
        result_no_condition = engine.calculate_conditional_statistical_parity(
            self.y_pred, 
            self.sensitive_attr, 
            None
        )
        
        expected_demographic = engine.calculate_demographic_parity(self.y_pred, self.sensitive_attr)
        self.assertEqual(result_no_condition, expected_demographic)
    
    def test_calculate_comprehensive_fairness_metrics(self):
        """Test comprehensive fairness metrics calculation using Fairlearn."""
        engine = FairnessCompassEngine(enforce_policy=False)
        
        results = engine.calculate_comprehensive_fairness_metrics(
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_attr=self.sensitive_attr
        )
        
        # Check that comprehensive metrics are calculated
        self.assertIsInstance(results, dict)
        self.assertGreater(len(results), 0)
        
        # Check that all values are numeric
        for metric_name, value in results.items():
            self.assertIsInstance(value, (int, float))
            self.assertGreaterEqual(value, 0.0)


if __name__ == "__main__":
    unittest.main() 