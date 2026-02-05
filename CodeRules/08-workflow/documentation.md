# Documentation

Guidelines for writing documentation in VerifyWise.

## Types of Documentation

| Type | Location | Purpose |
|------|----------|---------|
| Code comments | In source files | Explain complex logic |
| JSDoc/Docstrings | In source files | API documentation |
| README | Per directory/component | Usage and setup |
| API docs | OpenAPI/Swagger | External API reference |
| Architecture | `/docs` | System design |

## Code Comments

### When to Comment

Comment **why**, not **what**:

```typescript
// Bad: States what code does
// Loop through users
for (const user of users) {
  // Check if active
  if (user.isActive) {
    // Add to list
    result.push(user);
  }
}

// Good: Explains why
// Filter out deactivated users as they shouldn't receive notifications
// per GDPR compliance requirements (see issue #456)
const activeUsers = users.filter(user => user.isActive);
```

### When NOT to Comment

```typescript
// Bad: Obvious code needs no comment
// Increment counter
counter++;

// Set name to John
const name = 'John';

// Return the result
return result;

// Good: Self-documenting code needs no comment
counter++;
const userName = 'John';
return processedResult;
```

### Complex Logic

```typescript
// Good: Explain complex algorithm
// Use binary search for O(log n) performance since the array
// is sorted by createdAt and can contain 10k+ items
function findUserByDate(users: User[], targetDate: Date): User | null {
  let left = 0;
  let right = users.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    // ...
  }
}
```

### TODO Comments

Include ticket reference:

```typescript
// TODO(#123): Implement caching once Redis is available
// TODO(@username): Review this approach after launch
// FIXME(#456): This breaks when user has no email
```

## JSDoc (TypeScript)

### Function Documentation

```typescript
/**
 * Calculates the total price including tax and discounts.
 *
 * @param items - Array of cart items to calculate
 * @param taxRate - Tax rate as decimal (e.g., 0.08 for 8%)
 * @param discountCode - Optional discount code to apply
 * @returns Total price in cents
 * @throws {InvalidDiscountError} If discount code is invalid
 *
 * @example
 * ```ts
 * const total = calculateTotal(items, 0.08, 'SAVE10');
 * console.log(total); // 10800 (cents)
 * ```
 */
function calculateTotal(
  items: CartItem[],
  taxRate: number,
  discountCode?: string
): number {
  // implementation
}
```

### Interface Documentation

```typescript
/**
 * Represents a user in the system.
 */
interface User {
  /** Unique identifier */
  id: string;

  /** User's email address (unique) */
  email: string;

  /** Display name */
  name: string;

  /**
   * User's role determining permissions.
   * @default 'user'
   */
  role: 'admin' | 'user' | 'guest';

  /** Whether the user account is active */
  isActive: boolean;

  /** ISO timestamp of account creation */
  createdAt: string;
}
```

### Class Documentation

```typescript
/**
 * Service for managing user operations.
 *
 * Handles user CRUD operations, authentication state,
 * and profile management.
 *
 * @example
 * ```ts
 * const userService = new UserService(repository);
 * const user = await userService.create({ email, name, password });
 * ```
 */
class UserService {
  /**
   * Creates a new UserService instance.
   *
   * @param repository - User repository for database operations
   * @param emailService - Optional email service for notifications
   */
  constructor(
    private repository: UserRepository,
    private emailService?: EmailService
  ) {}

  /**
   * Creates a new user account.
   *
   * @param data - User creation data
   * @returns The created user
   * @throws {ConflictError} If email already exists
   */
  async create(data: CreateUserInput): Promise<User> {
    // implementation
  }
}
```

## Python Docstrings

Use Google style docstrings:

### Function Docstrings

```python
def calculate_total(
    items: list[CartItem],
    tax_rate: float,
    discount_code: str | None = None,
) -> int:
    """
    Calculate the total price including tax and discounts.

    Args:
        items: List of cart items to calculate.
        tax_rate: Tax rate as decimal (e.g., 0.08 for 8%).
        discount_code: Optional discount code to apply.

    Returns:
        Total price in cents.

    Raises:
        InvalidDiscountError: If discount code is invalid.

    Example:
        >>> total = calculate_total(items, 0.08, 'SAVE10')
        >>> print(total)
        10800
    """
```

