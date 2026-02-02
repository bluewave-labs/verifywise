# Testing Strategy

Testing philosophy and strategy for VerifyWise development.

## Coverage Goals

**Target: 80% code coverage minimum**

| Layer | Coverage Target | Focus |
|-------|----------------|-------|
| Business Logic | 90%+ | Services, utilities |
| API Endpoints | 80%+ | Controllers, routes |
| UI Components | 70%+ | User interactions |
| Integration | 60%+ | Cross-module flows |

## Test Pyramid

```
                    /\
                   /  \
                  / E2E \         <- Few, slow, expensive
                 /--------\
                /          \
               / Integration \    <- Some, medium speed
              /----------------\
             /                  \
            /      Unit Tests    \ <- Many, fast, cheap
           /________________________\
```

### Unit Tests (Base of Pyramid)

- **Quantity**: Many (70% of tests)
- **Speed**: Fast (< 10ms each)
- **Scope**: Single function/class
- **Dependencies**: Mocked

```typescript
// Example: Unit test for utility function
describe('formatCurrency', () => {
  it('formats positive numbers with dollar sign', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('formats negative numbers with parentheses', () => {
    expect(formatCurrency(-100)).toBe('($100.00)');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});
```

### Integration Tests (Middle)

- **Quantity**: Some (25% of tests)
- **Speed**: Medium (< 1s each)
- **Scope**: Multiple modules working together
- **Dependencies**: Real or test databases

```typescript
// Example: Integration test for API endpoint
describe('POST /api/users', () => {
  it('creates a user and returns the created user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@example.com',
        name: 'Test User',
        password: 'SecurePass123!',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe('test@example.com');

    // Verify in database
    const user = await User.findByEmail('test@example.com');
    expect(user).toBeDefined();
  });
});
```

### End-to-End Tests (Top)

- **Quantity**: Few (5% of tests)
- **Speed**: Slow (> 1s each)
- **Scope**: Full user flows
- **Dependencies**: Real system

```typescript
// Example: E2E test for user registration flow
describe('User Registration', () => {
  it('completes full registration flow', async () => {
    await page.goto('/register');
    await page.fill('[name="email"]', 'new@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="name"]', 'New User');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Welcome, New User');
  });
});
```

## Test-Driven Development (TDD)

### Red-Green-Refactor Cycle

1. **Red**: Write a failing test
2. **Green**: Write minimum code to pass
3. **Refactor**: Improve code while keeping tests green

```typescript
// 1. RED - Write failing test first
describe('UserService.activate', () => {
  it('activates an inactive user', async () => {
    const user = await createInactiveUser();
    await userService.activate(user.id);
    const updated = await User.findById(user.id);
    expect(updated.isActive).toBe(true);
  });
});

// 2. GREEN - Write minimal implementation
class UserService {
  async activate(userId: string): Promise<void> {
    await User.update({ isActive: true }, { where: { id: userId } });
  }
}

// 3. REFACTOR - Improve while tests pass
class UserService {
  async activate(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) throw new NotFoundError('User', userId);
    if (user.isActive) throw new ConflictError('User already active');

    await user.update({ isActive: true });
    await this.sendActivationEmail(user);

    return user;
  }
}
```

### When to Use TDD

- New features with clear requirements
- Bug fixes (write test that reproduces bug first)
- Refactoring (tests ensure behavior preserved)
- Complex business logic

## Test Organization

### File Structure

```
src/
├── services/
│   ├── user.service.ts
│   └── user.service.test.ts    # Co-located tests
├── components/
│   ├── UserCard/
│   │   ├── UserCard.tsx
│   │   └── UserCard.test.tsx   # Component tests
└── utils/
    ├── formatters.ts
    └── formatters.test.ts

tests/                          # Integration/E2E tests
├── integration/
│   ├── api/
│   │   └── users.test.ts
│   └── setup.ts
└── e2e/
    ├── flows/
    │   └── registration.test.ts
    └── setup.ts
```

### Test Naming

```typescript
// Describe block: Component/Function name
describe('UserService', () => {
  // Nested describe for method/feature
  describe('createUser', () => {
    // It block: "should" + expected behavior + "when" + condition
    it('should create a user when valid data is provided', () => {});
    it('should throw ValidationError when email is invalid', () => {});
    it('should throw ConflictError when email already exists', () => {});
  });
});

// Alternative: Given-When-Then style
describe('UserService.createUser', () => {
  describe('given valid user data', () => {
    it('creates the user in database', () => {});
    it('sends welcome email', () => {});
  });

  describe('given invalid email', () => {
    it('throws ValidationError', () => {});
  });
});
```

## Test Isolation

### Database Isolation

```typescript
// tests/setup.ts
beforeEach(async () => {
  // Reset database before each test
  await sequelize.truncate({ cascade: true });
});

// Or use transactions
beforeEach(async () => {
  transaction = await sequelize.transaction();
});

afterEach(async () => {
  await transaction.rollback();
});
```

### Mock External Services

```typescript
// Mock external API
jest.mock('../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

// Mock third-party library
jest.mock('stripe', () => ({
  charges: {
    create: jest.fn().mockResolvedValue({ id: 'ch_test' }),
  },
}));

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

## Test Data

### Factories

```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';

interface UserOverrides {
  email?: string;
  name?: string;
  role?: string;
}

export function buildUser(overrides: UserOverrides = {}): UserInput {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role: 'user',
    ...overrides,
  };
}

export async function createUser(overrides: UserOverrides = {}): Promise<User> {
  const data = buildUser(overrides);
  return User.create({
    ...data,
    password: await hashPassword('TestPass123!'),
  });
}

// Usage
const user = await createUser({ role: 'admin' });
```

### Fixtures

```typescript
// tests/fixtures/users.ts
export const validUser = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'SecurePass123!',
};

export const adminUser = {
  email: 'admin@example.com',
  name: 'Admin User',
  password: 'AdminPass123!',
  role: 'admin',
};

export const invalidEmails = [
  'notanemail',
  '@nodomain.com',
  'no@tld',
  '',
  null,
];
```

## What to Test

### Must Test

- **Business logic** - Core functionality
- **Edge cases** - Boundaries, empty states
- **Error handling** - Expected failures
- **Security** - Auth, authorization
- **User interactions** - Forms, buttons, navigation

### Don't Test

- **Framework code** - Trust React, Express, etc.
- **Third-party libraries** - They have their own tests
- **Implementation details** - Test behavior, not internals
- **Trivial code** - Simple getters, one-liners

```typescript
// Don't test this (trivial)
class User {
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

// Do test this (business logic)
class PriceCalculator {
  calculate(items: CartItem[], discountCode?: string): number {
    // Complex logic worth testing
  }
}
```

## Continuous Integration

### CI Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linting
        run: npm run lint

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "vitest related --run"
    ]
  }
}
```

## Metrics and Reporting

### Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML report
open coverage/index.html
```

### Coverage Thresholds

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
});
```

## Summary

| Aspect | Guideline |
|--------|-----------|
| **Coverage** | 80% minimum |
| **Pyramid** | Many unit, some integration, few E2E |
| **TDD** | Red-Green-Refactor cycle |
| **Isolation** | Each test independent |
| **Naming** | `should [behavior] when [condition]` |
| **CI** | Tests run on every push/PR |

## Related Documents

- [Frontend Testing](./frontend-testing.md)
- [Backend Testing](./backend-testing.md)
- [Python Testing](./python-testing.md)
