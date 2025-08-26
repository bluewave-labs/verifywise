from typing import Any

import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import ConfusionMatrixDisplay, confusion_matrix, accuracy_score
import pandas as pd
from eval_engine.metrics import equalized_odds
from sklearn.calibration import calibration_curve


def plot_demographic_parity(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    sensitive_features: np.ndarray,
    mf: Any,
    attribute_name: str = "Group",
):
    """
    Plot Demographic Parity (selection rates by group) with overall rate and DP difference.

    Parameters
    ----------
    y_true : np.ndarray
        Ground-truth labels (numpy array). Not used directly; provided for signature consistency.
    y_pred : np.ndarray
        Predicted labels (numpy array). Not used directly; provided for signature consistency.
    sensitive_features : np.ndarray
        Sensitive feature values (numpy array). Not used directly; the grouping comes from `mf`.
    mf : fairlearn.metrics.MetricFrame
        A MetricFrame configured with a selection rate metric. `mf.by_group` is expected
        to be a pandas Series (or single-column DataFrame) of selection rates per group.
    attribute_name : str, optional
        Display name for the sensitive attribute on the x-axis.
    """

    # Extract per-group selection rates from MetricFrame, handling Series/DataFrame cases
    group_rates = mf.by_group
    if isinstance(group_rates, pd.DataFrame):
        if "selection_rate" in group_rates.columns:
            group_rates = group_rates["selection_rate"]
        elif group_rates.shape[1] == 1:
            group_rates = group_rates.iloc[:, 0]
        else:
            # Fallback: pick the first column if multiple are present
            first_col = group_rates.columns[0]
            group_rates = group_rates[first_col]

    overall_rate = mf.overall
    # If overall is a DataFrame/Series (e.g., multiple metrics), try to coerce to scalar
    if isinstance(overall_rate, (pd.Series, pd.DataFrame)):
        if isinstance(overall_rate, pd.DataFrame):
            if "selection_rate" in overall_rate.columns:
                overall_rate = float(overall_rate["selection_rate"].iloc[0])
            else:
                overall_rate = float(overall_rate.iloc[0, 0])
        else:
            overall_rate = float(overall_rate.iloc[0])

    dpd = mf.difference()
    if isinstance(dpd, (pd.Series, pd.DataFrame)):
        # Coerce to scalar if needed
        try:
            dpd = float(dpd.item())
        except Exception:
            if isinstance(dpd, pd.DataFrame):
                dpd = float(dpd.iloc[0, 0])
            else:
                dpd = float(dpd.iloc[0])

    print(f"Selection rate by {attribute_name}:\n{group_rates}")
    try:
        print(f"Overall selection rate: {float(overall_rate):.3f}")
    except Exception:
        print(f"Overall selection rate: {overall_rate}")
    try:
        print(f"Demographic Parity Difference: {float(dpd):.3f}")
    except Exception:
        print(f"Demographic Parity Difference: {dpd}")

    # --- Visualization ---
    fig, ax = plt.subplots(figsize=(7, 5))

    # Use the new colormap API
    num_groups = len(group_rates)
    cmap = plt.colormaps["tab10"]
    colors = [cmap(i % cmap.N) for i in range(max(num_groups, 1))]

    # Bar plot with different colors for each group
    group_rates.plot(
        kind="bar",
        ax=ax,
        color=colors,
        edgecolor="black",
    )

    # Add horizontal line for overall selection rate
    ax.axhline(y=float(overall_rate), color="green", linestyle="--", linewidth=1.5, label="Overall Rate")

    # Title & labels
    ax.set_title(f"Demographic Parity by {attribute_name}", fontsize=14)
    ax.set_ylabel("Selection Rate (P(Ŷ=1))", fontsize=12)
    ax.set_xlabel(attribute_name, fontsize=12)
    ax.legend()

    # Compute a reasonable y-limit and annotate DP difference
    try:
        max_rate = float(pd.Series(group_rates).max())
    except Exception:
        max_rate = 1.0
    y_top = max(max_rate, float(overall_rate)) + 0.02
    ax.set_ylim(top=min(1.05, y_top + 0.03))

    x_pos = (num_groups - 1) / 2.0 if num_groups > 0 else 0.0
    ax.text(
        x_pos,
        y_top,
        f"DP Difference = {float(dpd):.3f}",
        ha="center",
        fontsize=12,
        color="red",
    )

    plt.tight_layout()
    plt.show()

    return fig, ax


