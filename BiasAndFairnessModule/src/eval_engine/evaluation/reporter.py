"""Utilities for persisting evaluation results to disk.

This module defines the ``Reporter`` class, responsible for preparing
an output directory and logging actions related to saving results.
"""

from pathlib import Path
import logging
import json
from typing import Any, Dict
from ...core.config import ConfigManager
from .data_models import EvalResult


class Reporter:
    """Handles persistence of evaluation results.

    For now, this class is initialized with an output directory and a logger.
    Future methods will support dumping an ``EvalResult`` to JSON and writing
    related artifacts.
    """

    def __init__(self, config_manager: ConfigManager) -> None:
        """Create a new instance of Reporter.

        Args:
            config_manager: Configuration manager to read artifact locations from.
        """
        self.config_manager = config_manager
        self.reports_dir: Path = Path(
            str(self.config_manager.get_artifacts_config().reports_dir)
        )
        # Ensure the output directory exists to avoid errors on first write.
        self.reports_dir.mkdir(parents=True, exist_ok=True)

        # Initialize a dedicated logger for this component.
        self.logger: logging.Logger = logging.getLogger(f"{__name__}.Reporter")
        self.logger.debug("Initialized Reporter with reports_dir=%s", str(self.reports_dir))

    def write_json(self, result: EvalResult) -> None:
        """Write evaluation results to a JSON file named 'general_report.json'.

        Args:
            result: Aggregated evaluation result to be serialized.
        """
        payload: Dict[str, Any] = {
            "meta": {
                "run_id": result.meta.run_id,
                "output_dir": getattr(result.meta, "output_dir", None),
                "favourable_outcome": result.meta.favourable_outcome,
                "disparity_reference": result.meta.disparity_reference,
                "config_snapshot_path": result.meta.config_snapshot_path,
                "git_commit": getattr(result.meta, "git_commit", None),
                "notes": result.meta.notes,
            },
            "metrics": result.metrics,
            "plots": [
                {
                    "type": p.type,
                    "attribute": p.attribute,
                    "paths": p.paths,
                    "extras": getattr(p, "extras", {}),
                }
                for p in result.plots
            ],
            "warnings": result.warnings,
        }

        output_path = self.reports_dir / "general_report.json"
        with output_path.open("w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        self.logger.info("Wrote metrics report to %s", str(output_path))


