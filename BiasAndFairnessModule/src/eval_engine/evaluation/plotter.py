from typing import Callable, Dict

import numpy as np

from ...core.config import ConfigManager
from .data_models import EvalData, PlotArtifact
from .utils import get_logger, save_plotly
from visualizations.plots import (
    plot_demographic_parity,
    plot_calibration_by_group,
    plot_groupwise_confusion_matrices,
    create_fairness_vs_accuracy_plot,
    plot_fairness_radar,
    plot_conditional_statistical_parity,
    plot_cumulative_parity_loss,
    plot_group_metrics_boxplots,
)


class Plotter:
    """
    Plotter orchestrates generation and saving of fairness visualizations.

    This initial scaffold wires a handler for Demographic Parity using
    `plot_demographic_parity` from `visualizations.plots`.
    """

    def __init__(self, config_manager: ConfigManager, plots_dir: str) -> None:
        self.config_manager = config_manager
        self.plots_dir = plots_dir
        self.logger = get_logger("eval.plotter")

        # Registry of plot handlers by key
        self._handlers: Dict[str, Callable[..., PlotArtifact]] = {
            "plot_demographic_parity": self._handle_demographic_parity,
            "plot_calibration_by_group": self._handle_calibration_by_group,
            "plot_groupwise_confusion_matrices": self._handle_groupwise_confusion_matrices,
            "create_fairness_vs_accuracy_plot": self._handle_fairness_vs_accuracy_plot,
            "plot_fairness_radar": self._handle_fairness_radar,
            "plot_conditional_statistical_parity": self._handle_conditional_statistical_parity,
            "plot_cumulative_parity_loss": self._handle_cumulative_parity_loss,
            "plot_group_metrics_boxplots": self._handle_group_metrics_boxplots,
        }

    def generate(self, data: EvalData) -> list[PlotArtifact]:
        """Generate figures as specified in configuration.

        Reads visualization specs, collects figure names, and invokes the
        appropriate handler for each, with warning-level logging on failures.
        """

        viz_items = self.config_manager.get_visualizations()
        artifacts: list[PlotArtifact] = []

        for item in viz_items:
            fig_type = getattr(item, "type", None)
            handler = self._handlers.get(str(fig_type))
            if handler is None:
                self.logger.warning(f"Handler not registered for type '{fig_type}'")
                continue

            try:
                attribute_name = getattr(item, "attribute", None)
                if not attribute_name:
                    raise ValueError("Visualization requires 'attribute' to be set")
                artifact = handler(data=data, attribute_name=attribute_name)
                artifacts.append(artifact)
            except Exception as exc:
                self.logger.warning(f"Failed to generate figure '{fig_type}': {exc}")

        return artifacts

    def _handle_demographic_parity(
        self,
        *,
        data: EvalData,
        attribute_name: str,
    ) -> PlotArtifact:
        """Generate and save Demographic Parity plot for a single attribute.

        Args:
            data: Evaluation data container.
            attribute_name: Column name in `data.protected_attributes_df` to plot.
        """

        if (
            data.protected_attributes_df is None
            or attribute_name not in data.protected_attributes_df.columns
        ):
            raise ValueError(
                f"Attribute '{attribute_name}' not found in protected_attributes_df"
            )

        y_true: np.ndarray = data.y_true
        y_pred: np.ndarray = data.y_pred
        sensitive_features: np.ndarray = (
            data.protected_attributes_df[attribute_name].to_numpy()
        )

        fig, _ = plot_demographic_parity(
            y_true=y_true,
            y_pred=y_pred,
            sensitive_features=sensitive_features,
            attribute_name=attribute_name,
        )

        base_no_ext = f"{self.plots_dir}/demographic_parity__{attribute_name}"
        saved = save_plotly(fig, base_no_ext, ("html", "png"), logger=self.logger)

        return PlotArtifact(
            type="demographic_parity",
            attribute=attribute_name,
            paths=saved,
        )

    def _handle_calibration_by_group(
        self,
        *,
        data: EvalData,
        attribute_name: str,
    ) -> PlotArtifact:
        """Generate and save Calibration-by-Group plot for a single attribute."""

        if (
            data.protected_attributes_df is None
            or attribute_name not in data.protected_attributes_df.columns
        ):
            raise ValueError(
                f"Attribute '{attribute_name}' not found in protected_attributes_df"
            )

        if data.y_prob is None:
            raise ValueError("Calibration plot requires 'y_prob' probabilities to be provided")

        y_true: np.ndarray = data.y_true
        y_prob: np.ndarray = data.y_prob
        protected_attr: np.ndarray = (
            data.protected_attributes_df[attribute_name].to_numpy()
        )

        fig, _ = plot_calibration_by_group(
            y_true=y_true,
            y_prob=y_prob,
            protected_attr=protected_attr,
        )

        base_no_ext = f"{self.plots_dir}/calibration_by_group__{attribute_name}"
        saved = save_plotly(fig, base_no_ext, ("html", "png"), logger=self.logger)

        return PlotArtifact(
            type="calibration_by_group",
            attribute=attribute_name,
            paths=saved,
        )

    def _handle_groupwise_confusion_matrices(
        self,
        *,
        data: EvalData,
        attribute_name: str,
    ) -> PlotArtifact:
        """Generate and save groupwise confusion matrices for a single attribute."""

        if (
            data.protected_attributes_df is None
            or attribute_name not in data.protected_attributes_df.columns
        ):
            raise ValueError(
                f"Attribute '{attribute_name}' not found in protected_attributes_df"
            )

        y_true: np.ndarray = data.y_true
        y_pred: np.ndarray = data.y_pred
        sensitive_attr: np.ndarray = (
            data.protected_attributes_df[attribute_name].to_numpy()
        )

        # Build a simple identity mapping from unique values to labels
        unique_vals = np.unique(sensitive_attr)
        sensitive_mapping = {val: str(val) for val in unique_vals}

        fig, _ = plot_groupwise_confusion_matrices(
            y_true=y_true,
            y_pred=y_pred,
            sensitive_attr=sensitive_attr,
            sensitive_mapping=sensitive_mapping,
            labels=None,
            normalize=None,
        )

        base_no_ext = f"{self.plots_dir}/confusion_matrices_by_group__{attribute_name}"
        saved = save_plotly(fig, base_no_ext, ("html", "png"), logger=self.logger)

        return PlotArtifact(
            type="groupwise_confusion_matrices",
            attribute=attribute_name,
            paths=saved,
        )

    def _handle_fairness_vs_accuracy_plot(
        self,
        *,
        data: EvalData,
        attribute_name: str,
    ) -> PlotArtifact:
        """Generate and save Fairness vs Accuracy plot (threshold sweep)."""

        if (
            data.protected_attributes_df is None
            or attribute_name not in data.protected_attributes_df.columns
        ):
            raise ValueError(
                f"Attribute '{attribute_name}' not found in protected_attributes_df"
            )

        if data.y_prob is None:
            raise ValueError(
                "Fairness vs Accuracy plot requires 'y_prob' scores to be provided"
            )

        y_true: np.ndarray = data.y_true
        y_pred: np.ndarray = data.y_pred
        y_scores: np.ndarray = data.y_prob
        sensitive_attr: np.ndarray = (
            data.protected_attributes_df[attribute_name].to_numpy()
        )

        fig, _ = create_fairness_vs_accuracy_plot(
            y_true=y_true,
            y_pred=y_pred,
            y_scores=y_scores,
            sensitive_attr=sensitive_attr,
        )

        base_no_ext = f"{self.plots_dir}/fairness_vs_accuracy__{attribute_name}"
        saved = save_plotly(fig, base_no_ext, ("html", "png"), logger=self.logger)

        return PlotArtifact(
            type="fairness_vs_accuracy",
            attribute=attribute_name,
            paths=saved,
        )

    def _handle_fairness_radar(
        self,
        *,
        data: EvalData,
        attribute_name: str,
    ) -> PlotArtifact:
        """Generate and save Fairness Radar plot for a single attribute."""

        if (
            data.protected_attributes_df is None
            or attribute_name not in data.protected_attributes_df.columns
        ):
            raise ValueError(
                f"Attribute '{attribute_name}' not found in protected_attributes_df"
            )

        y_true: np.ndarray = data.y_true
        # Prefer probabilities if available, as the radar uses proba for several metrics
        y_pred_input: np.ndarray = (
            data.y_prob if data.y_prob is not None else data.y_pred
        )
        protected_attributes: np.ndarray = (
            data.protected_attributes_df[attribute_name].to_numpy()
        )

        unique_vals = np.unique(protected_attributes)
        sensitive_mapping = {val: str(val) for val in unique_vals}

        fig, _ = plot_fairness_radar(
            y_true=y_true,
            y_pred=y_pred_input,
            protected_attributes=protected_attributes,
            sensitive_mapping=sensitive_mapping,
            title=f"Fairness Metrics Radar Chart ({attribute_name})",
        )

        base_no_ext = f"{self.plots_dir}/fairness_radar__{attribute_name}"
        saved = save_plotly(fig, base_no_ext, ("html", "png"), logger=self.logger)

        return PlotArtifact(
            type="fairness_radar",
            attribute=attribute_name,
            paths=saved,
        )

    def _handle_conditional_statistical_parity(
        self,
        *,
        data: EvalData,
        attribute_name: str,
    ) -> PlotArtifact:
        """Generate and save Conditional Statistical Parity heatmap for a single protected attribute.

        Uses all available legitimate attributes to define strata (concatenated as a composite key).
        """

        if (
            data.protected_attributes_df is None
            or attribute_name not in data.protected_attributes_df.columns
        ):
            raise ValueError(
                f"Attribute '{attribute_name}' not found in protected_attributes_df"
            )

        if (
            getattr(data, "legitimate_attributes_df", None) is None
            or data.legitimate_attributes_df.empty
        ):
            raise ValueError(
                "Conditional Statistical Parity plot requires legitimate_attributes_df to be provided"
            )

        y_pred: np.ndarray = data.y_pred
        protected_attributes: np.ndarray = (
            data.protected_attributes_df[attribute_name].to_numpy()
        )
        # Build composite strata from all legitimate attributes
        legit_df = data.legitimate_attributes_df.astype(str)
        legitimate_attributes: np.ndarray = (
            legit_df.agg("|".join, axis=1).to_numpy()
            if legit_df.shape[1] > 1
            else legit_df.iloc[:, 0].to_numpy()
        )

        fig, _ = plot_conditional_statistical_parity(
            y_pred=y_pred,
            protected_attributes=protected_attributes,
            legitimate_attributes=legitimate_attributes,
        )

        base_no_ext = f"{self.plots_dir}/conditional_statistical_parity__{attribute_name}"
        saved = save_plotly(fig, base_no_ext, ("html", "png"), logger=self.logger)

        return PlotArtifact(
            type="conditional_statistical_parity",
            attribute=attribute_name,
            paths=saved,
        )

    def _handle_cumulative_parity_loss(
        self,
        *,
        data: EvalData,
        attribute_name: str,
    ) -> PlotArtifact:
        """Generate and save Cumulative Parity Loss stacked bar plot for a single attribute."""

        if (
            data.protected_attributes_df is None
            or attribute_name not in data.protected_attributes_df.columns
        ):
            raise ValueError(
                f"Attribute '{attribute_name}' not found in protected_attributes_df"
            )

        y_true: np.ndarray = data.y_true
        y_pred: np.ndarray = data.y_pred
        protected_attributes: np.ndarray = (
            data.protected_attributes_df[attribute_name].to_numpy()
        )

        fig, _ = plot_cumulative_parity_loss(
            y_true=y_true,
            y_pred=y_pred,
            protected_attributes=protected_attributes,
        )

        base_no_ext = f"{self.plots_dir}/cumulative_parity_loss__{attribute_name}"
        saved = save_plotly(fig, base_no_ext, ("html", "png"), logger=self.logger)

        return PlotArtifact(
            type="cumulative_parity_loss",
            attribute=attribute_name,
            paths=saved,
        )

    def _handle_group_metrics_boxplots(
        self,
        *,
        data: EvalData,
        attribute_name: str,
    ) -> PlotArtifact:
        """Generate and save Group Metrics Boxplots for a single attribute."""

        if (
            data.protected_attributes_df is None
            or attribute_name not in data.protected_attributes_df.columns
        ):
            raise ValueError(
                f"Attribute '{attribute_name}' not found in protected_attributes_df"
            )

        y_true: np.ndarray = data.y_true
        y_pred: np.ndarray = data.y_pred
        sensitive_attr: np.ndarray = (
            data.protected_attributes_df[attribute_name].to_numpy()
        )

        fig, _ = plot_group_metrics_boxplots(
            y_true=y_true,
            y_pred=y_pred,
            sensitive_attr=sensitive_attr,
        )

        base_no_ext = f"{self.plots_dir}/group_metrics_boxplots__{attribute_name}"
        saved = save_plotly(fig, base_no_ext, ("html", "png"), logger=self.logger)

        return PlotArtifact(
            type="group_metrics_boxplots",
            attribute=attribute_name,
            paths=saved,
        )


