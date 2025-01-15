# Project Scope Controller Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Data Types](#data-types)
- [Error Handling](#error-handling)

## Overview

This controller manages project scope-related operations, providing CRUD functionality for project scopes.

## Dependencies

```typescript
import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";
import { STATUS_CODE } from "../utils/statusCode.utils";
```

## API Endpoints

### Get All Project Scopes

- **Endpoint**: GET `/project-scopes`
- **Description**: Retrieves all project scopes
- **Response**:
  - 200: Success with project scopes data
  - 204: No content
  - 500: Server error

### Get Project Scope by ID

- **Endpoint**: GET `/project-scopes/:id`
- **Description**: Retrieves a specific project scope by ID
- **Response**:
  - 200: Success with project scope data
  - 204: No content
  - 500: Server error

### Create Project Scope

- **Endpoint**: POST `/project-scopes`
- **Request Body**:

```typescript
{
  assessmentId: number;
  describeAiEnvironment: string;
  isNewAiTechnology: boolean;
  usesPersonalData: boolean;
  projectScopeDocuments: string;
  technologyType: string;
  hasOngoingMonitoring: boolean;
  unintendedOutcomes: string;
  technologyDocumentation: string;
}
```

- **Response**:
  - 201: Created
  - 204: No content
  - 500: Server error

### Update Project Scope

- **Endpoint**: PUT `/project-scopes/:id`
- **Request Body**: Same as Create Project Scope
- **Response**:
  - 200: Success
  - 204: No content
  - 500: Server error

### Delete Project Scope

- **Endpoint**: DELETE `/project-scopes/:id`
- **Response**:
  - 200: Success
  - 204: No content
  - 500: Server error

## Data Types

```typescript
interface ProjectScope {
  assessmentId: number;
  describeAiEnvironment: string;
  isNewAiTechnology: boolean;
  usesPersonalData: boolean;
  projectScopeDocuments: string;
  technologyType: string;
  hasOngoingMonitoring: boolean;
  unintendedOutcomes: string;
  technologyDocumentation: string;
}
```

## Error Handling

The controller uses HTTP status codes and a standardized STATUS_CODE utility for error responses:

- 204: No Content
- 500: Internal Server Error

All endpoints are wrapped in try-catch blocks for error handling, returning appropriate status codes and error messages.
