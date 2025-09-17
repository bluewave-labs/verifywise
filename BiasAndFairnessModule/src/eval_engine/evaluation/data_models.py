from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Union

import numpy as np
import pandas as pd


@dataclass
class Meta:
    """Metadata for a single evaluation run."""

    run_id: str
    output_dir: str
    config_snapshot_path: Optional[str] = None
    favourable_outcome: Optional[Union[int, str]] = None
    disparity_reference: Optional[str] = None  # e.g., "worst"
    notes: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PlotArtifact:
    """Reference to a saved plot artifact on disk."""

    type: str
    attribute: Optional[str]
    paths: Dict[str, str]


@dataclass
class EvalData:
    """Container for inputs used by the evaluation engine."""

    df: pd.DataFrame
    y_true: np.ndarray
    y_pred: np.ndarray
    y_prob: Optional[np.ndarray]
    attributes_df: pd.DataFrame
    meta: Meta


@dataclass
class EvalResult:
    """Aggregated results of an evaluation run: metrics, plots, and metadata."""

    metrics: Dict[str, Any]
    plots: List[PlotArtifact]
    meta: Meta
    warnings: List[str] = field(default_factory=list)
