"""
Bias and Fairness Metrics Module

This module implements various bias and fairness metrics for machine learning models.
Each metric is registered using the metric_registry decorator for centralized access.
"""

from typing import Any, Dict, List, NamedTuple, Union, Hashable

import numpy as np
import pandas as pd
from fairlearn.metrics import (MetricFrame, demographic_parity_difference,
                               equalized_odds_difference, false_positive_rate,
                               true_positive_rate, selection_rate as fairlearn_selection_rate)
from sklearn.metrics import (brier_score_loss, precision_score, recall_score, 
                            f1_score, accuracy_score, confusion_matrix)

from .metric_registry import register_metric


def _balance_for_positive_class_metric(y_t: np.ndarray, y_p: np.ndarray) -> float:
    mask = y_t == 1
    return float(np.mean(y_p[mask])) if np.any(mask) else -1.0  # Use -1.0 to indicate "no data"


def _balance_for_negative_class_metric(y_t: np.ndarray, y_p: np.ndarray) -> float:
    mask = y_t == 0
    return float(np.mean(y_p[mask])) if np.any(mask) else -1.0  # Use -1.0 to indicate "no data"


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


@register_metric("selection_rate")
def selection_rate(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> MetricFrame:
    """
    Calculate per-group Selection Rate metric.

    Args:
        y_true: Ground truth labels (accepted for signature consistency)
        y_pred: Predicted labels
        protected_attributes: Protected group attributes

    Returns:
        MetricFrame: Fairlearn MetricFrame with per-group selection rates
    """
    # Flatten and validate inputs
    y_true_array = np.asarray(y_true).ravel()
    y_pred_array = np.asarray(y_pred).ravel()
    sensitive_features_array = np.asarray(protected_attributes).ravel()

    if y_pred_array.shape[0] != sensitive_features_array.shape[0]:
        raise ValueError(
            "Length mismatch: y_pred and protected_attributes must have the same number of samples"
        )

    # y_true is accepted by Fairlearn's API for signature consistency, but not used
    if y_true_array.shape[0] not in (0, y_pred_array.shape[0]):
        raise ValueError(
            "Length mismatch: y_true must have the same number of samples as y_pred (or be empty)"
        )

    metric_frame = MetricFrame(
        metrics=fairlearn_selection_rate,
        y_true=y_true_array,
        y_pred=y_pred_array,
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
            return -1.0  # Use -1.0 to indicate "no data"
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
    return eod_value


@register_metric("equalized_opportunity")
def equalized_opportunity(
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


@register_metric("equalized_opportunities")
def equalized_opportunities(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> MetricFrame:
    """
    Calculate Equalized Opportunities metric (alias for equalized_opportunity).

    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes

    Returns:
        MetricFrame: Fairlearn MetricFrame with per-group true positive rates
    """
    return equalized_opportunity(y_true, y_pred, protected_attributes)


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


# Additional metrics for generation and continuous tasks
@register_metric("toxicity_gap")
def toxicity_gap(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Toxicity Gap metric for generation tasks.
    
    Args:
        y_true: Ground truth labels or reference scores
        y_pred: Predicted toxicity scores
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in toxicity scores between groups
    """
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
    
    # Calculate mean toxicity per group
    unique_groups = np.unique(sensitive_features_array)
    group_means = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        group_means[group] = np.mean(y_pred_array[group_mask])
    
    # Return the maximum difference between groups
    if len(group_means) >= 2:
        return float(max(group_means.values()) - min(group_means.values()))
    return 0.0


@register_metric("sentiment_gap")
def sentiment_gap(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Sentiment Gap metric for generation tasks.
    
    Args:
        y_true: Ground truth labels or reference scores
        y_pred: Predicted sentiment scores
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in sentiment scores between groups
    """
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
    
    # Calculate mean sentiment per group
    unique_groups = np.unique(sensitive_features_array)
    group_means = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        group_means[group] = np.mean(y_pred_array[group_mask])
    
    # Return the maximum difference between groups
    if len(group_means) >= 2:
        return float(max(group_means.values()) - min(group_means.values()))
    return 0.0


@register_metric("stereotype_gap")
def stereotype_gap(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Stereotype Gap metric for generation tasks.
    
    Args:
        y_true: Ground truth labels or reference scores
        y_pred: Predicted stereotype scores
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in stereotype scores between groups
    """
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
    
    # Calculate mean stereotype score per group
    unique_groups = np.unique(sensitive_features_array)
    group_means = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        group_means[group] = np.mean(y_pred_array[group_mask])
    
    # Return the maximum difference between groups
    if len(group_means) >= 2:
        return float(max(group_means.values()) - min(group_means.values()))
    return 0.0


@register_metric("exposure_disparity")
def exposure_disparity(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Exposure Disparity metric for generation tasks.
    
    Args:
        y_true: Ground truth labels or reference scores
        y_pred: Predicted exposure scores
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in exposure scores between groups
    """
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
    
    # Calculate mean exposure per group
    unique_groups = np.unique(sensitive_features_array)
    group_means = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        group_means[group] = np.mean(y_pred_array[group_mask])
    
    # Return the maximum difference between groups
    if len(group_means) >= 2:
        return float(max(group_means.values()) - min(group_means.values()))
    return 0.0


@register_metric("representation_disparity")
def representation_disparity(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Representation Disparity metric for generation tasks.
    
    Args:
        y_true: Ground truth labels or reference scores
        y_pred: Predicted representation scores
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in representation scores between groups
    """
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
    
    # Calculate mean representation per group
    unique_groups = np.unique(sensitive_features_array)
    group_means = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        group_means[group] = np.mean(y_pred_array[group_mask])
    
    # Return the maximum difference between groups
    if len(group_means) >= 2:
        return float(max(group_means.values()) - min(group_means.values()))
    return 0.0


@register_metric("prompt_fairness")
def prompt_fairness(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Prompt Fairness metric for generation tasks.
    
    Args:
        y_true: Ground truth labels or reference scores
        y_pred: Predicted fairness scores
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in fairness scores between groups
    """
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
    
    # Calculate mean fairness score per group
    unique_groups = np.unique(sensitive_features_array)
    group_means = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        group_means[group] = np.mean(y_pred_array[group_mask])
    
    # Return the maximum difference between groups
    if len(group_means) >= 2:
        return float(max(group_means.values()) - min(group_means.values()))
    return 0.0


# Performance difference metrics
@register_metric("accuracy_difference")
def accuracy_difference(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Accuracy Difference metric.
    
    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in accuracy between groups
    """
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
    
    # Calculate accuracy per group
    unique_groups = np.unique(sensitive_features_array)
    group_accuracies = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        if np.sum(group_mask) > 0:
            group_accuracies[group] = accuracy_score(
                y_true_array[group_mask], y_pred_array[group_mask]
            )
    
    # Return the maximum difference between groups
    if len(group_accuracies) >= 2:
        return float(max(group_accuracies.values()) - min(group_accuracies.values()))
    return 0.0


@register_metric("precision_difference")
def precision_difference(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Precision Difference metric.
    
    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in precision between groups
    """
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
    
    # Calculate precision per group
    unique_groups = np.unique(sensitive_features_array)
    group_precisions = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        if np.sum(group_mask) > 0:
            group_precisions[group] = precision_score(
                y_true_array[group_mask], y_pred_array[group_mask], zero_division=0.0
            )
    
    # Return the maximum difference between groups
    if len(group_precisions) >= 2:
        return float(max(group_precisions.values()) - min(group_precisions.values()))
    return 0.0


@register_metric("recall_difference")
def recall_difference(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Recall Difference metric.
    
    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in recall between groups
    """
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
    
    # Calculate recall per group
    unique_groups = np.unique(sensitive_features_array)
    group_recalls = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        if np.sum(group_mask) > 0:
            group_recalls[group] = recall_score(
                y_true_array[group_mask], y_pred_array[group_mask], zero_division=0.0
            )
    
    # Return the maximum difference between groups
    if len(group_recalls) >= 2:
        return float(max(group_recalls.values()) - min(group_recalls.values()))
    return 0.0


@register_metric("f1_difference")
def f1_difference(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate F1 Difference metric.
    
    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in F1 score between groups
    """
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
    
    # Calculate F1 score per group
    unique_groups = np.unique(sensitive_features_array)
    group_f1s = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        if np.sum(group_mask) > 0:
            group_f1s[group] = f1_score(
                y_true_array[group_mask], y_pred_array[group_mask], zero_division=0.0
            )
    
    # Return the maximum difference between groups
    if len(group_f1s) >= 2:
        return float(max(group_f1s.values()) - min(group_f1s.values()))
    return 0.0


# Multiclass classification metrics
@register_metric("multiclass_demographic_parity")
def multiclass_demographic_parity(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Multiclass Demographic Parity metric.
    
    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in selection rates between groups across all classes
    """
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
    
    # Calculate selection rate per group per class
    unique_groups = np.unique(sensitive_features_array)
    unique_classes = np.unique(y_pred_array)
    max_disparity = 0.0
    
    for class_label in unique_classes:
        class_mask = y_pred_array == class_label
        class_selection_rates = {}
        
        for group in unique_groups:
            group_mask = sensitive_features_array == group
            combined_mask = class_mask & group_mask
            if np.sum(combined_mask) > 0:
                class_selection_rates[group] = np.sum(combined_mask) / np.sum(group_mask)
        
        if len(class_selection_rates) >= 2:
            class_disparity = max(class_selection_rates.values()) - min(class_selection_rates.values())
            max_disparity = max(max_disparity, class_disparity)
    
    return float(max_disparity)


@register_metric("multiclass_equalized_odds")
def multiclass_equalized_odds(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Multiclass Equalized Odds metric.
    
    Args:
        y_true: Ground truth labels
        y_pred: Predicted labels
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in true positive rates between groups across all classes
    """
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
    
    # Calculate true positive rate per group per class
    unique_groups = np.unique(sensitive_features_array)
    unique_classes = np.unique(y_true_array)
    max_disparity = 0.0
    
    for class_label in unique_classes:
        class_mask = y_true_array == class_label
        class_tprs = {}
        
        for group in unique_groups:
            group_mask = sensitive_features_array == group
            combined_mask = class_mask & group_mask
            if np.sum(combined_mask) > 0:
                # True positives for this class in this group
                tp = np.sum((y_pred_array == class_label) & combined_mask)
                # Total positives for this class in this group
                total_pos = np.sum(combined_mask)
                class_tprs[group] = tp / total_pos if total_pos > 0 else 0.0
        
        if len(class_tprs) >= 2:
            class_disparity = max(class_tprs.values()) - min(class_tprs.values())
            max_disparity = max(max_disparity, class_disparity)
    
    return float(max_disparity)


# Regression metrics
@register_metric("regression_demographic_parity")
def regression_demographic_parity(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> float:
    """
    Calculate Regression Demographic Parity metric.
    
    Args:
        y_true: Ground truth continuous values
        y_pred: Predicted continuous values
        protected_attributes: Protected group attributes
        
    Returns:
        float: Maximum difference in mean predicted values between groups
    """
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
    
    # Calculate mean predicted value per group
    unique_groups = np.unique(sensitive_features_array)
    group_means = {}
    
    for group in unique_groups:
        group_mask = sensitive_features_array == group
        if np.sum(group_mask) > 0:
            group_means[group] = np.mean(y_pred_array[group_mask])
    
    # Return the maximum difference between groups
    if len(group_means) >= 2:
        return float(max(group_means.values()) - min(group_means.values()))
    return 0.0


# Group-wise confusion-derived metrics (TPR, FPR, PPV, NPV)
@register_metric("compute_group_metrics")
def compute_group_metrics(
    y_true: np.ndarray, y_pred: np.ndarray, protected_attributes: np.ndarray
) -> pd.DataFrame:
    """
    Compute per-group TPR, FPR, PPV, NPV, ACC, and SPR.

    Args:
        y_true: Ground truth labels (0/1)
        y_pred: Predicted labels (0/1)
        protected_attributes: Protected group attributes

    Returns:
        pd.DataFrame: Rows per group with columns [group, TPR, FPR, PPV, NPV, ACC, SPR]
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
        return pd.DataFrame(columns=["group", "TPR", "FPR", "PPV", "NPV", "ACC", "SPR"])

    metrics_records: List[Dict[str, Any]] = []
    eps = 1e-10

    for group_value in np.unique(sensitive_features_array):
        group_mask = sensitive_features_array == group_value
        y_true_g = y_true_array[group_mask]
        y_pred_g = y_pred_array[group_mask]

        tn, fp, fn, tp = confusion_matrix(y_true_g, y_pred_g, labels=[0, 1]).ravel()

        tpr = float(tp / (tp + fn + eps))
        fpr = float(fp / (fp + tn + eps))
        ppv = float(tp / (tp + fp + eps))
        npv = float(tn / (tn + fn + eps))
        acc = float((tp + tn) / (tp + tn + fp + fn + eps))
        spr = float((tp + fp) / (len(y_true_g) + eps))

        metrics_records.append(
            {
                "group": group_value,
                "TPR": tpr,
                "FPR": fpr,
                "PPV": ppv,
                "NPV": npv,
                "ACC": acc,
                "SPR": spr,
            }
        )

    return pd.DataFrame(metrics_records)


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

    # Handle pandas DataFrame results (e.g., from compute_group_metrics)
    if isinstance(metric_result, pd.DataFrame):
        if metric_result.empty:
            return 0.0
        # Compute disparity per numeric column and return the maximum disparity across columns
        numeric_columns = [col for col in metric_result.columns if np.issubdtype(metric_result[col].dtype, np.number)]
        if not numeric_columns:
            return 0.0
        disparities = [float(metric_result[col].max() - metric_result[col].min()) for col in numeric_columns]
        return float(max(disparities)) if disparities else 0.0
    
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


@register_metric("equalized_odds_by_group")
def equalized_odds_by_group(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    protected_attributes: np.ndarray,
    pos_label: Hashable = 1,
) -> pd.DataFrame:
    """
    Compute per-group Equalized Odds components and gaps.

    Args:
        y_true: Ground truth binary labels.
        y_pred: Predicted binary labels (0/1). Threshold scores first if needed.
        protected_attributes: Protected group labels for each sample.
        pos_label: Positive class label used to compute TPR/FPR.

    Returns:
        pd.DataFrame: Per-group rows with columns [TPR, FPR, EO_gap]
            where EO_gap = max(|TPR - overall_TPR|, |FPR - overall_FPR|).
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
        return pd.DataFrame(columns=["TPR", "FPR", "EO_gap"])  # Empty, correct schema

    # Compute per-group TPR and FPR with MetricFrame
    mf = MetricFrame(
        metrics={
            "TPR": lambda yt, yp: true_positive_rate(yt, yp, pos_label=pos_label),
            "FPR": lambda yt, yp: false_positive_rate(yt, yp, pos_label=pos_label),
        },
        y_true=y_true_array,
        y_pred=y_pred_array,
        sensitive_features=sensitive_features_array,
    )

    by_group = mf.by_group.copy()
    by_group = by_group.sort_index()

    ref_tpr = mf.overall["TPR"]
    ref_fpr = mf.overall["FPR"]
    eo_gap = np.maximum(
        np.abs(by_group["TPR"] - ref_tpr),
        np.abs(by_group["FPR"] - ref_fpr),
    )

    out = by_group.assign(EO_gap=eo_gap)
    return out
