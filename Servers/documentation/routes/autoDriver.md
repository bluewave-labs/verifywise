# Auto Driver Routes Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Routes Configuration](#routes-configuration)
- [Authentication](#authentication)

## Overview

This router manages auto driver-related routes, providing an endpoint for creating auto driver entries.

## Dependencies

```typescript
import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
```

## Routes Configuration

### POST Routes

- **Create Auto Driver**
  - Route: `/`
  - Handler: `postAutoDriver`
  - Authentication: JWT (currently commented out)

## Authentication

The route is configured to use JWT authentication middleware (`authenticateJWT`), though it is currently commented out in the implementation.
