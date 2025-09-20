from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from .common import read_yaml


class SamplingConfig(BaseModel):
    """Configuration for dataset sampling."""

    enabled: bool = Field(default=True, description="Whether sampling is enabled")
    n_samples: int = Field(default=5000, gt=0, description="Number of samples to use")
    random_seed: int = Field(default=42, description="Random seed for reproducibility")


class DatasetConfig(BaseModel):
    """Configuration for the dataset."""

    name: str = Field(..., description="Name of the dataset")
    source: str = Field(
        ..., description="Source of the dataset (e.g., huggingface path)"
    )
    split: str = Field(default="train", description="Split of the dataset to use")
    platform: str = Field(
        default="huggingface", description="Platform where the dataset is hosted"
    )
    protected_attributes: List[str] = Field(
        default=[], description="List of protected attributes to check for bias"
    )
    target_column: str = Field(..., description="Target column for prediction")
    sampling: SamplingConfig = Field(
        default_factory=lambda: SamplingConfig(), description="Sampling configuration"
    )


class ClosedSourceModelConfig(BaseModel):
    """Configuration for closed source (API-based) models."""

    enabled: bool = Field(
        default=False, description="Whether to use closed source model"
    )
    api_endpoint: Optional[str] = Field(
        default=None, description="API endpoint for model inference"
    )
    api_key_env_var: str = Field(
        default="MODEL_API_KEY", description="Environment variable name for API key"
    )
    timeout_seconds: int = Field(
        default=30, gt=0, description="Timeout for API calls in seconds"
    )


class HuggingFaceModelConfig(BaseModel):
    """Configuration for Hugging Face models."""

    enabled: bool = Field(default=True, description="Whether to use Hugging Face model")
    model_id: str = Field(
        default="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        description="Model ID from Hugging Face Hub",
    )
    device: str = Field(
        default="cuda", description="Device to run the model on (cuda or cpu)"
    )
    max_new_tokens: int = Field(
        default=512, gt=0, description="Maximum sequence length for model generation"
    )
    temperature: float = Field(
        default=0.7, gt=0, le=1.0, description="Sampling temperature"
    )
    top_p: float = Field(
        default=0.9, gt=0, le=1.0, description="Top-p sampling parameter"
    )
    system_prompt: str = Field(
        default="You are a helpful AI assistant.",
        description="System prompt to be prepended to all model inputs",
    )


class ModelConfig(BaseModel):
    """Configuration for model settings."""

    model_task: str = Field(
        default="binary_classification",
        description="Model task type for Fairness Compass routing (binary_classification, multiclass_classification, regression, generation, ranking)"
    )
    label_behavior: str = Field(
        default="binary",
        description="Label behavior type for Fairness Compass routing (binary, categorical, continuous)"
    )
    huggingface: HuggingFaceModelConfig = Field(
        default_factory=lambda: HuggingFaceModelConfig(),
        description="Hugging Face model configuration",
    )


class MetricConfig(BaseModel):
    """Base configuration for metrics with thresholds."""

    metrics: List[str] = Field(default_factory=list, description="List of metric names")
    enabled: bool = Field(default=True, description="Whether metrics are enabled")
    thresholds: Optional[Dict[str, float]] = Field(
        default_factory=dict, description="Optional thresholds for each metric"
    )


class MetricsConfig(BaseModel):
    """Configuration for metrics."""

    fairness: MetricConfig = Field(
        default_factory=MetricConfig,
        description="Fairness metrics configuration",
    )
    performance: MetricConfig = Field(
        default_factory=MetricConfig,
        description="Performance metrics configuration",
    )


class BinaryMappingConfig(BaseModel):
    """Configuration for binary outcome mapping."""

    favorable_outcome: str = Field(..., description="The favorable outcome value")
    unfavorable_outcome: str = Field(..., description="The unfavorable outcome value")


class AttributeGroupConfig(BaseModel):
    """Configuration for protected attribute groups."""

    privileged: List[str] = Field(..., description="List of privileged group values")
    unprivileged: List[str] = Field(
        ..., description="List of unprivileged group values"
    )


class PostProcessingConfig(BaseModel):
    """Configuration for post-processing settings."""

    binary_mapping: BinaryMappingConfig = Field(
        ..., description="Binary outcome mapping configuration"
    )
    attribute_groups: Dict[str, AttributeGroupConfig] = Field(
        ..., description="Protected attribute groups configuration"
    )


class ArtifactsConfig(BaseModel):
    """Configuration for on-disk artifact paths."""

    inference_results_path: Path = Field(
        ..., description="Path to save raw inference results"
    )
    postprocessed_results_path: Path = Field(
        ..., description="Path to save post-processed results"
    )


class Config(BaseModel):
    """Main configuration class that includes all sub-configurations."""

    dataset: DatasetConfig
    model: ModelConfig
    metrics: MetricsConfig
    post_processing: PostProcessingConfig
    artifacts: ArtifactsConfig


class ConfigManager:
    """Configuration manager for the Bias and Fairness Module."""

    def __init__(self, config_path: Optional[str] = None):
        """Initialize the configuration manager.

        Args:
            config_path (str, optional): Path to the config.yaml file.
                If not provided, defaults to 'configs/config.yaml'
                relative to the module root.
        """
        if config_path is None:
            module_root = Path(__file__).parent.parent.parent
            config_path = str(module_root / "configs" / "config.yaml")

        self.config_path = config_path
        self._load_config()

    def _load_config(self) -> None:
        """Load and validate the configuration from the YAML file.

        Raises:
            FileNotFoundError: If the config file doesn't exist.
            yaml.YAMLError: If the config file is invalid YAML.
            TypeError: If the YAML content is not a dictionary.
            ValidationError: If the configuration is invalid
            according to the schema.
        """
        yaml_config = read_yaml(self.config_path)
        self.config = Config(**yaml_config)

    def get_dataset_config(self) -> DatasetConfig:
        """Get the complete dataset configuration.

        Returns:
            DatasetConfig: The complete dataset configuration.
        """
        return self.config.dataset

    def get_model_config(self) -> ModelConfig:
        """Get the complete model configuration.

        Returns:
            ModelConfig: The complete model configuration.
        """
        return self.config.model

    def get_metrics_config(self) -> MetricsConfig:
        """Get the complete metrics configuration.

        Returns:
            MetricsConfig: The complete metrics configuration.
        """
        return self.config.metrics

    def get_post_processing_config(self) -> PostProcessingConfig:
        """Get the complete post-processing configuration.

        Returns:
            PostProcessingConfig: The complete post-processing configuration.
        """
        return self.config.post_processing

    def get_artifacts_config(self) -> ArtifactsConfig:
        """Get the artifacts configuration.

        Returns:
            ArtifactsConfig: The artifacts configuration containing output paths.
        """
        return self.config.artifacts

    def reload_config(self) -> None:
        """Reload the configuration from the YAML file."""
        self._load_config()


# Create a default instance for easy access
default_config = ConfigManager()
