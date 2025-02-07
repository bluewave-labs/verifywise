# Assessment Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing assessments in a PostgreSQL database.

## Dependencies

```typescript
import { Assessment } from "../models/assessment.model";
import pool from "../database/db";
```

## Database Functions

### Get All Assessments

```typescript
export const getAllAssessmentsQuery = async (): Promise<Assessment[]>
```

- **Description**: Retrieves all assessments from the database
- **Returns**: Promise resolving to an array of Assessment objects
- **SQL Query**: `SELECT * FROM assessments`

### Get Assessment by ID

```typescript
export const getAssessmentByIdQuery = async (id: number): Promise<Assessment | null>
```

- **Description**: Retrieves a specific assessment by ID
- **Parameters**: `id` - Assessment ID
- **Returns**: Promise resolving to an Assessment object or null if not found
- **SQL Query**: `SELECT * FROM assessments WHERE id = $1`

### Create Assessment

```typescript
export const createNewAssessmentQuery = async (assessment: { projectId: number }): Promise<Assessment>
```

- **Description**: Creates a new assessment
- **Parameters**: assessment object containing projectId
- **Returns**: Promise resolving to the created Assessment object
- **SQL Query**: `INSERT INTO assessments (project_id) VALUES ($1) RETURNING *`

### Update Assessment

```typescript
export const updateAssessmentByIdQuery = async (
  id: number,
  assessment: Partial<{ projectId: number }>
): Promise<Assessment | null>
```

- **Description**: Updates an existing assessment
- **Parameters**:
  - `id` - Assessment ID
  - `assessment` - Partial assessment object with projectId
- **Returns**: Promise resolving to the updated Assessment object or null if not found
- **SQL Query**: `UPDATE assessments SET project_id = $1 WHERE id = $2 RETURNING *`

### Delete Assessment

```typescript
export const deleteAssessmentByIdQuery = async (id: number): Promise<Assessment | null>
```

- **Description**: Deletes an assessment by ID
- **Parameters**: `id` - Assessment ID
- **Returns**: Promise resolving to the deleted Assessment object or null if not found
- **SQL Query**: `DELETE FROM assessments WHERE id = $1 RETURNING *`

## Data Types

```typescript
interface Assessment {
  id?: number;
  projectId: number;
}
```

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Include console logging for debugging
- Handle potential null cases for single-record operations
- Return typed promises using the Assessment interface
