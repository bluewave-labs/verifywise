# Input Validation

Guidelines for validating and sanitizing user input in VerifyWise.

## Core Principles

1. **Validate on the server** - Client-side validation is for UX, not security
2. **Validate early** - Before any processing or storage
3. **Allowlist over denylist** - Define what's allowed, not what's forbidden
4. **Fail safely** - Reject invalid input, don't try to fix it

## TypeScript/Express Validation

### Using Zod

```typescript
// schemas/user.schema.ts
import { z } from 'zod';

// Reusable schemas
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255)
  .transform(email => email.toLowerCase().trim());

export const uuidSchema = z
  .string()
  .uuid('Invalid ID format');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Request schemas
export const createUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128),
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must not exceed 100 characters')
      .trim(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    email: emailSchema.optional(),
  }),
});

export const getUsersSchema = z.object({
  query: paginationSchema.extend({
    search: z.string().max(100).optional(),
    status: z.enum(['active', 'inactive', 'all']).default('all'),
  }),
});
```

### Validation Middleware

```typescript
// middleware/validate.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

export function validate(schema: ZodSchema) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Replace with validated and transformed data
      req.body = validated.body ?? req.body;
      req.query = validated.query ?? req.query;
      req.params = validated.params ?? req.params;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors.map(e => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
}

// Usage in routes
router.post(
  '/users',
  validate(createUserSchema),
  UserController.create
);

router.get(
  '/users',
  validate(getUsersSchema),
  UserController.getAll
);
```

### Custom Validators

```typescript
// schemas/custom.schema.ts
import { z } from 'zod';

// Phone number validation
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

// URL validation
export const urlSchema = z
  .string()
  .url('Invalid URL')
  .refine(
    (url) => url.startsWith('https://'),
    'URL must use HTTPS'
  );

// Date range validation
export const dateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine(
    (data) => data.endDate > data.startDate,
    'End date must be after start date'
  );

// Enum with custom error
export const roleSchema = z.enum(['admin', 'user', 'guest'], {
  errorMap: () => ({ message: 'Role must be admin, user, or guest' }),
});

// Conditional validation
export const paymentSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('credit_card'),
    cardNumber: z.string().regex(/^\d{16}$/),
    cvv: z.string().regex(/^\d{3,4}$/),
  }),
  z.object({
    type: z.literal('bank_transfer'),
    accountNumber: z.string().min(10).max(20),
    routingNumber: z.string().length(9),
  }),
]);
```

## Python/FastAPI Validation

### Pydantic Models

```python
# schemas/user.py
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserCreate(BaseModel):
    """Schema for creating a user."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    name: str = Field(..., min_length=1, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain an uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain a lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain a number")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Clean and validate name."""
        v = v.strip()
        if not v:
            raise ValueError("Name cannot be empty")
        return v


class UserUpdate(BaseModel):
    """Schema for updating a user."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None


class PaginationParams(BaseModel):
    """Pagination parameters."""

    page: int = Field(1, ge=1)
    limit: int = Field(10, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit


class DateRange(BaseModel):
    """Date range filter."""

    start_date: datetime
    end_date: datetime

    @model_validator(mode="after")
    def validate_date_range(self) -> "DateRange":
        if self.end_date <= self.start_date:
            raise ValueError("End date must be after start date")
        return self
```

### Dependency Validation

```python
# dependencies/validation.py
from fastapi import Depends, Path, Query, HTTPException
from uuid import UUID


async def valid_user_id(
    user_id: str = Path(..., description="User ID"),
) -> str:
    """Validate user ID is a valid UUID."""
    try:
        UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    return user_id


async def pagination_params(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
) -> dict:
    """Validate and return pagination parameters."""
    return {"page": page, "limit": limit, "offset": (page - 1) * limit}


# Usage in router
@router.get("/users/{user_id}")
async def get_user(
    user_id: str = Depends(valid_user_id),
):
    """Get user by validated ID."""
    pass


@router.get("/users")
async def list_users(
    pagination: dict = Depends(pagination_params),
):
    """List users with validated pagination."""
    pass
```

## Sanitization

### HTML/XSS Prevention

```typescript
// TypeScript - sanitize HTML entities
import { escape } from 'lodash';

function sanitizeHtml(input: string): string {
  return escape(input);
}

// Or use DOMPurify for rich text
import DOMPurify from 'isomorphic-dompurify';

function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
  });
}
```

### SQL Injection Prevention

