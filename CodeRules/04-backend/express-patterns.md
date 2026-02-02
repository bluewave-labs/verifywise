# Express Patterns

Guidelines for organizing and securing Express.js applications in VerifyWise.

## Project Structure

```
server/
├── src/
│   ├── config/             # Configuration files
│   │   ├── database.ts
│   │   ├── environment.ts
│   │   └── cors.ts
│   ├── controllers/        # Request handlers
│   │   ├── user.controller.ts
│   │   └── auth.controller.ts
│   ├── middleware/         # Custom middleware
│   │   ├── auth.middleware.ts
│   │   ├── validation.middleware.ts
│   │   └── error.middleware.ts
│   ├── models/             # Sequelize models
│   │   ├── User.ts
│   │   └── index.ts
│   ├── routes/             # Route definitions
│   │   ├── user.routes.ts
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── services/           # Business logic
│   │   ├── user.service.ts
│   │   └── auth.service.ts
│   ├── utils/              # Utility functions
│   │   ├── logger.ts
│   │   └── helpers.ts
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── tests/
└── package.json
```

## Application Setup

### Main App File

```typescript
// app.ts
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { corsOptions } from './config/cors';
import { errorMiddleware } from './middleware/error.middleware';
import { requestLogger } from './middleware/logging.middleware';
import routes from './routes';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors(corsOptions));

  // Body parsing
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // Compression
  app.use(compression());

  // Request logging
  app.use(requestLogger);

  // API routes
  app.use('/api/v1', routes);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy' });
  });

  // Error handling (must be last)
  app.use(errorMiddleware);

  return app;
}
```

### Server Entry Point

```typescript
// server.ts
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected');

    // Create and start app
    const app = createApp();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

## Route Organization

### Route Files

```typescript
// routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';

const router = Router();

// Public routes
router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);

// Protected routes
router.post(
  '/',
  authenticate,
  validate(createUserSchema),
  UserController.create
);

router.put(
  '/:id',
  authenticate,
  validate(updateUserSchema),
  UserController.update
);

router.delete(
  '/:id',
  authenticate,
  UserController.delete
);

export default router;
```

### Route Index

```typescript
// routes/index.ts
import { Router } from 'express';
import userRoutes from './user.routes';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);

export default router;
```

### Route Naming Conventions

```typescript
// RESTful routes
GET    /api/v1/users          // Get all users
POST   /api/v1/users          // Create user
GET    /api/v1/users/:id      // Get user by ID
PUT    /api/v1/users/:id      // Update user
DELETE /api/v1/users/:id      // Delete user

// Nested resources
GET    /api/v1/users/:userId/projects     // Get user's projects
POST   /api/v1/users/:userId/projects     // Create project for user

// Actions (when CRUD doesn't fit)
POST   /api/v1/users/:id/activate         // Activate user
POST   /api/v1/users/:id/deactivate       // Deactivate user
POST   /api/v1/auth/login                 // Login
POST   /api/v1/auth/logout                // Logout
POST   /api/v1/auth/refresh-token         // Refresh token
```

## Security Middleware

### Helmet Configuration

```typescript
// middleware/security.middleware.ts
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: true,
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
});
```

### CORS Configuration

```typescript
// config/cors.ts
import { CorsOptions } from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400, // 24 hours
};
```

### Rate Limiting

```typescript
// middleware/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Usage in routes
import { authLimiter } from '../middleware/rateLimit.middleware';

router.post('/login', authLimiter, AuthController.login);
router.post('/register', authLimiter, AuthController.register);
```

## Request Validation

### Using Zod

```typescript
// schemas/user.schema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Password must contain uppercase, lowercase, and number'
      ),
    name: z.string().min(1, 'Name is required').max(100),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
```

### Validation Middleware

```typescript
// middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          error: 'Validation failed',
          details: errors,
        });
        return;
      }
      next(error);
    }
  };
}
```

## Response Formatting

### Consistent Response Structure

```typescript
// utils/response.ts
interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    perPage?: number;
    total?: number;
    totalPages?: number;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
}

export function successResponse<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: SuccessResponse<T>['meta']
): void {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }

  res.status(statusCode).json(response);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 400,
  details?: unknown
): void {
  const response: ErrorResponse = {
    success: false,
    error: message,
  };

  if (details) {
    response.details = details;
  }

  res.status(statusCode).json(response);
}

// Usage in controller
export const UserController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await userService.findAll({ page: +page, limit: +limit });

      successResponse(res, result.users, 200, {
        page: +page,
        perPage: +limit,
        total: result.total,
        totalPages: Math.ceil(result.total / +limit),
      });
    } catch (error) {
      next(error);
    }
  },
};
```

### HTTP Status Codes

```typescript
// utils/httpStatus.ts
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Usage
res.status(HTTP_STATUS.CREATED).json({ data: newUser });
res.status(HTTP_STATUS.NOT_FOUND).json({ error: 'User not found' });
```

## Environment Configuration

```typescript
// config/environment.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  // Database
  DATABASE_URL: z.string(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // External services
  REDIS_URL: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).optional(),
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

export const env = validateEnv();

// Usage
import { env } from './config/environment';

const jwtSecret = env.JWT_SECRET;
const port = env.PORT;
```

## Logging

```typescript
// utils/logger.ts
import winston from 'winston';
import { env } from '../config/environment';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  env.NODE_ENV === 'development'
    ? winston.format.prettyPrint()
    : winston.format.json()
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    new winston.transports.Console(),
    // Add file transport for production
    ...(env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

// Request logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
}
```

## Summary

| Topic | Key Points |
|-------|------------|
| **Structure** | Separate controllers, services, routes, middleware |
| **Security** | Use Helmet, CORS, rate limiting |
| **Validation** | Validate all inputs with Zod schemas |
| **Responses** | Consistent format with success/error structure |
| **Config** | Validate environment variables at startup |
| **Logging** | Structured logging with Winston |

## Related Documents

- [Controller Guidelines](./controller-guidelines.md)
- [Middleware Guidelines](./middleware-guidelines.md)
- [Database Patterns](./database-patterns.md)
- [Security Checklist](../06-security/security-checklist.md)
