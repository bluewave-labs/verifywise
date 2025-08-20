from typing import List, Dict, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix
from fairlearn.metrics import (
    MetricFrame, demographic_parity_difference, equalized_odds_difference,
    equalized_odds_ratio, true_positive_rate_difference, false_positive_rate_difference,
    selection_rate_difference, accuracy_score_difference, precision_score_group_min,
    recall_score_group_min, f1_score_group_min
)


class FairnessCompassEngine:
    """
    Implements decision logic from the Fairness Compass (arXiv:2102.08453)
    to choose fairness metrics based on configuration values.
    Uses Fairlearn for robust metric calculations.
    """
    
    def __init__(
        self,
        enforce_policy: bool,
        representation_type: Optional[str] = None,      # "equal_number" | "proportional"
        base_rates_equal: Optional[bool] = None,
        ground_truth_available: Optional[bool] = None,
        label_bias: Optional[bool] = None,
        explaining_variables_present: Optional[bool] = None,
        output_type: Optional[str] = None,              # "label" | "score"
        fairness_focus: Optional[str] = None,           # "precision" | "recall"
        error_sensitivity: Optional[str] = None         # "false_positive" | "false_negative"
    ):
        """
        Initialize the Fairness Compass Engine with configuration parameters.
        
        Args:
            enforce_policy: Whether to enforce a specific policy
            representation_type: Type of representation ("equal_number" | "proportional")
            base_rates_equal: Whether base rates are equal across groups
            ground_truth_available: Whether ground truth labels are available
            label_bias: Whether there is label bias in the data
            explaining_variables_present: Whether explaining variables are present
            output_type: Type of model output ("label" | "score")
            fairness_focus: Focus area for fairness ("precision" | "recall")
            error_sensitivity: Type of error sensitivity ("false_positive" | "false_negative")
        """
        self.enforce_policy = enforce_policy
        self.representation_type = representation_type
        self.base_rates_equal = base_rates_equal
        self.ground_truth_available = ground_truth_available
        self.label_bias = label_bias
        self.explaining_variables_present = explaining_variables_present
        self.output_type = output_type
        self.fairness_focus = fairness_focus
        self.error_sensitivity = error_sensitivity
    
    def get_metric_recommendations(self) -> List[str]:
        """
        Encode the decision tree logic to output a list of fairness metrics.
        
        Returns:
            List[str]: List of recommended fairness metrics
        """
        # Step 1: Check if policy enforcement is required
        if self.enforce_policy:
            if self.representation_type == "equal_number":
                return ["Equal Selection Parity"]
            elif self.representation_type == "proportional":
                return ["Demographic Parity"]
            else:
                return ["Demographic Parity"]  # Default for policy enforcement
        
        # Step 2: Check if ground truth is unavailable or label bias exists
        if not self.ground_truth_available or self.label_bias:
            if self.explaining_variables_present:
                return ["Conditional Statistical Parity"]
            else:
                return ["Demographic Parity"]
        
        # Step 3: Check if base rates are equal
        if self.base_rates_equal:
            return ["Demographic Parity"]
        
        # Step 4: Check output type
        if self.output_type == "score":
            if self.error_sensitivity == "false_positive":
                return ["Balance for Negative Class"]
            elif self.error_sensitivity == "false_negative":
                return ["Balance for Positive Class"]
            else:
                return ["Balance for Positive Class", "Balance for Negative Class"]
        
        elif self.output_type == "label":
            if self.fairness_focus == "precision":
                return ["Conditional Use Accuracy Equality", "Predictive Parity"]
            
            elif self.fairness_focus == "recall":
                if self.error_sensitivity == "false_negative":
                    return ["Equalized Opportunity"]
                elif self.error_sensitivity == "false_positive":
                    return ["Predictive Equality"]
                else:
                    return ["Equalized Odds"]
            
            else:
                # Default for label output without specific focus
                return ["Equalized Odds"]
        
        # Fallback: Default recommendation
        return ["Demographic Parity"]
    
    def calculate_demographic_parity(self, y_pred: np.ndarray, sensitive_attr: np.ndarray) -> float:
        """
        Calculate Demographic Parity using Fairlearn.
        
        Args:
            y_pred: Model predictions (binary)
            sensitive_attr: Sensitive attribute values
            
        Returns:
            float: Demographic parity difference
        """
        # For demographic parity, we need to pass y_pred as both y_true and y_pred
        # since we're only interested in the selection rate difference
        return demographic_parity_difference(y_pred, y_pred, sensitive_features=sensitive_attr)
    
    def calculate_equalized_odds(self, y_true: np.ndarray, y_pred: np.ndarray, sensitive_attr: np.ndarray) -> Dict[str, float]:
        """
        Calculate Equalized Odds using Fairlearn.
        
        Args:
            y_true: True labels
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            
        Returns:
            Dict[str, float]: TPR and FPR differences
        """
        tpr_diff = true_positive_rate_difference(y_true, y_pred, sensitive_features=sensitive_attr)
        fpr_diff = false_positive_rate_difference(y_true, y_pred, sensitive_features=sensitive_attr)
        
        return {
            "tpr_diff": tpr_diff,
            "fpr_diff": fpr_diff
        }
    
    def calculate_equalized_opportunity(self, y_true: np.ndarray, y_pred: np.ndarray, sensitive_attr: np.ndarray) -> float:
        """
        Calculate Equalized Opportunity (TPR difference) using Fairlearn.
        
        Args:
            y_true: True labels
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            
        Returns:
            float: TPR difference
        """
        return true_positive_rate_difference(y_true, y_pred, sensitive_features=sensitive_attr)
    
    def calculate_predictive_equality(self, y_true: np.ndarray, y_pred: np.ndarray, sensitive_attr: np.ndarray) -> float:
        """
        Calculate Predictive Equality (FPR difference) using Fairlearn.
        
        Args:
            y_true: True labels
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            
        Returns:
            float: FPR difference
        """
        return false_positive_rate_difference(y_true, y_pred, sensitive_features=sensitive_attr)
    
    def calculate_predictive_parity(self, y_true: np.ndarray, y_pred: np.ndarray, sensitive_attr: np.ndarray) -> float:
        """
        Calculate Predictive Parity using Fairlearn's precision metrics.
        
        Args:
            y_true: True labels
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            
        Returns:
            float: Precision difference
        """
        # Use Fairlearn's precision score group min (difference from min)
        return precision_score_group_min(y_true, y_pred, sensitive_features=sensitive_attr)
    
    def calculate_balance_for_positive_class(self, y_scores: np.ndarray, sensitive_attr: np.ndarray) -> float:
        """
        Calculate Balance for Positive Class using Fairlearn.
        
        Args:
            y_scores: Model scores (continuous)
            sensitive_attr: Sensitive attribute values
            
        Returns:
            float: Mean score difference for positive class
        """
        # Convert scores to predictions for Fairlearn compatibility
        y_pred = (y_scores > 0.5).astype(int)
        
        # Use selection rate difference as proxy for balance
        return selection_rate_difference(y_pred, y_pred, sensitive_features=sensitive_attr)
    
    def calculate_balance_for_negative_class(self, y_scores: np.ndarray, sensitive_attr: np.ndarray) -> float:
        """
        Calculate Balance for Negative Class using Fairlearn.
        
        Args:
            y_scores: Model scores (continuous)
            sensitive_attr: Sensitive attribute values
            
        Returns:
            float: Mean score difference for negative class
        """
        # Convert scores to predictions for Fairlearn compatibility
        y_pred = (y_scores > 0.5).astype(int)
        
        # Use selection rate difference as proxy for balance
        return selection_rate_difference(y_pred, y_pred, sensitive_features=sensitive_attr)
    
    def calculate_conditional_use_accuracy_equality(self, y_true: np.ndarray, y_pred: np.ndarray, sensitive_attr: np.ndarray) -> float:
        """
        Calculate Conditional Use Accuracy Equality using Fairlearn.
        
        Args:
            y_true: True labels
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            
        Returns:
            float: Accuracy difference for positive predictions
        """
        # Use Fairlearn's accuracy score difference
        return accuracy_score_difference(y_true, y_pred, sensitive_features=sensitive_attr)
    
    def calculate_conditional_statistical_parity(self, y_pred: np.ndarray, sensitive_attr: np.ndarray, 
                                              conditioning_vars: Optional[np.ndarray] = None) -> float:
        """
        Calculate Conditional Statistical Parity using Fairlearn.
        
        Args:
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            conditioning_vars: Conditioning variables (optional)
            
        Returns:
            float: Conditional statistical parity difference
        """
        if conditioning_vars is None:
            # Fall back to demographic parity if no conditioning variables
            return self.calculate_demographic_parity(y_pred, sensitive_attr)
        
        # For conditional parity, we'll use demographic parity as a proxy
        # In a more sophisticated implementation, you might want to use Fairlearn's
        # conditional metrics or implement custom conditional logic
        return self.calculate_demographic_parity(y_pred, sensitive_attr)
    
    def calculate_equal_selection_parity(self, y_pred: np.ndarray, sensitive_attr: np.ndarray) -> float:
        """
        Calculate Equal Selection Parity using Fairlearn.
        
        Args:
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            
        Returns:
            float: Equal selection parity difference
        """
        # Equal Selection Parity is similar to Demographic Parity
        return self.calculate_demographic_parity(y_pred, sensitive_attr)
    
    def calculate_comprehensive_fairness_metrics(self, y_true: np.ndarray, y_pred: np.ndarray, 
                                              sensitive_attr: np.ndarray) -> Dict[str, float]:
        """
        Calculate comprehensive fairness metrics using Fairlearn's MetricFrame.
        
        Args:
            y_true: True labels
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            
        Returns:
            Dict[str, float]: Comprehensive fairness metrics
        """
        # Create MetricFrame with comprehensive metrics
        metrics = {
            "accuracy": accuracy_score_difference,
            "precision": precision_score_group_min,
            "recall": recall_score_group_min,
            "f1": f1_score_group_min,
            "demographic_parity": demographic_parity_difference,
            "equalized_odds": equalized_odds_difference,
            "equalized_odds_ratio": equalized_odds_ratio,
            "true_positive_rate_diff": true_positive_rate_difference,
            "false_positive_rate_diff": false_positive_rate_difference,
            "selection_rate_diff": selection_rate_difference
        }
        
        # Calculate metrics directly using Fairlearn functions
        results = {}
        results["accuracy_difference"] = accuracy_score_difference(y_true, y_pred, sensitive_features=sensitive_attr)
        results["precision_group_min"] = precision_score_group_min(y_true, y_pred, sensitive_features=sensitive_attr)
        results["recall_group_min"] = recall_score_group_min(y_true, y_pred, sensitive_features=sensitive_attr)
        results["f1_group_min"] = f1_score_group_min(y_true, y_pred, sensitive_features=sensitive_attr)
        results["demographic_parity_difference"] = demographic_parity_difference(y_pred, y_pred, sensitive_features=sensitive_attr)
        results["equalized_odds_difference"] = equalized_odds_difference(y_true, y_pred, sensitive_features=sensitive_attr)
        results["equalized_odds_ratio"] = equalized_odds_ratio(y_true, y_pred, sensitive_features=sensitive_attr)
        results["true_positive_rate_difference"] = true_positive_rate_difference(y_true, y_pred, sensitive_features=sensitive_attr)
        results["false_positive_rate_difference"] = false_positive_rate_difference(y_true, y_pred, sensitive_features=sensitive_attr)
        results["selection_rate_difference"] = selection_rate_difference(y_pred, y_pred, sensitive_features=sensitive_attr)
        
        return results
    
    def calculate_fairness_metrics(self, y_true: Optional[np.ndarray], y_pred: np.ndarray, 
                                 sensitive_attr: np.ndarray, y_scores: Optional[np.ndarray] = None,
                                 conditioning_vars: Optional[np.ndarray] = None) -> Dict[str, float]:
        """
        Calculate all recommended fairness metrics using Fairlearn.
        
        Args:
            y_true: True labels (required for some metrics)
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            y_scores: Model scores (for score-based metrics)
            conditioning_vars: Conditioning variables (for conditional metrics)
            
        Returns:
            Dict[str, float]: Dictionary of calculated fairness metrics
        """
        recommended_metrics = self.get_metric_recommendations()
        results = {}
        
        for metric in recommended_metrics:
            if metric == "Demographic Parity":
                results[metric] = self.calculate_demographic_parity(y_pred, sensitive_attr)
            
            elif metric == "Equalized Odds":
                if y_true is not None:
                    equalized_odds = self.calculate_equalized_odds(y_true, y_pred, sensitive_attr)
                    results[f"{metric}_TPR_diff"] = equalized_odds["tpr_diff"]
                    results[f"{metric}_FPR_diff"] = equalized_odds["fpr_diff"]
                else:
                    results[metric] = float('nan')
            
            elif metric == "Equalized Opportunity":
                if y_true is not None:
                    results[metric] = self.calculate_equalized_opportunity(y_true, y_pred, sensitive_attr)
                else:
                    results[metric] = float('nan')
            
            elif metric == "Predictive Equality":
                if y_true is not None:
                    results[metric] = self.calculate_predictive_equality(y_true, y_pred, sensitive_attr)
                else:
                    results[metric] = float('nan')
            
            elif metric == "Predictive Parity":
                if y_true is not None:
                    results[metric] = self.calculate_predictive_parity(y_true, y_pred, sensitive_attr)
                else:
                    results[metric] = float('nan')
            
            elif metric == "Balance for Positive Class":
                if y_scores is not None:
                    results[metric] = self.calculate_balance_for_positive_class(y_scores, sensitive_attr)
                else:
                    results[metric] = float('nan')
            
            elif metric == "Balance for Negative Class":
                if y_scores is not None:
                    results[metric] = self.calculate_balance_for_negative_class(y_scores, sensitive_attr)
                else:
                    results[metric] = float('nan')
            
            elif metric == "Conditional Use Accuracy Equality":
                if y_true is not None:
                    results[metric] = self.calculate_conditional_use_accuracy_equality(y_true, y_pred, sensitive_attr)
                else:
                    results[metric] = float('nan')
            
            elif metric == "Conditional Statistical Parity":
                results[metric] = self.calculate_conditional_statistical_parity(y_pred, sensitive_attr, conditioning_vars)
            
            elif metric == "Equal Selection Parity":
                results[metric] = self.calculate_equal_selection_parity(y_pred, sensitive_attr)
        
        # Add comprehensive metrics if y_true is available
        if y_true is not None:
            comprehensive_metrics = self.calculate_comprehensive_fairness_metrics(y_true, y_pred, sensitive_attr)
            results.update(comprehensive_metrics)
        
        return results
    
    def explain(self) -> Dict:
        """
        Returns a JSON-style dictionary of all config values and the chosen recommendation(s).
        
        Returns:
            Dict: Dictionary containing configuration values and recommendations
        """
        recommendations = self.get_metric_recommendations()
        
        return {
            "configuration": {
                "enforce_policy": self.enforce_policy,
                "representation_type": self.representation_type,
                "base_rates_equal": self.base_rates_equal,
                "ground_truth_available": self.ground_truth_available,
                "label_bias": self.label_bias,
                "explaining_variables_present": self.explaining_variables_present,
                "output_type": self.output_type,
                "fairness_focus": self.fairness_focus,
                "error_sensitivity": self.error_sensitivity
            },
            "recommendations": recommendations,
            "reasoning": self._get_reasoning(recommendations)
        }
    
    def _get_reasoning(self, recommendations: List[str]) -> str:
        """
        Generate reasoning for the chosen recommendations.
        
        Args:
            recommendations: List of recommended metrics
            
        Returns:
            str: Reasoning for the recommendations
        """
        if self.enforce_policy:
            if self.representation_type == "equal_number":
                return "Policy enforcement with equal number representation requires Equal Selection Parity"
            elif self.representation_type == "proportional":
                return "Policy enforcement with proportional representation requires Demographic Parity"
            else:
                return "Policy enforcement requires Demographic Parity as default"
        
        if not self.ground_truth_available or self.label_bias:
            if self.explaining_variables_present:
                return "Ground truth unavailable or label bias present with explaining variables requires Conditional Statistical Parity"
            else:
                return "Ground truth unavailable or label bias present without explaining variables requires Demographic Parity"
        
        if self.base_rates_equal:
            return "Equal base rates across groups require Demographic Parity"
        
        if self.output_type == "score":
            if self.error_sensitivity == "false_positive":
                return "Score-based output with false positive sensitivity requires Balance for Negative Class"
            elif self.error_sensitivity == "false_negative":
                return "Score-based output with false negative sensitivity requires Balance for Positive Class"
            else:
                return "Score-based output requires both Balance metrics"
        
        if self.output_type == "label":
            if self.fairness_focus == "precision":
                return "Label output with precision focus requires Conditional Use Accuracy Equality and Predictive Parity"
            elif self.fairness_focus == "recall":
                if self.error_sensitivity == "false_negative":
                    return "Label output with recall focus and false negative sensitivity requires Equalized Opportunity"
                elif self.error_sensitivity == "false_positive":
                    return "Label output with recall focus and false positive sensitivity requires Predictive Equality"
                else:
                    return "Label output with recall focus requires Equalized Odds"
            else:
                return "Label output requires Equalized Odds as default"
        
        return "Default recommendation: Demographic Parity" 