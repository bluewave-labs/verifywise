from __future__ import annotations

from pydantic import BaseModel
from typing import List, Literal, Optional


class RoleItem(BaseModel):
    role_id: str
    user_role: str
    assistant_role: str
    typical_channels: List[str]


class RolesCatalog(BaseModel):
    version: str
    roles: List[RoleItem]


class ActivityItem(BaseModel):
    activity_id: str
    domain: str
    description: str
    verbs: List[str]


class ActivitiesCatalog(BaseModel):
    version: str
    activities: List[ActivityItem]


class DomainItem(BaseModel):
    domain_id: str
    regulated: bool
    keywords: List[str]


class DomainsCatalog(BaseModel):
    version: str
    domains: List[DomainItem]


class IndustriesCatalog(BaseModel):
    version: str
    industries: List[dict] 


class OrgContextItem(BaseModel):
    context_id: str
    org_context: str


class OrgContextsCatalog(BaseModel):
    version: str
    org_contexts: List[OrgContextItem]


class BaseTemplate(BaseModel):
    template_id: str
    domain: str
    activity_id: str
    template: str


class BaseTemplatesFile(BaseModel):
    version: str
    templates: List[BaseTemplate]