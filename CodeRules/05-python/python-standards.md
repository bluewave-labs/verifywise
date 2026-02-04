# Python Standards

Python coding standards for VerifyWise services, following PEP 8 and Python best practices.

## PEP 8 Compliance

### Indentation

Use 4 spaces per indentation level. Never use tabs.

```python
# Good
def calculate_total(items: list[Item]) -> float:
    total = 0.0
    for item in items:
        if item.is_active:
            total += item.price * item.quantity
    return total

# Bad - 2 spaces
def calculate_total(items: list[Item]) -> float:
  total = 0.0
  for item in items:
    total += item.price
  return total

# Bad - tabs
def calculate_total(items: list[Item]) -> float:
	total = 0.0  # This is a tab
```

### Line Length

Maximum line length is 88 characters (Black formatter default).

```python
# Good - line within limit
user = await user_repository.find_by_email(email)

# Good - break long lines
user = await user_repository.find_by_email_with_preferences(
    email=email,
    include_inactive=False,
    load_preferences=True,
)

# Good - break long strings
error_message = (
    f"Failed to process user {user_id}: "
    f"Invalid email format '{email}'"
)

# Good - break long conditions
if (
    user.is_active
    and user.has_permission("edit")
    and project.status == "active"
):
    allow_edit()
```

### Blank Lines

- Two blank lines around top-level function and class definitions
- One blank line between method definitions in a class
- Use blank lines sparingly inside functions to indicate logical sections

```python
import os
from typing import Optional


class UserService:
    """Service for user operations."""

    def __init__(self, repository: UserRepository) -> None:
        self.repository = repository

    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return self.repository.find_by_id(user_id)

    def create_user(self, data: CreateUserInput) -> User:
        """Create a new user."""
        # Validate email uniqueness
        existing = self.repository.find_by_email(data.email)
        if existing:
            raise UserAlreadyExistsError(data.email)

        # Create and return user
        return self.repository.create(data)


def helper_function() -> None:
    """A helper function outside the class."""
    pass
```

### Imports

Organize imports in three groups, separated by blank lines:
1. Standard library imports
2. Third-party imports
3. Local imports

```python
# Standard library
import os
import sys
from datetime import datetime
from typing import Optional, List

# Third-party
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Local imports
from app.config import settings
from app.models.user import User
from app.services.user_service import UserService

# Avoid wildcard imports
# Bad
from app.models import *

# Good
from app.models import User, Project, Task
```

### Import Ordering

Use `isort` or similar tool. Order alphabetically within groups.

```python
# Sorted alphabetically
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import Column, String
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User
```

## Naming Conventions

### Variables and Functions

Use `snake_case` for variables, functions, and methods.

```python
# Good
user_name = "John"
total_count = 0
is_active = True

def get_user_by_email(email: str) -> User:
    pass

def calculate_total_price(items: list[Item]) -> float:
    pass

# Bad
userName = "John"      # camelCase
TotalCount = 0         # PascalCase
IsActive = True        # PascalCase

def getUserByEmail(email: str) -> User:  # camelCase
    pass
```

### Classes

Use `PascalCase` for class names.

```python
# Good
class UserService:
    pass

class HTTPClientError(Exception):
    pass

class DatabaseConnectionPool:
    pass

# Bad
class user_service:     # snake_case
    pass

class httpClientError:  # camelCase
    pass
```

### Constants

Use `UPPER_SNAKE_CASE` for constants.

```python
# Good
MAX_RETRY_ATTEMPTS = 3
DEFAULT_TIMEOUT_SECONDS = 30
API_BASE_URL = "https://api.example.com"
DATABASE_URL = os.getenv("DATABASE_URL")

# Bad
maxRetryAttempts = 3
default_timeout = 30
ApiBaseUrl = "https://api.example.com"
```

### Private Members

Use a single leading underscore for internal/private members.

