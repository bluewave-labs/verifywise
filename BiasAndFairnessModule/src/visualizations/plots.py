from typing import Any

import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import ConfusionMatrixDisplay, confusion_matrix, accuracy_score
import pandas as pd
from eval_engine.metrics import (
    equalized_odds,
    compute_group_metrics,
    conditional_statistical_parity,
)
from sklearn.calibration import calibration_curve
import seaborn as sns


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


def plot_fairness_radar(
    metrics_dict: dict,
    title: str = "Fairness Metrics Radar Chart",
):
    """
    Plot a radar chart comparing fairness metrics across groups.

    Parameters
    ----------
    metrics_dict : dict
        Mapping of group -> {metric_name: value, ...}.
        Example structure:
            {
                "Male": {"Demographic Parity": 0.9, "Equalized Odds": 0.85, ...},
                "Female": {"Demographic Parity": 0.7, "Equalized Odds": 0.65, ...}
            }
    title : str, optional
        Title of the plot.
    """

    if not metrics_dict:
        raise ValueError("metrics_dict must not be empty")

    groups = list(metrics_dict.keys())
    first_group_metrics = next(iter(metrics_dict.values()))
    if not first_group_metrics:
        raise ValueError("metrics_dict values must contain at least one metric")

    metric_names = list(first_group_metrics.keys())
    num_metrics = len(metric_names)

    # Compute angles for radar axes
    angles = np.linspace(0.0, 2.0 * np.pi, num_metrics, endpoint=False).tolist()
    angles += angles[:1]  # complete the loop

    # Initialize the radar chart
    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))

    for group in groups:
        group_values_map = metrics_dict[group]
        # Ensure ordering matches metric_names; missing values become NaN
        values = [float(group_values_map.get(m, np.nan)) for m in metric_names]
        values += values[:1]  # complete the loop
        ax.plot(angles, values, label=group, linewidth=2)
        ax.fill(angles, values, alpha=0.25)

    # Set metric labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(metric_names)

    # Optional: set range 0-1 for fairness metrics
    ax.set_ylim(0, 1)

    # Add legend and title
    ax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.1))
    ax.set_title(title, fontsize=14, pad=20)

    plt.tight_layout()
    plt.show()

    return fig, ax


def plot_conditional_statistical_parity(
    y_pred: np.ndarray,
    protected_attributes: np.ndarray,
    legitimate_attributes: np.ndarray,
):
    """
    Plot a heatmap of Conditional Statistical Parity (selection rates by group within strata).

    Parameters
    ----------
    y_pred : np.ndarray
        Predicted labels or scores binarized upstream as needed for selection rate.
    protected_attributes : np.ndarray
        Encoded sensitive attribute values.
    legitimate_attributes : np.ndarray
        Legitimate attributes to condition on (define strata).
    """

    y_pred = np.asarray(y_pred).ravel()
    protected_attributes = np.asarray(protected_attributes).ravel()
    legitimate_attributes = np.asarray(legitimate_attributes).ravel()

    if not (
        y_pred.shape[0] == protected_attributes.shape[0] == legitimate_attributes.shape[0]
    ):
        raise ValueError(
            "y_pred, protected_attributes, and legitimate_attributes must have the same length"
        )

    results = conditional_statistical_parity(
        y_pred=y_pred,
        protected_attributes=protected_attributes,
        legitimate_attributes=legitimate_attributes,
    )

    if not results:
        raise ValueError("No conditional statistical parity results to plot")

    # Convert results into DataFrame for heatmap: rows=groups, cols=strata
    data: dict = {}
    for res in results:
        stratum = str(res.get("stratum", ""))
        group_rates = res.get("group_selection_rates", {})
        for group, rate in group_rates.items():
            group_key = str(group)
            if group_key not in data:
                data[group_key] = {}
            data[group_key][stratum] = float(rate)

    df = pd.DataFrame(data).T
    # Sort for stable visualization
    df = df.sort_index(axis=0)
    df = df.reindex(sorted(df.columns), axis=1)

    fig, ax = plt.subplots(figsize=(12, 6))
    sns.heatmap(
        df,
        annot=True,
        fmt=".2f",
        cmap="YlGnBu",
        cbar_kws={"label": "Selection Rate"},
        ax=ax,
    )
    ax.set_xlabel("Stratum")
    ax.set_ylabel("Group")
    ax.set_title("Conditional Statistical Parity Heatmap")
    plt.tight_layout()
    plt.show()

    return fig, ax


