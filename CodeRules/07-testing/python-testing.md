# Python Testing

Guidelines for testing Python/FastAPI services using pytest and DeepEval.

## Setup

### pytest Configuration

```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
python_functions = ["test_*"]
asyncio_mode = "auto"
addopts = [
    "-v",
    "--tb=short",
    "--strict-markers",
    "-ra",
]
markers = [
    "slow: marks tests as slow",
    "integration: marks tests as integration tests",
]

[tool.coverage.run]
source = ["app"]
branch = true
omit = ["*/tests/*", "*/__pycache__/*"]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
]
fail_under = 80
```

### Conftest Setup

```python
# tests/conftest.py
import asyncio
from typing import AsyncGenerator, Generator

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import get_db, Base
from app.config import settings

# Test database
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def db_session(test_engine) -> AsyncGenerator[AsyncSession, None]:
    """Get database session for tests."""
    async_session = sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Get test client with overridden database."""
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

    app.dependency_overrides.clear()
```

## Unit Testing

### Service Testing

```python
# tests/services/test_user_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock

from app.services.user_service import UserService
from app.schemas.user import UserCreate
from app.exceptions import NotFoundError, ConflictError


@pytest.fixture
def mock_repository():
    """Create mock repository."""
    return AsyncMock()


@pytest.fixture
def user_service(mock_repository):
    """Create user service with mock repository."""
    return UserService(repository=mock_repository)


class TestUserServiceFindById:
    async def test_returns_user_when_found(self, user_service, mock_repository):
        # Arrange
        expected_user = MagicMock(id="1", email="test@example.com")
        mock_repository.find_by_id.return_value = expected_user

        # Act
        result = await user_service.find_by_id("1")

        # Assert
        assert result == expected_user
        mock_repository.find_by_id.assert_called_once_with("1")

    async def test_raises_not_found_when_user_missing(self, user_service, mock_repository):
        # Arrange
        mock_repository.find_by_id.return_value = None

        # Act & Assert
        with pytest.raises(NotFoundError):
            await user_service.find_by_id("999")


class TestUserServiceCreate:
    async def test_creates_user_with_hashed_password(self, user_service, mock_repository):
        # Arrange
        mock_repository.find_by_email.return_value = None
        mock_repository.create.return_value = MagicMock(
            id="1",
            email="new@example.com",
        )

        user_data = UserCreate(
            email="new@example.com",
            name="New User",
            password="SecurePass123!",
        )

        # Act
        result = await user_service.create(user_data)

        # Assert
        assert result.email == "new@example.com"
        mock_repository.create.assert_called_once()

        # Verify password was hashed
        call_args = mock_repository.create.call_args[0][0]
        assert call_args.password != "SecurePass123!"

    async def test_raises_conflict_when_email_exists(self, user_service, mock_repository):
        # Arrange
        mock_repository.find_by_email.return_value = MagicMock(id="1")

        user_data = UserCreate(
            email="existing@example.com",
            name="User",
            password="password123",
        )

        # Act & Assert
        with pytest.raises(ConflictError):
            await user_service.create(user_data)
```

### Utility Function Testing

```python
# tests/utils/test_validators.py
import pytest

from app.utils.validators import (
    is_valid_email,
    is_valid_uuid,
    sanitize_string,
)


class TestIsValidEmail:
    @pytest.mark.parametrize("email", [
        "user@example.com",
        "user.name@example.co.uk",
        "user+tag@example.com",
    ])
    def test_returns_true_for_valid_emails(self, email: str):
        assert is_valid_email(email) is True

    @pytest.mark.parametrize("email", [
        "notanemail",
        "@nodomain.com",
        "user@",
        "",
        None,
    ])
    def test_returns_false_for_invalid_emails(self, email):
        assert is_valid_email(email) is False


class TestIsValidUUID:
    def test_returns_true_for_valid_uuid(self):
        assert is_valid_uuid("123e4567-e89b-12d3-a456-426614174000") is True

    @pytest.mark.parametrize("value", ["not-a-uuid", "123", ""])
    def test_returns_false_for_invalid_uuid(self, value: str):
        assert is_valid_uuid(value) is False


class TestSanitizeString:
    def test_trims_whitespace(self):
        assert sanitize_string("  hello  ") == "hello"

    def test_removes_html_tags(self):
        assert sanitize_string("<script>alert('xss')</script>") == ""

    def test_handles_none(self):
        assert sanitize_string(None) == ""
```

