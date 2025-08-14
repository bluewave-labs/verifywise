import unittest
import numpy as np
import pandas as pd
from src.tests.eval_engine.evaluation_module import FairnessEvaluator


class TestFairnessEvaluator(unittest.TestCase):
    """Test cases for the FairnessEvaluator class."""
    
    def setUp(self):
        """Set up test data."""
        # Create synthetic data for testing
        np.random.seed(42)
        self.n_samples = 1000
        
        # Create synthetic features
        self.X = np.random.randn(self.n_samples, 5)
        
        # Create synthetic labels (binary classification)
        self.y_true = np.random.binomial(1, 0.3, self.n_samples)
        self.y_pred = np.random.binomial(1, 0.35, self.n_samples)
        
        # Create synthetic sensitive attributes
        self.sensitive_features = np.random.choice(['A', 'B'], self.n_samples)
        
        # Create synthetic scores
        self.y_scores = np.random.random(self.n_samples)
        
        # Create synthetic LLM data
        self.prompts = [
            "The person is a doctor.",
            "The person is a nurse.",
            "The person is an engineer.",
            "The person is a teacher."
        ] * 250  # 1000 total prompts
        
        self.responses = [
            "This person is highly qualified.",
            "This person is caring and dedicated.",
            "This person is technical and analytical.",
            "This person is patient and knowledgeable."
        ] * 250  # 1000 total responses
        
        self.sensitive_attributes = [
            {"gender": "male", "race": "white"},
            {"gender": "female", "race": "black"},
            {"gender": "male", "race": "asian"},
            {"gender": "female", "race": "hispanic"}
        ] * 250  # 1000 total attributes
    
    def test_evaluate_tabular_model_basic(self):
        """Test basic tabular model evaluation."""
        evaluator = FairnessEvaluator(task_type="binary_classification")
        
        results = evaluator.evaluate_tabular_model(
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_features=self.sensitive_features
        )
        
        # Check that results contain expected keys
        expected_keys = [
            "accuracy_difference", "precision_difference", "recall_difference",
            "f1_difference", "demographic_parity", "equalized_odds"
        ]
        
        for key in expected_keys:
            self.assertIn(key, results)
            self.assertIsInstance(results[key], (int, float))
    
    def test_evaluate_tabular_model_with_scores(self):
        """Test tabular model evaluation with prediction scores."""
        evaluator = FairnessEvaluator(task_type="regression")
        
        results = evaluator.evaluate_tabular_model(
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_features=self.sensitive_features,
            y_scores=self.y_scores
        )
        
        # Check that score-based metrics are included
        expected_keys = [
            "balance_for_positive_class", "balance_for_negative_class"
        ]
        
        for key in expected_keys:
            self.assertIn(key, results)
            self.assertIsInstance(results[key], (int, float))
    
    def test_evaluate_tabular_model_custom_metrics(self):
        """Test tabular model evaluation with custom metrics."""
        evaluator = FairnessEvaluator(task_type="binary_classification")
        
        custom_metrics = ["demographic_parity", "equalized_odds"]
        
        results = evaluator.evaluate_tabular_model(
            y_true=self.y_true,
            y_pred=self.y_pred,
            sensitive_features=self.sensitive_features,
            metrics=custom_metrics
        )
        
        # Check that only requested metrics are included
        for key in results.keys():
            if key not in ["group_metrics", "overall_metrics"]:
                self.assertIn(key, custom_metrics)
    
    def test_evaluate_llm_responses_basic(self):
        """Test basic LLM response evaluation."""
        evaluator = FairnessEvaluator(task_type="generation")
        
        results = evaluator.evaluate_llm_responses(
            prompts=self.prompts[:10],  # Use subset for testing
            responses=self.responses[:10],
            sensitive_attributes=self.sensitive_attributes[:10]
        )
        
        # Check that results contain expected keys
        expected_keys = [
            "sentiment_gap", "toxicity_gap", "stereotype_gap",
            "exposure_disparity", "representation_disparity"
        ]
        
        for key in expected_keys:
            self.assertIn(key, results)
            self.assertIsInstance(results[key], (int, float))
    
    def test_evaluate_llm_responses_custom_metrics(self):
        """Test LLM response evaluation with custom metrics."""
        evaluator = FairnessEvaluator(task_type="generation")
        
        custom_metrics = ["sentiment_gap", "toxicity_gap"]
        
        results = evaluator.evaluate_llm_responses(
            prompts=self.prompts[:10],
            responses=self.responses[:10],
            sensitive_attributes=self.sensitive_attributes[:10],
            metrics=custom_metrics
        )
        
        # Check that only requested metrics are included
        for key in results.keys():
            if key not in ["group_metrics", "response_characteristics"]:
                self.assertIn(key, custom_metrics)
    
    def test_calculate_response_metrics(self):
        """Test response metrics calculation."""
        evaluator = FairnessEvaluator(task_type="generation")
        
        test_responses = [
            "This is a positive response.",
            "This is a negative response with hate speech.",
            "This is a neutral response."
        ]
        
        metrics = evaluator._calculate_response_metrics(test_responses)
        
        self.assertEqual(len(metrics), 3)
        
        for metric in metrics:
            self.assertIn("sentiment", metric)
            self.assertIn("toxicity", metric)
            self.assertIn("length", metric)
            self.assertIn("complexity", metric)
            
            # Check that values are reasonable
            self.assertGreaterEqual(metric["sentiment"], -1.0)
            self.assertLessEqual(metric["sentiment"], 1.0)
            self.assertGreaterEqual(metric["toxicity"], 0.0)
            self.assertLessEqual(metric["toxicity"], 1.0)
            self.assertGreaterEqual(metric["length"], 0)
            self.assertGreaterEqual(metric["complexity"], 0.0)
            self.assertLessEqual(metric["complexity"], 1.0)
    
    def test_group_by_sensitive_attributes(self):
        """Test grouping by sensitive attributes."""
        evaluator = FairnessEvaluator(task_type="generation")
        
        response_metrics = [
            {"sentiment": 0.5, "toxicity": 0.1, "length": 10, "complexity": 0.8},
            {"sentiment": -0.2, "toxicity": 0.3, "length": 15, "complexity": 0.6},
            {"sentiment": 0.8, "toxicity": 0.0, "length": 12, "complexity": 0.9}
        ]
        
        sensitive_attributes = [
            {"gender": "male", "race": "white"},
            {"gender": "female", "race": "black"},
            {"gender": "male", "race": "asian"}
        ]
        
        groups = evaluator._group_by_sensitive_attributes(response_metrics, sensitive_attributes)
        
        self.assertEqual(len(groups), 3)
        
        # Check that each group has the expected structure
        for group_key, metrics_list in groups.items():
            self.assertIsInstance(metrics_list, list)
            self.assertEqual(len(metrics_list), 1)
            
            metric = metrics_list[0]
            self.assertIn("sentiment", metric)
            self.assertIn("toxicity", metric)
            self.assertIn("length", metric)
            self.assertIn("complexity", metric)
    
    def test_calculate_sentiment_gap(self):
        """Test sentiment gap calculation."""
        evaluator = FairnessEvaluator(task_type="generation")
        
        groups = {
            "group_A": [{"sentiment": 0.8}, {"sentiment": 0.6}],
            "group_B": [{"sentiment": 0.2}, {"sentiment": 0.4}],
            "group_C": [{"sentiment": 0.5}]
        }
        
        gap = evaluator._calculate_sentiment_gap(groups)
        
        # Expected gap: max(0.7, 0.3, 0.5) - min(0.7, 0.3, 0.5) = 0.7 - 0.3 = 0.4
        expected_gap = 0.4
        self.assertAlmostEqual(gap, expected_gap, places=5)
    
    def test_calculate_toxicity_gap(self):
        """Test toxicity gap calculation."""
        evaluator = FairnessEvaluator(task_type="generation")
        
        groups = {
            "group_A": [{"toxicity": 0.1}, {"toxicity": 0.2}],
            "group_B": [{"toxicity": 0.8}, {"toxicity": 0.9}],
            "group_C": [{"toxicity": 0.5}]
        }
        
        gap = evaluator._calculate_toxicity_gap(groups)
        
        # Expected gap: max(0.15, 0.85, 0.5) - min(0.15, 0.85, 0.5) = 0.85 - 0.15 = 0.7
        expected_gap = 0.7
        self.assertAlmostEqual(gap, expected_gap, places=5)
    
    def test_calculate_balance_for_positive_class(self):
        """Test balance for positive class calculation."""
        evaluator = FairnessEvaluator(task_type="regression")
        
        y_scores = np.array([0.8, 0.9, 0.2, 0.3, 0.7, 0.1])
        sensitive_features = np.array(['A', 'A', 'A', 'B', 'B', 'B'])
        
        balance = evaluator._calculate_balance_for_positive_class(y_scores, sensitive_features)
        
        # Group A average: (0.8 + 0.9 + 0.2) / 3 = 0.633
        # Group B average: (0.3 + 0.7 + 0.1) / 3 = 0.367
        # Expected balance: 0.633 - 0.367 = 0.266
        expected_balance = 0.2666666666666667
        self.assertAlmostEqual(balance, expected_balance, places=10)
    
    def test_generate_fairness_report(self):
        """Test fairness report generation."""
        evaluator = FairnessEvaluator(task_type="binary_classification")
        
        test_results = {
            "demographic_parity": 0.1,
            "equalized_odds": 0.05,
            "accuracy_difference": 0.02,
            "group_metrics": {
                "group_A": {"accuracy": 0.85, "precision": 0.80},
                "group_B": {"accuracy": 0.83, "precision": 0.78}
            }
        }
        
        report = evaluator.generate_fairness_report(test_results)
        
        # Check that report contains expected content
        self.assertIn("FAIRNESS EVALUATION REPORT", report)
        self.assertIn("demographic_parity: 0.1000", report)
        self.assertIn("equalized_odds: 0.0500", report)
        self.assertIn("accuracy_difference: 0.0200", report)
        self.assertIn("GROUP METRICS:", report)
    
    def test_get_available_metrics(self):
        """Test available metrics for different task types."""
        # Test binary classification
        evaluator = FairnessEvaluator(task_type="binary_classification")
        metrics = evaluator._get_available_metrics()
        
        expected_metrics = [
            "accuracy_difference", "precision_difference", "recall_difference",
            "f1_difference", "demographic_parity", "equalized_odds",
            "equalized_opportunity", "predictive_equality", "predictive_parity",
            "conditional_use_accuracy_equality"
        ]
        
        for metric in expected_metrics:
            self.assertIn(metric, metrics)
        
        # Test regression
        evaluator = FairnessEvaluator(task_type="regression")
        metrics = evaluator._get_available_metrics()
        
        expected_metrics = [
            "accuracy_difference", "precision_difference", "recall_difference",
            "f1_difference", "demographic_parity", "equalized_odds",
            "balance_for_positive_class", "balance_for_negative_class"
        ]
        
        for metric in expected_metrics:
            self.assertIn(metric, metrics)
        
        # Test generation
        evaluator = FairnessEvaluator(task_type="generation")
        metrics = evaluator._get_available_metrics()
        
        expected_metrics = [
            "accuracy_difference", "precision_difference", "recall_difference",
            "f1_difference", "demographic_parity", "equalized_odds",
            "toxicity_gap", "sentiment_gap", "stereotype_gap",
            "exposure_disparity", "representation_disparity"
        ]
        
        for metric in expected_metrics:
            self.assertIn(metric, metrics)


if __name__ == "__main__":
    unittest.main() 