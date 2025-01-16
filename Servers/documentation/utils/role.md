# Role Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing roles in a PostgreSQL database.

## Dependencies

```typescript
import { Role } from "../models/role.model";
import pool from "../database/db";
```

## Database Functions

### Get All Roles

```typescript
export const getAllRolesQuery = async (): Promise<Role[]>
```

- **Description**: Retrieves all roles from the database
- **Returns**: Promise resolving to an array of Role objects
- **SQL Query**: `SELECT * FROM roles`

### Get Role by ID

```typescript
export const getRoleByIdQuery = async (id: number): Promise<Role | null>
```

- **Description**: Retrieves a specific role by ID
- **Parameters**: `id` - Role ID
- **Returns**: Promise resolving to a Role object or null if not found
- **SQL Query**: `SELECT * FROM roles WHERE id = $1`

### Create Role

```typescript
export const createNewRoleQuery = async (role: { projectId: number }): Promise<Role>
```

- **Description**: Creates a new role
- **Parameters**: role object containing projectId
- **Returns**: Promise resolving to the created Role object
- **SQL Query**: `INSERT INTO roles (project_id) VALUES ($1) RETURNING *`

### Update Role

```typescript
export const updateRoleByIdQuery = async (
  id: number,
  role: Partial<{ projectId: number }>
): Promise<Role | null>
```

- **Description**: Updates an existing role
- **Parameters**:
  - `id` - Role ID
  - `role` - Partial role object with projectId
- **Returns**: Promise resolving to the updated Role object or null if not found
- **SQL Query**: `UPDATE roles SET project_id = $1 WHERE id = $2 RETURNING *`

### Delete Role

```typescript
export const deleteRoleByIdQuery = async (id: number): Promise<Role | null>
```

- **Description**: Deletes a role by ID
- **Parameters**: `id` - Role ID
- **Returns**: Promise resolving to the deleted Role object or null if not found
- **SQL Query**: `DELETE FROM roles WHERE id = $1 RETURNING *`

## Data Types

```typescript
interface Role {
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
- Support partial updates
- Return typed promises using the Role interface
