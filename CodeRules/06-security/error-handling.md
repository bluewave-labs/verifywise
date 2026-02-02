# Error Handling

Secure error handling guidelines for VerifyWise.

## Principles

1. **Never expose internal details** - Stack traces, SQL queries, internal paths
2. **Log for debugging** - Full details server-side
3. **Respond generically** - User-friendly messages to clients
4. **Fail securely** - Default to deny on errors
5. **Handle all errors** - Don't let exceptions go uncaught

## Error Response Format

### Standard Format

```typescript
// Success response
{
  "success": true,
  "data": { ... }
}

// Error response
{
  "success": false,
  "error": "User-friendly error message",
  "code": "ERROR_CODE",
  "details": [...] // Optional, only for validation errors
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 400 | Bad Request | Validation errors, malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable | Business logic validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

## TypeScript/Express Implementation

### Custom Error Classes

```typescript
// utils/errors.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string = 'APP_ERROR',
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly details: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    details: Array<{ field: string; message: string }> = []
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} not found: ${identifier}`
      : `${resource} not found`;
    super(message, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}
```

### Global Error Handler

```typescript
// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

export function errorMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error with context
  logger.error({
    message: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    requestId: req.headers['x-request-id'],
  });

  // Handle known application errors
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: error.message,
      code: error.code,
    };

    if (error instanceof ValidationError && error.details.length > 0) {
      response.details = error.details;
    }

    res.status(error.statusCode).json(response);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Handle Sequelize errors
  if (error.name === 'SequelizeValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
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
      code: 'CONFLICT',
    });
    return;
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    res.status(400).json({
      success: false,
      error: 'Invalid reference',
      code: 'INVALID_REFERENCE',
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Unknown errors - NEVER expose details in production
  const isProduction = process.env.NODE_ENV === 'production';

  res.status(500).json({
    success: false,
    error: isProduction ? 'An unexpected error occurred' : error.message,
    code: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { stack: error.stack }),
  });
}
```

### Async Error Wrapper

```typescript
// utils/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Usage in controllers
export const UserController = {
  getById: asyncHandler(async (req, res) => {
    const user = await userService.findById(req.params.id);

    if (!user) {
      throw new NotFoundError('User', req.params.id);
    }

    res.json({ success: true, data: user });
  }),
};
```

## Python/FastAPI Implementation

### Exception Classes

```python
# exceptions.py
from typing import Any, Optional


class AppError(Exception):
    """Base application error."""

    def __init__(
        self,
        message: str,
        status_code: int = 400,
        code: str = "APP_ERROR",
        details: Optional[list[dict[str, Any]]] = None,
    ) -> None:
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details
        super().__init__(message)


class NotFoundError(AppError):
    """Resource not found error."""

    def __init__(self, resource: str, identifier: Optional[str] = None) -> None:
        message = f"{resource} not found"
        if identifier:
            message = f"{resource} not found: {identifier}"
        super().__init__(message, status_code=404, code="NOT_FOUND")


class ValidationError(AppError):
    """Validation error."""

    def __init__(
        self,
        message: str,
        details: Optional[list[dict[str, Any]]] = None,
    ) -> None:
        super().__init__(
            message,
            status_code=400,
            code="VALIDATION_ERROR",
            details=details,
        )


class UnauthorizedError(AppError):
    """Authentication error."""

    def __init__(self, message: str = "Authentication required") -> None:
        super().__init__(message, status_code=401, code="UNAUTHORIZED")


class ForbiddenError(AppError):
    """Authorization error."""

    def __init__(self, message: str = "Access denied") -> None:
        super().__init__(message, status_code=403, code="FORBIDDEN")


class ConflictError(AppError):
    """Resource conflict error."""

    def __init__(self, message: str) -> None:
        super().__init__(message, status_code=409, code="CONFLICT")
```

### Exception Handlers

```python
# main.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError as PydanticValidationError

from app.exceptions import AppError
from app.utils.logger import logger

app = FastAPI()


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Handle application errors."""
    logger.error(
        f"AppError: {exc.message}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "code": exc.code,
        },
    )

    content = {
        "success": False,
        "error": exc.message,
        "code": exc.code,
    }

    if exc.details:
        content["details"] = exc.details

    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handle Pydantic validation errors."""
    details = [
        {"field": ".".join(str(loc) for loc in e["loc"]), "message": e["msg"]}
        for e in exc.errors()
    ]

    return JSONResponse(
        status_code=400,
        content={
            "success": False,
            "error": "Validation failed",
            "code": "VALIDATION_ERROR",
            "details": details,
        },
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected errors."""
    logger.exception(
        f"Unexpected error: {exc}",
        extra={
            "path": request.url.path,
            "method": request.method,
        },
    )

    # Never expose details in production
    import os

    is_production = os.getenv("ENV") == "production"

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An unexpected error occurred" if is_production else str(exc),
            "code": "INTERNAL_ERROR",
        },
    )
```

