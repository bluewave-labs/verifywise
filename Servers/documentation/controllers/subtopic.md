# Subtopic Controller Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Data Types](#data-types)
- [Error Handling](#error-handling)

## Overview

This controller manages subtopic-related operations, providing CRUD functionality for subtopics.

## Dependencies

```typescript
import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";
import { STATUS_CODE } from "../utils/statusCode.utils";
```

## API Endpoints

### Get All Subtopics

- **Endpoint**: GET `/subtopics`
- **Description**: Retrieves all subtopics
- **Response**:
  - 200: Success with subtopics data
  - 204: No content
  - 500: Server error

### Get Subtopic by ID

- **Endpoint**: GET `/subtopics/:id`
- **Description**: Retrieves a specific subtopic by ID
- **Response**:
  - 200: Success with subtopic data
  - 204: No content
  - 500: Server error

### Create Subtopic

- **Endpoint**: POST `/subtopics`
- **Request Body**:

```typescript
{
  topicId: number;
  name: string;
}
```

- **Response**:
  - 200: Success
  - 204: No content
  - 500: Server error

### Update Subtopic

- **Endpoint**: PUT `/subtopics/:id`
- **Request Body**:

```typescript
{
  topicId?: number;
  name?: string;
}
```

- **Response**:
  - 200: Success
  - 204: No content
  - 500: Server error

### Delete Subtopic

- **Endpoint**: DELETE `/subtopics/:id`
- **Response**:
  - 200: Success
  - 204: No content
  - 500: Server error

## Data Types

```typescript
interface Subtopic {
  topicId: number;
  name: string;
}
```

## Error Handling

The controller uses HTTP status codes and a standardized STATUS_CODE utility for error responses:

- 204: No Content
- 500: Internal Server Error

All endpoints are wrapped in try-catch blocks for error handling, returning appropriate status codes and error messages.
