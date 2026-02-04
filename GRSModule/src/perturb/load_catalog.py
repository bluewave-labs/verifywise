from __future__ import annotations

from pathlib import Path

from config import load_yaml_model
from perturb.models import MutationCatalog


def load_mutation_catalog(path: Path) -> MutationCatalog:
    return load_yaml_model(path, MutationCatalog)
