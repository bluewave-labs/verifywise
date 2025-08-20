import ast
import json
from pathlib import Path
from typing import Any, Dict, Optional

import pandas as pd

# Import metrics to ensure they are registered
from .metric_registry import get_metric
from .metrics import *  # This imports and registers all metric functions


class FairnessEvaluator:
    """
    A class to evaluate fairness metrics based on model results and configuration.
    """

    def __init__(self, metrics_config, results_path: str):
        """
        Initialize the FairnessEvaluator with metrics configuration and results file path.

        Args:
            metrics_config: Configuration containing metrics settings
            results_path (str): Path to the results file to be evaluated
        """
        self.config = metrics_config
        self.results_path = Path(results_path)
        self.results: Optional[pd.DataFrame] = None

        # Load results
        self._load_results()

    def _load_results(self) -> None:
        """Load and validate the results CSV file into a pandas DataFrame."""
        try:
            self.results = pd.read_csv(self.results_path)

            # Validate required columns
            required_columns = [
                "sample_id",
                "prompt",
                "answer",
                "prediction",
            ]
            missing_columns = [
                col for col in required_columns if col not in self.results.columns
            ]
            if missing_columns:
                raise ValueError(
                    f"Missing required columns in results file: {missing_columns}"
                )

        except FileNotFoundError:
            raise FileNotFoundError(f"Results file not found at: {self.results_path}")
        except pd.errors.EmptyDataError:
            raise ValueError(f"Results file is empty: {self.results_path}")
        except pd.errors.ParserError:
            raise ValueError(f"Invalid CSV format in results file: {self.results_path}")

    def evaluate(self) -> Dict[str, Dict[str, Any]]:
        """
        Get the metric functions specified in the configuration for both fairness and performance metrics.

        Returns:
            Dict[str, Dict[str, Any]]: A nested dictionary with 'fairness' and 'performance' sections,
                                     each containing metric names mapped to their corresponding functions
        """
        metric_functions = {"fairness": {}, "performance": {}}

        # Get fairness metrics if enabled
        if self.config.fairness.enabled:
            for metric_name in self.config.fairness.metrics:
                metric_functions["fairness"][metric_name] = get_metric(metric_name)

        # Get performance metrics if enabled
        if self.config.performance.enabled:
            for metric_name in self.config.performance.metrics:
                metric_functions["performance"][metric_name] = get_metric(metric_name)

        return metric_functions
