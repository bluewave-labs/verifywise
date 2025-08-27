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
import plotly.graph_objects as go
from matplotlib import colors as mcolors
from plotly.subplots import make_subplots


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

    # --- Visualization (Plotly) ---
    # Prepare x (group labels) and y (selection rates)
    try:
        x_labels = [str(idx) for idx in list(group_rates.index)]
        y_values = [float(v) for v in list(group_rates.values)]
    except Exception:
        # Fallback if by_group is not a typical pandas Series
        series_like = pd.Series(group_rates)
        x_labels = [str(idx) for idx in list(series_like.index)]
        y_values = [float(v) for v in list(series_like.values)]

    num_groups = len(y_values)
    cmap = plt.colormaps["tab10"]
    bar_colors = [mcolors.to_hex(cmap(i % cmap.N)) for i in range(max(num_groups, 1))]

    fig = go.Figure()

    # Bars for selection rate by group
    fig.add_trace(
        go.Bar(
            x=x_labels,
            y=y_values,
            name="Selection Rate",
            showlegend=False,
            marker=dict(
                color=bar_colors,
                line=dict(color="black", width=1),
            ),
        )
    )

    # Horizontal overall selection rate line as a scatter trace (to show in legend)
    fig.add_trace(
        go.Scatter(
            x=x_labels,
            y=[float(overall_rate)] * num_groups,
            mode="lines",
            name="Overall Rate",
            line=dict(color="green", dash="dash", width=1.5),
            hoverinfo="skip",
        )
    )

    # Compute a reasonable y-limit and annotate DP difference
    try:
        max_rate = float(pd.Series(y_values).max())
    except Exception:
        max_rate = 1.0
    y_top = max(max_rate, float(overall_rate)) + 0.02
    y_max = min(1.05, y_top + 0.03)

    # Add annotation for DP Difference at the top center
    mid_idx = (num_groups - 1) // 2 if num_groups > 0 else 0
    mid_x = x_labels[mid_idx] if x_labels else 0
    fig.add_annotation(
        x=mid_x,
        y=y_top,
        text=f"DP Difference = {float(dpd):.3f}",
        showarrow=False,
        font=dict(size=12, color="red"),
        xanchor="center",
    )

    fig.update_layout(
        width=700,
        height=500,
        title=f"Demographic Parity by {attribute_name}",
        xaxis_title=attribute_name,
        yaxis_title="Selection Rate (P(Ŷ=1))",
        yaxis=dict(range=[0, y_max]),
        margin=dict(l=40, r=40, t=60, b=40),
    )

    fig.show()

    return fig, None


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

    # Plotly figure
    fig = go.Figure()

    for group in groups:
        mask = protected_attr == group
        prob_true, prob_pred = calibration_curve(
            y_true[mask], y_prob[mask], n_bins=n_bins, strategy="uniform"
        )
        fig.add_trace(
            go.Scatter(
                x=prob_pred,
                y=prob_true,
                mode="lines+markers",
                name=f"{group}",
                marker=dict(size=6),
                line=dict(width=2),
            )
        )

    # Reference line (perfect calibration)
    fig.add_trace(
        go.Scatter(
            x=[0, 1],
            y=[0, 1],
            mode="lines",
            name="Perfectly calibrated",
            line=dict(color="black", dash="dash"),
            hoverinfo="skip",
        )
    )

    fig.update_layout(
        width=800,
        height=600,
        title="Calibration Plot by Subgroup",
        xaxis_title="Mean predicted probability",
        yaxis_title="Fraction of positives",
        margin=dict(l=40, r=40, t=60, b=40),
        legend=dict(title="Group"),
    )
    fig.update_xaxes(range=[0, 1], showgrid=True, gridcolor="rgba(0,0,0,0.2)")
    fig.update_yaxes(range=[0, 1], showgrid=True, gridcolor="rgba(0,0,0,0.2)")

    fig.show()

    return fig, None


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

    # Create Plotly subplots
    subplot_titles = [f"Group: {sensitive_mapping.get(g, f'Group {g}')}" for g in unique_groups]
    fig = make_subplots(rows=1, cols=n_groups, subplot_titles=subplot_titles, horizontal_spacing=0.08)

    for idx, group in enumerate(unique_groups):
        mask = sensitive_attr == group
        cm = confusion_matrix(
            y_true[mask],
            y_pred[mask],
            labels=labels_for_cm,
            normalize=normalize,
        )

        # Prepare text annotations
        if normalize is None:
            text_vals = [[f"{int(v)}" for v in row] for row in cm]
        else:
            text_vals = [[f"{v:.2f}" for v in row] for row in cm]

        # Heatmap trace
        fig.add_trace(
            go.Heatmap(
                z=cm,
                x=[str(l) for l in display_labels],
                y=[str(l) for l in display_labels],
                colorscale="Blues",
                showscale=False,
                text=text_vals,
                texttemplate="%{text}",
                hovertemplate="True: %{y}<br>Pred: %{x}<br>Value: %{text}<extra></extra>",
                zauto=True,
            ),
            row=1,
            col=idx + 1,
        )

        # Axis titles per subplot
        fig.update_xaxes(title_text="Predicted label", row=1, col=idx + 1)
        fig.update_yaxes(title_text="True label", autorange="reversed", row=1, col=idx + 1)

    fig.update_layout(
        width=max(400, 500 * n_groups),
        height=400,
        margin=dict(l=40, r=40, t=80, b=40),
    )

    fig.show()

    return fig, None


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

    # Plotly scatter with threshold-colored markers and colorbar
    fig = go.Figure(
        data=go.Scatter(
            x=eod_df["accuracy"],
            y=eod_df["eo_diff"],
            mode="markers",
            marker=dict(
                size=10,
                color=eod_df["threshold"],
                colorscale="Viridis",
                showscale=True,
                colorbar=dict(title="Threshold"),
            ),
            hovertemplate="Accuracy: %{x:.3f}<br>EO Diff: %{y:.3f}<br>Threshold: %{marker.color:.2f}<extra></extra>",
        )
    )
    fig.update_layout(
        width=800,
        height=600,
        title="Fairness vs Accuracy Trade-off",
        xaxis_title="Accuracy",
        yaxis_title="Equalized Odds Difference",
        margin=dict(l=40, r=40, t=60, b=40),
    )

    fig.show()

    return fig, None


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

    # Plotly radar (scatterpolar)
    fig = go.Figure()

    for group in metrics_dict.keys():
        values = [float(metrics_dict[group].get(m, np.nan)) for m in metric_names]
        values += values[:1]
        thetas = metric_names + [metric_names[0]]
        fig.add_trace(
            go.Scatterpolar(
                r=values,
                theta=thetas,
                name=str(group),
                fill="toself",
                opacity=0.6,
                line=dict(width=2),
            )
        )

    fig.update_layout(
        width=700,
        height=700,
        title=title,
        polar=dict(
            radialaxis=dict(range=[0, 1], showline=True, gridcolor="rgba(0,0,0,0.2)"),
            angularaxis=dict(direction="clockwise"),
        ),
        legend=dict(x=1.05, y=1, xanchor="left"),
        margin=dict(l=40, r=100, t=60, b=40),
    )

    fig.show()

    return fig, None


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

    # Plotly heatmap with annotations
    z_vals = df.values.astype(float)
    x_labels = df.columns.astype(str).tolist()
    y_labels = df.index.astype(str).tolist()

    text_vals = [[f"{v:.2f}" if pd.notna(v) else "" for v in row] for row in z_vals]

    fig = go.Figure(
        data=go.Heatmap(
            z=z_vals,
            x=x_labels,
            y=y_labels,
            colorscale="YlGnBu",
            colorbar=dict(title="Selection Rate"),
            text=text_vals,
            texttemplate="%{text}",
            hovertemplate="Group: %{y}<br>Stratum: %{x}<br>Selection Rate: %{z:.2f}<extra></extra>",
            zauto=True,
        )
    )

    fig.update_layout(
        width=1200,
        height=600,
        title="Conditional Statistical Parity Heatmap",
        xaxis_title="Stratum",
        yaxis_title="Group",
        margin=dict(l=40, r=40, t=60, b=40),
    )
    fig.update_yaxes(autorange="reversed")

    fig.show()

    return fig, None


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

    # Plotly horizontal stacked bar chart
    fig = go.Figure()

    cmap = plt.colormaps.get("tab20")
    for i, metric in enumerate(available_metrics):
        color_rgba = cmap(i % cmap.N) if cmap is not None else (0.1, 0.2, 0.5, 1.0)
        color_hex = mcolors.to_hex(color_rgba)
        fig.add_trace(
            go.Bar(
                x=values[:, i].tolist(),
                y=groups,
                name=metric,
                orientation="h",
                marker=dict(color=color_hex, line=dict(color="white", width=1)),
            )
        )

    fig.update_layout(
        width=800,
        height=500,
        barmode="stack",
        title=title,
        xaxis_title=x_label,
        yaxis_title=y_label,
        legend=dict(title="Metrics", x=1.05, y=1, xanchor="left"),
        margin=dict(l=80, r=120, t=60, b=40),
    )
    fig.update_xaxes(showgrid=True, gridcolor="rgba(0,0,0,0.4)", griddash="dash")

    fig.show()

    return fig, None


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

    # Plotly: boxes per metric + overlaid scatter points per group
    fig = go.Figure()

    metrics = df_melted["Metric"].unique().tolist()
    # Box traces (aggregate across groups per metric)
    for metric in metrics:
        vals = df_melted.loc[df_melted["Metric"] == metric, "Value"].astype(float).tolist()
        fig.add_trace(
            go.Box(
                x=[metric] * len(vals),
                y=vals,
                name=metric,
                boxpoints=False,
                showlegend=False,
            )
        )

    # Overlay per-group scatter points
    groups = df_melted["group"].unique().tolist()
    for grp in groups:
        sub = df_melted[df_melted["group"] == grp]
        fig.add_trace(
            go.Scatter(
                x=sub["Metric"],
                y=sub["Value"],
                mode="markers",
                name=str(grp),
                marker=dict(size=8, opacity=0.7),
                hovertemplate="Group: %{text}<br>Metric: %{x}<br>Value: %{y:.3f}<extra></extra>",
                text=[str(grp)] * len(sub),
            )
        )

    fig.update_layout(
        width=1000,
        height=600,
        title="Fairness Metrics Across Groups",
        xaxis_title="Metric",
        yaxis_title="Value",
        margin=dict(l=40, r=40, t=60, b=40),
        legend=dict(title="Group", x=1.02, y=1, xanchor="left"),
    )
    fig.update_yaxes(range=[0, 1], showgrid=True, gridcolor="rgba(0,0,0,0.4)")

    fig.show()

    return fig, None

