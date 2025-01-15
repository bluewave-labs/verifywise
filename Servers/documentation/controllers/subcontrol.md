# Subcontrol Controller Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Data Types](#data-types)
- [Error Handling](#error-handling)

## Overview

This controller manages subcontrol-related operations, providing CRUD functionality for subcontrols.

## Dependencies

```typescript
import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";
import { STATUS_CODE } from "../utils/statusCode.utils";
```

## API Endpoints

### Get All Subcontrols

- **Endpoint**: GET `/subcontrols`
- **Description**: Retrieves all subcontrols
- **Response**:
  - 200: Success with subcontrols data
  - 204: No content
  - 500: Server error

### Get Subcontrol by ID

- **Endpoint**: GET `/subcontrols/:id`
- **Description**: Retrieves a specific subcontrol by ID
- **Response**:
  - 200: Success with subcontrol data
  - 204: No content
  - 500: Server error

### Create Subcontrol

- **Endpoint**: POST `/subcontrols`
- **Request Body**:

```typescript
{
  controlId: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
  evidence: string;
  attachment: string;
  feedback: string;
}
```

- **Response**:
  - 200: Success
  - 204: No content
  - 500: Server error

### Update Subcontrol

- **Endpoint**: PUT `/subcontrols/:id`
- **Request Body**: `Partial<Subcontrol>`
- **Response**:
  - 200: Success
  - 204: No content
  - 500: Server error

### Delete Subcontrol

- **Endpoint**: DELETE `/subcontrols/:id`
- **Response**:
  - 200: Success
  - 204: No content
  - 500: Server error

## Data Types

```typescript
interface Subcontrol {
  controlId: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
  evidence: string;
  attachment: string;
  feedback: string;
}
```

## Error Handling

The controller uses HTTP status codes and a standardized STATUS_CODE utility for error responses:

- 204: No Content
- 500: Internal Server Error

All endpoints are wrapped in try-catch blocks for error handling, returning appropriate status codes and error messages.
