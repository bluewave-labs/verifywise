from typing import Optional, Any, Dict, List, Union, cast

import os
import pandas as pd

from ..core.config import ConfigManager, DatasetConfig, ModelConfig, PromptingConfig
from ..dataset_loader.data_loader import DataLoader
from .engine import InferenceEngine
from .factory import build_engine


class InferencePipeline:
    """High-level pipeline that wires configuration, data loading, and inference.

    Initializes with a provided `ConfigManager`, captures key model/prompting fields,
    loads the dataset via `DataLoader`, and builds a provider-agnostic
    `InferenceEngine`.
    """

    def __init__(self, config_manager: ConfigManager, *, api_key: Optional[str] = None) -> None:
        # Save configuration manager
        self.config_manager: ConfigManager = config_manager

        # Pull key configuration sections
        model_cfg: ModelConfig = self.config_manager.get_model_config()
        prompting_cfg: PromptingConfig = self.config_manager.get_prompting_config()
        dataset_cfg: DatasetConfig = self.config_manager.get_dataset_config()

        # Expose a few frequently used config fields
        self.provider: str = (model_cfg.provider or "").strip()
        self.model_id: str = model_cfg.model_id
        self.formatter: str = prompting_cfg.formatter

        # Initialize and load dataset
        self.data_loader: DataLoader = DataLoader(dataset_cfg)
        self.data: pd.DataFrame = self.data_loader.load_data()

        # Build inference engine; resolve API key for providers that need it
        resolved_api_key: Optional[str] = api_key
        if resolved_api_key is None and self.provider.lower() == "openai":
            resolved_api_key = os.getenv("OPENAI_API_KEY")

        self.engine: InferenceEngine = build_engine(self.config_manager, api_key=resolved_api_key)


    def _get_samples(
        self,
        *,
        batch_size: Optional[int] = None,
        limit_samples: Optional[int] = None,
    ) -> Union[List[Dict[str, Any]], List[List[Dict[str, Any]]]]:
        """Retrieve samples from the DataLoader with optional limiting and batching.

        Args:
            batch_size: If provided, return samples grouped into batches of this size.
            limit_samples: If provided, restrict the total number of samples returned.

        Returns:
            - List[Dict] if batch_size is None
            - List[List[Dict]] if batch_size is set
        """
        samples = self.data_loader.generate_features_and_metadata(batch_size)

        if limit_samples is None:
            return samples

        # Apply limiting behavior depending on batching mode
        if batch_size is None:
            samples_list = cast(List[Dict[str, Any]], samples)
            return samples_list[:limit_samples]

        # Batched case: flatten → limit → regroup
        samples_batches = cast(List[List[Dict[str, Any]]], samples)
        flat_samples: List[Dict[str, Any]] = [item for batch in samples_batches for item in batch]
        flat_samples = flat_samples[:limit_samples]
        rebatched: List[List[Dict[str, Any]]] = [
            flat_samples[i : i + batch_size] for i in range(0, len(flat_samples), batch_size)
        ]
        return rebatched

