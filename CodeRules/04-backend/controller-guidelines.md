# Controller Guidelines

Guidelines for implementing Express.js controllers in VerifyWise.

## Controller Structure

### Basic Controller Pattern

```typescript
// controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { HTTP_STATUS } from '../utils/httpStatus';
import { AppError } from '../utils/errors';

export const UserController = {
  /**
   * Get all users with pagination
   * GET /api/v1/users
   */
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 10, search } = req.query;

      const result = await userService.findAll({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.users,
        meta: {
          page: Number(page),
          perPage: Number(limit),
          total: result.total,
          totalPages: Math.ceil(result.total / Number(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await userService.findById(id);

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create new user
   * POST /api/v1/users
   */
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = req.body;

      const user = await userService.create(userData);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update user
   * PUT /api/v1/users/:id
   */
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      const user = await userService.update(id, updates);

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete user
   * DELETE /api/v1/users/:id
   */
  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await userService.delete(id);

      if (!deleted) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  },
};
```

## Request Handling

### Typed Request Parameters

```typescript
// types/requests.ts
import { Request } from 'express';

interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UserParams {
  id: string;
}

interface CreateUserBody {
  email: string;
  password: string;
  name: string;
}

// Typed request
type GetUsersRequest = Request<{}, {}, {}, PaginationQuery>;
type GetUserRequest = Request<UserParams>;
type CreateUserRequest = Request<{}, {}, CreateUserBody>;

// Usage
async getAll(req: GetUsersRequest, res: Response, next: NextFunction) {
  const { page, limit, sortBy, sortOrder } = req.query;
  // Types are inferred
}
```

### Accessing Authenticated User

```typescript
// types/express.d.ts
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Usage in controller
async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // User attached by auth middleware
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('Unauthorized', HTTP_STATUS.UNAUTHORIZED);
    }

    const profile = await userService.getProfile(userId);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
}
```

## Input Validation

### Pre-Validated Data

Controllers should receive pre-validated data from middleware.

```typescript
// routes/user.routes.ts
import { validate } from '../middleware/validation.middleware';
import { createUserSchema } from '../schemas/user.schema';

router.post(
  '/',
  validate(createUserSchema),
  UserController.create
);

// Controller receives validated data
async create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Data already validated by middleware
    const { email, password, name } = req.body;

    const user = await userService.create({ email, password, name });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
```

### Additional Business Validation

```typescript
async create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Business validation (not schema validation)
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      throw new AppError('Email already registered', HTTP_STATUS.CONFLICT);
    }

    const user = await userService.create({ email, password, name });

    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
```

## Response Patterns

### Success Responses

```typescript
// Single resource
res.status(200).json({
  success: true,
  data: user,
});

// Collection with pagination
res.status(200).json({
  success: true,
  data: users,
  meta: {
    page: 1,
    perPage: 10,
    total: 100,
    totalPages: 10,
  },
});

// Created resource
res.status(201).json({
  success: true,
  data: newUser,
});

// No content (delete, some updates)
res.status(204).send();

// Action result
res.status(200).json({
  success: true,
  message: 'Password reset email sent',
});
```

### Error Responses

```typescript
// Use AppError for expected errors
throw new AppError('User not found', 404);
throw new AppError('Email already exists', 409);
throw new AppError('Invalid credentials', 401);

// Error middleware handles formatting
// {
//   success: false,
//   error: 'User not found'
// }
```

## Controller Best Practices

### Keep Controllers Thin

Controllers should only:
1. Extract data from request
2. Call service layer
3. Format and send response

```typescript
// Bad: Business logic in controller
async create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Bad: Business logic should be in service
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
    });

    // Bad: More business logic
    await sendEmail(email, 'Welcome!', 'Thanks for joining...');

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}

// Good: Delegate to service
async create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, name } = req.body;

    // Service handles all business logic
    const user = await userService.register({ email, password, name });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
}
```

### Use Async/Await with Try/Catch

```typescript
// Always wrap async operations
async getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.findById(req.params.id);
    res.json({ success: true, data: user });
  } catch (error) {
    next(error); // Pass to error middleware
  }
}

// Or use async error wrapper
import { asyncHandler } from '../utils/asyncHandler';

// utils/asyncHandler.ts
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage - no try/catch needed
export const UserController = {
  getUser: asyncHandler(async (req, res, next) => {
    const user = await userService.findById(req.params.id);
    res.json({ success: true, data: user });
  }),
};
```

### Consistent Response Types

```typescript
// Define return type for consistency
async function sendResponse<T>(
  res: Response,
  statusCode: number,
  data: T,
  meta?: object
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta && { meta }),
  });
}

// Usage
async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.findById(req.params.id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    sendResponse(res, 200, user);
  } catch (error) {
    next(error);
  }
}
```

## Common Patterns

### Pagination

```typescript
async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const { rows: users, count: total } = await User.findAndCountAll({
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: users,
      meta: {
        page,
        perPage: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
}
```

### Filtering and Search

```typescript
async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { search, status, role, startDate, endDate } = req.query;

    const filters: FilterOptions = {
      ...(search && { search: String(search) }),
      ...(status && { status: String(status) }),
      ...(role && { role: String(role) }),
      ...(startDate && { startDate: new Date(String(startDate)) }),
      ...(endDate && { endDate: new Date(String(endDate)) }),
    };

    const result = await userService.findAll(filters);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
```

### Bulk Operations

```typescript
async bulkDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new AppError('No IDs provided', 400);
    }

    if (ids.length > 100) {
      throw new AppError('Cannot delete more than 100 items at once', 400);
    }

    const deletedCount = await userService.bulkDelete(ids);

    res.status(200).json({
      success: true,
      data: { deletedCount },
    });
  } catch (error) {
    next(error);
  }
}
```

### File Upload

```typescript
import multer from 'multer';

const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type', 400));
    }
  },
});

// Route
router.post('/avatar', authenticate, upload.single('avatar'), UserController.uploadAvatar);

// Controller
async uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const avatarUrl = await userService.uploadAvatar(req.user!.id, req.file);

    res.status(200).json({
      success: true,
      data: { avatarUrl },
    });
  } catch (error) {
    next(error);
  }
}
```

## Testing Controllers

```typescript
// controllers/user.controller.test.ts
import request from 'supertest';
import { createApp } from '../app';
import { userService } from '../services/user.service';

jest.mock('../services/user.service');

describe('UserController', () => {
  const app = createApp();

  describe('GET /api/v1/users/:id', () => {
    it('returns user when found', async () => {
      const mockUser = { id: '1', name: 'John', email: 'john@example.com' };
      (userService.findById as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/v1/users/1')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockUser,
      });
    });

    it('returns 404 when user not found', async () => {
      (userService.findById as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/users/999')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'User not found',
      });
    });
  });
});
```

## Summary

| Principle | Description |
|-----------|-------------|
| **Thin Controllers** | Only handle HTTP concerns, delegate business logic |
| **Consistent Responses** | Use standard success/error response format |
| **Proper Error Handling** | Use try/catch and pass errors to middleware |
| **Type Safety** | Type request parameters, body, and query |
| **Validation** | Validate in middleware, not in controllers |

## Related Documents

- [Express Patterns](./express-patterns.md)
- [Middleware Guidelines](./middleware-guidelines.md)
- [Backend Testing](../07-testing/backend-testing.md)
