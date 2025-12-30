"""
DeepEval Orgs Router
"""
from fastapi import APIRouter, Request, Body
from controllers.deepeval_orgs import (
    create_org_controller,
    get_all_orgs_controller,
    get_projects_for_org_controller,
    delete_org_controller,
    update_org_controller,
)

router = APIRouter()


@router.get("/orgs")
async def list_orgs(request: Request):
    return await get_all_orgs_controller(tenant=request.headers["x-tenant-id"])


@router.post("/orgs")
async def create_org(request: Request, body: dict = Body(...)):
    name = body.get("name", "").strip()
    return await create_org_controller(name=name, tenant=request.headers["x-tenant-id"])


@router.get("/orgs/{org_id}/projects")
async def org_projects(org_id: str, request: Request):
    return await get_projects_for_org_controller(org_id=org_id, tenant=request.headers["x-tenant-id"])


@router.put("/orgs/{org_id}")
async def update_org(org_id: str, request: Request, body: dict = Body(...)):
    """
    Update an organization.
    """
    name = body.get("name", "").strip()
    member_ids = body.get("member_ids", None)
    return await update_org_controller(
        org_id=org_id,
        name=name,
        member_ids=member_ids,
        tenant=request.headers["x-tenant-id"]
    )


@router.delete("/orgs/{org_id}")
async def delete_org(org_id: str, request: Request):
    """
    Delete an organization.
    """
    return await delete_org_controller(org_id=org_id, tenant=request.headers["x-tenant-id"])


