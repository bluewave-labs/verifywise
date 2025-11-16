"""
DeepEval Orgs Router
"""
from fastapi import APIRouter, Request, Body
from controllers.deepeval_orgs import (
    create_org_controller,
    get_all_orgs_controller,
    get_projects_for_org_controller,
)

router = APIRouter()


@router.get("/orgs")
async def list_orgs(request: Request):
    return await get_all_orgs_controller(tenant=request.headers.get("x-tenant-id", "default"))


@router.post("/orgs")
async def create_org(request: Request, body: dict = Body(...)):
    name = body.get("name", "").strip()
    return await create_org_controller(name=name, tenant=request.headers.get("x-tenant-id", "default"))


@router.get("/orgs/{org_id}/projects")
async def org_projects(org_id: str, request: Request):
    return await get_projects_for_org_controller(org_id=org_id, tenant=request.headers.get("x-tenant-id", "default"))


