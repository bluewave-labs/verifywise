from __future__ import annotations

from pathlib import Path

from config import load_yaml_model
from infer.models_config import ModelsConfig


def load_models_config(path: Path) -> ModelsConfig:
    return load_yaml_model(path, ModelsConfig)
