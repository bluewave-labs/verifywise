# Subtopic Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing subtopics in a PostgreSQL database.

## Dependencies

```typescript
import { Subtopic } from "../models/subtopic.model";
import pool from "../database/db";
```

## Database Functions

### Get All Subtopics

```typescript
export const getAllSubtopicsQuery = async (): Promise<Subtopic[]>
```

- **Description**: Retrieves all subtopics from the database
- **Returns**: Promise resolving to an array of Subtopic objects
- **SQL Query**: `SELECT * FROM subtopics`

### Get Subtopic by ID

```typescript
export const getSubtopicByIdQuery = async (id: number): Promise<Subtopic | null>
```

- **Description**: Retrieves a specific subtopic by ID
- **Parameters**: `id` - Subtopic ID
- **Returns**: Promise resolving to a Subtopic object or null if not found
- **SQL Query**: `SELECT * FROM subtopics WHERE id = $1`

### Create Subtopic

```typescript
export const createNewSubtopicQuery = async (subtopic: {
  topicId: number;
  name: string;
}): Promise<{ topicId: number; name: string; }>
```

- **Description**: Creates a new subtopic
- **Parameters**: subtopic object containing topicId and name
- **Returns**: Promise resolving to the created Subtopic object
- **SQL Query**: `INSERT INTO subtopics (topic_id, name) VALUES ($1, $2) RETURNING *`

### Update Subtopic

```typescript
export const updateSubtopicByIdQuery = async (
  id: number,
  subtopic: Partial<{ topicId: number; name: string; }>
): Promise<Subtopic | null>
```

- **Description**: Updates an existing subtopic
- **Parameters**:
  - `id` - Subtopic ID
  - `subtopic` - Partial subtopic object with fields to update
- **Returns**: Promise resolving to the updated Subtopic object or null if not found
- **SQL Query**: `UPDATE subtopics SET topic_id = $1, name = $2 WHERE id = $3 RETURNING *`

### Delete Subtopic

```typescript
export const deleteSubtopicByIdQuery = async (id: number): Promise<Subtopic | null>
```

- **Description**: Deletes a subtopic by ID
- **Parameters**: `id` - Subtopic ID
- **Returns**: Promise resolving to the deleted Subtopic object or null if not found
- **SQL Query**: `DELETE FROM subtopics WHERE id = $1 RETURNING *`

## Data Types

```typescript
interface Subtopic {
  id?: number;
  topicId: number;
  name: string;
}
```

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Include console logging for debugging
- Handle potential null cases for single-record operations
- Support partial updates
- Return typed promises using the Subtopic interface
