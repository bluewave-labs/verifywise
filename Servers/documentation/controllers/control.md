# Control Controller Documentation

## Table of Contents
- [Overview](#overview)
- [Dependencies](#dependencies)
- [API Endpoints](#api-endpoints)
- [Data Types](#data-types)
- [Error Handling](#error-handling)

## Overview
This controller manages control-related operations, including CRUD operations for controls, control categories, and subcontrols.

## Dependencies
```typescript
import { Request, Response } from "express";
import { MOCKDATA_ON } from "../flags";
import { STATUS_CODE } from "../utils/statusCode.utils";
```

## API Endpoints

### Get All Controls
- **Endpoint**: GET `/controls`
- **Description**: Retrieves all controls
- **Response**: 
  - 200: Success with controls data
  - 204: No content
  - 500: Server error

### Get Control by ID
- **Endpoint**: GET `/controls/:id`
- **Description**: Retrieves a specific control by ID
- **Response**: 
  - 200: Success with control data
  - 204: No content
  - 500: Server error

### Create Control
- **Endpoint**: POST `/controls`
- **Request Body**:
```typescript
{
  projectId: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
  controlGroup: string;
}
```
- **Response**: 
  - 201: Created
  - 400: Bad request
  - 500: Server error

### Update Control
- **Endpoint**: PUT `/controls/:id`
- **Request Body**:
```typescript
{
  projectId: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
}
```
- **Response**: 
  - 200: Success
  - 400: Bad request
  - 500: Server error

### Delete Control
- **Endpoint**: DELETE `/controls/:id`
- **Response**: 
  - 200: Success
  - 400: Bad request
  - 500: Server error

### Save Controls
- **Endpoint**: POST `/controls/save`
- **Request Body**:
```typescript
{
  projectId: number;
  controlCategoryTitle: string;
  control: {
    controlTitle: string;
    controlDescription: string;
    status: string;
    approver: string;
    riskReview: string;
    owner: string;
    reviewer: string;
    description: string;
    date: Date;
    subControls: Array<any>;
  };
}
```

### Update Controls
- **Endpoint**: PUT `/controls/update`
- **Request Body**:
```typescript
{
  projectId: number;
  controlCategoryTitle: string;
  controlCategoryId: number;
  control: {
    id: number;
    controlCategoryId: number;
    controlId: number;
    controlTitle: string;
    controlDescription: string;
    status: string;
    approver: string;
    riskReview: string;
    owner: string;
    reviewer: string;
    date: Date;
    description: string;
    subControls: Array<{
      id: number;
      controlId: number;
      subControlTitle: string;
      subControlDescription: string;
      status: string;
      approver: string;
      riskReview: string;
      owner: string;
      reviewer: string;
      date: Date;
      description: string;
      evidence: string;
      evidenceFiles: Array<any>;
      feedback: string;
      feedbackFiles: Array<any>;
    }>;
  };
}
```

## Data Types
```typescript
interface Control {
  projectId: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
  controlGroup?: string;
}

interface SubControl {
  controlId: number;
  subControlTitle: string;
  subControlDescription: string;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  date: Date;
  description: string;
  evidence: string;
  evidenceFiles: any[];
  feedback: string;
  feedbackFiles: any[];
}
```

## Error Handling
The controller uses HTTP status codes and a standardized STATUS_CODE utility for error responses:
- 400: Bad Request
- 500: Internal Server Error

All endpoints are wrapped in try-catch blocks for error handling, returning appropriate status codes and error messages.