# FastAPI Router Template

Copy-paste template for creating FastAPI routers in VerifyWise.

## Router File

```python
# routers/resources.py

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.models import User
from app.schemas.resource import (
    ResourceCreate,
    ResourceUpdate,
    ResourceResponse,
    ResourceListResponse,
)
from app.services import resource_service
from app.exceptions import NotFoundError, ConflictError

router = APIRouter(prefix="/resources", tags=["resources"])


@router.get("", response_model=ResourceListResponse)
async def list_resources(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, max_length=100, description="Search query"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResourceListResponse:
    """
    List resources with pagination.

    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 10, max: 100)
    - **search**: Optional search query
    - **sort_by**: Field to sort by (default: created_at)
    - **sort_order**: Sort order (asc or desc, default: desc)
    """
    result = await resource_service.find_all(
        db,
        page=page,
        limit=limit,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    return ResourceListResponse(
        items=result.items,
        total=result.total,
        page=page,
        limit=limit,
    )


@router.get("/me", response_model=list[ResourceResponse])
async def get_my_resources(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ResourceResponse]:
    """Get resources owned by the current user."""
    resources = await resource_service.find_by_user_id(db, current_user.id)
    return resources


@router.get("/{resource_id}", response_model=ResourceResponse)
async def get_resource(
    resource_id: str = Path(..., description="Resource ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResourceResponse:
    """Get a resource by ID."""
    resource = await resource_service.find_by_id(db, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    return resource


@router.post(
    "",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_resource(
    data: ResourceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResourceResponse:
    """
    Create a new resource.

    - **name**: Resource name (required)
    - **description**: Resource description (optional)
    - **type**: Resource type (required)
    - **is_public**: Whether resource is public (default: false)
    """
    # Check for duplicate name
    existing = await resource_service.find_by_name(db, data.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Resource with this name already exists",
        )

    resource = await resource_service.create(
        db,
        data=data,
        user_id=current_user.id,
    )

    return resource


@router.put("/{resource_id}", response_model=ResourceResponse)
async def update_resource(
    data: ResourceUpdate,
    resource_id: str = Path(..., description="Resource ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResourceResponse:
    """Update a resource."""
    resource = await resource_service.find_by_id(db, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # Check ownership
    if resource.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this resource",
        )

    updated = await resource_service.update(db, resource_id, data)
    return updated


@router.patch("/{resource_id}", response_model=ResourceResponse)
async def partial_update_resource(
    data: ResourceUpdate,
    resource_id: str = Path(..., description="Resource ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ResourceResponse:
    """Partially update a resource."""
    resource = await resource_service.find_by_id(db, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # Check ownership
    if resource.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this resource",
        )

    # Only update provided fields
    update_data = data.model_dump(exclude_unset=True)
    updated = await resource_service.update(db, resource_id, update_data)
    return updated


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_resource(
    resource_id: str = Path(..., description="Resource ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a resource."""
    resource = await resource_service.find_by_id(db, resource_id)

    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    # Check ownership
    if resource.user_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this resource",
        )

    await resource_service.delete(db, resource_id)


# Admin-only endpoints
@router.get("/admin/all", response_model=ResourceListResponse)
async def admin_list_all_resources(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(["admin"])),
) -> ResourceListResponse:
    """List all resources (admin only)."""
    result = await resource_service.find_all(
        db,
        page=page,
        limit=limit,
        include_all=True,  # Include all users' resources
    )

    return ResourceListResponse(
        items=result.items,
        total=result.total,
        page=page,
        limit=limit,
    )
```

## Schema File

```python
# schemas/resource.py

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ResourceBase(BaseModel):
    """Base schema for resources."""
    name: str = Field(..., min_length=1, max_length=100, description="Resource name")
    description: Optional[str] = Field(None, max_length=500, description="Description")
    type: str = Field(..., description="Resource type")
    is_public: bool = Field(False, description="Whether resource is public")


class ResourceCreate(ResourceBase):
    """Schema for creating a resource."""
    pass


class ResourceUpdate(BaseModel):
    """Schema for updating a resource (all fields optional)."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    type: Optional[str] = None
    is_public: Optional[bool] = None


class ResourceResponse(ResourceBase):
    """Schema for resource response."""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ResourceListResponse(BaseModel):
    """Schema for paginated resource list response."""
    items: list[ResourceResponse]
    total: int
    page: int
    limit: int

    @property
    def total_pages(self) -> int:
        """Calculate total pages."""
        return (self.total + self.limit - 1) // self.limit
```

## Service File