```python
class UserService:
    def __init__(self) -> None:
        self._cache: dict[str, User] = {}  # Internal cache
        self._repository = UserRepository()

    def _validate_email(self, email: str) -> bool:
        """Internal validation method."""
        return "@" in email

    def create_user(self, data: CreateUserInput) -> User:
        """Public method."""
        if not self._validate_email(data.email):
            raise ValidationError("Invalid email")
        return self._repository.create(data)

# Double underscore for name mangling (rarely needed)
class Base:
    def __init__(self) -> None:
        self.__private = "Cannot be easily overridden"
```

### Module and Package Names

Use short, lowercase names. Avoid underscores if possible.

```
# Good
app/
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── project.py
├── services/
│   ├── __init__.py
│   └── user_service.py  # Underscore OK when needed for clarity
├── routers/
│   └── users.py
└── utils/
    └── helpers.py

# Bad
app/
├── Models/           # PascalCase
├── UserServices/     # PascalCase
└── helper_utils/     # Redundant
```

## Code Organization

### Module Structure

```python
# Standard module structure

"""
Module docstring explaining the purpose.

This module provides user-related functionality.
"""

# Imports (grouped as specified above)
from typing import Optional

from fastapi import HTTPException

from app.models import User

# Constants
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100

# Type definitions
UserDict = dict[str, Any]

# Classes
class UserService:
    """Service for user operations."""
    pass

# Functions
def format_user(user: User) -> UserDict:
    """Format user for API response."""
    pass

# Private functions
def _validate_input(data: dict) -> bool:
    """Internal validation helper."""
    pass
```

### Class Organization

```python
class UserService:
    """
    Service for user operations.

    Provides methods for creating, reading, updating,
    and deleting users.
    """

    # Class constants
    MAX_LOGIN_ATTEMPTS = 5

    # Class initialization
    def __init__(self, repository: UserRepository) -> None:
        self._repository = repository
        self._cache: dict[str, User] = {}

    # Properties
    @property
    def cache_size(self) -> int:
        """Return current cache size."""
        return len(self._cache)

    # Public methods
    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        pass

    def create_user(self, data: CreateUserInput) -> User:
        """Create a new user."""
        pass

    # Private methods
    def _validate_email(self, email: str) -> bool:
        """Validate email format."""
        pass

    # Special methods
    def __repr__(self) -> str:
        return f"UserService(cache_size={self.cache_size})"
```

## Docstrings

Use Google-style docstrings.

### Function Docstrings

```python
def calculate_discount(
    price: float,
    discount_percent: float,
    max_discount: Optional[float] = None,
) -> float:
    """
    Calculate the discounted price.

    Applies a percentage discount to the given price, optionally
    capping the maximum discount amount.

    Args:
        price: Original price in dollars.
        discount_percent: Discount percentage (0-100).
        max_discount: Maximum discount amount. If None, no cap is applied.

    Returns:
        The discounted price.

    Raises:
        ValueError: If price is negative or discount_percent is out of range.

    Example:
        >>> calculate_discount(100.0, 20.0)
        80.0
        >>> calculate_discount(100.0, 50.0, max_discount=30.0)
        70.0
    """
    if price < 0:
        raise ValueError("Price cannot be negative")
    if not 0 <= discount_percent <= 100:
        raise ValueError("Discount percent must be between 0 and 100")

    discount = price * (discount_percent / 100)
    if max_discount is not None:
        discount = min(discount, max_discount)

    return price - discount
```

### Class Docstrings

```python
class UserRepository:
    """
    Repository for user database operations.

    Provides methods for CRUD operations on users in the database.
    Uses SQLAlchemy for database interactions.

    Attributes:
        session: SQLAlchemy database session.

    Example:
        >>> repo = UserRepository(session)
        >>> user = repo.find_by_id("user-123")
        >>> print(user.name)
    """

    def __init__(self, session: Session) -> None:
        """
        Initialize the repository.

        Args:
            session: SQLAlchemy database session.
        """
        self.session = session
```

