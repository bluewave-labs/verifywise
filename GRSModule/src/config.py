from __future__ import annotations

from pathlib import Path
from typing import TypeVar, Type

import yaml
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


def load_yaml_model(path: Path, model: Type[T]) -> T:
    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    return model.model_validate(raw)