def plot_calibration_by_group(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    protected_attr: np.ndarray,
    n_bins: int = 10,
):
    """
    Plot calibration curves per sensitive group.

    Parameters
    ----------
    y_true : np.ndarray
        Ground truth binary labels.
    y_prob : np.ndarray
        Predicted probabilities for the positive class.
    protected_attr : np.ndarray
        Encoded sensitive attribute values.
    n_bins : int, optional
        Number of bins for calibration_curve. Default is 10.
    """

    y_true = np.asarray(y_true).ravel()
    y_prob = np.asarray(y_prob).ravel()
    protected_attr = np.asarray(protected_attr).ravel()

    if not (y_true.shape[0] == y_prob.shape[0] == protected_attr.shape[0]):
        raise ValueError("y_true, y_prob, and protected_attr must have the same length")

    groups = np.unique(protected_attr)

    fig, ax = plt.subplots(figsize=(8, 6))

    for group in groups:
        mask = protected_attr == group
        prob_true, prob_pred = calibration_curve(
            y_true[mask], y_prob[mask], n_bins=n_bins, strategy="uniform"
        )
        ax.plot(prob_pred, prob_true, marker="o", label=f"{group}")

    # Reference line (perfect calibration)
    ax.plot([0, 1], [0, 1], "k--", label="Perfectly calibrated")

    ax.set_xlabel("Mean predicted probability")
    ax.set_ylabel("Fraction of positives")
    ax.set_title("Calibration Plot by Subgroup")
    ax.legend()
    ax.grid(True, linestyle="--", alpha=0.6)
    plt.tight_layout()
    plt.show()

    return fig, ax


def plot_groupwise_confusion_matrices(
    y_true,
    y_pred,
    sensitive_attr,
    sensitive_mapping,
    labels=None,
    normalize=None,
):
    """
    Create a confusion matrix subplot for each sensitive group.

    Parameters
    ----------
    y_true : array-like of shape (n_samples,)
        Ground truth labels.
    y_pred : array-like of shape (n_samples,)
        Predicted labels.
    sensitive_attr : array-like of shape (n_samples,)
        Encoded sensitive attribute values (e.g., 0, 1).
    sensitive_mapping : dict
        Mapping from encoded sensitive attribute values to human-readable labels.
        Example: {0: "Male", 1: "Female"}
    labels : list, optional
        The list of class labels. If None, inferred from y_true and y_pred.
    normalize : {"true", "pred", "all"}, default=None
        Normalization mode for confusion matrix.
    """

    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    sensitive_attr = np.asarray(sensitive_attr)

    if not (len(y_true) == len(y_pred) == len(sensitive_attr)):
        raise ValueError("y_true, y_pred, and sensitive_attr must have the same length")

    # Infer labels when not provided
    if labels is None:
        inferred_labels = np.unique(np.concatenate((y_true, y_pred)))
        labels_for_cm = inferred_labels
        display_labels = inferred_labels
    else:
        labels_for_cm = labels
        display_labels = labels

    unique_groups = np.unique(sensitive_attr)
    n_groups = len(unique_groups)

    fig, axes = plt.subplots(1, n_groups, figsize=(5 * n_groups, 4))
    if n_groups == 1:
        axes = [axes]

    for ax, group in zip(axes, unique_groups):
        mask = sensitive_attr == group
        cm = confusion_matrix(y_true[mask], y_pred[mask], labels=labels_for_cm, normalize=normalize)
        disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=display_labels)
        disp.plot(ax=ax, colorbar=False, cmap="Blues")

        group_name = sensitive_mapping.get(group, f"Group {group}")
        ax.set_title(f"Group: {group_name}")

    plt.tight_layout()
    plt.show()

    return fig, axes


def create_fairness_vs_accuracy_plot(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_scores: np.ndarray,
    sensitive_attr: np.ndarray,
    num_thresholds: int = 21,
):
    """
    Plot Equalized Odds difference versus Accuracy across score thresholds.

    Parameters
    ----------
    y_true : np.ndarray
        Ground truth labels.
    y_pred : np.ndarray
        Predicted labels (unused in computation per-threshold; kept for signature consistency).
    y_scores : np.ndarray
        Predicted scores/probabilities used for thresholding.
    sensitive_attr : np.ndarray
        Encoded sensitive attribute values.
    num_thresholds : int, optional
        Number of thresholds to sweep in [0, 1]. Default is 21.
    """

    y_true = np.asarray(y_true).ravel()
    y_scores = np.asarray(y_scores).ravel()
    sensitive_attr = np.asarray(sensitive_attr).ravel()

    if not (
        y_true.shape[0] == y_scores.shape[0] == sensitive_attr.shape[0]
    ):
        raise ValueError(
            "y_true, y_scores, and sensitive_attr must have the same length"
        )

    thresholds = np.linspace(0.0, 1.0, num_thresholds)
    results = []
    for thresh in thresholds:
        y_pred_bin = (y_scores >= thresh).astype(int)
        acc = accuracy_score(y_true, y_pred_bin)
        eo = equalized_odds(y_true, y_pred_bin, sensitive_attr)
        results.append({"threshold": float(thresh), "accuracy": float(acc), "eo_diff": float(eo)})

    eod_df = pd.DataFrame(results)

    fig, ax = plt.subplots(figsize=(8, 6))
    scatter = ax.scatter(
        eod_df["accuracy"],
        eod_df["eo_diff"],
        c=eod_df["threshold"],
        cmap="viridis",
        s=80,
    )
    cbar = fig.colorbar(scatter, ax=ax)
    cbar.set_label("Threshold")
    ax.set_xlabel("Accuracy")
    ax.set_ylabel("Equalized Odds Difference")
    ax.set_title("Fairness vs Accuracy Trade-off")
    plt.tight_layout()
    plt.show()

    return fig, ax

