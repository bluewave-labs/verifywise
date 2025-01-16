# Subcontrol Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing subcontrols in a PostgreSQL database.

## Dependencies

```typescript
import { Subcontrol } from "../models/subcontrol.model";
import pool from "../database/db";
```

## Database Functions

### Get All Subcontrols

```typescript
export const getAllSubcontrolsQuery = async (): Promise<Subcontrol[]>
```

- **Description**: Retrieves all subcontrols from the database
- **Returns**: Promise resolving to an array of Subcontrol objects
- **SQL Query**: `SELECT * FROM subcontrols`

### Get Subcontrol by ID

```typescript
export const getSubcontrolByIdQuery = async (id: number): Promise<Subcontrol | null>
```

- **Description**: Retrieves a specific subcontrol by ID
- **Parameters**: `id` - Subcontrol ID
- **Returns**: Promise resolving to a Subcontrol object or null if not found
- **SQL Query**: `SELECT * FROM subcontrols WHERE id = $1`

### Create Subcontrol

```typescript
export const createNewSubcontrolQuery = async (
  controlId: number,
  subcontrol: {
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
): Promise<Subcontrol>
```

- **Description**: Creates a new subcontrol
- **Parameters**:
  - `controlId` - Associated Control ID
  - `subcontrol` - Subcontrol object with required fields
- **Returns**: Promise resolving to the created Subcontrol object
- **SQL Query**: INSERT with all fields and RETURNING clause

### Update Subcontrol

```typescript
export const updateSubcontrolByIdQuery = async (
  id: number,
  subcontrol: Partial<Subcontrol>
): Promise<Subcontrol | null>
```

- **Description**: Updates an existing subcontrol
- **Parameters**:
  - `id` - Subcontrol ID
  - `subcontrol` - Partial subcontrol object with fields to update
- **Returns**: Promise resolving to the updated Subcontrol object or null if not found
- **SQL Query**: UPDATE query with all fields

### Delete Subcontrol

```typescript
export const deleteSubcontrolByIdQuery = async (id: number): Promise<Subcontrol | null>
```

- **Description**: Deletes a subcontrol by ID
- **Parameters**: `id` - Subcontrol ID
- **Returns**: Promise resolving to the deleted Subcontrol object or null if not found
- **SQL Query**: `DELETE FROM subcontrols WHERE id = $1 RETURNING *`

## Data Types

```typescript
interface Subcontrol {
  id?: number;
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

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Include console logging for debugging
- Handle potential null cases for single-record operations
- Support partial updates
- Return typed promises using the Subcontrol interface
