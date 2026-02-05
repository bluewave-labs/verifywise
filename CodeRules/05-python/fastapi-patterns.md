# FastAPI Patterns

Guidelines for building FastAPI services in VerifyWise.

## Project Structure

```
app/
├── __init__.py
├── main.py              # Application entry point
├── config.py            # Configuration settings
├── database.py          # Database connection
├── routers/             # API routers
│   ├── __init__.py
│   ├── users.py
│   └── projects.py
├── models/              # SQLAlchemy/Pydantic models
│   ├── __init__.py
│   ├── user.py
│   └── project.py
├── schemas/             # Pydantic schemas (request/response)
│   ├── __init__.py
│   ├── user.py
│   └── project.py
├── services/            # Business logic
│   ├── __init__.py
│   ├── user_service.py
│   └── project_service.py
├── repositories/        # Data access
│   ├── __init__.py
│   └── user_repository.py
├── dependencies/        # Dependency injection
│   ├── __init__.py
│   ├── database.py
│   └── auth.py
├── middleware/          # Custom middleware
│   └── __init__.py
├── utils/               # Utility functions
│   ├── __init__.py
│   └── helpers.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    └── test_users.py
```

## Application Setup

### Main Application

```python
# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import users, projects, auth
from app.middleware.logging import LoggingMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await init_db()
    yield
    # Shutdown
    # Add cleanup code here


app = FastAPI(
    title="VerifyWise API",
    description="API for VerifyWise services",
    version="1.0.0",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(LoggingMiddleware)

# Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
```

### Configuration

```python
# config.py
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""

    # App
    APP_NAME: str = "VerifyWise API"
    DEBUG: bool = False
    ENV: str = "development"

    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    # Auth
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache
def get_settings() -> Settings:
    """Get cached settings."""
    return Settings()


settings = get_settings()
```

## Routers

### Basic Router

```python
# routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse,
)
from app.services.user_service import UserService
from app.dependencies.auth import get_current_user
from app.dependencies.services import get_user_service
from app.models.user import User

router = APIRouter()


@router.get("", response_model=UserListResponse)
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None),
    service: UserService = Depends(get_user_service),
):
    """
    List users with pagination.

    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 10, max: 100)
    - **search**: Optional search query
    """
    result = await service.find_all(page=page, limit=limit, search=search)
    return UserListResponse(
        items=result.items,
        total=result.total,
        page=page,
        limit=limit,
    )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    service: UserService = Depends(get_user_service),
):
    """Get user by ID."""
    user = await service.find_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    service: UserService = Depends(get_user_service),
):
    """Create a new user."""
    return await service.create(data)


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str,
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    """Update user."""
    user = await service.update(user_id, data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    """Delete user."""
    deleted = await service.delete(user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
```

### Router with Path Operations

```python
# routers/projects.py
from fastapi import APIRouter, Depends, HTTPException, status, Path

router = APIRouter()


@router.get("/{project_id}/members")
async def get_project_members(
    project_id: str = Path(..., description="Project ID"),
    service: ProjectService = Depends(get_project_service),
):
    """Get all members of a project."""
    project = await service.find_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await service.get_members(project_id)


@router.post("/{project_id}/members")
async def add_project_member(
    project_id: str,
    member: MemberCreate,
    current_user: User = Depends(get_current_user),
    service: ProjectService = Depends(get_project_service),
):
    """Add a member to a project."""
    # Check authorization
    if not await service.can_manage_members(project_id, current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized")

    return await service.add_member(project_id, member)
```

## Pydantic Schemas

### Request/Response Schemas

```python
# schemas/user.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None


class UserResponse(UserBase):
    """Schema for user response."""
    id: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Schema for paginated user list."""
    items: List[UserResponse]
    total: int
    page: int
    limit: int

    @property
    def total_pages(self) -> int:
        """Calculate total pages."""
        return (self.total + self.limit - 1) // self.limit
```

### Validation Examples

```python
from pydantic import BaseModel, Field, field_validator, model_validator
import re


class PasswordChange(BaseModel):
    """Schema for password change."""
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets strength requirements."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain a number")
        return v

    @model_validator(mode="after")
    def passwords_match(self) -> "PasswordChange":
        """Validate passwords match."""
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class DateRange(BaseModel):
    """Schema for date range filter."""
    start_date: datetime
    end_date: datetime

    @model_validator(mode="after")
    def validate_date_range(self) -> "DateRange":
        """Validate end date is after start date."""
        if self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")
        return self
```