```typescript
// Always use parameterized queries
// Sequelize handles this automatically

// Safe - parameterized
const user = await User.findOne({
  where: { email: userInput },
});

// Safe - parameterized
const users = await sequelize.query(
  'SELECT * FROM users WHERE email = :email',
  {
    replacements: { email: userInput },
    type: QueryTypes.SELECT,
  }
);

// NEVER do this
// const users = await sequelize.query(
//   `SELECT * FROM users WHERE email = '${userInput}'`
// );
```

### Path Traversal Prevention

```typescript
import path from 'path';

function sanitizePath(userPath: string, baseDir: string): string {
  // Resolve to absolute path
  const resolvedPath = path.resolve(baseDir, userPath);

  // Ensure it's within base directory
  if (!resolvedPath.startsWith(path.resolve(baseDir))) {
    throw new ValidationError('Invalid path');
  }

  return resolvedPath;
}

// Usage
const safeFilePath = sanitizePath(req.params.filename, '/uploads');
```

## File Upload Validation

```typescript
// middleware/upload.middleware.ts
import multer from 'multer';
import path from 'path';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf'];

export const upload = multer({
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 5, // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(new Error(`Invalid file type: ${file.mimetype}`));
      return;
    }

    // Check extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      cb(new Error(`Invalid file extension: ${ext}`));
      return;
    }

    cb(null, true);
  },
  storage: multer.diskStorage({
    destination: '/tmp/uploads',
    filename: (req, file, cb) => {
      // Generate safe filename
      const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
});

// Additional content validation after upload
async function validateFileContent(filePath: string, mimeType: string): Promise<boolean> {
  const fileTypeFromBuffer = await import('file-type');
  const buffer = await fs.readFile(filePath);
  const type = await fileTypeFromBuffer.fileTypeFromBuffer(buffer);

  if (!type || type.mime !== mimeType) {
    // File content doesn't match claimed MIME type
    await fs.unlink(filePath);
    return false;
  }

  return true;
}
```

## Request Size Limits

```typescript
// app.ts
import express from 'express';

const app = express();

// Limit JSON body size
app.use(express.json({ limit: '10kb' }));

// Limit URL-encoded body size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Custom limit for specific routes
app.use('/api/upload', express.json({ limit: '50mb' }));
```

## Common Validation Patterns

### Email Validation

```typescript
// Zod
const emailSchema = z.string().email().max(255).toLowerCase().trim();

// Custom validation for specific domain
const companyEmailSchema = z
  .string()
  .email()
  .refine(
    (email) => email.endsWith('@company.com'),
    'Must use company email'
  );
```

### UUID Validation

```typescript
const uuidSchema = z.string().uuid();

// Or regex for specific version
const uuidV4Schema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  'Invalid UUID v4'
);
```

### Date Validation

```typescript
const dateSchema = z.coerce.date();

// With range
const pastDateSchema = z.coerce.date().max(new Date(), 'Date must be in the past');
const futureDateSchema = z.coerce.date().min(new Date(), 'Date must be in the future');

// ISO string
const isoDateSchema = z.string().datetime();
```

### Number Validation

```typescript
// Integer with range
const ageSchema = z.number().int().min(0).max(150);

// Positive number
const priceSchema = z.number().positive();

// From query string
const pageSchema = z.coerce.number().int().positive().default(1);
```

## Error Messages

### User-Friendly Errors

```typescript
// schemas/user.schema.ts
export const createUserSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    }).email('Please enter a valid email address'),

    password: z.string({
      required_error: 'Password is required',
    })
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password is too long'),

    name: z.string({
      required_error: 'Name is required',
    })
      .min(1, 'Name cannot be empty')
      .max(100, 'Name must be 100 characters or less'),
  }),
});
```

### Formatted Error Response

```typescript
// Format validation errors
function formatValidationErrors(error: ZodError): object[] {
  return error.errors.map(e => ({
    field: e.path.join('.'),
    message: e.message,
    code: e.code,
  }));
}

// Response format
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "body.email", "message": "Please enter a valid email address", "code": "invalid_string" },
    { "field": "body.password", "message": "Password must be at least 8 characters", "code": "too_small" }
  ]
}
```

## Summary

| Validation Type | TypeScript | Python |
|-----------------|------------|--------|
| Schema validation | Zod | Pydantic |
| Email | z.string().email() | EmailStr |
| UUID | z.string().uuid() | UUID type |
| Numbers | z.number().int() | int, Field(ge=, le=) |
| Strings | z.string().min().max() | Field(min_length=) |
| Dates | z.coerce.date() | datetime |
| Custom | z.refine() | @field_validator |

## Related Documents

- [Security Checklist](./security-checklist.md)
- [Authentication](./authentication.md)
- [Error Handling](./error-handling.md)