def plot_cumulative_parity_loss(
    data: dict,
    title: str = "Stacked Parity Loss by Subgroup",
    x_label: str = "Cumulative Parity Loss",
    y_label: str = "Protected Subgroups",
):
    """
    Plot a horizontal stacked bar chart of cumulative parity loss per subgroup.

    Parameters
    ----------
    data : dict
        Mapping of group -> {metric_name: value, ...}.
        Example:
            {
                "Male": {"TPR": 0.10, "PPV": 0.15, ...},
                "Female": {"TPR": 0.08, "PPV": 0.18, ...}
            }
    title : str
        Title of the plot.
    x_label : str
        Label for the x-axis.
    y_label : str
        Label for the y-axis.
    """

    if not data:
        raise ValueError("data must not be empty")

    groups = list(data.keys())
    first_metrics = next(iter(data.values()))
    if not first_metrics:
        raise ValueError("Each group must contain at least one metric entry")

    metrics = list(first_metrics.keys())

    # Convert dictionary to a 2D array [num_groups x num_metrics]
    values = np.array([[float(data[group].get(metric, 0.0)) for metric in metrics] for group in groups])

    fig, ax = plt.subplots(figsize=(8, 5))

    # Horizontal stacked bar chart
    left = np.zeros(len(groups))
    cmap = plt.colormaps.get("tab20")
    for i, metric in enumerate(metrics):
        color = cmap(i % cmap.N) if cmap is not None else None
        ax.barh(groups, values[:, i], left=left, label=metric, color=color, edgecolor="white")
        left += values[:, i]

    # Labels and style
    ax.set_xlabel(x_label)
    ax.set_ylabel(y_label)
    ax.set_title(title)
    ax.legend(title="Metrics", bbox_to_anchor=(1.05, 1), loc="upper left")
    ax.grid(True, axis="x", linestyle="--", alpha=0.4)
    plt.tight_layout()
    plt.show()

    return fig, ax


def plot_group_metrics_boxplots(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    sensitive_attr: np.ndarray,
):
    """
    Boxplots of per-group fairness metrics (TPR, FPR, PPV, NPV) across groups.

    Parameters
    ----------
    y_true : np.ndarray
        Ground truth labels (0/1).
    y_pred : np.ndarray
        Predicted labels (0/1).
    sensitive_attr : np.ndarray
        Encoded sensitive attribute values.
    """

    y_true = np.asarray(y_true).ravel()
    y_pred = np.asarray(y_pred).ravel()
    sensitive_attr = np.asarray(sensitive_attr).ravel()

    if not (y_true.shape[0] == y_pred.shape[0] == sensitive_attr.shape[0]):
        raise ValueError("y_true, y_pred, and sensitive_attr must have the same length")

    df_metrics = compute_group_metrics(y_true, y_pred, sensitive_attr)
    if df_metrics.empty:
        raise ValueError("No data available to plot group metrics boxplots")

    df_melted = df_metrics.melt(id_vars="group", var_name="Metric", value_name="Value")

    fig, ax = plt.subplots(figsize=(10, 6))
    sns.boxplot(data=df_melted, x="Metric", y="Value", ax=ax)
    # Overlay per-group points for visibility and legend
    sns.stripplot(
        data=df_melted,
        x="Metric",
        y="Value",
        hue="group",
        dodge=True,
        alpha=0.7,
        linewidth=0,
        ax=ax,
    )

    ax.set_title("Fairness Metrics Across Groups")
    ax.set_xlabel("Metric")
    ax.set_ylabel("Value")
    ax.set_ylim(0, 1)
    ax.grid(True, linestyle="--", alpha=0.4, axis="y")
    ax.legend(title="Group", bbox_to_anchor=(1.02, 1), loc="upper left")
    plt.tight_layout()
    plt.show()

    return fig, ax

