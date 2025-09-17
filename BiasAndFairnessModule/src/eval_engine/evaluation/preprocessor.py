from typing import Optional
import pandas as pd

from ...core.config import ConfigManager
from .utils import get_logger


class Preprocessor:
    """Prepare post-processed results for evaluation."""

    def __init__(
        self,
        config_manager: Optional[ConfigManager] = None,
    ) -> None:
        self.config_manager = config_manager
        self.logger = get_logger("eval.preprocessor")

    def load_postprocessed_results(self, results_path: Optional[str] = None) -> pd.DataFrame:
        """Load the post-processed results CSV into a DataFrame.

        If results_path is None, the path is taken from the ConfigManager.
        Raises ValueError if the loaded DataFrame is empty.
        """

        if results_path is None:
            if self.config_manager is None:
                raise ValueError(
                    "results_path not provided and config_manager is None; cannot determine results path"
                )
            results_path = str(
                self.config_manager.get_artifacts_config().postprocessed_results_path
            )

        self.logger.info(f"Loading post-processed results from: {results_path}")
        df = pd.read_csv(results_path)
        if df.empty:
            raise ValueError("Post-processed results DataFrame is empty")
        return df