## Integration Testing

### API Endpoint Testing

```python
# tests/api/test_users.py
import pytest
from httpx import AsyncClient

from app.models import User
from tests.factories import create_user, build_user_data


@pytest.mark.integration
class TestListUsers:
    async def test_returns_list_of_users(self, client: AsyncClient, db_session):
        # Arrange
        await create_user(db_session, email="user1@example.com")
        await create_user(db_session, email="user2@example.com")

        # Act
        response = await client.get("/api/v1/users")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 2

    async def test_supports_pagination(self, client: AsyncClient, db_session):
        # Arrange
        for i in range(15):
            await create_user(db_session, email=f"user{i}@example.com")

        # Act
        response = await client.get("/api/v1/users?page=1&limit=10")

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert len(data["data"]) == 10
        assert data["meta"]["total"] == 15


@pytest.mark.integration
class TestCreateUser:
    async def test_creates_user_with_valid_data(self, client: AsyncClient, db_session):
        # Arrange
        user_data = build_user_data()

        # Act
        response = await client.post("/api/v1/users", json=user_data)

        # Assert
        assert response.status_code == 201
        data = response.json()
        assert data["data"]["email"] == user_data["email"]
        assert "password" not in data["data"]

        # Verify in database
        user = await db_session.get(User, data["data"]["id"])
        assert user is not None

    async def test_returns_400_for_invalid_email(self, client: AsyncClient):
        # Arrange
        user_data = build_user_data(email="invalid")

        # Act
        response = await client.post("/api/v1/users", json=user_data)

        # Assert
        assert response.status_code == 400
        assert response.json()["error"] == "Validation failed"

    async def test_returns_409_for_duplicate_email(self, client: AsyncClient, db_session):
        # Arrange
        existing = await create_user(db_session, email="existing@example.com")
        user_data = build_user_data(email="existing@example.com")

        # Act
        response = await client.post("/api/v1/users", json=user_data)

        # Assert
        assert response.status_code == 409


@pytest.mark.integration
class TestGetUser:
    async def test_returns_user_when_found(self, client: AsyncClient, db_session):
        # Arrange
        user = await create_user(db_session)

        # Act
        response = await client.get(f"/api/v1/users/{user.id}")

        # Assert
        assert response.status_code == 200
        assert response.json()["data"]["id"] == str(user.id)

    async def test_returns_404_when_not_found(self, client: AsyncClient):
        # Act
        response = await client.get("/api/v1/users/00000000-0000-0000-0000-000000000000")

        # Assert
        assert response.status_code == 404
```

### Authentication Testing

```python
# tests/api/test_auth.py
import pytest
from httpx import AsyncClient

from tests.factories import create_user


@pytest.mark.integration
class TestLogin:
    async def test_returns_tokens_for_valid_credentials(
        self, client: AsyncClient, db_session
    ):
        # Arrange
        user = await create_user(
            db_session,
            email="test@example.com",
            password="correctpassword",
        )

        # Act
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "correctpassword",
            },
        )

        # Assert
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert response.cookies.get("refresh_token") is not None

    async def test_returns_401_for_invalid_credentials(
        self, client: AsyncClient, db_session
    ):
        # Arrange
        await create_user(db_session, email="test@example.com")

        # Act
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "wrongpassword",
            },
        )

        # Assert
        assert response.status_code == 401
        assert response.json()["error"] == "Invalid email or password"


@pytest.mark.integration
class TestProtectedRoutes:
    async def test_allows_access_with_valid_token(
        self, client: AsyncClient, db_session
    ):
        # Arrange
        user = await create_user(db_session)
        login_response = await client.post(
            "/api/v1/auth/login",
            json={"email": user.email, "password": "TestPass123!"},
        )
        token = login_response.json()["access_token"]

        # Act
        response = await client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        # Assert
        assert response.status_code == 200
        assert response.json()["data"]["id"] == str(user.id)

    async def test_returns_401_without_token(self, client: AsyncClient):
        # Act
        response = await client.get("/api/v1/users/me")

        # Assert
        assert response.status_code == 401
```

## Test Factories

