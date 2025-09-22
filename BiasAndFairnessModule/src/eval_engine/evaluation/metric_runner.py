import fnmatch
from typing import Any, Dict, Optional, List, Tuple
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
    
    @staticmethod
    def _series_like_to_dict(x: Any) -> Dict[str, float]:
        try:
            if isinstance(x, pd.Series):
                return {str(k): MetricRunner._maybe_float(v) for k, v in x.to_dict().items()}
            # try array-like with index/keys
            if hasattr(x, "items"):
                return {str(k): MetricRunner._maybe_float(v) for k, v in x.items()}
        except Exception:
            pass
        # last resort
        try:
            arr = np.asarray(x)
            return {str(i): MetricRunner._maybe_float(v) for i, v in enumerate(arr)}
        except Exception:
            return {}
    
    @staticmethod
    def _range_stats(values: List[Optional[float]]) -> Tuple[Optional[float], Optional[float]]:
        vals = [v for v in values if isinstance(v, (int, float)) and not np.isnan(v)]
        if not vals:
            return None, None
        vmin, vmax = min(vals), max(vals)
        diff = float(vmax - vmin)
        ratio = (float(vmin) / float(vmax)) if vmax != 0 else None
        return diff, ratio
    
    @staticmethod
    def _adapt_dict_by_group(d: Dict[Any, Any]) -> Dict[str, Any]:
        values: List[float] = []
        by_group: Dict[str, Any] = {}
        for k, v in d.items():
            fv: Optional[float] = None
            if isinstance(v, (list, dict)):
                by_group[str(k)] = v
            else:
                fv = MetricRunner._maybe_float(v)
                by_group[str(k)] = fv
            if fv is not None:
                values.append(fv)
        diff, ratio = MetricRunner._range_stats(values)
        return {"by_group": by_group, "overall": None, "difference": diff, "ratio": ratio, "extra": {"units": "count"}}

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

    def _adapt_metricframe(self, mf: Any) -> Dict[str, Any]:
        """
        Extracts by_group, overall, difference, ratio from a MetricFrame-like object.
        Falls back to manual max-min when methods are missing.
        """
        by_group: Dict[str, Optional[float]] = {}
        overall: Optional[float] = None
        diff: Optional[float] = None
        ratio: Optional[float] = None

        # by_group
        if hasattr(mf, "by_group"):
            try:
                bg = getattr(mf, "by_group")
                if isinstance(bg, pd.Series):
                    by_group = {str(k): self._maybe_float(v) for k, v in bg.to_dict().items()}
                elif isinstance(bg, dict):
                    by_group = {str(k): self._maybe_float(v) for k, v in bg.items()}
                else:
                    by_group = self._series_like_to_dict(bg)
            except Exception:
                by_group = {}

        # overall
        if hasattr(mf, "overall"):
            try:
                overall = self._maybe_float(getattr(mf, "overall"))
            except Exception:
                overall = None

        # difference / ratio
        if hasattr(mf, "difference"):
            try:
                diff = self._maybe_float(mf.difference())
            except Exception:
                diff = None
        if hasattr(mf, "ratio"):
            try:
                ratio = self._maybe_float(mf.ratio())
            except Exception:
                ratio = None

        # Fallback from by_group
        if (diff is None or ratio is None) and by_group:
            values = [v for v in by_group.values() if self._is_number(v)]
            d, r = self._range_stats(values)
            if diff is None:
                diff = d
            if ratio is None:
                ratio = r

        return {"by_group": by_group, "overall": overall, "difference": diff, "ratio": ratio, "extra": {}}

    def _adapt_namedtuple(self, nt: Any) -> Dict[str, Any]:
        out: Dict[str, Any] = {}
        for field in getattr(nt, "_fields", []):
            part = getattr(nt, field)
            if self._looks_like_metricframe(part):
                out[field] = self._adapt_metricframe(part)
            elif isinstance(part, dict):
                out[field] = self._adapt_dict_by_group(part)
            elif self._is_namedtuple(part):
                out[field] = {"components": self._adapt_namedtuple(part)}
            else:
                out[field] = {"value": self._maybe_float(part)}
        return out

    def _normalize_by_attribute(self, raw: Any) -> Optional[Dict[str, Any]]:
        """
        Returns a dict with keys: by_group, overall, difference, ratio, extra.
        """
        # MetricFrame-like (fairlearn or your wrapper)
        if self._looks_like_metricframe(raw):
            return self._adapt_metricframe(raw)

        # dict-by-group (e.g., equal_selection_parity counts)
        if isinstance(raw, dict):
            return self._adapt_dict_by_group(raw)

        # namedtuple of frames (composite)
        if self._is_namedtuple(raw):
            return {"components": self._adapt_namedtuple(raw)}

        # list of dicts (e.g., conditional statistical parity reports)
        if isinstance(raw, list):
            return {"list": raw}

        # scalar → treat as simple scalar by_group with single key "value"
        if self._is_number(raw):
            v = self._maybe_float(raw)
            return {"by_group": {"value": v}, "overall": v, "difference": 0.0, "ratio": 1.0, "extra": {}}

        # Pandas objects: try to coerce to dict
        if isinstance(raw, (pd.Series, pd.DataFrame)):
            try:
                series = raw if isinstance(raw, pd.Series) else raw.squeeze()
                d = {str(k): self._maybe_float(v) for k, v in series.to_dict().items()}
                diff, ratio = self._range_stats(list(d.values()))
                return {"by_group": d, "overall": self._maybe_float(series.mean()), "difference": diff, "ratio": ratio, "extra": {}}
            except Exception:
                return None

        # Unknown type
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

            # Compute per-attribute fairness if attributes exist and metric accepts them
            if (
                hasattr(data, "attributes_df")
                and isinstance(protected_attributes, pd.DataFrame)
                and not protected_attributes.empty
                and "protected_attributes" in accepts
            ):
                for attr in protected_attributes.columns:
                    try:
                        attr_array = protected_attributes[attr].to_numpy()
                        raw = self._safe_call(
                            fn,
                            **{
                                **common,
                                "protected_attributes": attr_array,
                            },
                        )

                        if res["result_type"] == "unknown":
                            res["result_type"] = self._infer_result_type_hint(raw)

                        normalized = self._normalize_by_attribute(raw)
                        res["by_attribute"][attr] = normalized

                        if res["result_type"] == "scalar" and res["summary"] is None:
                            res["summary"] = self._maybe_float(raw)
                    except Exception as exc:
                        self.logger.warning(
                            f"By-attribute computation failed for metric '{metric_name}' on '{attr}': {exc}"
                        )
                        res["by_attribute"][attr] = None

            results[metric_name] = res

        return results


