# Type Hints

Guidelines for using type hints in Python for VerifyWise services.

## Why Type Hints

- **Better IDE support** - Autocomplete, refactoring, navigation
- **Early error detection** - Catch type errors before runtime
- **Self-documenting code** - Types serve as documentation
- **Safer refactoring** - Type checker validates changes
- **Team communication** - Clear interface contracts

## Basic Type Hints

### Variables

```python
# Basic types
name: str = "John"
age: int = 30
price: float = 19.99
is_active: bool = True

# Type inference - annotation optional when obvious
count = 0  # int inferred
items = []  # list[Any] - better to annotate

# Annotate when type isn't obvious
user_ids: list[str] = []
settings: dict[str, Any] = {}
```

### Functions

```python
def greet(name: str) -> str:
    """Return a greeting message."""
    return f"Hello, {name}!"


def add_numbers(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b


def process_items(items: list[str]) -> None:
    """Process items (no return value)."""
    for item in items:
        print(item)


async def fetch_user(user_id: str) -> User:
    """Fetch user from database."""
    return await db.users.find_by_id(user_id)
```

### Optional and Union

```python
from typing import Optional, Union

# Optional - can be None
def find_user(user_id: str) -> Optional[User]:
    """Find user, returns None if not found."""
    return db.users.get(user_id)

# Equivalent using Union
def find_user(user_id: str) -> Union[User, None]:
    pass

# Python 3.10+ syntax
def find_user(user_id: str) -> User | None:
    pass

# Default None
def greet(name: str, title: Optional[str] = None) -> str:
    if title:
        return f"Hello, {title} {name}!"
    return f"Hello, {name}!"
```

### Collections

```python
from typing import List, Dict, Set, Tuple

# Python 3.9+ - use built-in types directly
users: list[User] = []
user_map: dict[str, User] = {}
unique_ids: set[str] = set()
coordinates: tuple[float, float] = (1.0, 2.0)

# Python 3.8 - use typing module
users: List[User] = []
user_map: Dict[str, User] = {}
unique_ids: Set[str] = set()
coordinates: Tuple[float, float] = (1.0, 2.0)

# Nested collections
matrix: list[list[int]] = [[1, 2], [3, 4]]
grouped_users: dict[str, list[User]] = {}

# Variable-length tuple
args: tuple[int, ...] = (1, 2, 3, 4, 5)
```

## Advanced Types

### TypedDict

```python
from typing import TypedDict, Required, NotRequired


class UserDict(TypedDict):
    """User dictionary structure."""
    id: str
    name: str
    email: str
    age: NotRequired[int]  # Optional key


class Config(TypedDict, total=False):
    """All keys optional."""
    debug: bool
    log_level: str
    max_retries: int


# Usage
user: UserDict = {
    "id": "1",
    "name": "John",
    "email": "john@example.com",
}

config: Config = {"debug": True}  # Other keys optional
```

### Literal

```python
from typing import Literal

# Restrict to specific values
Status = Literal["pending", "active", "inactive"]
HttpMethod = Literal["GET", "POST", "PUT", "DELETE"]


def set_status(status: Status) -> None:
    """Set user status."""
    pass


set_status("active")   # OK
set_status("invalid")  # Type error


# In function signatures
def make_request(
    url: str,
    method: Literal["GET", "POST"] = "GET",
) -> Response:
    pass
```

### TypeVar and Generics

```python
from typing import TypeVar, Generic

T = TypeVar("T")
K = TypeVar("K")
V = TypeVar("V")


# Generic function
def first(items: list[T]) -> T | None:
    """Get first item from list."""
    return items[0] if items else None


# Constrained TypeVar
Number = TypeVar("Number", int, float)


def add(a: Number, b: Number) -> Number:
    """Add two numbers of same type."""
    return a + b


# Generic class
class Repository(Generic[T]):
    """Generic repository for any model type."""

    def __init__(self, model_class: type[T]) -> None:
        self.model_class = model_class

    async def find_by_id(self, id: str) -> T | None:
        pass

    async def find_all(self) -> list[T]:
        pass

    async def create(self, data: dict) -> T:
        pass


# Usage
user_repo: Repository[User] = Repository(User)
user = await user_repo.find_by_id("123")  # Returns User | None
```

### Callable

```python
from typing import Callable, Awaitable

# Synchronous callable
Validator = Callable[[str], bool]


def validate_email(email: str) -> bool:
    return "@" in email


validator: Validator = validate_email


# Async callable
AsyncFetcher = Callable[[str], Awaitable[dict]]


async def fetch_data(url: str) -> dict:
    pass


fetcher: AsyncFetcher = fetch_data


# Callable with keyword arguments
Handler = Callable[..., None]  # Any arguments


def register_handler(event: str, handler: Handler) -> None:
    pass
```

### Protocol

```python
from typing import Protocol, runtime_checkable


# Structural typing (duck typing with type hints)
class Serializable(Protocol):
    """Protocol for serializable objects."""

    def to_dict(self) -> dict:
        ...


class JsonSerializable(Protocol):
    """Protocol for JSON serializable objects."""

    def to_json(self) -> str:
        ...


# Classes don't need to explicitly inherit
class User:
    def to_dict(self) -> dict:
        return {"id": self.id, "name": self.name}


def serialize(obj: Serializable) -> dict:
    """Serialize any object with to_dict method."""
    return obj.to_dict()


user = User()
serialize(user)  # OK - User has to_dict method


# Runtime checkable protocol
@runtime_checkable
class Closeable(Protocol):
    def close(self) -> None:
        ...


# Can use isinstance at runtime
if isinstance(resource, Closeable):
    resource.close()
```

