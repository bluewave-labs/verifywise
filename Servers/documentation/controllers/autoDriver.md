# AutoDriver Controller Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)

## Overview

This controller handles the automated insertion of mock data for testing and development purposes.

## Dependencies

```typescript
import { Request, Response } from "express";
import { insertMockData } from "../driver/autoDriver.driver";
import { STATUS_CODE } from "../utils/statusCode.utils";
```

## API Endpoints

### Insert Mock Data

- **Endpoint**: POST `/autodriver`
- **Description**: Inserts predefined mock data into the system
- **Response**:
  - 201: Created (Mock data successfully inserted)
  - 500: Server error

## Error Handling

The controller uses HTTP status codes and a standardized STATUS_CODE utility for error responses:

- 500: Internal Server Error

All endpoints are wrapped in try-catch blocks for error handling, returning appropriate status codes and error messages.
