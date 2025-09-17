from typing import Optional, List
import pandas as pd

from ...core.config import ConfigManager
from .utils import get_logger, safe_mkdirs, snapshot_config
from .data_models import Meta, EvalData


class Preprocessor:
    """Prepare post-processed results for evaluation."""

    def __init__(
        self,
        config_manager: ConfigManager,
    ) -> None:
        self.config_manager = config_manager
        self.logger = get_logger("eval.preprocessor")

    def load_postprocessed_results(self, results_path: Optional[str] = None) -> pd.DataFrame:
        """Load the post-processed results CSV into a DataFrame.

        If results_path is None, the path is taken from the ConfigManager.
        Raises ValueError if the loaded DataFrame is empty.
        """

        if results_path is None:
            results_path = str(
                self.config_manager.get_artifacts_config().postprocessed_results_path
            )

        self.logger.info(f"Loading post-processed results from: {results_path}")
        df = pd.read_csv(results_path)
        if df.empty:
            raise ValueError("Post-processed results DataFrame is empty")
        return df

    def get_protected_attributes(self, df: pd.DataFrame) -> List[str]:
        """Return list of protected attribute columns present in the DataFrame.

        Reads desired attributes from ConfigManager and logs warnings for any that
        are missing from the provided DataFrame.
        """

        desired_attrs: List[str] = (
            self.config_manager.get_dataset_config().protected_attributes or []
        )
        present_attrs: List[str] = []
        missing_attrs: List[str] = []

        df_cols = set(df.columns)
        for attr in desired_attrs:
            if attr in df_cols:
                present_attrs.append(attr)
            else:
                missing_attrs.append(attr)

        if missing_attrs:
            self.logger.warning(
                "Missing protected attributes in dataset: %s",
                ", ".join(missing_attrs),
            )

        return present_attrs

    def run(
        self,
        results_path: Optional[str],
        output_dir: str,
        run_id: str,
    ) -> EvalData:
        """Load results, derive arrays, and assemble EvalData and Meta."""

        safe_mkdirs(output_dir)

        # Load results and determine protected attributes present
        df = self.load_postprocessed_results(results_path)
        protected_attrs = self.get_protected_attributes(df)

        # Extract required arrays
        if "answer" not in df.columns or "prediction" not in df.columns:
            missing = [c for c in ["answer", "prediction"] if c not in df.columns]
            raise ValueError(f"Missing required columns in results: {missing}")

        y_true = df["answer"].to_numpy()
        y_pred = df["prediction"].to_numpy()

        # Optional probability/score column: use 'confidence' if available
        y_prob = df["confidence"].to_numpy() if "confidence" in df.columns else None

        # Attributes DataFrame (N x K) or empty with correct index
        if protected_attrs:
            attributes_arr = df[protected_attrs].copy()
        else:
            attributes_arr = pd.DataFrame(index=df.index)

        # Build Meta
        pp_cfg = self.config_manager.get_post_processing_config()
        favourable_outcome_value = pp_cfg.binary_mapping.favorable_outcome
        config_snapshot = snapshot_config(
            self.config_manager.to_dict(), output_dir=output_dir, run_id=run_id
        )
        meta = Meta(
            run_id=run_id,
            output_dir=output_dir,
            config_snapshot_path=config_snapshot,
            favourable_outcome=favourable_outcome_value,
            disparity_reference=None,
        )

        return EvalData(
            df=df,
            y_true=y_true,
            y_pred=y_pred,
            y_prob=y_prob,
            attributes_arr=attributes_arr,
            meta=meta,
        )