### NewType

```python
from typing import NewType

# Create distinct types for documentation and safety
UserId = NewType("UserId", str)
ProjectId = NewType("ProjectId", str)
Email = NewType("Email", str)


def get_user(user_id: UserId) -> User:
    pass


def get_project(project_id: ProjectId) -> Project:
    pass


# Usage
user_id = UserId("user-123")
project_id = ProjectId("project-456")

get_user(user_id)      # OK
get_user(project_id)   # Type error - wrong type
get_user("user-123")   # Type error - plain string
```

## Type Aliases

```python
from typing import TypeAlias

# Simple aliases
UserId: TypeAlias = str
UserList: TypeAlias = list[User]
UserMap: TypeAlias = dict[str, User]

# Complex aliases
JsonValue: TypeAlias = (
    str | int | float | bool | None | list["JsonValue"] | dict[str, "JsonValue"]
)

Callback: TypeAlias = Callable[[str, int], None]
AsyncCallback: TypeAlias = Callable[[str], Awaitable[None]]

# Response type
ApiResponse: TypeAlias = dict[str, Any]


def fetch_users() -> UserList:
    pass


def get_user_map() -> UserMap:
    pass
```

## Class Type Hints

### Instance and Class Methods

```python
from typing import ClassVar, Self


class User:
    # Class variable
    _instances: ClassVar[dict[str, "User"]] = {}

    def __init__(self, name: str, email: str) -> None:
        self.name = name
        self.email = email

    @classmethod
    def from_dict(cls, data: dict[str, str]) -> Self:
        """Create instance from dictionary."""
        return cls(name=data["name"], email=data["email"])

    @classmethod
    def get_instance(cls, user_id: str) -> Self | None:
        """Get cached instance."""
        return cls._instances.get(user_id)

    def copy(self) -> Self:
        """Create a copy of this user."""
        return self.__class__(name=self.name, email=self.email)
```

### Dataclasses

```python
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class User:
    """User model with type hints."""
    id: str
    name: str
    email: str
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.utcnow)
    tags: list[str] = field(default_factory=list)


@dataclass(frozen=True)
class Point:
    """Immutable point."""
    x: float
    y: float


@dataclass
class Config:
    """Configuration with post-init processing."""
    host: str
    port: int
    url: str = field(init=False)

    def __post_init__(self) -> None:
        self.url = f"http://{self.host}:{self.port}"
```

## Pydantic Models

```python
from pydantic import BaseModel, Field, EmailStr, field_validator
from datetime import datetime


class UserBase(BaseModel):
    """Base user model."""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """User creation model."""
    password: str = Field(..., min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase")
        return v


class UserResponse(UserBase):
    """User response model."""
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response."""
    items: list[T]
    total: int
    page: int
    limit: int
```

## AsyncIO Types

```python
from typing import AsyncIterator, AsyncGenerator, Coroutine
from collections.abc import Awaitable


# Async generator
async def fetch_pages() -> AsyncGenerator[list[User], None]:
    """Fetch users page by page."""
    page = 1
    while True:
        users = await fetch_users(page=page)
        if not users:
            break
        yield users
        page += 1


# Async iterator
async def stream_events() -> AsyncIterator[Event]:
    """Stream events."""
    async for event in event_source:
        yield event


# Coroutine type
def start_task(coro: Coroutine[Any, Any, T]) -> Task[T]:
    """Start a task from coroutine."""
    return asyncio.create_task(coro)


# Awaitable
async def process(awaitable: Awaitable[str]) -> str:
    """Process any awaitable."""
    return await awaitable
```

## Overloads

```python
from typing import overload


@overload
def process(value: str) -> str:
    ...


@overload
def process(value: int) -> int:
    ...


@overload
def process(value: list[str]) -> list[str]:
    ...


def process(value: str | int | list[str]) -> str | int | list[str]:
    """Process different types differently."""
    if isinstance(value, str):
        return value.upper()
    elif isinstance(value, int):
        return value * 2
    else:
        return [v.upper() for v in value]


# Type checker knows return type based on input
result1 = process("hello")     # str
result2 = process(42)          # int
result3 = process(["a", "b"])  # list[str]
```

## Type Checking with mypy

### Configuration

```toml
# pyproject.toml
[tool.mypy]
python_version = "3.12"
strict = true
warn_return_any = true
warn_unused_ignores = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_any_generics = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_configs = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false
```

### Common mypy Commands

```bash
# Check entire project
mypy app/

# Check specific file
mypy app/services/user_service.py

# Show error codes
mypy --show-error-codes app/

# Generate HTML report
mypy --html-report mypy_report app/
```

### Handling mypy Errors

```python
# Ignore specific line
result = some_untyped_function()  # type: ignore[no-untyped-call]

# Type assertion
from typing import cast

value = cast(str, some_value)

# Reveal type (for debugging)
from typing import reveal_type

reveal_type(variable)  # mypy will print the inferred type

# TYPE_CHECKING for import cycles
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import User  # Only imported during type checking


def process_user(user: "User") -> None:  # Forward reference as string
    pass
```

## Summary

| Type | Use Case |
|------|----------|
| **Basic types** | str, int, float, bool |
| **Optional** | Value or None |
| **Union** | One of several types |
| **Literal** | Specific allowed values |
| **TypeVar** | Generic type parameters |
| **Protocol** | Structural typing |
| **TypedDict** | Typed dictionaries |
| **Callable** | Function types |

## Related Documents

- [Python Standards](./python-standards.md)
- [FastAPI Patterns](./fastapi-patterns.md)
- [Python Testing](../07-testing/python-testing.md)
