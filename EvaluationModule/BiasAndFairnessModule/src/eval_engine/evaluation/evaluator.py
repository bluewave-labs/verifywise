from typing import Optional, Dict, Any
from pathlib import Path

from ...core.config import ConfigManager
from .utils import get_logger, make_run_id
from .preprocessor import Preprocessor
from .data_models import EvalData, PlotArtifact, EvalResult
from .metric_runner import MetricRunner
from .plotter import Plotter
from .reporter import Reporter


class FairnessEvaluator:
    """Thin orchestrator for bias/fairness evaluation lifecycle.

    Responsibilities (incrementally implemented):
    - Load post-processed results from artifacts
    - Preprocess into EvalData (via Preprocessor)
    - Compute metrics (via MetricRunner)
    - Generate visualizations (via Plotter)
    - Persist JSON report (via Reporter)
    """

    def __init__(self, config_manager: ConfigManager) -> None:
        self.config_manager = config_manager
        self.logger = get_logger("eval.fairness_evaluator")       
    
    def run(
        self,
        *,
        results_path: Optional[str] = None,
        output_dir: Optional[str] = None,
    ) -> EvalResult:
        """Kick off evaluation by preprocessing results into EvalData.

        Args:
            results_path: Optional override path to postprocessed results CSV.
            output_dir: Directory to store run artifacts (config snapshot, etc.).

        Returns:
            EvalResult containing metadata, metrics, plots, and warnings.
        """

        # Derive defaults from configuration when not provided
        run_id = make_run_id()

        # Base directory for artifacts; default to reports_dir
        base_dir = (
            output_dir
            if output_dir is not None
            else str(self.config_manager.get_artifacts_config().reports_dir)
        )
        # Create unique folder per run by appending run_id
        run_output_dir = str(Path(base_dir) / run_id)

        self.logger.info("Starting evaluation run: %s", run_id)

        # Preprocess: load results and assemble EvalData
        preprocessor = Preprocessor(config_manager=self.config_manager)
        eval_data = preprocessor.run(
            results_path=results_path,
            output_dir=run_output_dir,
            run_id=run_id,
        )

        self.logger.info("Prepared EvalData for run: %s", run_id)

        # Compute metrics via MetricRunner with warn-and-None failure policy
        metrics: Optional[Dict[str, Any]] = None
        try:
            metric_runner = MetricRunner(config_manager=self.config_manager)
            metrics = metric_runner.run(eval_data)
        except Exception as exc:
            self.logger.warning("Metrics computation failed: %s", exc)
            metrics = None

        # Generate visualizations via Plotter with warn-and-None failure policy
        plots: Optional[list[PlotArtifact]] = None
        try:
            plotter = Plotter(config_manager=self.config_manager, run_output_dir=run_output_dir)
            plots = plotter.generate(eval_data)
        except Exception as exc:
            self.logger.warning("Plot generation failed: %s", exc)
            plots = None

        # Build EvalResult
        eval_result = EvalResult(
            meta=eval_data.meta,
            metrics=metrics if isinstance(metrics, dict) else {},
            plots=plots or [],
            warnings=[],
        )

        # Persist results to JSON report (warn-on-failure) in the unique run folder
        try:
            reporter = Reporter(reports_dir=run_output_dir)
            reporter.write_json(eval_result)
        except Exception as exc:
            self.logger.warning("Failed to write JSON report: %s", exc)

        return eval_result

