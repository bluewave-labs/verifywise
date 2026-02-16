"""
Pydantic models for bias audit configuration and results.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class CategoryConfig(BaseModel):
    """Configuration for a single protected category."""
    label: str
    groups: List[str] = Field(default_factory=list)


class IntersectionalConfig(BaseModel):
    """Configuration for intersectional analysis."""
    required: bool = False
    cross: List[str] = Field(default_factory=list)


class ResultsTableConfig(BaseModel):
    """Configuration for a single results table."""
    type: str  # "category" or "intersectional"
    category_key: Optional[str] = None
    title: str


class ResultsFormatConfig(BaseModel):
    """Configuration for results format."""
    tables: List[ResultsTableConfig] = Field(default_factory=list)


class BiasAuditConfig(BaseModel):
    """Full configuration for running a bias audit."""
    preset_id: str
    preset_name: str = ""
    mode: str = "quantitative_audit"
    categories: Dict[str, CategoryConfig] = Field(default_factory=dict)
    intersectional: IntersectionalConfig = Field(default_factory=IntersectionalConfig)
    metrics: List[str] = Field(default_factory=lambda: ["selection_rate", "impact_ratio"])
    threshold: Optional[float] = 0.80
    small_sample_exclusion: Optional[float] = None
    required_metadata: List[str] = Field(default_factory=list)
    metadata: Dict[str, str] = Field(default_factory=dict)
    results_format: ResultsFormatConfig = Field(default_factory=ResultsFormatConfig)
    outcome_column: str = "selected"
    column_mapping: Dict[str, str] = Field(default_factory=dict)


class GroupResult(BaseModel):
    """Result for a single demographic group."""
    category_type: str  # "sex", "race_ethnicity", "intersectional"
    category_name: str  # e.g. "Male", "Hispanic or Latino Female"
    applicant_count: int
    selected_count: int
    selection_rate: float
    impact_ratio: Optional[float] = None
    excluded: bool = False
    flagged: bool = False


class CategoryTable(BaseModel):
    """A table of results for one category or intersectional analysis."""
    title: str
    category_key: str  # e.g. "sex", "race_ethnicity", "intersectional"
    rows: List[GroupResult] = Field(default_factory=list)
    highest_group: Optional[str] = None
    highest_rate: Optional[float] = None


class BiasAuditResult(BaseModel):
    """Complete results from a bias audit computation."""
    tables: List[CategoryTable] = Field(default_factory=list)
    overall_selection_rate: float = 0.0
    total_applicants: int = 0
    total_selected: int = 0
    unknown_count: int = 0
    flags_count: int = 0
    excluded_count: int = 0
    summary: str = ""
