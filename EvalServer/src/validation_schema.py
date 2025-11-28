"""
Configuration validation schema that matches the actual YAML structure used in the system.
This schema validates the configuration format used by the bias and fairness evaluation system.
"""

from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


class Sampling(BaseModel):
    enabled: bool = False
    n_samples: Optional[int] = Field(default=None, ge=1, lt=200000)
    random_seed: Optional[int] = None


class DatasetCfg(BaseModel):
    name: str
    source: str
    split: Literal["train", "test", "validation"]
    platform: Literal["huggingface"]
    protected_attributes: List[str]
    legitimate_attributes: List[str] = []
    target_column: str
    sampling: Sampling = Sampling()


class PostProcBinaryMap(BaseModel):
    favorable_outcome: str
    unfavorable_outcome: str


class AttributeGroup(BaseModel):
    privileged: List[str]
    unprivileged: List[str]


class PostProcessingCfg(BaseModel):
    binary_mapping: PostProcBinaryMap
    attribute_groups: Dict[str, AttributeGroup]


class HuggingfaceCfg(BaseModel):
    device: Literal["cpu", "cuda"] = "cpu"
    enabled: bool = True
    model_id: str
    max_new_tokens: int = Field(default=50, ge=1, le=8192)
    system_prompt: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)


class ModelCfg(BaseModel):
    model_task: Literal[
        "binary_classification",
        "multiclass_classification",
        "regression",
        "generation",
        "ranking",
    ]
    label_behavior: Literal["binary", "categorical", "continuous"]
    huggingface: HuggingfaceCfg


class PromptFormatterCfg(BaseModel):
    system_prompt: Optional[str] = None
    assistant_preamble: Optional[str] = None


class PromptingCfg(BaseModel):
    formatter: str
    defaults: Dict[str, Optional[str]] = {}
    formatters: Dict[str, PromptFormatterCfg]

    @model_validator(mode="after")
    def check_formatter_exists(self):
        if self.formatter not in self.formatters:
            raise ValueError(f"formatter '{self.formatter}' not found in formatters")
        return self


class MetricsCfg(BaseModel):
    enabled: bool
    metrics: List[str]


class AllMetricsCfg(BaseModel):
    fairness: MetricsCfg
    performance: Optional[MetricsCfg] = None


class ArtifactsCfg(BaseModel):
    reports_dir: str
    inference_results_path: str
    postprocessed_results_path: str


class VisualizationCfg(BaseModel):
    type: str
    attribute: str


class RootCfg(BaseModel):
    model: ModelCfg
    dataset: DatasetCfg
    sampling: Sampling = Sampling()
    # Make other fields optional to match your actual YAML structure
    post_processing: Optional[PostProcessingCfg] = None
    prompting: Optional[PromptingCfg] = None
    metrics: Optional[AllMetricsCfg] = None
    artifacts: Optional[ArtifactsCfg] = None
    visualizations: List[VisualizationCfg] = []

    @model_validator(mode="after")
    def semantic_rules(self) -> "RootCfg":
        if self.dataset.protected_attributes and self.dataset.legitimate_attributes:
            pa = set(self.dataset.protected_attributes)
            la = set(self.dataset.legitimate_attributes)
            both = pa & la
            if both:
                raise ValueError(
                    f"Attributes cannot be both protected and legitimate: {sorted(both)}"
                )
        return self


def get_config_schema():
    """Get the JSON schema for configuration validation."""
    return RootCfg.model_json_schema()


def validate_config(yaml_text: str):
    """Validate YAML text against the schema and return normalized YAML + errors."""
    import yaml
    
    # 1) Parse YAML
    try:
        parsed: Any = yaml.safe_load(yaml_text) if yaml_text.strip() else {}
        if not isinstance(parsed, dict):
            return {
                "valid": False,
                "errors": [
                    {"path": "<root>", "msg": "YAML must be a mapping at the root"}
                ],
                "normalized_yaml": None,
                "normalized": None,
            }
    except Exception as e:
        return {
            "valid": False,
            "errors": [{"path": "<yaml>", "msg": f"YAML parse error: {e}"}],
            "normalized_yaml": None,
            "normalized": None,
        }

    # 2) Validate via Pydantic
    try:
        cfg = RootCfg.model_validate(parsed)
        normalized_dict = cfg.model_dump(mode="python", by_alias=False)
        normalized_yaml = yaml.safe_dump(normalized_dict, sort_keys=False, allow_unicode=True)
        return {
            "valid": True,
            "errors": [],
            "normalized_yaml": normalized_yaml,
            "normalized": normalized_dict,
        }
    except Exception as e:
        # Pydantic gives rich error JSON, but in POC we present a flat list
        errors = []
        try:
            for err in e.errors(): # type: ignore[attr-defined]
                loc = ".".join(str(p) for p in err.get("loc", [])) or "<root>"
                msg = err.get("msg", str(e))
                errors.append({"path": loc, "msg": msg})
        except Exception:
            errors = [{"path": "<model>", "msg": str(e)}]
        return {"valid": False, "errors": errors, "normalized_yaml": None, "normalized": None}