## Dependency Injection

### Database Dependency

```python
# dependencies/database.py
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session_maker


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

### Authentication Dependency

```python
# dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.config import settings
from app.models.user import User
from app.services.user_service import UserService

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_service: UserService = Depends(get_user_service),
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await user_service.find_by_id(user_id)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user


def require_role(allowed_roles: list[str]):
    """Dependency for role-based access control."""
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user

    return role_checker


# Usage
@router.get("/admin/dashboard")
async def admin_dashboard(
    current_user: User = Depends(require_role(["admin"])),
):
    """Admin only endpoint."""
    pass
```

### Service Dependencies

```python
# dependencies/services.py
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.database import get_db
from app.repositories.user_repository import UserRepository
from app.services.user_service import UserService


def get_user_repository(
    db: AsyncSession = Depends(get_db),
) -> UserRepository:
    """Get user repository."""
    return UserRepository(db)


def get_user_service(
    repository: UserRepository = Depends(get_user_repository),
) -> UserService:
    """Get user service."""
    return UserService(repository)
```

## Error Handling

### Exception Handlers

```python
# main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.exceptions import AppError, NotFoundError, ValidationError


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Handle application errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.code,
            "message": exc.message,
            "details": exc.details,
        },
    )


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    """Handle not found errors."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "NOT_FOUND",
            "message": str(exc),
        },
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected errors."""
    # Log the error
    logger.error(f"Unexpected error: {exc}", exc_info=True)

    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_ERROR",
            "message": "An unexpected error occurred",
        },
    )
```

### Custom Exceptions

```python
# exceptions.py
from typing import Any, Optional


class AppError(Exception):
    """Base application error."""

    def __init__(
        self,
        message: str,
        code: str = "APP_ERROR",
        status_code: int = 400,
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details
        super().__init__(message)


class NotFoundError(AppError):
    """Resource not found error."""

    def __init__(self, resource: str, identifier: str) -> None:
        super().__init__(
            message=f"{resource} not found: {identifier}",
            code="NOT_FOUND",
            status_code=404,
        )


class ValidationError(AppError):
    """Validation error."""

    def __init__(self, message: str, field: Optional[str] = None) -> None:
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=422,
            details={"field": field} if field else None,
        )


class AuthorizationError(AppError):
    """Authorization error."""

    def __init__(self, message: str = "Access denied") -> None:
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403,
        )
```

## Background Tasks

```python
from fastapi import BackgroundTasks


@router.post("/users/{user_id}/send-notification")
async def send_notification(
    user_id: str,
    message: str,
    background_tasks: BackgroundTasks,
    service: UserService = Depends(get_user_service),
):
    """Send notification to user."""
    user = await service.find_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Add background task
    background_tasks.add_task(
        send_email_notification,
        email=user.email,
        message=message,
    )

    return {"status": "notification_queued"}


async def send_email_notification(email: str, message: str) -> None:
    """Send email notification (runs in background)."""
    # Email sending logic
    await email_service.send(to=email, body=message)
```

## Testing

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

from app.main import app
from app.database import get_db
from app.models import Base

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture
async def test_db():
    """Create test database."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(test_db):
    """Create test client."""
    app.dependency_overrides[get_db] = lambda: test_db

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()


# tests/test_users.py
@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    """Test user creation."""
    response = await client.post(
        "/api/v1/users",
        json={
            "email": "test@example.com",
            "name": "Test User",
            "password": "SecurePass123",
        },
    )

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["name"] == "Test User"
    assert "id" in data
```

## Summary

| Component | Purpose |
|-----------|---------|
| **Routers** | Define API endpoints |
| **Schemas** | Request/response validation |
| **Dependencies** | Dependency injection |
| **Services** | Business logic |
| **Repositories** | Data access |
| **Exceptions** | Error handling |

## Related Documents

- [Python Standards](./python-standards.md)
- [Type Hints](./type-hints.md)
- [Python Testing](../07-testing/python-testing.md)
