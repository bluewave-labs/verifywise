from typing import Optional

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


