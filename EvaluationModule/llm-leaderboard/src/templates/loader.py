from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Any

import yaml

from .schema import TemplateFile, ScenarioTemplate


def load_template_file(path: Path) -> TemplateFile:
    if not path.exists():
        raise FileNotFoundError(f"Template file not found: {path}")

    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ValueError(f"Invalid YAML structure in {path}: expected mapping at top level")

    return TemplateFile.model_validate(raw)


def load_templates(version: str, *, templates_root: Path = Path("templates")) -> Dict[str, List[ScenarioTemplate]]:
    """
    Returns dict: scenario_type -> list[ScenarioTemplate]
    """
    vdir = templates_root / version
    if not vdir.exists():
        raise FileNotFoundError(f"Templates version dir not found: {vdir}")

    files = [
        vdir / "compliance_policy.yaml",
        vdir / "ambiguous_prompt.yaml",
        vdir / "multi_step_reasoning.yaml",
    ]

    out: Dict[str, List[ScenarioTemplate]] = {}
    for f in files:
        tf = load_template_file(f)
        # Basic consistency check: file version should match folder version
        if tf.version != version:
            raise ValueError(f"{f}: version '{tf.version}' does not match requested '{version}'")
        out.setdefault(tf.scenario_type, []).extend(tf.templates)

    return out


def render_prompt(template: ScenarioTemplate, values: Dict[str, Any]) -> str:
    """
    Very small renderer: format prompt_template with provided values.
    Raises KeyError if missing.
    """
    return template.prompt_template.format(**values)
