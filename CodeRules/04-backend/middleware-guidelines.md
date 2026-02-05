# Middleware Guidelines

Guidelines for implementing Express.js middleware in VerifyWise.

## Middleware Basics

### Structure

```typescript
import { Request, Response, NextFunction } from 'express';

// Synchronous middleware
function syncMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Do something
  req.customProperty = 'value';
  next();
}

// Async middleware
async function asyncMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await someAsyncOperation();
    next();
  } catch (error) {
    next(error);
  }
}

// Middleware factory (configurable)
function configMiddleware(options: MiddlewareOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Use options
    if (options.enabled) {
      // Do something
    }
    next();
  };
}
```

### Execution Order

```typescript
// Middleware executes in order of registration
app.use(firstMiddleware);   // Runs 1st
app.use(secondMiddleware);  // Runs 2nd
app.use(thirdMiddleware);   // Runs 3rd

// Route-specific middleware
router.get(
  '/users/:id',
  validateId,      // Runs 1st
  authenticate,    // Runs 2nd
  authorize,       // Runs 3rd
  UserController.getById  // Final handler
);
```

## Authentication Middleware

### JWT Authentication

```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { userService } from '../services/user.service';
import { AppError } from '../utils/errors';

interface JwtPayload {
  userId: string;
  iat: number;
  exp: number;
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token = authHeader.slice(7); // Remove 'Bearer '

    // Verify token
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token expired', 401);
      }
      throw new AppError('Invalid token', 401);
    }

    // Get user from database
    const user = await userService.findById(payload.userId);

    if (!user) {
      throw new AppError('User not found', 401);
    }

    if (!user.isActive) {
      throw new AppError('User account is deactivated', 401);
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
```

### Optional Authentication

```typescript
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      // No token - continue without user
      next();
      return;
    }

    const token = authHeader.slice(7);

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      const user = await userService.findById(payload.userId);
      if (user?.isActive) {
        req.user = user;
      }
    } catch {
      // Invalid token - continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
}
```

## Authorization Middleware

### Role-Based Authorization

```typescript
// middleware/authorize.middleware.ts
type UserRole = 'admin' | 'manager' | 'user';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      next(new AppError('Insufficient permissions', 403));
      return;
    }

    next();
  };
}

// Usage in routes
router.get('/admin/dashboard', authenticate, authorize('admin'), AdminController.dashboard);
router.get('/reports', authenticate, authorize('admin', 'manager'), ReportController.list);
```

### Resource-Based Authorization

```typescript
export function authorizeResource(resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const resourceId = req.params.id;
      const hasAccess = await permissionService.checkAccess(
        req.user.id,
        resourceType,
        resourceId,
        req.method
      );

      if (!hasAccess) {
        throw new AppError('Access denied to this resource', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Usage
router.put(
  '/projects/:id',
  authenticate,
  authorizeResource('project'),
  ProjectController.update
);
```

## Validation Middleware

### Schema Validation

```typescript
// middleware/validation.middleware.ts
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace request data with validated data
      req.body = validated.body;
      req.query = validated.query as any;
      req.params = validated.params as any;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        }));

        res.status(400).json({
          success: false,
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

### Parameter Validation

```typescript
export function validateUUID(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(value)) {
      res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format`,
      });
      return;
    }

    next();
  };
}

// Usage
router.get('/users/:id', validateUUID('id'), UserController.getById);
```

## Error Handling Middleware

### Global Error Handler

```typescript
// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { env } from '../config/environment';

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known errors
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
    return;
  }

  // Handle Sequelize errors
  if (error.name === 'SequelizeValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation error',
      details: (error as any).errors?.map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    });
    return;
  }

  if (error.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({
      success: false,
      error: 'Resource already exists',
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
    });
    return;
  }

  // Unknown errors - don't expose details in production
  res.status(500).json({
    success: false,
    error: env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error.message,
    ...(env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
}
```

### Custom Error Classes

```typescript
// utils/errors.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
```

### 404 Handler

```typescript
// middleware/notFound.middleware.ts
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
  });
}

// Register after all routes
app.use('/api/v1', routes);
app.use(notFoundHandler);
app.use(errorMiddleware);
```

## Logging Middleware

### Request Logging

```typescript
// middleware/logging.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Generate unique request ID
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  const startTime = Date.now();

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info({
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      userId: req.user?.id,
    });
  });

  next();
}
```

### Sensitive Data Redaction

```typescript
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'authorization'];

function redactSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const redacted: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

export function requestBodyLogger(req: Request, res: Response, next: NextFunction): void {
  if (req.body && Object.keys(req.body).length > 0) {
    logger.debug({
      requestId: req.headers['x-request-id'],
      body: redactSensitiveData(req.body),
    });
  }
  next();
}
```

## Security Middleware

### Request Sanitization

```typescript
// middleware/sanitize.middleware.ts
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

// Sanitize against NoSQL injection
export const sanitizeMongo = mongoSanitize();

// Sanitize against XSS
export function sanitizeXss(req: Request, res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query) as any;
  }
  if (req.params) {
    req.params = sanitizeObject(req.params) as any;
  }
  next();
}

function sanitizeObject(obj: any): any {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized: any = Array.isArray(obj) ? [] : {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[xss(key)] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}
```

### Request Timeout

```typescript
export function timeout(ms: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          error: 'Request timeout',
        });
      }
    }, ms);

    res.on('finish', () => clearTimeout(timer));
    next();
  };
}

// Usage
app.use(timeout(30000)); // 30 second timeout
```

## Utility Middleware

### Request ID

```typescript
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = req.headers['x-request-id'] as string || uuidv4();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
}
```

### Response Time Header

```typescript
export function responseTime(req: Request, res: Response, next: NextFunction): void {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const time = diff[0] * 1000 + diff[1] / 1e6; // Convert to ms
    res.setHeader('X-Response-Time', `${time.toFixed(3)}ms`);
  });

  next();
}
```

### Cache Control

```typescript
export function cacheControl(options: { maxAge?: number; private?: boolean }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const directives = [];

    if (options.private) {
      directives.push('private');
    } else {
      directives.push('public');
    }

    if (options.maxAge !== undefined) {
      directives.push(`max-age=${options.maxAge}`);
    }

    res.setHeader('Cache-Control', directives.join(', '));
    next();
  };
}

// Usage
router.get('/static/data', cacheControl({ maxAge: 3600 }), StaticController.getData);
```

## Middleware Order

The recommended order for middleware registration:

```typescript
const app = express();

// 1. Security headers
app.use(helmet());

// 2. Request ID
app.use(requestId);

// 3. CORS
app.use(cors(corsOptions));

// 4. Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 5. Sanitization
app.use(sanitizeMongo);
app.use(sanitizeXss);

// 6. Compression
app.use(compression());

// 7. Request logging
app.use(requestLogger);

// 8. Rate limiting
app.use('/api', apiLimiter);

// 9. Routes
app.use('/api/v1', routes);

// 10. 404 handler
app.use(notFoundHandler);

// 11. Error handler (must be last)
app.use(errorMiddleware);
```

## Summary

| Middleware Type | Purpose |
|-----------------|---------|
| **Authentication** | Verify user identity |
| **Authorization** | Check permissions |
| **Validation** | Validate request data |
| **Error Handling** | Handle and format errors |
| **Logging** | Log requests and responses |
| **Security** | Protect against attacks |

## Related Documents

- [Express Patterns](./express-patterns.md)
- [Controller Guidelines](./controller-guidelines.md)
- [Authentication](../06-security/authentication.md)
