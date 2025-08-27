from typing import Any

import matplotlib.pyplot as plt
import numpy as np
from sklearn.metrics import ConfusionMatrixDisplay, confusion_matrix, accuracy_score
import pandas as pd
from eval_engine.metrics import (
    equalized_odds,
    compute_group_metrics,
    conditional_statistical_parity,
    selection_rate,
    equalized_odds_by_group,
    predictive_parity,
    calibration,
    balance_positive_class,
    balance_negative_class,
)
from sklearn.calibration import calibration_curve
import seaborn as sns


def plot_demographic_parity(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    sensitive_features: np.ndarray,
    attribute_name: str = "Group",
):
    """
    Plot Demographic Parity (selection rates by group) using the selection_rate metric.

    Parameters
    ----------
    y_true : np.ndarray
        Ground-truth labels (numpy array). Accepted for signature consistency.
    y_pred : np.ndarray
        Predicted labels (numpy array).
    sensitive_features : np.ndarray
        Sensitive feature values (numpy array).
    attribute_name : str, optional
        Display name for the sensitive attribute on the x-axis.
    """

    # Compute MetricFrame for selection rates by group
    mf = selection_rate(y_true=y_true, y_pred=y_pred, protected_attributes=sensitive_features)

    group_rates = mf.by_group
    overall_rate = mf.overall
    dpd = mf.difference()

    # Coerce potential non-scalars to float for printing/plotting
    try:
        overall_rate = float(overall_rate)
    except Exception:
        pass
    try:
        dpd = float(dpd)
    except Exception:
        pass

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
    y_true: np.ndarray,
    y_pred: np.ndarray,
    protected_attributes: np.ndarray,
    sensitive_mapping: dict,
    title: str = "Fairness Metrics Radar Chart",
):
    """
    Plot a radar chart comparing fairness metrics across groups.

    Parameters
    ----------
    y_true : np.ndarray
        Ground truth binary labels.
    y_pred : np.ndarray
        Predicted labels (0/1) or probabilities. If probabilities are provided,
        a threshold of 0.5 is used to binarize where needed.
    protected_attributes : np.ndarray
        Encoded sensitive attribute values.
    sensitive_mapping : dict
        Mapping from encoded sensitive values to human-readable labels.
        Example: {0: "Male", 1: "Female"}
    title : str, optional
        Title of the plot.
    """

    y_true = np.asarray(y_true).ravel()
    y_pred = np.asarray(y_pred).ravel()
    protected_attributes = np.asarray(protected_attributes).ravel()

    if not (
        y_true.shape[0] == y_pred.shape[0] == protected_attributes.shape[0]
    ):
        raise ValueError(
            "y_true, y_pred, and protected_attributes must have the same length"
        )

    # Determine if y_pred appears probabilistic or binary
    unique_pred_values = np.unique(y_pred)
    is_binary_pred = set(unique_pred_values.tolist()).issubset({0, 1})

    # Define labels and probabilities for downstream metrics
    y_pred_labels = y_pred.astype(int) if is_binary_pred else (y_pred >= 0.5).astype(int)
    y_pred_probs = y_pred.astype(float)

    # Compute per-group metrics
    sr_mf = selection_rate(y_true=y_true, y_pred=y_pred_labels, protected_attributes=protected_attributes)
    pp_mf = predictive_parity(y_true=y_true, y_pred=y_pred_labels, protected_attributes=protected_attributes)
    cal_mf = calibration(y_true=y_true, y_pred_proba=y_pred_probs, protected_attributes=protected_attributes)
    bp_mf = balance_positive_class(y_true=y_true, y_pred_proba=y_pred_probs, protected_attributes=protected_attributes)
    bn_mf = balance_negative_class(y_true=y_true, y_pred_proba=y_pred_probs, protected_attributes=protected_attributes)
    eog_df = equalized_odds_by_group(y_true=y_true, y_pred=y_pred_labels, protected_attributes=protected_attributes)

    # Build metrics_dict in the required format, mapping group ids to names
    groups = np.unique(protected_attributes)
    metrics_dict: dict[str, dict[str, float]] = {}
    for g in groups:
        group_name = sensitive_mapping.get(g, str(g))
        group_metrics: dict[str, float] = {
            "Demographic Parity": float(sr_mf.by_group.loc[g]) if g in sr_mf.by_group.index else np.nan,
            "Equalized Odds": float(eog_df.loc[g, "EO_gap"]) if (not eog_df.empty and g in eog_df.index) else np.nan,
            "Predictive Parity": float(pp_mf.by_group.loc[g]) if g in pp_mf.by_group.index else np.nan,
            "Calibration": float(cal_mf.by_group.loc[g]) if g in cal_mf.by_group.index else np.nan,
            "Balance Positive": float(bp_mf.by_group.loc[g]) if g in bp_mf.by_group.index else np.nan,
            "Balance Negative": float(bn_mf.by_group.loc[g]) if g in bn_mf.by_group.index else np.nan,
        }
        metrics_dict[group_name] = group_metrics

    if not metrics_dict:
        raise ValueError("No metrics could be computed for radar plot")

    # Prepare radar plot
    first_group_metrics = next(iter(metrics_dict.values()))
    if not first_group_metrics:
        raise ValueError("At least one metric is required to render the radar plot")

    metric_names = list(first_group_metrics.keys())
    num_metrics = len(metric_names)

    angles = np.linspace(0.0, 2.0 * np.pi, num_metrics, endpoint=False).tolist()
    angles += angles[:1]

    fig, ax = plt.subplots(figsize=(7, 7), subplot_kw=dict(polar=True))

    for group in metrics_dict.keys():
        values = [float(metrics_dict[group].get(m, np.nan)) for m in metric_names]
        values += values[:1]
        ax.plot(angles, values, label=group, linewidth=2)
        ax.fill(angles, values, alpha=0.25)

    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(metric_names)
    ax.set_ylim(0, 1)
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
    y_true: np.ndarray,
    y_pred: np.ndarray,
    protected_attributes: np.ndarray,
    title: str = "Stacked Parity Loss by Subgroup",
    x_label: str = "Cumulative Parity Loss",
    y_label: str = "Protected Subgroups",
):
    """
    Plot a horizontal stacked bar chart of selected fairness metrics per subgroup.

    Parameters
    ----------
    y_true : np.ndarray
        Ground truth labels (0/1).
    y_pred : np.ndarray
        Predicted labels (0/1).
    protected_attributes : np.ndarray
        Encoded sensitive attribute values.
    title : str, optional
        Title of the plot.
    x_label : str, optional
        Label for the x-axis.
    y_label : str, optional
        Label for the y-axis.
    """

    y_true = np.asarray(y_true).ravel()
    y_pred = np.asarray(y_pred).ravel()
    protected_attributes = np.asarray(protected_attributes).ravel()

    if not (
        y_true.shape[0] == y_pred.shape[0] == protected_attributes.shape[0]
    ):
        raise ValueError("y_true, y_pred, and protected_attributes must have the same length")

    # Compute group metrics and keep only the desired ones
    df_metrics = compute_group_metrics(y_true=y_true, y_pred=y_pred, protected_attributes=protected_attributes)
    if df_metrics.empty:
        raise ValueError("No metrics available to plot")

    desired_metrics = ["TPR", "PPV", "FPR", "ACC", "SPR"]
    available_metrics = [m for m in desired_metrics if m in df_metrics.columns]
    if not available_metrics:
        raise ValueError("None of the required metrics (TPR, PPV, FPR, ACC, SPR) are available")

    # Prepare data for plotting
    groups = df_metrics["group"].tolist()
    values = df_metrics[available_metrics].to_numpy(dtype=float)

    fig, ax = plt.subplots(figsize=(8, 5))

    # Horizontal stacked bar chart
    left = np.zeros(len(groups))
    cmap = plt.colormaps.get("tab20")
    for i, metric in enumerate(available_metrics):
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

    # Only plot TPR, FPR, PPV, NPV even if more metrics are present
    desired_cols = ["group", "TPR", "FPR", "PPV", "NPV"]
    existing_cols = [c for c in desired_cols if c in df_metrics.columns]
    if "group" not in existing_cols:
        raise ValueError("Expected 'group' column missing from group metrics DataFrame")
    df_metrics = df_metrics[existing_cols]

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

