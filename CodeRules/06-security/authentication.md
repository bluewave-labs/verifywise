# Authentication

Security guidelines for authentication in VerifyWise.

## Password Security

### Password Hashing

Always use bcrypt with a cost factor of 12 or higher.

```typescript
// services/auth.service.ts
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Usage in registration
async function registerUser(data: RegisterInput): Promise<User> {
  const hashedPassword = await hashPassword(data.password);

  return User.create({
    email: data.email,
    password: hashedPassword,
    name: data.name,
  });
}
```

### Password Requirements

Enforce strong password policies.

```typescript
// schemas/auth.schema.ts
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[a-z]/, 'Password must contain a lowercase letter')
  .regex(/\d/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: passwordSchema,
    name: z.string().min(1).max(100),
  }),
});
```

### Password Change

Require current password and invalidate sessions.

```typescript
async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isValid = await verifyPassword(currentPassword, user.password);
  if (!isValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Hash and save new password
  const hashedPassword = await hashPassword(newPassword);
  await User.update(
    { password: hashedPassword, passwordChangedAt: new Date() },
    { where: { id: userId } }
  );

  // Invalidate all existing sessions
  await Session.destroy({ where: { userId } });
}
```

## JWT Handling

### Token Generation

```typescript
// services/token.service.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

interface TokenPayload {
  sub: string;      // User ID
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    {
      sub: userId,
      type: 'access',
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: ACCESS_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    {
      sub: userId,
      type: 'refresh',
      jti: crypto.randomUUID(), // Unique token ID for revocation
    },
    process.env.JWT_REFRESH_SECRET!,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      algorithm: 'HS256',
    }
  );
}

export function verifyAccessToken(token: string): TokenPayload {
  const payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

  if (payload.type !== 'access') {
    throw new Error('Invalid token type');
  }

  return payload;
}
```

### Token Storage

**Access Tokens**:
- Store in memory (JavaScript variable)
- Short expiration (15-30 minutes)
- Never store in localStorage (XSS vulnerable)

**Refresh Tokens**:
- Store in httpOnly cookie
- Longer expiration (7-30 days)
- Rotate on use

```typescript
// Setting refresh token cookie
function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,           // Not accessible via JavaScript
    secure: true,             // HTTPS only
    sameSite: 'strict',       // CSRF protection
    path: '/api/v1/auth',     // Limit scope
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// Login response
async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;

  const user = await authenticateUser(email, password);

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);

  // Store refresh token hash in database
  await RefreshToken.create({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  setRefreshTokenCookie(res, refreshToken);

  res.json({
    accessToken,
    user: sanitizeUser(user),
  });
}
```

### Token Refresh

```typescript
async function refreshTokens(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AuthenticationError('Refresh token required');
  }

  // Verify token
  let payload: TokenPayload;
  try {
    payload = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as TokenPayload;
  } catch (error) {
    throw new AuthenticationError('Invalid refresh token');
  }

  // Check if token exists in database (not revoked)
  const storedToken = await RefreshToken.findOne({
    where: {
      userId: payload.sub,
      tokenHash: hashToken(refreshToken),
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!storedToken) {
    throw new AuthenticationError('Refresh token revoked or expired');
  }

  // Generate new tokens (token rotation)
  const newAccessToken = generateAccessToken(payload.sub);
  const newRefreshToken = generateRefreshToken(payload.sub);

  // Revoke old token and store new one
  await storedToken.destroy();
  await RefreshToken.create({
    userId: payload.sub,
    tokenHash: hashToken(newRefreshToken),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  setRefreshTokenCookie(res, newRefreshToken);

  res.json({ accessToken: newAccessToken });
}
```

### Token Revocation

```typescript
// Logout - revoke current refresh token
async function logout(req: Request, res: Response): Promise<void> {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await RefreshToken.destroy({
      where: { tokenHash: hashToken(refreshToken) },
    });
  }

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    path: '/api/v1/auth',
  });

  res.status(204).send();
}

// Logout all sessions
async function logoutAll(userId: string): Promise<void> {
  await RefreshToken.destroy({
    where: { userId },
  });
}
```

## Rate Limiting

### Login Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Per-IP rate limiting
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many login attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use Redis for distributed systems
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.call(...args),
  }),
});

// Per-account rate limiting (more strict)
export const accountRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour per account
  keyGenerator: (req) => req.body.email?.toLowerCase() || req.ip,
  message: {
    error: 'Account temporarily locked. Please try again later.',
  },
});

// Apply to login route
router.post(
  '/login',
  loginRateLimiter,
  accountRateLimiter,
  validate(loginSchema),
  AuthController.login
);
```

### Account Lockout

```typescript
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes

async function handleLoginAttempt(
  email: string,
  password: string
): Promise<User> {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    // Don't reveal if email exists
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingTime = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60000
    );
    throw new AuthenticationError(
      `Account locked. Try again in ${remainingTime} minutes.`
    );
  }

  // Verify password
  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    // Increment failed attempts
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;

    if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
      // Lock account
      await User.update(
        {
          failedLoginAttempts: failedAttempts,
          lockedUntil: new Date(Date.now() + LOCKOUT_DURATION),
        },
        { where: { id: user.id } }
      );
    } else {
      await User.update(
        { failedLoginAttempts: failedAttempts },
        { where: { id: user.id } }
      );
    }

    throw new AuthenticationError('Invalid email or password');
  }

  // Reset failed attempts on successful login
  await User.update(
    {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
    { where: { id: user.id } }
  );

  return user;
}
```

## Session Management

### Session Creation

```typescript
import crypto from 'crypto';

async function createSession(userId: string, req: Request): Promise<Session> {
  const sessionId = crypto.randomBytes(32).toString('hex');

  return Session.create({
    id: sessionId,
    userId,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    createdAt: new Date(),
    lastActivityAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });
}
```

### Session Validation

```typescript
async function validateSession(sessionId: string): Promise<Session | null> {
  const session = await Session.findOne({
    where: {
      id: sessionId,
      expiresAt: { [Op.gt]: new Date() },
    },
    include: [{ model: User, as: 'user' }],
  });

  if (!session) {
    return null;
  }

  // Update last activity
  await session.update({ lastActivityAt: new Date() });

  return session;
}
```

### Session Invalidation

```typescript
// Invalidate single session
async function invalidateSession(sessionId: string): Promise<void> {
  await Session.destroy({ where: { id: sessionId } });
}

// Invalidate all user sessions
async function invalidateAllSessions(userId: string): Promise<void> {
  await Session.destroy({ where: { userId } });
}

// Invalidate on password change
async function onPasswordChange(userId: string): Promise<void> {
  await invalidateAllSessions(userId);
  await RefreshToken.destroy({ where: { userId } });
}
```

## Python/FastAPI Authentication

```python
# dependencies/auth.py
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings
from app.models import User
from app.services import user_service

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def hash_password(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)

    to_encode = {
        "sub": user_id,
        "exp": expire,
        "type": "access",
    }
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get the current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = await user_service.get_by_id(user_id)
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated",
        )

    return user
```

## Summary

| Topic | Best Practice |
|-------|--------------|
| **Password Hashing** | bcrypt with cost factor 12+ |
| **Access Tokens** | Short-lived (15-30 min), stored in memory |
| **Refresh Tokens** | httpOnly cookie, rotation on use |
| **Rate Limiting** | Per-IP and per-account limits |
| **Account Lockout** | Lock after 5 failed attempts |
| **Session Management** | Track and allow invalidation |

## Related Documents

- [Security Checklist](./security-checklist.md)
- [Input Validation](./input-validation.md)
- [Error Handling](./error-handling.md)
