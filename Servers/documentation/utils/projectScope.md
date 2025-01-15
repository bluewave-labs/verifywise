# Project Scope Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing project scopes in a PostgreSQL database.

## Dependencies

```typescript
import { ProjectScope } from "../models/projectScope.model";
import pool from "../database/db";
```

## Database Functions

### Get All Project Scopes

```typescript
export const getAllProjectScopesQuery = async (): Promise<ProjectScope[]>
```

- **Description**: Retrieves all project scopes from the database
- **Returns**: Promise resolving to an array of ProjectScope objects
- **SQL Query**: `SELECT * FROM project_scopes`

### Get Project Scope by ID

```typescript
export const getProjectScopeByIdQuery = async (id: number): Promise<ProjectScope | null>
```

- **Description**: Retrieves a specific project scope by ID
- **Parameters**: `id` - Project Scope ID
- **Returns**: Promise resolving to a ProjectScope object or null if not found
- **SQL Query**: `SELECT * FROM project_scopes WHERE id = $1`

### Create Project Scope

```typescript
export const createProjectScopeQuery = async (projectScope: {
  assessmentId: number;
  describeAiEnvironment: string;
  isNewAiTechnology: boolean;
  usesPersonalData: boolean;
  projectScopeDocuments: string;
  technologyType: string;
  hasOngoingMonitoring: boolean;
  unintendedOutcomes: string;
  technologyDocumentation: string;
}): Promise<ProjectScope>
```

- **Description**: Creates a new project scope
- **Parameters**: projectScope object with required fields
- **Returns**: Promise resolving to the created ProjectScope object
- **SQL Query**: INSERT with all fields and RETURNING clause

### Update Project Scope

```typescript
export const updateProjectScopeByIdQuery = async (
  id: number,
  projectScope: Partial<ProjectScope>
): Promise<ProjectScope | null>
```

- **Description**: Updates an existing project scope
- **Parameters**:
  - `id` - Project Scope ID
  - `projectScope` - Partial project scope object with fields to update
- **Returns**: Promise resolving to the updated ProjectScope object or null if not found
- **SQL Query**: UPDATE query with all fields

### Delete Project Scope

```typescript
export const deleteProjectScopeByIdQuery = async (id: number): Promise<ProjectScope | null>
```

- **Description**: Deletes a project scope by ID
- **Parameters**: `id` - Project Scope ID
- **Returns**: Promise resolving to the deleted ProjectScope object or null if not found
- **SQL Query**: `DELETE FROM project_scopes WHERE id = $1 RETURNING *`

## Data Types

```typescript
interface ProjectScope {
  id?: number;
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

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Include console logging for debugging
- Handle potential null cases for single-record operations
- Support partial updates
- Return typed promises using the ProjectScope interface
