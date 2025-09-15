from typing import Optional, Any, Dict, List

import os
import pandas as pd

from ..core.config import ConfigManager, DatasetConfig, ModelConfig, PromptingConfig
from ..core.common import chunked, parse_json_strict
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
        # Alias to match requested name in formatted results
        self.prompt_formatter: str = prompting_cfg.formatter

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
        limit_samples: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve a flat list of samples from the DataLoader with optional limiting.

        Args:
            limit_samples: If provided, restrict the total number of samples returned.

        Returns:
            List[Dict]: Flat list of sample dictionaries.
        """
        samples: List[Dict[str, Any]] = self.data_loader.generate_features_and_metadata(batch_size=None)

        if limit_samples is None:
            return samples

        return samples[:limit_samples]


    def _format_result(
        self,
        *,
        sample: Dict[str, Any],
        timestamp: str,
        prediction: str,
    ) -> Dict[str, Any]:
        """Create a standardized result row for a single inference.

        Args:
            sample: Sample dict containing `sample_id`, `features`, `answer`, and `protected_attributes`.
            timestamp: ISO-8601 formatted timestamp string.
            prediction: Model prediction text/value for the sample.

        Returns:
            A dictionary representing the standardized inference result row.
        """
        provider_lower = self.provider.lower()
        pred_value: Optional[str] = None
        conf_value: Optional[float] = None
        raw_output: Optional[str] = prediction
        if provider_lower == "openai":
            parsed = parse_json_strict(prediction)
            pred_value = parsed["prediction"]
            conf_value = float(parsed["confidence"])
        elif provider_lower == "huggingface":
            pred_value = prediction
            conf_value = None
        else:
            raise NotImplementedError(
                f"Provider '{self.provider}' is not supported in _format_result"
            )

        row: Dict[str, Any] = {
            "sample_id": sample["sample_id"],
            "features": sample["features"],
            "answer": sample["answer"],
            "protected_attributes": sample["protected_attributes"],
            "raw_output": raw_output,
            "prediction": pred_value,
            "confidence": conf_value,
            "provider": self.provider,
            "model_id": self.model_id,
            "prompt_formatter": self.prompt_formatter,
            "timestamp": timestamp,
        }
        return row


    def run(
        self,
        *,
        batch_size: Optional[int] = None,
        limit_samples: Optional[int] = None,
        auto_save: bool = True,
    ) -> List[Dict[str, Any]]:
        """Run inference and return a flat list of standardized result rows.

        If `auto_save` is True, results will be saved to the configured
        `artifacts.inference_results_path` CSV file.
        """
        samples = self._get_samples(limit_samples=limit_samples)

        results: List[Dict[str, Any]] = []

        # Optional chunking using helper; if batch_size is None or <= 0, one chunk
        for batch in chunked(samples, batch_size):
            features_list: List[Dict[str, Any]] = [s["features"] for s in batch]
            predictions: List[str] = self.engine.predict(features_list)
            for s, pred in zip(batch, predictions):
                ts = pd.Timestamp.now().isoformat()
                results.append(
                    self._format_result(sample=s, timestamp=ts, prediction=pred)
                )
        if auto_save:
            self.save(results)
        return results

    def save(self, results: List[Dict[str, Any]]) -> None:
        """Save results to CSV at the configured artifacts path."""
        artifacts_cfg = self.config_manager.get_artifacts_config()
        output_path = artifacts_cfg.inference_results_path
        output_path.parent.mkdir(parents=True, exist_ok=True)
        pd.DataFrame(results).to_csv(output_path, index=False)