## Error Handling

### Custom Exceptions

```python
# exceptions.py
class AppError(Exception):
    """Base exception for application errors."""

    def __init__(self, message: str, code: str = "APP_ERROR") -> None:
        self.message = message
        self.code = code
        super().__init__(message)


class NotFoundError(AppError):
    """Raised when a resource is not found."""

    def __init__(self, resource: str, identifier: str) -> None:
        super().__init__(
            message=f"{resource} not found: {identifier}",
            code="NOT_FOUND",
        )


class ValidationError(AppError):
    """Raised when validation fails."""

    def __init__(self, message: str, field: Optional[str] = None) -> None:
        super().__init__(message=message, code="VALIDATION_ERROR")
        self.field = field


class AuthorizationError(AppError):
    """Raised when authorization fails."""

    def __init__(self, message: str = "Access denied") -> None:
        super().__init__(message=message, code="UNAUTHORIZED")
```

### Exception Handling

```python
# Good - specific exception handling
async def get_user(user_id: str) -> User:
    try:
        user = await repository.find_by_id(user_id)
        if not user:
            raise NotFoundError("User", user_id)
        return user
    except DatabaseError as e:
        logger.error(f"Database error: {e}")
        raise AppError("Failed to retrieve user") from e

# Good - context manager for resources
async def process_file(path: str) -> dict:
    async with aiofiles.open(path) as f:
        content = await f.read()
        return parse_content(content)

# Bad - bare except
try:
    result = process_data(data)
except:  # Never do this
    pass

# Bad - catching Exception without re-raising
try:
    result = process_data(data)
except Exception:
    return None  # Silently swallowing errors
```

## Best Practices

### Use Context Managers

```python
# File handling
async with aiofiles.open("data.json") as f:
    data = await f.read()

# Database sessions
async with async_session() as session:
    user = await session.get(User, user_id)

# Custom context manager
from contextlib import asynccontextmanager

@asynccontextmanager
async def database_transaction():
    session = async_session()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
```

### Use Generators for Large Data

```python
# Good - generator for large data
def read_large_file(path: str):
    """Read large file line by line."""
    with open(path) as f:
        for line in f:
            yield line.strip()

# Good - async generator
async def fetch_all_users():
    """Fetch users in batches."""
    offset = 0
    batch_size = 100

    while True:
        users = await repository.find_all(offset=offset, limit=batch_size)
        if not users:
            break
        for user in users:
            yield user
        offset += batch_size

# Usage
async for user in fetch_all_users():
    process_user(user)
```

### Use Dataclasses for Data Structures

```python
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional


@dataclass
class User:
    """User data structure."""
    id: str
    email: str
    name: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    is_active: bool = True
    role: str = "user"


@dataclass(frozen=True)
class Point:
    """Immutable point."""
    x: float
    y: float


# Usage
user = User(id="1", email="john@example.com", name="John")
point = Point(x=1.0, y=2.0)
```

### Avoid Mutable Default Arguments

```python
# Bad - mutable default
def add_item(item: str, items: list = []) -> list:  # Bug!
    items.append(item)
    return items

# Good - use None and create inside
def add_item(item: str, items: Optional[list] = None) -> list:
    if items is None:
        items = []
    items.append(item)
    return items

# Good - use default_factory with dataclass
@dataclass
class Config:
    items: list = field(default_factory=list)
```

## Summary

| Category | Convention |
|----------|------------|
| **Indentation** | 4 spaces |
| **Line Length** | 88 characters |
| **Variables/Functions** | snake_case |
| **Classes** | PascalCase |
| **Constants** | UPPER_SNAKE_CASE |
| **Private** | _single_leading_underscore |
| **Imports** | Grouped and sorted |
| **Docstrings** | Google style |

## Related Documents

- [FastAPI Patterns](./fastapi-patterns.md)
- [Type Hints](./type-hints.md)
- [Python Testing](../07-testing/python-testing.md)
