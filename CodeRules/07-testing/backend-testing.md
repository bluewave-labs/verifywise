# Backend Testing

Guidelines for testing Node.js/Express applications using Jest.

## Setup

### Jest Configuration

```typescript
// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
```

### Test Setup

```typescript
// src/test/setup.ts
import { sequelize } from '../config/database';

// Increase timeout for database operations
jest.setTimeout(30000);

beforeAll(async () => {
  // Connect to test database
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
});

// Reset database between tests
beforeEach(async () => {
  await sequelize.truncate({ cascade: true });
});
```

## Unit Testing

### Service Testing

```typescript
// services/user.service.test.ts
import { UserService } from './user.service';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../models/User';
import { NotFoundError, ConflictError } from '../utils/errors';

// Mock the repository
jest.mock('../repositories/user.repository');

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockRepository = new UserRepository() as jest.Mocked<UserRepository>;
    userService = new UserService(mockRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      const mockUser = { id: '1', name: 'John', email: 'john@example.com' };
      mockRepository.findById.mockResolvedValue(mockUser as User);

      const result = await userService.findById('1');

      expect(result).toEqual(mockUser);
      expect(mockRepository.findById).toHaveBeenCalledWith('1');
    });

    it('throws NotFoundError when user not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(userService.findById('999')).rejects.toThrow(NotFoundError);
    });
  });

  describe('create', () => {
    const createData = {
      email: 'new@example.com',
      name: 'New User',
      password: 'password123',
    };

    it('creates user with hashed password', async () => {
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({
        id: '1',
        email: createData.email,
        name: createData.name,
      } as User);

      const result = await userService.create(createData);

      expect(result.email).toBe(createData.email);
      expect(mockRepository.create).toHaveBeenCalled();
      // Verify password was hashed
      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.password).not.toBe(createData.password);
    });

    it('throws ConflictError when email exists', async () => {
      mockRepository.findByEmail.mockResolvedValue({ id: '1' } as User);

      await expect(userService.create(createData)).rejects.toThrow(ConflictError);
    });
  });
});
```

### Utility Function Testing

```typescript
// utils/validators.test.ts
import { isValidEmail, isValidUUID, sanitizeString } from './validators';

describe('isValidEmail', () => {
  it('returns true for valid emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user.name@example.co.uk')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  it('returns false for invalid emails', () => {
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@nodomain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidUUID', () => {
  it('returns true for valid UUIDs', () => {
    expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('returns false for invalid UUIDs', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('123')).toBe(false);
  });
});

describe('sanitizeString', () => {
  it('trims whitespace', () => {
    expect(sanitizeString('  hello  ')).toBe('hello');
  });

  it('removes HTML tags', () => {
    expect(sanitizeString('<script>alert("xss")</script>')).toBe('');
  });
});
```

## Integration Testing

### API Endpoint Testing

```typescript
// routes/user.routes.test.ts
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { hashPassword } from '../utils/auth';

const app = createApp();

describe('User Routes', () => {
  describe('GET /api/v1/users', () => {
    beforeEach(async () => {
      await User.bulkCreate([
        { id: '1', email: 'user1@example.com', name: 'User 1', password: 'hash' },
        { id: '2', email: 'user2@example.com', name: 'User 2', password: 'hash' },
      ]);
    });

    it('returns list of users', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('email');
      expect(response.body.data[0]).not.toHaveProperty('password');
    });

    it('supports pagination', async () => {
      const response = await request(app)
        .get('/api/v1/users?page=1&limit=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta).toEqual({
        page: 1,
        perPage: 1,
        total: 2,
        totalPages: 2,
      });
    });
  });

  describe('POST /api/v1/users', () => {
    const validUserData = {
      email: 'new@example.com',
      name: 'New User',
      password: 'SecurePass123!',
    };

    it('creates a new user', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send(validUserData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(validUserData.email);
      expect(response.body.data).not.toHaveProperty('password');

      // Verify in database
      const user = await User.findOne({ where: { email: validUserData.email } });
      expect(user).toBeDefined();
    });

    it('returns 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/users')
        .send({ ...validUserData, email: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('returns 409 for duplicate email', async () => {
      await User.create({ ...validUserData, password: 'hash' });

      const response = await request(app)
        .post('/api/v1/users')
        .send(validUserData)
        .expect(409);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('returns user when found', async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        password: 'hash',
      });

      const response = await request(app)
        .get(`/api/v1/users/${user.id}`)
        .expect(200);

      expect(response.body.data.id).toBe(user.id);
    });

    it('returns 404 when not found', async () => {
      const response = await request(app)
        .get('/api/v1/users/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });
  });
});
```

### Authentication Testing

