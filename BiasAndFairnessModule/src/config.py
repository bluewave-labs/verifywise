from pathlib import Path
from typing import Dict, List, Optional, Union, Literal, Callable, Any

from pydantic import BaseModel, Field, HttpUrl, AnyHttpUrl
from .common import read_yaml


class SamplingConfig(BaseModel):
    """Configuration for dataset sampling."""
    enabled: bool = Field(default=True, description="Whether sampling is enabled")
    n_samples: int = Field(default=5000, gt=0, description="Number of samples to use")
    random_seed: int = Field(default=42, description="Random seed for reproducibility")


class DatasetConfig(BaseModel):
    """Configuration for the dataset."""
    name: str = Field(..., description="Name of the dataset")
    source: str = Field(..., description="Source of the dataset (e.g., huggingface path)")
    platform: str = Field(
        default="huggingface",
        description="Platform where the dataset is hosted"
    )
    protected_attributes: List[str] = Field(
        default=[],
        description="List of protected attributes to check for bias"
    )
    target_column: str = Field(..., description="Target column for prediction")
    sampling: SamplingConfig = Field(
        default_factory=lambda: SamplingConfig(),
        description="Sampling configuration"
    )


class ClosedSourceModelConfig(BaseModel):
    """Configuration for closed source (API-based) models."""
    enabled: bool = Field(default=False, description="Whether to use closed source model")
    api_endpoint: Optional[str] = Field(
        default=None,
        description="API endpoint for model inference"
    )
    api_key_env_var: str = Field(
        default="MODEL_API_KEY",
        description="Environment variable name for API key"
    )
    timeout_seconds: int = Field(
        default=30,
        gt=0,
        description="Timeout for API calls in seconds"
    )


class ModelConfig(BaseModel):
    """Configuration for model settings."""
    closed_source: ClosedSourceModelConfig = Field(
        default_factory=lambda: ClosedSourceModelConfig(),
        description="Closed source model configuration"
    )


class DisparityMetric(BaseModel):
    """Configuration for a single disparity metric."""
    name: str = Field(..., description="Name of the metric")
    threshold: Optional[float] = Field(
        None,
        description="Threshold for acceptable disparity"
    )


class PerformanceMetric(BaseModel):
    """Configuration for a single performance metric."""
    name: str = Field(..., description="Name of the metric")
    threshold: Optional[float] = Field(
        None,
        description="Threshold for acceptable performance"
    )


class MetricsConfig(BaseModel):
    """Configuration for metrics."""
    disparity: Dict[str, Any] = Field(
        default_factory=lambda: {
            "enabled": True,
            "metrics": []
        },
        description="Disparity metrics configuration"
    )
    performance: Dict[str, Any] = Field(
        default_factory=lambda: {
            "enabled": True,
            "metrics": []
        },
        description="Performance metrics configuration"
    )


class Config(BaseModel):
    """Main configuration class that includes all sub-configurations."""
    dataset: DatasetConfig
    model: ModelConfig
    metrics: MetricsConfig


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
            module_root = Path(__file__).parent.parent
            config_path = str(module_root / "configs" / "config.yaml")
            
        self.config_path = config_path
        self._load_config()
    
    def _load_config(self) -> None:
        """Load and validate the configuration from the YAML file.
        
        Raises:
            FileNotFoundError: If the config file doesn't exist.
            yaml.YAMLError: If the config file is invalid YAML.
            TypeError: If the YAML content is not a dictionary.
            ValidationError: If the configuration is invalid according to the schema.
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

    def reload_config(self) -> None:
        """Reload the configuration from the YAML file."""
        self._load_config()


# Create a default instance for easy access
default_config = ConfigManager()
