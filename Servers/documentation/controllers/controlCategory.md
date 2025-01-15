# Control Category Controller Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Data Types](#data-types)
- [Error Handling](#error-handling)

## Overview

This controller manages control category operations, providing CRUD functionality for control categories.

## Dependencies

```typescript
import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { ControlCategory } from "../models/controlCategory.model";
```

## API Endpoints

### Get All Control Categories

- **Endpoint**: GET `/control-categories`
- **Description**: Retrieves all control categories
- **Response**:
  - 200: Success with control categories data
  - 500: Server error

### Get Control Category by ID

- **Endpoint**: GET `/control-categories/:id`
- **Description**: Retrieves a specific control category by ID
- **Response**:
  - 200: Success with control category data
  - 500: Server error

### Create Control Category

- **Endpoint**: POST `/control-categories`
- **Request Body**: `ControlCategory`
- **Response**:
  - 201: Created with control category data
  - 500: Server error

### Update Control Category

- **Endpoint**: PUT `/control-categories/:id`
- **Request Body**: `Partial<ControlCategory>`
- **Response**:
  - 202: Accepted with updated control category data
  - 500: Server error

### Delete Control Category

- **Endpoint**: DELETE `/control-categories/:id`
- **Response**:
  - 202: Accepted with deleted control category data
  - 500: Server error

## Data Types

```typescript
interface ControlCategory {
  projectId: number;
  name: string;
}
```

## Error Handling

The controller uses HTTP status codes and a standardized STATUS_CODE utility for error responses:

- 500: Internal Server Error

All endpoints are wrapped in try-catch blocks for error handling, returning appropriate status codes and error messages.