### Class Docstrings

```python
class UserService:
    """
    Service for managing user operations.

    Handles user CRUD operations, authentication state,
    and profile management.

    Attributes:
        repository: User repository for database operations.
        email_service: Optional email service for notifications.

    Example:
        >>> service = UserService(repository)
        >>> user = await service.create(CreateUserInput(...))
    """

    def __init__(
        self,
        repository: UserRepository,
        email_service: EmailService | None = None,
    ) -> None:
        """
        Initialize the UserService.

        Args:
            repository: User repository for database operations.
            email_service: Optional email service for notifications.
        """
        self.repository = repository
        self.email_service = email_service
```

## README Files

### Project README

```markdown
# VerifyWise

Brief description of what the project does.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm 8+

## Installation

\```bash
pnpm install
cp .env.example .env
# Edit .env with your settings
\```

## Development

\```bash
pnpm dev
\```

## Testing

\```bash
pnpm test
pnpm test:coverage
\```

## Project Structure

\```
src/
├── components/    # React components
├── services/      # Business logic
├── hooks/         # Custom hooks
└── utils/         # Utility functions
\```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT
```

### Component README

```markdown
# UserCard Component

Displays user information in a card format.

## Usage

\```tsx
import { UserCard } from '@/components/UserCard';

<UserCard
  user={user}
  onEdit={handleEdit}
  showActions
/>
\```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| user | User | required | User object to display |
| onEdit | (user: User) => void | - | Called when edit is clicked |
| showActions | boolean | true | Show action buttons |

## Examples

### Basic

\```tsx
<UserCard user={user} />
\```

### With Actions

\```tsx
<UserCard
  user={user}
  onEdit={handleEdit}
  onDelete={handleDelete}
  showActions
/>
\```
```

## API Documentation

### OpenAPI/Swagger

```yaml
# openapi.yaml
openapi: 3.0.0
info:
  title: VerifyWise API
  version: 1.0.0
  description: API for VerifyWise platform

paths:
  /users:
    get:
      summary: List users
      description: Returns a paginated list of users
      tags:
        - Users
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 10
            maximum: 100
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
      required:
        - id
        - email
        - name
```

### FastAPI Auto-Documentation

```python
@router.get(
    "/users",
    response_model=UserListResponse,
    summary="List users",
    description="Returns a paginated list of users.",
    responses={
        200: {"description": "Successful response"},
        400: {"description": "Invalid parameters"},
    },
)
async def list_users(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
) -> UserListResponse:
    """
    List users with pagination.

    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 10, max: 100)
    """
```

## Architecture Documentation

### ADR (Architecture Decision Records)

```markdown
# ADR-001: Use PostgreSQL as Primary Database

## Status

Accepted

## Context

We need to choose a database for the application. Options considered:
- PostgreSQL
- MySQL
- MongoDB

## Decision

We will use PostgreSQL.

## Rationale

- Strong ACID compliance
- Excellent JSON support for flexible schemas
- Mature ecosystem with Sequelize ORM
- Team expertise

## Consequences

### Positive
- Reliable data integrity
- Powerful querying capabilities

### Negative
- Requires more setup than SQLite
- Need to manage connections

## Alternatives Considered

- **MongoDB**: Rejected due to eventual consistency concerns
- **MySQL**: Viable but less feature-rich
```

## Summary

| Documentation Type | When to Use |
|-------------------|-------------|
| **Code comments** | Complex logic, business rules |
| **JSDoc/Docstrings** | Public APIs, exported functions |
| **README** | Setup, usage, examples |
| **API docs** | External API consumers |
| **ADRs** | Important decisions |

## Related Documents

- [Clean Code Principles](../01-foundations/clean-code.md)
- [TypeScript Standards](../02-typescript/typescript-standards.md)
- [Python Standards](../05-python/python-standards.md)
