# Topic Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing topics in a PostgreSQL database.

## Dependencies

```typescript
import { Topic } from "../models/topic.model";
import pool from "../database/db";
```

## Database Functions

### Get All Topics

```typescript
export const getAllTopicsQuery = async (): Promise<Topic[]>
```

- **Description**: Retrieves all topics from the database
- **Returns**: Promise resolving to an array of Topic objects
- **SQL Query**: `SELECT * FROM topics`

### Get Topic by ID

```typescript
export const getTopicByIdQuery = async (id: number): Promise<Topic | null>
```

- **Description**: Retrieves a specific topic by ID
- **Parameters**: `id` - Topic ID
- **Returns**: Promise resolving to a Topic object or null if not found
- **SQL Query**: `SELECT * FROM topics WHERE id = $1`

### Create Topic

```typescript
export const createNewTopicQuery = async (topic: {
  assessmentId: number;
  title: string;
}): Promise<Topic>
```

- **Description**: Creates a new topic
- **Parameters**: topic object containing assessmentId and title
- **Returns**: Promise resolving to the created Topic object
- **SQL Query**: `INSERT INTO topics (assessment_id, title) VALUES ($1, $2) RETURNING *`

### Update Topic

```typescript
export const updateTopicByIdQuery = async (
  id: number,
  topic: Partial<{ assessmentId: number; title: string; }>
): Promise<Topic | null>
```

- **Description**: Updates an existing topic
- **Parameters**:
  - `id` - Topic ID
  - `topic` - Partial topic object with fields to update
- **Returns**: Promise resolving to the updated Topic object or null if not found
- **SQL Query**: Dynamic UPDATE query based on provided fields

### Delete Topic

```typescript
export const deleteTopicByIdQuery = async (id: number): Promise<Topic | null>
```

- **Description**: Deletes a topic by ID
- **Parameters**: `id` - Topic ID
- **Returns**: Promise resolving to the deleted Topic object or null if not found
- **SQL Query**: `DELETE FROM topics WHERE id = $1 RETURNING *`

## Data Types

```typescript
interface Topic {
  id?: number;
  assessmentId: number;
  title: string;
}
```

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Include console logging for debugging
- Handle potential null cases for single-record operations
- Support partial updates with dynamic query building
- Return typed promises using the Topic interface