```typescript
// routes/auth.routes.test.ts
import request from 'supertest';
import { createApp } from '../app';
import { User } from '../models/User';
import { hashPassword, generateAccessToken } from '../utils/auth';

const app = createApp();

describe('Auth Routes', () => {
  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        email: 'test@example.com',
        name: 'Test User',
        password: await hashPassword('correctpassword'),
        isActive: true,
      });
    });

    it('returns tokens for valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword',
        })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('returns 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid email or password');
    });

    it('returns 401 for inactive user', async () => {
      await User.update(
        { isActive: false },
        { where: { email: 'test@example.com' } }
      );

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctpassword',
        })
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    let authToken: string;
    let userId: string;

    beforeEach(async () => {
      const user = await User.create({
        email: 'test@example.com',
        name: 'Test User',
        password: await hashPassword('password'),
      });
      userId = user.id;
      authToken = generateAccessToken(user.id);
    });

    it('allows access with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.id).toBe(userId);
    });

    it('returns 401 without token', async () => {
      await request(app)
        .get('/api/v1/users/me')
        .expect(401);
    });

    it('returns 401 with invalid token', async () => {
      await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
```

## Mocking Sequelize

### Model Mocking

```typescript
// Approach 1: Mock the model directly
jest.mock('../models/User', () => ({
  User: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
}));

// Approach 2: Use sequelize-mock
import SequelizeMock from 'sequelize-mock';

const DBConnectionMock = new SequelizeMock();
const UserMock = DBConnectionMock.define('User', {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
});

UserMock.$queueResult(UserMock.build({ id: '1', name: 'John' }));
```

### Transaction Testing

```typescript
describe('createUserWithProfile', () => {
  it('creates user and profile in transaction', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      bio: 'Test bio',
    };

    const result = await userService.createWithProfile(userData);

    // Both should be created
    const user = await User.findByPk(result.id);
    const profile = await Profile.findOne({ where: { userId: result.id } });

    expect(user).toBeDefined();
    expect(profile).toBeDefined();
    expect(profile?.bio).toBe(userData.bio);
  });

  it('rolls back on failure', async () => {
    // Mock profile creation to fail
    jest.spyOn(Profile, 'create').mockRejectedValueOnce(new Error('DB Error'));

    await expect(
      userService.createWithProfile({
        email: 'test@example.com',
        name: 'Test',
        bio: 'Test',
      })
    ).rejects.toThrow();

    // User should not be created
    const user = await User.findOne({ where: { email: 'test@example.com' } });
    expect(user).toBeNull();
  });
});
```

## Test Factories

```typescript
// test/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { User } from '../../models/User';
import { hashPassword } from '../../utils/auth';

interface UserOverrides {
  email?: string;
  name?: string;
  password?: string;
  role?: string;
  isActive?: boolean;
}

export async function createUser(overrides: UserOverrides = {}): Promise<User> {
  return User.create({
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: await hashPassword(overrides.password || 'TestPass123!'),
    role: 'user',
    isActive: true,
    ...overrides,
  });
}

export async function createAdmin(overrides: UserOverrides = {}): Promise<User> {
  return createUser({ ...overrides, role: 'admin' });
}

export function buildUserData(overrides: Partial<UserOverrides> = {}) {
  return {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    password: 'TestPass123!',
    ...overrides,
  };
}
```

## Testing Middleware

```typescript
// middleware/auth.middleware.test.ts
import { Request, Response, NextFunction } from 'express';
import { authenticate } from './auth.middleware';
import { generateAccessToken } from '../utils/auth';
import { User } from '../models/User';

describe('authenticate middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('calls next() with valid token', async () => {
    const user = await User.create({
      email: 'test@example.com',
      name: 'Test',
      password: 'hash',
      isActive: true,
    });

    const token = generateAccessToken(user.id);
    mockReq.headers = { authorization: `Bearer ${token}` };

    await authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect((mockReq as any).user).toBeDefined();
    expect((mockReq as any).user.id).toBe(user.id);
  });

  it('returns 401 without token', async () => {
    await authenticate(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 })
    );
  });
});
```

## Error Handling Tests

```typescript
describe('Error handling', () => {
  it('handles validation errors', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ email: 'invalid' })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: 'Validation failed',
      details: expect.arrayContaining([
        expect.objectContaining({ field: expect.any(String) }),
      ]),
    });
  });

  it('handles database errors gracefully', async () => {
    // Force a database error
    jest.spyOn(User, 'create').mockRejectedValueOnce(new Error('DB Error'));

    const response = await request(app)
      .post('/api/v1/users')
      .send(validUserData)
      .expect(500);

    expect(response.body.error).toBe('An unexpected error occurred');
    expect(response.body).not.toHaveProperty('stack');
  });
});
```

## Summary

| Test Type | Focus | Tools |
|-----------|-------|-------|
| **Unit** | Individual functions/classes | Jest mocks |
| **Integration** | API endpoints | Supertest |
| **Database** | Model operations | Test database |

## Related Documents

- [Testing Strategy](./testing-strategy.md)
- [Express Patterns](../04-backend/express-patterns.md)
- [Controller Guidelines](../04-backend/controller-guidelines.md)
