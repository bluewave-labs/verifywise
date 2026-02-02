from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from config import load_yaml_model
from render.models import (
    RolesCatalog,
    ActivitiesCatalog,
    DomainsCatalog,
    OrgContextsCatalog,
    BaseTemplatesFile,
)


@dataclass(frozen=True)
class RenderInputs:
    roles: RolesCatalog
    activities: ActivitiesCatalog
    domains: DomainsCatalog
    org_contexts: OrgContextsCatalog
    templates: BaseTemplatesFile


def load_render_inputs(*, config_dir: Path) -> RenderInputs:
    catalogs_dir = config_dir / "catalogs"
    templates_dir = config_dir / "templates"

    roles = load_yaml_model(catalogs_dir / "roles.yaml", RolesCatalog)
    activities = load_yaml_model(catalogs_dir / "activities.yaml", ActivitiesCatalog)
    domains = load_yaml_model(catalogs_dir / "domains.yaml", DomainsCatalog)
    org_contexts = load_yaml_model(catalogs_dir / "org_contexts.yaml", OrgContextsCatalog)
    templates = load_yaml_model(templates_dir / "base_scenarios.yaml", BaseTemplatesFile)

    return RenderInputs(
        roles=roles,
        activities=activities,
        domains=domains,
        org_contexts=org_contexts,
        templates=templates,
    )