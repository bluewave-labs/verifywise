# Control Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing controls in a PostgreSQL database.

## Dependencies

```typescript
import { Control } from "../models/control.model";
import pool from "../database/db";
```

## Database Functions

### Get All Controls

```typescript
export const getAllControlsQuery = async (): Promise<Control[]>
```

- **Description**: Retrieves all controls from the database
- **Returns**: Promise resolving to an array of Control objects
- **SQL Query**: `SELECT * FROM controls`

### Get Control by ID

```typescript
export const getControlByIdQuery = async (id: number): Promise<Control | null>
```

- **Description**: Retrieves a specific control by ID
- **Parameters**: `id` - Control ID
- **Returns**: Promise resolving to a Control object or null if not found
- **SQL Query**: `SELECT * FROM controls WHERE id = $1`

### Create Control

```typescript
export const createNewControlQuery = async (control: {
  projectId: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
}): Promise<Control>
```

- **Description**: Creates a new control
- **Parameters**: control object with required fields
- **Returns**: Promise resolving to the created Control object
- **SQL Query**: INSERT with all fields and RETURNING clause

### Update Control

```typescript
export const updateControlByIdQuery = async (
  id: number,
  control: Partial<{
    projectId: number;
    status: string;
    approver: string;
    riskReview: string;
    owner: string;
    reviewer: string;
    dueDate: Date;
    implementationDetails: string;
  }>
): Promise<Control | null>
```

- **Description**: Updates an existing control
- **Parameters**:
  - `id` - Control ID
  - `control` - Partial control object with fields to update
- **Returns**: Promise resolving to the updated Control object or null if not found
- **SQL Query**: Dynamic UPDATE query based on provided fields

### Delete Control

```typescript
export const deleteControlByIdQuery = async (id: number): Promise<Control | null>
```

- **Description**: Deletes a control by ID
- **Parameters**: `id` - Control ID
- **Returns**: Promise resolving to the deleted Control object or null if not found
- **SQL Query**: `DELETE FROM controls WHERE id = $1 RETURNING *`

## Data Types

```typescript
interface Control {
  id?: number;
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

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Include console logging for debugging
- Handle potential null cases for single-record operations
- Support partial updates with dynamic query building
- Return typed promises using the Control interface
