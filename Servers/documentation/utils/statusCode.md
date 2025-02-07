# HTTP Status Code Utility Documentation

## Table of Contents

- [Overview](#overview)
- [Class Definition](#class-definition)
- [Status Code Categories](#status-code-categories)
- [Usage](#usage)

## Overview

This utility class provides standardized HTTP status code responses with associated messages and data/error payloads.

## Class Definition

```typescript
export class STATUS_CODE {
  static method(data: any): { message: string; data?: any; error?: any };
}
```

## Status Code Categories

### 1XX Informational

```typescript
static 100(data: any) // Continue
static 101(data: any) // Switching Protocols
static 102(data: any) // Processing
static 103(data: any) // Early Hints
```

### 2XX Success

```typescript
static 200(data: any) // OK
static 201(data: any) // Created
static 202(data: any) // Accepted
static 203(data: any) // Non-Authoritative Information
static 204(data: any) // No Content
```

### 3XX Redirection

```typescript
static 300(data: any) // Multiple Choices
static 301(data: any) // Moved Permanently
static 302(data: any) // Found
```

### 4XX Client Errors

```typescript
static 400(data: any) // Bad Request
static 401(data: any) // Unauthorized
static 402(data: any) // Payment Required
static 403(data: any) // Forbidden
static 404(data: any) // Not Found
static 405(data: any) // Method Not Allowed
static 406(data: any) // Not Acceptable
static 407(data: any) // Proxy Authentication Required
static 408(data: any) // Request Timeout
static 409(data: any) // Conflict
```

### 5XX Server Errors

```typescript
static 500(error: any) // Internal Server Error
static 501(error: any) // Not Implemented
static 502(error: any) // Bad Gateway
static 503(error: any) // Service Unavailable
static 504(error: any) // Gateway Timeout
```

## Usage

```typescript
// Success response example
return STATUS_CODE[200]({
  user: { id: 1, name: "John" },
});
// Output: { message: "OK", data: { user: { id: 1, name: "John" } } }

// Error response example
return STATUS_CODE[500](new Error("Database connection failed"));
// Output: { message: "Internal Server Error", error: Error("Database connection failed") }
```
