from typing import Optional, List, Dict, Any
import pandas as pd

from ...core.config import ConfigManager
from .utils import get_logger, safe_mkdirs, snapshot_config
from .data_models import Meta, EvalData

def build_encoding_notes(config_manager: ConfigManager) -> Dict[str, Any]:
    """Build a dictionary describing encoding rules used in post-processing."""

    pp_cfg = config_manager.get_post_processing_config()

    fav = pp_cfg.binary_mapping.favorable_outcome
    unfav = pp_cfg.binary_mapping.unfavorable_outcome

    notes: Dict[str, Any] = {
        "labels": {
            "positive_label": fav,
            "negative_label": unfav,
            "encode": {fav: 1, unfav: 0},
            "decode": {1: fav, 0: unfav},
        },
        "protected_attributes": {},
    }

    for attr, group in pp_cfg.attribute_groups.items():
        enc_map = {**{v: 1 for v in group.privileged}, **{v: 0 for v in group.unprivileged}}
        notes["protected_attributes"][attr] = {
            "encode": enc_map,
            "decode": {1: "privileged", 0: "unprivileged"},
            "sets": {
                "privileged": list(group.privileged),
                "unprivileged": list(group.unprivileged),
            },
        }

    return notes


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

    def get_legitimate_attributes(self, df: pd.DataFrame) -> List[str]:
        """Return list of legitimate attribute columns present in the DataFrame.

        Reads desired attributes from ConfigManager and logs warnings for any that
        are missing from the provided DataFrame.
        """

        desired_attrs: List[str] = (
            self.config_manager.get_dataset_config().legitimate_attributes or []
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
                "Missing legitimate attributes in dataset: %s",
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
        legitimate_attrs = self.get_legitimate_attributes(df)

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
            protected_attributes_df = df[protected_attrs].copy()
        else:
            protected_attributes_df = pd.DataFrame(index=df.index)

        # Legitimate Attributes DataFrame (N x L) or empty with correct index
        if legitimate_attrs:
            legitimate_attributes_df = df[legitimate_attrs].copy()
        else:
            legitimate_attributes_df = pd.DataFrame(index=df.index)

        # Build Meta
        pp_cfg = self.config_manager.get_post_processing_config()
        favourable_outcome_value = pp_cfg.binary_mapping.favorable_outcome
        config_snapshot = snapshot_config(
            self.config_manager.to_dict(), output_dir=output_dir, run_id=run_id
        )
        notes: Dict[str, Any] = {"encodings": build_encoding_notes(self.config_manager)}
        meta = Meta(
            run_id=run_id,
            output_dir=output_dir,
            config_snapshot_path=config_snapshot,
            favourable_outcome=favourable_outcome_value,
            disparity_reference=None,
            notes=notes,
        )

        return EvalData(
            df=df,
            y_true=y_true,
            y_pred=y_pred,
            y_prob=y_prob,
            protected_attributes_df=protected_attributes_df,
            legitimate_attributes_df=legitimate_attributes_df,
            meta=meta,
        )




