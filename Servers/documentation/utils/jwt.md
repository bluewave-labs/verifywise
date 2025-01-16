# JWT Token Utility Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Functions](#functions)
- [Types](#types)
- [Error Handling](#error-handling)

## Overview

This module provides utility functions for JWT (JSON Web Token) generation and verification.

## Dependencies

```typescript
import Jwt from "jsonwebtoken";
```

## Functions

### Get Token Payload

```typescript
export const getTokenPayload = (token: any): any
```

- **Description**: Verifies and decodes a JWT token
- **Parameters**: `token` - JWT token string
- **Returns**: Decoded token payload or null if verification fails
- **Payload Structure**:
  ```typescript
  {
    id: number;
    email: string;
    expire: number;
  }
  ```

### Generate Token

```typescript
export const generateToken = (payload: { id: number; email: string }): string | void
```

- **Description**: Generates a JWT token with expiration
- **Parameters**: `payload` - Object containing user id and email
- **Returns**: JWT token string or void if generation fails
- **Token Configuration**:
  - Expiration: 1 hour (3600 seconds)
  - Uses JWT_SECRET from environment variables

## Types

```typescript
interface TokenPayload {
  id: number;
  email: string;
  expire: number;
}

interface TokenInput {
  id: number;
  email: string;
}
```

## Error Handling

- Token verification errors return null
- Token generation errors are logged to console
- Both functions use try-catch blocks for error management
- Requires JWT_SECRET environment variable to be set
