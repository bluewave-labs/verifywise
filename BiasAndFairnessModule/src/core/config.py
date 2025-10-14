from pathlib import Path
from typing import Any, Dict, List, Optional
import copy

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
    legitimate_attributes: List[str] = Field(
        default=[], description="List of legitimate (allowed) attributes for processing"
    )
    target_column: str = Field(..., description="Target column for prediction")
    sampling: SamplingConfig = Field(
        default_factory=lambda: SamplingConfig(), description="Sampling configuration"
    )


class ModelConfig(BaseModel):
    """Configuration for model settings."""

    # Provider selection (e.g., 'huggingface', 'openai')
    provider: str = Field(
        default="huggingface",
        description="Inference provider to use (e.g., 'huggingface', 'openai')",
    )

    model_task: str = Field(
        default="binary_classification",
        description="Model task type for Fairness Compass routing (binary_classification, multiclass_classification, regression, generation, ranking)"
    )
    label_behavior: str = Field(
        default="binary",
        description="Label behavior type for Fairness Compass routing (binary, categorical, continuous)"
    )

    # Unified generation/inference parameters (apply across providers)
    model_id: str = Field(
        default="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        description="Model identifier (HF repo id or provider-specific model name)",
    )
    device: str = Field(
        default="cuda", description="Device to run local models on (cuda or cpu)"
    )
    max_new_tokens: int = Field(
        default=512, gt=0, description="Maximum number of tokens to generate"
    )
    temperature: float = Field(
        default=0.7, gt=0, le=1.0, description="Sampling temperature"
    )
    top_p: float = Field(
        default=0.9, gt=0, le=1.0, description="Top-p nucleus sampling parameter"
    )

    # Optional base URL for OpenAI-compatible or custom endpoints
    base_url: Optional[str] = Field(
        default=None,
        description="Optional base URL for remote OpenAI-compatible providers",
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

    reports_dir: Path = Field(
        ..., description="Directory to save evaluation result JSON and summaries"
    )
    inference_results_path: Path = Field(
        ..., description="Path to save raw inference results"
    )
    postprocessed_results_path: Path = Field(
        ..., description="Path to save post-processed results"
    )


class VisualizationItem(BaseModel):
    """Specification for a single visualization to generate."""

    type: str = Field(..., description="Plot type identifier")
    attribute: Optional[str] = Field(
        default=None, description="Protected attribute column for the plot"
    )


class PromptingDefaults(BaseModel):
    """Defaults applied across formatters unless overridden by formatter-specific config."""

    instruction: Optional[str] = Field(
        default=None, description="Short, reusable task instruction"
    )
    system_prompt: Optional[str] = Field(
        default=None, description="Shared system prompt unless formatter overrides"
    )


class PromptingFormatterOptions(BaseModel):
    """Per-formatter configuration overrides."""

    system_prompt: Optional[str] = Field(
        default=None, description="Formatter-specific system prompt"
    )
    assistant_preamble: Optional[str] = Field(
        default=None, description="Optional assistant preamble for certain formatters"
    )


class PromptingConfig(BaseModel):
    """Configuration for prompt formatting with defaults and per-formatter overrides.

    Backward compatible with the previous flat schema (instruction, system_prompt, assistant_preamble).
    """

    # New structured fields
    formatter: str = Field(
        default="tinyllama-chat", description="Name of prompt formatter to use"
    )
    defaults: PromptingDefaults = Field(
        default_factory=PromptingDefaults,
        description="Defaults shared across formatters",
    )
    formatters: Dict[str, PromptingFormatterOptions] = Field(
        default_factory=dict, description="Per-formatter overrides"
    )

    # Legacy flat fields for backward compatibility with existing code paths
    system_prompt: Optional[str] = Field(
        default=None,
        description="[Legacy] System prompt; computed from defaults/formatter if not set",
    )
    instruction: Optional[str] = Field(
        default=None, description="[Legacy] Instruction; maps to defaults.instruction"
    )
    assistant_preamble: Optional[str] = Field(
        default=None,
        description="[Legacy] Assistant preamble; from selected formatter options if present",
    )


class Config(BaseModel):
    """Main configuration class that includes all sub-configurations."""

    dataset: DatasetConfig
    model: ModelConfig
    prompting: PromptingConfig
    metrics: MetricsConfig
    post_processing: PostProcessingConfig
    artifacts: ArtifactsConfig
    visualizations: List["VisualizationItem"] = Field(
        default_factory=list,
        description="List of visualization specifications to generate",
    )


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
        self._cfg: Dict[str, Any] = {}
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
        # Store the raw parsed YAML content for hashing and snapshotting
        self._cfg = yaml_config
        self.config = Config(**yaml_config)

    def to_dict(self) -> Dict[str, Any]:
        """Return an immutable copy of the raw configuration content as a dict."""
        return copy.deepcopy(self._cfg)

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

    def get_prompting_config(self) -> PromptingConfig:
        """Get the prompting configuration.

        Returns:
            PromptingConfig: The prompt input and formatter configuration.
        """
        return self.config.prompting

    def get_visualizations(self) -> List["VisualizationItem"]:
        """Get visualization specifications from configuration."""
        return self.config.visualizations

    def reload_config(self) -> None:
        """Reload the configuration from the YAML file."""
        self._load_config()


# Create a default instance for easy access
default_config = ConfigManager()
