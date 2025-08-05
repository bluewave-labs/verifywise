import ast
import json
from pathlib import Path
from typing import Any, Dict, Optional

import pandas as pd


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
                "protected_attributes",
                "prediction",
            ]
            missing_columns = [
                col for col in required_columns if col not in self.results.columns
            ]
            if missing_columns:
                raise ValueError(
                    f"Missing required columns in results file: {missing_columns}"
                )

            # Convert protected_attributes from string to dict using ast for safety
            self.results["protected_attributes"] = self.results[
                "protected_attributes"
            ].apply(ast.literal_eval)
            # Expand protected_attributes dictionary into separate columns
            protected_attrs_expanded = pd.json_normalize(
                self.results["protected_attributes"].tolist()
            )

            # Add expanded columns back to results DataFrame with 'protected_' prefix
            for col in protected_attrs_expanded.columns:
                self.results[col] = protected_attrs_expanded[col]
        except FileNotFoundError:
            raise FileNotFoundError(f"Results file not found at: {self.results_path}")
        except pd.errors.EmptyDataError:
            raise ValueError(f"Results file is empty: {self.results_path}")
        except pd.errors.ParserError:
            raise ValueError(f"Invalid CSV format in results file: {self.results_path}")
