from __future__ import annotations

from pathlib import Path
from typing import List, Dict, Any

import yaml

from models.obligation import Obligation


class ObligationFileError(RuntimeError):
    pass


def load_obligations_yaml(path: Path) -> tuple[str, List[Obligation]]:
    """
    Loads obligations from a YAML file and validates them with Pydantic.

    Expected format:
      version: <str>
      obligations: [ ... ]
    """
    if not path.exists():
        raise ObligationFileError(f"Obligations file not found: {path}")

    raw = yaml.safe_load(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict):
        raise ObligationFileError("Obligations YAML must be a mapping at the top level")

    version = raw.get("version")
    if not isinstance(version, str) or not version.strip():
        raise ObligationFileError("Missing or invalid 'version' in obligations.yaml")

    items = raw.get("obligations")
    if not isinstance(items, list) or not items:
        raise ObligationFileError("Missing or empty 'obligations' list in obligations.yaml")

    obligations: List[Obligation] = []
    seen_ids: set[str] = set()

    for i, item in enumerate(items, start=1):
        if not isinstance(item, dict):
            raise ObligationFileError(f"Obligation #{i} must be a mapping/object")

        obj = Obligation.model_validate(item)
        if obj.obligation_id in seen_ids:
            raise ObligationFileError(f"Duplicate obligation_id: {obj.obligation_id}")
        seen_ids.add(obj.obligation_id)
        obligations.append(obj)

    return version, obligations