## Logging Best Practices

### What to Log

```typescript
// Good - contextual information
logger.error({
  event: 'USER_CREATION_FAILED',
  userId: attemptedUserId,
  reason: 'email_already_exists',
  ip: req.ip,
  requestId: req.headers['x-request-id'],
});

// Good - sanitized error
logger.error({
  event: 'DATABASE_ERROR',
  operation: 'user_query',
  errorCode: error.code,
  errorMessage: error.message,
  // Stack trace included
  stack: error.stack,
});
```

### What NOT to Log

```typescript
// NEVER log sensitive data
// Bad examples:
logger.info({ password: user.password });
logger.info({ token: accessToken });
logger.info({ creditCard: cardNumber });
logger.info({ ssn: socialSecurityNumber });
logger.debug({ query: `SELECT * WHERE email='${email}'` }); // Potential SQL

// Good - redact sensitive fields
logger.info({
  user: {
    id: user.id,
    email: user.email,
    password: '[REDACTED]',
  },
});
```

### Log Levels

```typescript
// Error - failures that need attention
logger.error('Database connection failed', { error });

// Warn - unusual but handled situations
logger.warn('Rate limit approaching', { userId, requestCount });

// Info - important business events
logger.info('User registered', { userId });

// Debug - development troubleshooting
logger.debug('Processing request', { params: req.params });
```

## Security Considerations

### Don't Expose Implementation Details

```typescript
// Bad - exposes internal information
{
  "error": "SQLITE_CONSTRAINT: UNIQUE constraint failed: users.email",
  "stack": "Error at Object.create (/app/node_modules/sequelize/lib/..."
}

// Good - generic message
{
  "success": false,
  "error": "A user with this email already exists",
  "code": "CONFLICT"
}
```

### Don't Confirm Existence

```typescript
// Bad - confirms email exists
if (!user) {
  throw new NotFoundError('User not found');
}
if (!passwordValid) {
  throw new UnauthorizedError('Invalid password');
}

// Good - don't reveal which failed
if (!user || !passwordValid) {
  throw new UnauthorizedError('Invalid email or password');
}
```

### Timing Attack Prevention

```typescript
import crypto from 'crypto';

// Bad - timing reveals if user exists
async function login(email: string, password: string) {
  const user = await User.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid credentials'); // Fast return
  }
  const valid = await bcrypt.compare(password, user.password); // Slow
  if (!valid) {
    throw new UnauthorizedError('Invalid credentials');
  }
  return user;
}

// Good - constant time comparison
async function login(email: string, password: string) {
  const user = await User.findByEmail(email);

  // Always perform password comparison to prevent timing attacks
  const passwordToCheck = user?.password || '$2b$12$placeholder';
  const valid = await bcrypt.compare(password, passwordToCheck);

  if (!user || !valid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  return user;
}
```

## Client-Side Error Handling

### React Error Boundary

```tsx
// components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <DefaultErrorFallback />;
    }
    return this.props.children;
  }
}
```

### API Error Handling

```typescript
// services/api.ts
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new ApiError(
      data.error || 'An error occurred',
      response.status,
      data.code
    );
  }

  return response.json();
}

// hooks/useApi.ts
function useApiMutation<T, V>(
  mutationFn: (variables: V) => Promise<T>
) {
  return useMutation({
    mutationFn,
    onError: (error: ApiError) => {
      // Show user-friendly message
      if (error.status === 401) {
        toast.error('Please log in to continue');
        // Redirect to login
      } else if (error.status === 403) {
        toast.error('You don\'t have permission for this action');
      } else if (error.status === 429) {
        toast.error('Too many requests. Please wait a moment.');
      } else {
        toast.error(error.message || 'Something went wrong');
      }
    },
  });
}
```

## Summary

| Principle | Implementation |
|-----------|----------------|
| **Generic responses** | User-friendly messages, no internals |
| **Detailed logging** | Full context server-side |
| **Consistent format** | Standard error response structure |
| **Fail securely** | Default deny on errors |
| **No timing leaks** | Constant time comparisons |

## Related Documents

- [Security Checklist](./security-checklist.md)
- [Authentication](./authentication.md)
- [Input Validation](./input-validation.md)