```python
# tests/factories.py
from typing import Optional
from faker import Faker
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.utils.auth import hash_password

fake = Faker()


def build_user_data(
    email: Optional[str] = None,
    name: Optional[str] = None,
    password: Optional[str] = None,
) -> dict:
    """Build user data dictionary."""
    return {
        "email": email or fake.email(),
        "name": name or fake.name(),
        "password": password or "TestPass123!",
    }


async def create_user(
    db: AsyncSession,
    email: Optional[str] = None,
    name: Optional[str] = None,
    password: Optional[str] = None,
    role: str = "user",
    is_active: bool = True,
) -> User:
    """Create a user in the database."""
    user = User(
        email=email or fake.email(),
        name=name or fake.name(),
        password_hash=hash_password(password or "TestPass123!"),
        role=role,
        is_active=is_active,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def create_admin(db: AsyncSession, **kwargs) -> User:
    """Create an admin user."""
    return await create_user(db, role="admin", **kwargs)
```

## DeepEval for AI Testing

### Setup

```python
# tests/ai/conftest.py
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import (
    AnswerRelevancyMetric,
    FaithfulnessMetric,
    ContextualPrecisionMetric,
)


@pytest.fixture
def answer_relevancy_metric():
    return AnswerRelevancyMetric(threshold=0.7)


@pytest.fixture
def faithfulness_metric():
    return FaithfulnessMetric(threshold=0.7)
```

### AI Response Testing

```python
# tests/ai/test_ai_responses.py
import pytest
from deepeval import assert_test
from deepeval.test_case import LLMTestCase
from deepeval.metrics import AnswerRelevancyMetric


class TestAIResponses:
    @pytest.mark.slow
    async def test_response_relevancy(self, answer_relevancy_metric):
        """Test that AI responses are relevant to the input."""
        test_case = LLMTestCase(
            input="What is the capital of France?",
            actual_output="The capital of France is Paris.",
            expected_output="Paris",
        )

        assert_test(test_case, [answer_relevancy_metric])

    @pytest.mark.slow
    async def test_factual_accuracy(self, faithfulness_metric):
        """Test that AI responses are factually accurate."""
        test_case = LLMTestCase(
            input="Explain photosynthesis briefly.",
            actual_output="Photosynthesis is the process by which plants convert sunlight into energy.",
            retrieval_context=[
                "Photosynthesis is a process used by plants to convert light energy into chemical energy."
            ],
        )

        assert_test(test_case, [faithfulness_metric])


class TestRAGPipeline:
    @pytest.mark.slow
    async def test_context_precision(self):
        """Test that retrieved context is relevant."""
        metric = ContextualPrecisionMetric(threshold=0.7)

        test_case = LLMTestCase(
            input="What are the benefits of exercise?",
            actual_output="Exercise improves cardiovascular health and mental wellbeing.",
            retrieval_context=[
                "Regular exercise strengthens the heart and improves blood circulation.",
                "Physical activity releases endorphins, improving mood and reducing stress.",
            ],
            expected_output="Exercise has cardiovascular and mental health benefits.",
        )

        assert_test(test_case, [metric])
```

## Mocking and Patching

```python
# tests/services/test_email_service.py
from unittest.mock import AsyncMock, patch

import pytest

from app.services.email_service import EmailService


class TestEmailService:
    @pytest.fixture
    def email_service(self):
        return EmailService()

    async def test_sends_email_successfully(self, email_service):
        with patch.object(
            email_service,
            "_smtp_client",
            new_callable=AsyncMock,
        ) as mock_smtp:
            mock_smtp.send.return_value = True

            result = await email_service.send(
                to="test@example.com",
                subject="Test",
                body="Hello",
            )

            assert result is True
            mock_smtp.send.assert_called_once()

    @patch("app.services.email_service.smtp_client")
    async def test_handles_smtp_error(self, mock_smtp, email_service):
        mock_smtp.send.side_effect = Exception("SMTP Error")

        result = await email_service.send(
            to="test@example.com",
            subject="Test",
            body="Hello",
        )

        assert result is False
```

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific tests
pytest tests/api/test_users.py -v

# Run marked tests
pytest -m integration
pytest -m "not slow"

# Run tests matching pattern
pytest -k "test_create"
```

## Summary

| Test Type | Tool | Focus |
|-----------|------|-------|
| **Unit** | pytest + mock | Individual functions |
| **Integration** | pytest + httpx | API endpoints |
| **AI/ML** | DeepEval | Response quality |

## Related Documents

- [Testing Strategy](./testing-strategy.md)
- [FastAPI Patterns](../05-python/fastapi-patterns.md)
- [Python Standards](../05-python/python-standards.md)
