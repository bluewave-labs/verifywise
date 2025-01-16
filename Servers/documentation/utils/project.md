# Project Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing projects in a PostgreSQL database.

## Dependencies

```typescript
import { Project } from "../models/project.model";
import pool from "../database/db";
```

## Database Functions

### Get All Projects

```typescript
export const getAllProjectsQuery = async (): Promise<Project[]>
```

- **Description**: Retrieves all projects from the database
- **Returns**: Promise resolving to an array of Project objects
- **SQL Query**: `SELECT * FROM projects`

### Get Project by ID

```typescript
export const getProjectByIdQuery = async (id: number): Promise<Project | null>
```

- **Description**: Retrieves a specific project by ID
- **Parameters**: `id` - Project ID
- **Returns**: Promise resolving to a Project object or null if not found
- **SQL Query**: `SELECT * FROM projects WHERE id = $1`

### Create Project

```typescript
export const createNewProjectQuery = async (project: {
  project_title: string;
  owner: number;
  users: string;
  start_date: Date;
  ai_risk_classification: string;
  type_of_high_risk_role: string;
  goal: string;
  last_updated?: Date;
  last_updated_by?: number;
}): Promise<Project>
```

- **Description**: Creates a new project
- **Parameters**: project object with required fields
- **Returns**: Promise resolving to the created Project object
- **SQL Query**: INSERT with all fields and RETURNING clause

### Update Project

```typescript
export const updateProjectByIdQuery = async (
  id: number,
  project: Partial<{
    project_title: string;
    owner: string;
    users: string;
    start_date: Date;
    ai_risk_classification: string;
    type_of_high_risk_role: string;
    goal: string;
    last_updated: Date;
    last_updated_by: string;
  }>
): Promise<Project | null>
```

- **Description**: Updates an existing project
- **Parameters**:
  - `id` - Project ID
  - `project` - Partial project object with fields to update
- **Returns**: Promise resolving to the updated Project object or null if not found
- **SQL Query**: Dynamic UPDATE query based on provided fields

### Delete Project

```typescript
export const deleteProjectByIdQuery = async (id: number): Promise<Project | null>
```

- **Description**: Deletes a project by ID
- **Parameters**: `id` - Project ID
- **Returns**: Promise resolving to the deleted Project object or null if not found
- **SQL Query**: `DELETE FROM projects WHERE id = $1 RETURNING *`

## Data Types

```typescript
interface Project {
  id?: number;
  project_title: string;
  owner: number;
  users: string;
  start_date: Date;
  ai_risk_classification: string;
  type_of_high_risk_role: string;
  goal: string;
  last_updated?: Date;
  last_updated_by?: number;
}
```

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Include console logging for debugging
- Handle potential null cases for single-record operations
- Support partial updates with dynamic query building
- Return typed promises using the Project interface
