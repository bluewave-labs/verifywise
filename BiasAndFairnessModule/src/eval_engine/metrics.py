"""
Bias and Fairness Metrics Module

This module implements various bias and fairness metrics for machine learning models.
Each metric is registered using the metric_registry decorator for centralized access.
"""

from typing import Any, Dict, List, NamedTuple, Union

import numpy as np
import pandas as pd
from fairlearn.metrics import (MetricFrame, demographic_parity_difference,
                               equalized_odds_difference, false_positive_rate,
                               true_positive_rate)
from sklearn.metrics import brier_score_loss, precision_score

from .metric_registry import register_metric


def _balance_for_positive_class_metric(y_t: np.ndarray, y_p: np.ndarray) -> float:
    mask = y_t == 1
    return float(np.mean(y_p[mask])) if np.any(mask) else float("nan")


def _balance_for_negative_class_metric(y_t: np.ndarray, y_p: np.ndarray) -> float:
    mask = y_t == 0
    return float(np.mean(y_p[mask])) if np.any(mask) else float("nan")


# Result type for conditional use accuracy equality
class ConditionalUseAccuracyResult(NamedTuple):
    npv: MetricFrame
    ppv: MetricFrame


@register_metric("equal_selection_parity")
def equal_selection_parity(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> Dict[Any, int]:
    """
    Calculate Equal Selection Parity metric.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes

    Returns:
        Dict[Any, int]: Mapping of sensitive group value -> count of favourable outcomes (y_pred == 1)
    """
    # Flatten and validate inputs (y_true accepted for signature consistency)
    y_true_array = np.asarray(y_true).ravel()
    y_pred_array = np.asarray(y_pred).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if y_pred_array.shape[0] != sensitive_features_array.shape[0]:
        raise ValueError(
            "Length mismatch: y_pred and protected_attributes must have the same number of samples"
        )

    if y_true_array.shape[0] not in (0, y_pred_array.shape[0]):
        raise ValueError(
            "Length mismatch: y_true must have the same number of samples as y_pred (or be empty)"
        )

    num_samples = y_pred_array.shape[0]
    if num_samples == 0:
        return {}

    # Compute absolute counts of favourable outcomes (predicted positives) per group
    favourable_mask = y_pred_array == 1
    unique_groups = np.unique(sensitive_features_array)

    group_to_count: Dict[Any, int] = {}
    for group_value in unique_groups:
        group_mask = sensitive_features_array == group_value
        group_to_count[group_value] = int(np.sum(favourable_mask & group_mask))

    return group_to_count


@register_metric("demographic_parity")
def demographic_parity(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Demographic Parity (Statistical Parity) metric.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes

    Returns:
        float: Demographic parity score
    """
    # Validate and flatten inputs
    y_true_array = np.asarray(y_true).ravel()
    y_pred_array = np.asarray(y_pred).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if y_pred_array.shape[0] != sensitive_features_array.shape[0]:
        raise ValueError(
            "Length mismatch: y_pred and protected_attributes must have the same number of samples"
        )

    # y_true is accepted by Fairlearn's API for signature consistency, but not used
    # for demographic parity calculations. We still validate its length when provided.
    if y_true_array.shape[0] not in (0, y_pred_array.shape[0]):
        raise ValueError(
            "Length mismatch: y_true must have the same number of samples as y_pred (or be empty)"
        )

    dp_difference = demographic_parity_difference(
        y_true=y_true_array,
        y_pred=y_pred_array,
        sensitive_features=sensitive_features_array,
    )
    return float(dp_difference)


@register_metric("conditional_statistical_parity")
def conditional_statistical_parity(
    y_pred: np.ndarray,
    protected_attributes: np.ndarray,
    legitimate_attributes: np.ndarray,
) -> List[Dict[str, Any]]:
    """
    Calculate Conditional Statistical Parity metric.

    Args:
        y_pred: Predicted labels
        protected_attributes: Protected group attributes
        legitimate_attributes: Legitimate attributes to condition on

    Returns:
        List[Dict[str, Any]]: A list of per-stratum records. Each record has keys:
            - "stratum": the stratum value
            - "group_selection_rates": dict of group -> selection rate (float)
            - "disparity": max(group rates) - min(group rates) (float)
    """
    # Flatten and validate inputs
    y_pred_array = np.asarray(y_pred).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()
    legitimate_array = np.asarray(legitimate_attributes).ravel()

    num_samples = y_pred_array.shape[0]
    if not (
        sensitive_features_array.shape[0] == num_samples
        and legitimate_array.shape[0] == num_samples
    ):
        raise ValueError(
            "Length mismatch: y_pred, protected_attributes, and legitimate_attributes must have the same number of samples"
        )

    if num_samples == 0:
        return []

    # Build DataFrame for stratum-wise computation
    df = pd.DataFrame(
        {
            "y_pred": y_pred_array,
            "sensitive": sensitive_features_array,
            "stratify": legitimate_array,
        }
    )

    # Compute disparity (max selection rate difference across sensitive groups) within each stratum
    details: List[Dict[str, Any]] = []
    for stratum_value in df["stratify"].unique():
        subset = df[df["stratify"] == stratum_value]

        if subset.empty:
            continue

        # Dummy y_true (not used by the mean metric, required by MetricFrame signature)
        dummy_y_true = np.zeros_like(subset["y_pred"], dtype=float)

        metric_frame = MetricFrame(
            metrics=lambda y_t, y_p: float(np.mean(y_p)),
            y_true=dummy_y_true,
            y_pred=subset["y_pred"].to_numpy(),
            sensitive_features=subset["sensitive"].to_numpy(),
        )

        group_rates = metric_frame.by_group
        # If only one group present in the stratum, disparity is zero
        disparity_value = (
            float(group_rates.max() - group_rates.min())
            if len(group_rates) > 0
            else 0.0
        )

        # Collect structured details for this stratum
        sorted_group_keys = sorted(group_rates.index.tolist())
        group_rates_dict = {
            str(k): float(group_rates.loc[k]) for k in sorted_group_keys
        }
        details.append(
            {
                "stratum": str(stratum_value),
                "group_selection_rates": group_rates_dict,
                "disparity": float(disparity_value),
            }
        )

    return details


@register_metric("calibration")
def calibration(
    y_true: np.ndarray, y_pred_proba: np.ndarray, protected_attributes: np.ndarray
) -> MetricFrame:
    """
    Calculate Calibration metric.

    Args:
        y_true: Ground truth labels
        y_pred_proba: Predicted probabilities
        protected_attributes: Protected group attributes

    Returns:
        MetricFrame: Fairlearn MetricFrame with per-group Brier scores
    """
    # Flatten and validate inputs
    y_true_array = np.asarray(y_true).ravel()
    y_prob_array = np.asarray(y_pred_proba).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if not (
        y_true_array.shape[0] == y_prob_array.shape[0]
        and y_prob_array.shape[0] == sensitive_features_array.shape[0]
    ):
        raise ValueError(
            "Length mismatch: y_true, y_pred_proba, and protected_attributes must have the same number of samples"
        )

    # Build MetricFrame with Brier score per sensitive group
    metric_frame = MetricFrame(
        metrics=brier_score_loss,
        y_true=y_true_array,
        y_pred=y_prob_array,
        sensitive_features=sensitive_features_array,
    )
    return metric_frame


@register_metric("conditional_use_accuracy_equality")
def conditional_use_accuracy_equality(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> "ConditionalUseAccuracyResult":
    """
    Calculate Conditional Use Accuracy Equality metric.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes

    Returns:
        ConditionalUseAccuracyResult: Named tuple with two MetricFrames:
            - npv: per-group Negative Predictive Value
            - ppv: per-group Positive Predictive Value (Precision)
    """

    # Define return container
    class ConditionalUseAccuracyResult(NamedTuple):
        npv: MetricFrame
        ppv: MetricFrame

    # Flatten and validate inputs
    y_true_array = np.asarray(y_true).ravel()
    y_pred_array = np.asarray(y_pred).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if not (
        y_true_array.shape[0] == y_pred_array.shape[0]
        and y_pred_array.shape[0] == sensitive_features_array.shape[0]
    ):
        raise ValueError(
            "Length mismatch: y_true, y_pred, and protected_attributes must have the same number of samples"
        )

    # Define NPV metric function
    def negative_predictive_value(y_t: np.ndarray, y_p: np.ndarray) -> float:
        predicted_negative_mask = y_p == 0
        if not np.any(predicted_negative_mask):
            return float("nan")
        true_negative_count = np.sum((y_t == 0) & predicted_negative_mask)
        predicted_negative_count = np.sum(predicted_negative_mask)
        return float(true_negative_count / predicted_negative_count)

    # Build MetricFrames for NPV and PPV per sensitive group
    metric_frame_npv = MetricFrame(
        metrics=negative_predictive_value,
        y_true=y_true_array,
        y_pred=y_pred_array,
        sensitive_features=sensitive_features_array,
    )

    metric_frame_ppv = MetricFrame(
        metrics=lambda yt, yp: precision_score(yt, yp, zero_division=0.0),
        y_true=y_true_array,
        y_pred=y_pred_array,
        sensitive_features=sensitive_features_array,
    )

    return ConditionalUseAccuracyResult(npv=metric_frame_npv, ppv=metric_frame_ppv)


@register_metric("predictive_parity")
def predictive_parity(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> MetricFrame:
    """
    Calculate Predictive Parity metric.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes

    Returns:
        MetricFrame: Fairlearn MetricFrame with per-group precision scores
    """
    # Flatten and validate inputs
    y_true_array = np.asarray(y_true).ravel()
    y_pred_array = np.asarray(y_pred).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if not (
        y_true_array.shape[0] == y_pred_array.shape[0]
        and y_pred_array.shape[0] == sensitive_features_array.shape[0]
    ):
        raise ValueError(
            "Length mismatch: y_true, y_pred, and protected_attributes must have the same number of samples"
        )

    metric_frame = MetricFrame(
        metrics=lambda yt, yp: precision_score(yt, yp, zero_division=0.0),
        y_true=y_true_array,
        y_pred=y_pred_array,
        sensitive_features=sensitive_features_array,
    )
    return metric_frame


@register_metric("equalized_odds")
def equalized_odds(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Equalized Odds metric.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes

    Returns:
        float: Equalized odds score
    """
    # Flatten and validate inputs
    y_true_array = np.asarray(y_true).ravel()
    y_pred_array = np.asarray(y_pred).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if not (
        y_true_array.shape[0] == y_pred_array.shape[0]
        and y_pred_array.shape[0] == sensitive_features_array.shape[0]
    ):
        raise ValueError(
            "Length mismatch: y_true, y_pred, and protected_attributes must have the same number of samples"
        )

    if y_true_array.shape[0] == 0:
        return 0.0

    eod_value = equalized_odds_difference(
        y_true=y_true_array,
        y_pred=y_pred_array,
        sensitive_features=sensitive_features_array,
        agg="worst_case",
    )
    return float(eod_value)


@register_metric("equalized_opportunities")
def equalized_opportunities(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> MetricFrame:
    """
    Calculate Equalized Opportunities metric.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes

    Returns:
        MetricFrame: Fairlearn MetricFrame with per-group true positive rates
    """
    # Flatten and validate inputs
    y_true_array = np.asarray(y_true).ravel()
    y_pred_array = np.asarray(y_pred).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if not (
        y_true_array.shape[0] == y_pred_array.shape[0]
        and y_pred_array.shape[0] == sensitive_features_array.shape[0]
    ):
        raise ValueError(
            "Length mismatch: y_true, y_pred, and protected_attributes must have the same number of samples"
        )

    metric_frame = MetricFrame(
        metrics=true_positive_rate,
        y_true=y_true_array,
        y_pred=y_pred_array,
        sensitive_features=sensitive_features_array,
    )
    return metric_frame


@register_metric("predictive_equality")
def predictive_equality(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> MetricFrame:
    """
    Calculate Predictive Equality metric.

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes

    Returns:
        MetricFrame: Fairlearn MetricFrame with per-group false positive rates
    """
    # Flatten and validate inputs
    y_true_array = np.asarray(y_true).ravel()
    y_pred_array = np.asarray(y_pred).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if not (
        y_true_array.shape[0] == y_pred_array.shape[0]
        and y_pred_array.shape[0] == sensitive_features_array.shape[0]
    ):
        raise ValueError(
            "Length mismatch: y_true, y_pred, and protected_attributes must have the same number of samples"
        )

    metric_frame = MetricFrame(
        metrics=false_positive_rate,
        y_true=y_true_array,
        y_pred=y_pred_array,
        sensitive_features=sensitive_features_array,
    )
    return metric_frame


@register_metric("balance_positive_class")
def balance_positive_class(
    y_true: np.ndarray, y_pred_proba: np.ndarray, protected_attributes: np.ndarray
) -> MetricFrame:
    """
    Calculate Balance for Positive Class metric.

    Args:
        y_true: Ground truth labels
        y_pred_proba: Predicted probabilities
        protected_attributes: Protected group attributes

    Returns:
        MetricFrame: Fairlearn MetricFrame with per-group mean predicted probability among positives
    """
    y_true_array = np.asarray(y_true).ravel()
    y_prob_array = np.asarray(y_pred_proba).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if not (
        y_true_array.shape[0] == y_prob_array.shape[0]
        and y_prob_array.shape[0] == sensitive_features_array.shape[0]
    ):
        raise ValueError(
            "Length mismatch: y_true, y_pred_proba, and protected_attributes must have the same number of samples"
        )

    metric_frame = MetricFrame(
        metrics=_balance_for_positive_class_metric,
        y_true=y_true_array,
        y_pred=y_prob_array,
        sensitive_features=sensitive_features_array,
    )
    return metric_frame


@register_metric("balance_negative_class")
def balance_negative_class(
    y_true: np.ndarray, y_pred_proba: np.ndarray, protected_attributes: np.ndarray
) -> MetricFrame:
    """
    Calculate Balance for Negative Class metric.

    Args:
        y_true: Ground truth labels
        y_pred_proba: Predicted probabilities
        protected_attributes: Protected group attributes

    Returns:
        MetricFrame: Fairlearn MetricFrame with per-group mean predicted probability among negatives
    """
    y_true_array = np.asarray(y_true).ravel()
    y_prob_array = np.asarray(y_pred_proba).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if not (
        y_true_array.shape[0] == y_prob_array.shape[0]
        and y_prob_array.shape[0] == sensitive_features_array.shape[0]
    ):
        raise ValueError(
            "Length mismatch: y_true, y_pred_proba, and protected_attributes must have the same number of samples"
        )

    metric_frame = MetricFrame(
        metrics=_balance_for_negative_class_metric,
        y_true=y_true_array,
        y_pred=y_prob_array,
        sensitive_features=sensitive_features_array,
    )
    return metric_frame


# Utility function for Fairness Compass Engine compatibility
# This function converts any metric result to a simple float value

def convert_metric_to_float(metric_result, metric_name: str = "unknown") -> float:
    """
    Convert any metric result to a simple float value for the Fairness Compass Engine.
    
    Args:
        metric_result: The result from any metric function
        metric_name: Name of the metric for error reporting
        
    Returns:
        float: Simple float value representing the metric
        
    Raises:
        ValueError: If the metric result cannot be converted to a float
    """
    # If already a float, return as is
    if isinstance(metric_result, (int, float)):
        return float(metric_result)
    
    # Handle MetricFrame objects (from Fairlearn)
    if hasattr(metric_result, 'by_group'):
        group_values = metric_result.by_group.values
        if len(group_values) >= 2:
            # Calculate difference between max and min values
            return float(max(group_values) - min(group_values))
        else:
            return 0.0
    
    # Handle dictionaries (like equal_selection_parity)
    if isinstance(metric_result, dict):
        if not metric_result:  # Empty dict
            return 0.0
        
        # For equal_selection_parity: convert counts to selection rates
        if metric_name == "equal_selection_parity":
            # This is a special case - we need to know the total samples
            # For now, return the count difference as a proxy
            counts = list(metric_result.values())
            if len(counts) >= 2:
                return float(max(counts) - min(counts))
            else:
                return 0.0
        else:
            # For other dict metrics, try to extract numeric values
            values = [v for v in metric_result.values() if isinstance(v, (int, float))]
            if len(values) >= 2:
                return float(max(values) - min(values))
            else:
                return 0.0
    
    # Handle lists of dictionaries (like conditional_statistical_parity)
    if isinstance(metric_result, list) and metric_result:
        if isinstance(metric_result[0], dict) and "disparity" in metric_result[0]:
            # Extract maximum disparity from the list
            disparities = [item.get("disparity", 0.0) for item in metric_result]
            return float(max(disparities))
        else:
            # Try to convert list items to floats
            try:
                float_values = [float(item) for item in metric_result if isinstance(item, (int, float))]
                if len(float_values) >= 2:
                    return float(max(float_values) - min(float_values))
                else:
                    return 0.0
            except (ValueError, TypeError):
                pass
    
    # Handle named tuples (like conditional_use_accuracy_equality)
    if hasattr(metric_result, '_fields'):  # NamedTuple
        # Extract numeric values from the named tuple
        numeric_values = []
        for field_value in metric_result:
            if hasattr(field_value, 'by_group'):
                group_vals = field_value.by_group.values
                if len(group_vals) >= 2:
                    numeric_values.append(float(max(group_vals) - min(group_vals)))
            elif isinstance(field_value, (int, float)):
                numeric_values.append(float(field_value))
        
        if numeric_values:
            return float(max(numeric_values))
        else:
            return 0.0
    
    # If we can't convert, raise an error
    raise ValueError(f"Cannot convert metric '{metric_name}' result of type {type(metric_result)} to float")
