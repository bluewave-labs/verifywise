from typing import Optional, List
import pandas as pd

from ...core.config import ConfigManager
from .utils import get_logger


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


