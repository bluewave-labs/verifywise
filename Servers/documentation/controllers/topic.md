# Topic Controller Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Data Types](#data-types)
- [Error Handling](#error-handling)

## Overview

This controller manages topic-related operations, providing CRUD functionality for topics.

## Dependencies

```typescript
import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";
import { STATUS_CODE } from "../utils/statusCode.utils";
```

## API Endpoints

### Get All Topics

- **Endpoint**: GET `/topics`
- **Description**: Retrieves all topics
- **Response**:
  - 200: Success with topics data
  - 204: No content
  - 500: Server error

### Get Topic by ID

- **Endpoint**: GET `/topics/:id`
- **Description**: Retrieves a specific topic by ID
- **Response**:
  - 200: Success with topic data
  - 204: No content
  - 500: Server error

### Create Topic

- **Endpoint**: POST `/topics`
- **Request Body**:

```typescript
{
  id: number;
  assessmentId: number;
  title: string;
}
```

- **Response**:
  - 201: Created
  - 204: No content
  - 500: Server error

### Update Topic

- **Endpoint**: PUT `/topics/:id`
- **Request Body**:

```typescript
{
  assessmentId: number;
  title: string;
}
```

- **Response**:
  - 200: Success
  - 204: No content
  - 500: Server error

### Delete Topic

- **Endpoint**: DELETE `/topics/:id`
- **Response**:
  - 200: Success
  - 204: No content
  - 500: Server error

## Data Types

```typescript
interface Topic {
  id?: number;
  assessmentId: number;
  title: string;
}

interface RequestWithFile extends Request {
  files?: any;
}
```

## Error Handling

The controller uses HTTP status codes and a standardized STATUS_CODE utility for error responses:

- 204: No Content
- 500: Internal Server Error

All endpoints are wrapped in try-catch blocks for error handling, returning appropriate status codes and error messages.
