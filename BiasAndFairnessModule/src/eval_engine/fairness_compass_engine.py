from typing import List, Dict, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix

# Import our new unified metrics system
from .metric_registry import get_metric, list_metrics
from .metrics import *  # This ensures all metrics are registered


class FairnessCompassEngine:
    """
    Implements decision logic from the Fairness Compass (arXiv:2102.08453)
    to choose fairness metrics based on configuration values.
    Uses our unified metrics system for robust metric calculations.
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
        Returns metric names that match our unified metrics system.
        
        Returns:
            List[str]: List of recommended fairness metrics
        """
        # Step 1: Check if policy enforcement is required
        if self.enforce_policy:
            if self.representation_type == "equal_number":
                return ["equal_selection_parity"]
            elif self.representation_type == "proportional":
                return ["demographic_parity"]
            else:
                return ["demographic_parity"]  # Default for policy enforcement
        
        # Step 2: Check if ground truth is unavailable or label bias exists
        if not self.ground_truth_available or self.label_bias:
            if self.explaining_variables_present:
                return ["conditional_statistical_parity"]
            else:
                return ["demographic_parity"]
        
        # Step 3: Check if base rates are equal
        if self.base_rates_equal:
            return ["demographic_parity"]
        
        # Step 4: Check output type
        if self.output_type == "score":
            if self.error_sensitivity == "false_positive":
                return ["balance_negative_class"]
            elif self.error_sensitivity == "false_negative":
                return ["balance_positive_class"]
            else:
                return ["balance_positive_class", "balance_negative_class"]
        
        elif self.output_type == "label":
            if self.fairness_focus == "precision":
                return ["conditional_use_accuracy_equality", "predictive_parity"]
            
            elif self.fairness_focus == "recall":
                if self.error_sensitivity == "false_negative":
                    return ["equalized_opportunities"]
                elif self.error_sensitivity == "false_positive":
                    return ["predictive_equality"]
                else:
                    return ["equalized_opportunities", "predictive_equality"]
            else:
                # Default for label output without specific focus
                return ["demographic_parity", "equalized_odds"]
        
        # Default fallback
        return ["demographic_parity", "equalized_odds"]
    
    def get_available_metrics(self) -> List[str]:
        """
        Get all available metrics from our unified system.
        
        Returns:
            List[str]: List of all available metric names
        """
        return list_metrics()
    
    def calculate_metric(self, metric_name: str, y_true: np.ndarray, y_pred: np.ndarray, 
                        sensitive_attr: np.ndarray, y_scores: Optional[np.ndarray] = None) -> float:
        """
        Calculate a specific metric using our unified metrics system.
        
        Args:
            metric_name: Name of the metric to calculate
            y_true: True labels
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            y_scores: Model scores (for score-based metrics)
            
        Returns:
            float: Calculated metric value
            
        Raises:
            KeyError: If metric is not available
            ValueError: If required inputs are missing
        """
        try:
            metric_func = get_metric(metric_name)
            
            # Handle different metric input requirements
            if metric_name in ["balance_positive_class", "balance_negative_class"]:
                if y_scores is None:
                    raise ValueError(f"Metric {metric_name} requires y_scores")
                raw_result = metric_func(y_true, y_scores, sensitive_attr)
            else:
                raw_result = metric_func(y_true, y_pred, sensitive_attr)
            
            # Convert the result to a float using our utility function
            from .metrics import convert_metric_to_float
            return convert_metric_to_float(raw_result, metric_name)
                
        except KeyError:
            raise KeyError(f"Metric '{metric_name}' not found. Available metrics: {list_metrics()}")
        except Exception as e:
            raise ValueError(f"Error calculating metric {metric_name}: {str(e)}")
    
    def calculate_fairness_metrics(self, y_true: Optional[np.ndarray], y_pred: np.ndarray, 
                                 sensitive_attr: np.ndarray, y_scores: Optional[np.ndarray] = None,
                                 conditioning_vars: Optional[np.ndarray] = None) -> Dict[str, float]:
        """
        Calculate all recommended fairness metrics using our unified metrics system.
        
        Args:
            y_true: True labels (required for most metrics)
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
            try:
                if metric in ["balance_positive_class", "balance_negative_class"]:
                    if y_scores is not None:
                        results[metric] = self.calculate_metric(metric, y_true, y_pred, sensitive_attr, y_scores)
                    else:
                        results[metric] = float('nan')
                        results[f"{metric}_note"] = "y_scores required but not provided"
                else:
                    if y_true is not None:
                        results[metric] = self.calculate_metric(metric, y_true, y_pred, sensitive_attr)
                    else:
                        results[metric] = float('nan')
                        results[f"{metric}_note"] = "y_true required but not provided"
                        
            except Exception as e:
                results[metric] = float('nan')
                results[f"{metric}_error"] = str(e)
        
        # Add comprehensive metrics if y_true is available
        if y_true is not None:
            comprehensive_metrics = self.calculate_comprehensive_fairness_metrics(y_true, y_pred, sensitive_attr)
            results.update(comprehensive_metrics)
        
        return results
    
    def calculate_comprehensive_fairness_metrics(self, y_true: np.ndarray, y_pred: np.ndarray, 
                                              sensitive_attr: np.ndarray) -> Dict[str, float]:
        """
        Calculate comprehensive fairness metrics using our unified system.
        
        Args:
            y_true: True labels
            y_pred: Model predictions
            sensitive_attr: Sensitive attribute values
            
        Returns:
            Dict[str, float]: Dictionary of comprehensive fairness metrics
        """
        results = {}
        
        # Calculate all available metrics that don't require scores
        available_metrics = [m for m in list_metrics() if m not in ["balance_positive_class", "balance_negative_class"]]
        
        for metric in available_metrics:
            try:
                results[metric] = self.calculate_metric(metric, y_true, y_pred, sensitive_attr)
            except Exception as e:
                results[metric] = float('nan')
                results[f"{metric}_error"] = str(e)
        
        return results
    
    def explain(self) -> Dict:
        """
        Returns a JSON-style dictionary of all config values and the chosen recommendation(s).
        
        Returns:
            Dict: Configuration and recommendations explanation
        """
        recommendations = self.get_metric_recommendations()
        
        explanation = {
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
            "reasoning": self._explain_reasoning(),
            "available_metrics": self.get_available_metrics()
        }
        
        return explanation
    
    def _explain_reasoning(self) -> str:
        """
        Provide human-readable explanation of the metric recommendations.
        
        Returns:
            str: Explanation of why these metrics were chosen
        """
        if self.enforce_policy:
            if self.representation_type == "equal_number":
                return "Policy enforcement requires equal selection rates across groups"
            elif self.representation_type == "proportional":
                return "Policy enforcement requires proportional representation across groups"
            else:
                return "Policy enforcement requires demographic parity"
        
        if not self.ground_truth_available or self.label_bias:
            if self.explaining_variables_present:
                return "Ground truth unavailable or label bias detected, but explaining variables present - using conditional statistical parity"
            else:
                return "Ground truth unavailable or label bias detected - using demographic parity as fallback"
        
        if self.base_rates_equal:
            return "Base rates are equal across groups - demographic parity is appropriate"
        
        if self.output_type == "score":
            if self.error_sensitivity == "false_positive":
                return "Score output with false positive sensitivity - focus on balance for negative class"
            elif self.error_sensitivity == "false_negative":
                return "Score output with false negative sensitivity - focus on balance for positive class"
            else:
                return "Score output - balance for both positive and negative classes"
        
        if self.output_type == "label":
            if self.fairness_focus == "precision":
                return "Label output with precision focus - conditional use accuracy equality and predictive parity"
            elif self.fairness_focus == "recall":
                if self.error_sensitivity == "false_negative":
                    return "Label output with recall focus and false negative sensitivity - equalized opportunity"
                elif self.error_sensitivity == "false_positive":
                    return "Label output with recall focus and false positive sensitivity - predictive equality"
                else:
                    return "Label output with recall focus - both equalized opportunity and predictive equality"
            else:
                return "Label output - standard demographic parity and equalized odds"
        
        return "Default recommendation - demographic parity and equalized odds"
    
    def validate_configuration(self) -> Dict[str, bool]:
        """
        Validate the current configuration for consistency.
        
        Returns:
            Dict[str, bool]: Validation results for each configuration aspect
        """
        validation = {}
        
        # Check for logical consistency
        validation["policy_consistency"] = not (
            self.enforce_policy and 
            (self.ground_truth_available is False or self.label_bias is True)
        )
        
        validation["focus_consistency"] = not (
            self.fairness_focus and 
            self.output_type != "label"
        )
        
        validation["sensitivity_consistency"] = not (
            self.error_sensitivity and 
            self.output_type != "score"
        )
        
        validation["representation_consistency"] = not (
            self.representation_type and 
            not self.enforce_policy
        )
        
        return validation 