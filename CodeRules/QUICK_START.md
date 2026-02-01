# Quick Start Guide

A one-page condensed reference for VerifyWise development standards. For detailed explanations, see the full documentation in [README.md](./README.md).

## Essential Rules

### Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Variables & Functions | camelCase | `getUserData`, `isValid` |
| Components & Classes | PascalCase | `UserProfile`, `AuthService` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_BASE_URL` |
| Files (Components) | PascalCase | `UserProfile.tsx` |
| Files (Utilities) | camelCase | `formatDate.ts` |
| CSS Classes | kebab-case | `user-profile-card` |
| Database Tables | snake_case | `user_profiles` |
| Python Variables | snake_case | `user_name`, `get_user_data` |

### TypeScript Must-Haves

```typescript
// Always use explicit types
const users: User[] = [];

// Avoid 'any' - use 'unknown' and narrow
function processData(data: unknown): ProcessedData {
  if (isValidData(data)) {
    return transform(data);
  }
  throw new Error('Invalid data');
}

// Use interfaces for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions/intersections
type Status = 'pending' | 'active' | 'inactive';
```

### React Component Structure

```tsx
// 1. Imports (external, internal, types)
import { useState, useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { useUser } from '@/hooks/useUser';
import type { UserProps } from './types';

// 2. Interface (if not in separate file)
interface Props {
  userId: string;
  onUpdate?: (user: User) => void;
}

// 3. Component (function declaration)
export function UserCard({ userId, onUpdate }: Props) {
  // Hooks first
  const { user, isLoading } = useUser(userId);
  const [isEditing, setIsEditing] = useState(false);

  // Handlers
  const handleSave = useCallback(() => {
    // implementation
  }, []);

  // Early returns for loading/error states
  if (isLoading) return <Skeleton />;
  if (!user) return null;

  // Main render
  return (
    <Box>
      <Typography>{user.name}</Typography>
    </Box>
  );
}
```

### Express Controller Pattern

```typescript
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate input
    if (!isValidUUID(id)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Business logic
    const user = await userService.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Success response
    res.status(200).json({ data: user });
  } catch (error) {
    next(error);
  }
};
```

### Python/FastAPI Pattern

```python
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users"])

class UserResponse(BaseModel):
    id: str
    name: str
    email: str

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    db: Session = Depends(get_db)
) -> UserResponse:
    user = await user_service.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

## PR Checklist (Abbreviated)

Before submitting a PR, ensure:

- [ ] Code deployed and tested locally
- [ ] Self-review completed
- [ ] Issue number included
- [ ] PR labeled correctly
- [ ] No hardcoded values
- [ ] UI elements use theme references
- [ ] PR addresses single feature
- [ ] Screenshots/videos for UI changes
- [ ] Tests written/updated
- [ ] No console.log statements
- [ ] No sensitive data exposed

## Security Essentials

1. **Never** store secrets in code - use environment variables
2. **Always** validate and sanitize user input
3. **Never** expose internal error details to clients
4. **Always** use parameterized queries (Sequelize handles this)
5. **Never** disable security headers in production
6. **Always** hash passwords with bcrypt (cost factor 12+)
7. **Never** log sensitive data (passwords, tokens, PII)

## Testing Requirements

- **Minimum Coverage**: 80%
- **Required Tests**:
  - Unit tests for business logic
  - Integration tests for API endpoints
  - Component tests for UI elements
- **Test Naming**: `describe('ComponentName', () => { it('should do X when Y', () => {}) })`

## Git Commit Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```
feat(auth): add password reset functionality
fix(dashboard): resolve chart rendering issue
docs(api): update endpoint documentation
```

## Key Principles

| Principle | Meaning |
|-----------|---------|
| **DRY** | Don't Repeat Yourself - extract common logic |
| **KISS** | Keep It Simple, Stupid - prefer simple solutions |
| **YAGNI** | You Aren't Gonna Need It - don't add unused features |
| **SRP** | Single Responsibility - one reason to change |
| **Boy Scout Rule** | Leave code cleaner than you found it |

## Quick Links

- [Full Documentation](./README.md)
- [PR Checklist](./checklists/pr-checklist.md)
- [Component Template](./examples/react-component-template.md)
- [Security Checklist](./checklists/security-review-checklist.md)