```python
# services/resource_service.py

from typing import Optional
from dataclasses import dataclass
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Resource
from app.schemas.resource import ResourceCreate


@dataclass
class PaginatedResult:
    """Result of paginated query."""
    items: list[Resource]
    total: int


async def find_all(
    db: AsyncSession,
    *,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    include_all: bool = False,
    user_id: Optional[str] = None,
) -> PaginatedResult:
    """Find all resources with pagination."""
    offset = (page - 1) * limit

    # Build query
    query = select(Resource)

    # Filter by user if not including all
    if not include_all and user_id:
        query = query.where(Resource.user_id == user_id)

    # Apply search
    if search:
        query = query.where(Resource.name.ilike(f"%{search}%"))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Apply sorting
    sort_column = getattr(Resource, sort_by, Resource.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Apply pagination
    query = query.offset(offset).limit(limit)

    # Execute
    result = await db.execute(query)
    items = list(result.scalars().all())

    return PaginatedResult(items=items, total=total)


async def find_by_id(db: AsyncSession, resource_id: str) -> Optional[Resource]:
    """Find resource by ID."""
    result = await db.execute(
        select(Resource).where(Resource.id == resource_id)
    )
    return result.scalar_one_or_none()


async def find_by_name(db: AsyncSession, name: str) -> Optional[Resource]:
    """Find resource by name."""
    result = await db.execute(
        select(Resource).where(Resource.name == name)
    )
    return result.scalar_one_or_none()


async def find_by_user_id(db: AsyncSession, user_id: str) -> list[Resource]:
    """Find all resources by user ID."""
    result = await db.execute(
        select(Resource)
        .where(Resource.user_id == user_id)
        .order_by(Resource.created_at.desc())
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    *,
    data: ResourceCreate,
    user_id: str,
) -> Resource:
    """Create a new resource."""
    resource = Resource(
        **data.model_dump(),
        user_id=user_id,
    )
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return resource


async def update(
    db: AsyncSession,
    resource_id: str,
    data: dict,
) -> Optional[Resource]:
    """Update a resource."""
    resource = await find_by_id(db, resource_id)
    if not resource:
        return None

    for key, value in data.items():
        if hasattr(resource, key):
            setattr(resource, key, value)

    await db.commit()
    await db.refresh(resource)
    return resource


async def delete(db: AsyncSession, resource_id: str) -> bool:
    """Delete a resource."""
    resource = await find_by_id(db, resource_id)
    if not resource:
        return False

    await db.delete(resource)
    await db.commit()
    return True
```

## Model File

```python
# models/resource.py

from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Resource(Base):
    """Resource model."""

    __tablename__ = "resources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    type = Column(String(50), nullable=False)
    is_public = Column(Boolean, default=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="resources")

    def __repr__(self) -> str:
        return f"<Resource(id={self.id}, name={self.name})>"
```

## Test File

```python
# tests/routers/test_resources.py

import pytest
from httpx import AsyncClient

from tests.factories import create_user, create_resource, build_resource_data


@pytest.mark.asyncio
class TestListResources:
    async def test_returns_paginated_resources(
        self, client: AsyncClient, db_session, auth_headers
    ):
        # Arrange
        user_id = auth_headers["user_id"]
        await create_resource(db_session, user_id=user_id)
        await create_resource(db_session, user_id=user_id)

        # Act
        response = await client.get(
            "/api/v1/resources",
            headers=auth_headers["headers"],
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 2
        assert data["total"] == 2

    async def test_supports_search(
        self, client: AsyncClient, db_session, auth_headers
    ):
        # Arrange
        user_id = auth_headers["user_id"]
        await create_resource(db_session, user_id=user_id, name="Test Resource")
        await create_resource(db_session, user_id=user_id, name="Other Resource")

        # Act
        response = await client.get(
            "/api/v1/resources?search=test",
            headers=auth_headers["headers"],
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == "Test Resource"


@pytest.mark.asyncio
class TestCreateResource:
    async def test_creates_resource(
        self, client: AsyncClient, auth_headers
    ):
        # Arrange
        resource_data = build_resource_data()

        # Act
        response = await client.post(
            "/api/v1/resources",
            json=resource_data,
            headers=auth_headers["headers"],
        )

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == resource_data["name"]

    async def test_returns_400_for_invalid_data(
        self, client: AsyncClient, auth_headers
    ):
        # Act
        response = await client.post(
            "/api/v1/resources",
            json={"name": ""},  # Empty name
            headers=auth_headers["headers"],
        )

        # Assert
        assert response.status_code == 422

    async def test_returns_409_for_duplicate_name(
        self, client: AsyncClient, db_session, auth_headers
    ):
        # Arrange
        user_id = auth_headers["user_id"]
        await create_resource(db_session, user_id=user_id, name="Existing")

        # Act
        response = await client.post(
            "/api/v1/resources",
            json={"name": "Existing", "type": "type1"},
            headers=auth_headers["headers"],
        )

        # Assert
        assert response.status_code == 409


@pytest.mark.asyncio
class TestDeleteResource:
    async def test_deletes_resource(
        self, client: AsyncClient, db_session, auth_headers
    ):
        # Arrange
        user_id = auth_headers["user_id"]
        resource = await create_resource(db_session, user_id=user_id)

        # Act
        response = await client.delete(
            f"/api/v1/resources/{resource.id}",
            headers=auth_headers["headers"],
        )

        # Assert
        assert response.status_code == 204

    async def test_returns_404_for_nonexistent(
        self, client: AsyncClient, auth_headers
    ):
        # Act
        response = await client.delete(
            "/api/v1/resources/nonexistent-id",
            headers=auth_headers["headers"],
        )

        # Assert
        assert response.status_code == 404
```

## Directory Structure

```
app/
├── routers/
│   ├── __init__.py
│   └── resources.py
├── schemas/
│   ├── __init__.py
│   └── resource.py
├── services/
│   ├── __init__.py
│   └── resource_service.py
├── models/
│   ├── __init__.py
│   └── resource.py
└── tests/
    └── routers/
        └── test_resources.py
```

## Register Router

```python
# main.py
from app.routers import resources

app.include_router(
    resources.router,
    prefix="/api/v1",
)
```
