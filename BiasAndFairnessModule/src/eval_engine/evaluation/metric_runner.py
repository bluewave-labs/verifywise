import fnmatch
from typing import Any, Dict, Optional
import inspect
import numpy as np
import pandas as pd

from ...core.config import ConfigManager
from .utils import get_logger
from .data_models import EvalData
from ..metric_registry import get_metric


class MetricRunner:
    """Compute fairness and performance metrics for an evaluation run.

    This runner reads metric selections from the configuration and computes
    the corresponding metrics over the provided `EvalData`.
    """

    def __init__(self, config_manager: ConfigManager) -> None:
        self.config_manager = config_manager
        self.logger = get_logger("eval.metric_runner")

    @staticmethod
    def _empty_result(result_type: str) -> Dict[str, Any]:
        return {
            "result_type": result_type,  # "scalar" | "metricframe" | "dict_by_group" | "list_of_dict" | "composite" | "unknown"
            "summary": None,
            "overall": None,
            "by_attribute": {},
            "notes": {},
        }

    @staticmethod
    def _is_number(x: Any) -> bool:
        return isinstance(x, (int, float, np.number)) and not (
            isinstance(x, float) and (np.isnan(x) or np.isinf(x))
        )

    @staticmethod
    def _maybe_float(x: Any) -> Optional[float]:
        try:
            if x is None:
                return None
            if isinstance(x, (pd.Series, pd.DataFrame)):
                x = np.asarray(x).ravel()[0]
            xf = float(x)
            if np.isnan(xf) or np.isinf(xf):
                return None
            return xf
        except Exception:
            return None

    @staticmethod
    def _is_namedtuple(x: Any) -> bool:
        return isinstance(x, tuple) and hasattr(x, "_fields")

    @staticmethod
    def _looks_like_metricframe(x: Any) -> bool:
        # Duck typing: has "by_group" and either "overall" or "difference"/"ratio"
        return hasattr(x, "by_group") and (
            hasattr(x, "overall") or hasattr(x, "difference") or hasattr(x, "ratio")
        )

    def _infer_result_type_hint(self, sample: Any) -> str:
        if sample is None:
            return "unknown"
        if self._is_number(sample):
            return "scalar"
        if self._looks_like_metricframe(sample):
            return "metricframe"
        if isinstance(sample, dict):
            return "dict_by_group"
        if self._is_namedtuple(sample):
            return "composite"
        if isinstance(sample, list):
            return "list_of_dict"
        if isinstance(sample, (pd.Series, pd.DataFrame)):
            return "dict_by_group"
        return "unknown"

    def _safe_call(self, fn, **kwargs):
        # Pass only accepted kwargs (signature-constrained)
        sig = inspect.signature(fn)
        accepts = set(sig.parameters.keys())
        clean = {k: v for k, v in kwargs.items() if k in accepts}
        return fn(**clean)

    def _normalize_overall(self, raw: Any) -> Optional[float]:
        """
        For "overall", we only ever store a scalar if it exists.
        If the metric returns a frame/dict/etc for overall, we ignore here and rely on by-attribute.
        """
        if self._is_number(raw):
            return self._maybe_float(raw)
        # MetricFrame overall
        if hasattr(raw, "overall"):
            try:
                return self._maybe_float(getattr(raw, "overall"))
            except Exception:
                return None
        # Pandas scalar-ish
        if isinstance(raw, (pd.Series, pd.DataFrame)):
            try:
                return float(np.asarray(raw).ravel()[0])
            except Exception:
                return None
        return None

    def run(self, data: EvalData) -> Dict[str, Any]:
        """Execute metric computations and prepare outputs.

        Args:
            data: The prepared evaluation data container.

        Note:
            Implementation to be added: compute metrics, handle graceful failures,
            and prepare artifacts per configuration.
        """
        # Read metric selections from configuration
        metrics_cfg = self.config_manager.get_metrics_config()
        fairness_metric_names = (
            list(metrics_cfg.fairness.metrics) if metrics_cfg.fairness.enabled else []
        )
        performance_metric_names = (
            list(metrics_cfg.performance.metrics)
            if metrics_cfg.performance.enabled
            else []
        )

        # Initialize results container
        results: Dict[str, Any] = {}

        # Extract arrays and attributes from input data
        y_true = data.y_true
        y_pred = data.y_pred
        y_prob = data.y_prob
        protected_attributes = data.attributes_df

        # Determine full ordered list of metric names to run
        metric_names: list[str] = []
        metric_names.extend(fairness_metric_names)
        metric_names.extend(performance_metric_names)

        # Register metric keys in results and warn on missing metrics
        for metric_name in metric_names:
            try:
                fn = get_metric(metric_name)
            except KeyError:
                self.logger.warning(f"Metric not found in registry: {metric_name}")
                results[metric_name] = self._empty_result("unknown")
                continue

            # Analyze function signature to capture accepted parameters
            params = inspect.signature(fn).parameters
            accepts = set(params.keys())

            # Build a common args dict based on what the function accepts
            common: Dict[str, Any] = {}
            if "y_true" in accepts:
                common["y_true"] = y_true
            if "y_pred" in accepts:
                common["y_pred"] = y_pred
            if "y_pred_proba" in accepts:
                common["y_pred_proba"] = y_prob
            
            res = self._empty_result(self._infer_result_type_hint(None))  # type filled after first success
            res["notes"]["disparity_reference"] = data.meta.disparity_reference or "worst"

            # Compute overall if metric does NOT accept protected attributes
            if "protected_attributes" not in accepts:
                try:
                    overall_raw = self._safe_call(fn, **common)

                    if res["result_type"] == "unknown":
                        res["result_type"] = self._infer_result_type_hint(overall_raw)

                    overall_value = self._normalize_overall(overall_raw)
                    res["overall"] = overall_value

                    if res["result_type"] == "scalar" and res["summary"] is None:
                        res["summary"] = overall_value
                except Exception as exc:
                    self.logger.warning(
                        f"Overall computation failed for metric '{metric_name}': {exc}"
                    )
                    res["overall"] = None

            results[metric_name] = res

        return results


