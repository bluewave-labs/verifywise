# Control Category Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing control categories in a PostgreSQL database.

## Dependencies

```typescript
import { ControlCategory } from "../models/controlCategory.model";
import pool from "../database/db";
```

## Database Functions

### Get All Control Categories

```typescript
export const getAllControlCategoriesQuery = async (): Promise<ControlCategory[]>
```

- **Description**: Retrieves all control categories from the database
- **Returns**: Promise resolving to an array of ControlCategory objects
- **SQL Query**: `SELECT * FROM control_categories`

### Get Control Category by ID

```typescript
export const getControlCategoryByIdQuery = async (id: number): Promise<ControlCategory | null>
```

- **Description**: Retrieves a specific control category by ID
- **Parameters**: `id` - Control Category ID
- **Returns**: Promise resolving to a ControlCategory object or null if not found
- **SQL Query**: `SELECT * FROM control_categories WHERE id = $1`

### Create Control Category

```typescript
export const createControlCategoryQuery = async (controlCategory: ControlCategory): Promise<ControlCategory>
```

- **Description**: Creates a new control category
- **Parameters**: controlCategory object with required fields
- **Returns**: Promise resolving to the created ControlCategory object
- **SQL Query**: `INSERT INTO control_categories (project_id, name) VALUES ($1, $2) RETURNING *`

### Update Control Category

```typescript
export const updateControlCategoryByIdQuery = async (
  id: number,
  controlCategory: Partial<ControlCategory>
): Promise<ControlCategory | null>
```

- **Description**: Updates an existing control category
- **Parameters**:
  - `id` - Control Category ID
  - `controlCategory` - Partial control category object with fields to update
- **Returns**: Promise resolving to the updated ControlCategory object or null if not found
- **SQL Query**: `UPDATE control_categories SET $1 WHERE id = $2 RETURNING *`

### Delete Control Category

```typescript
export const deleteControlCategoryByIdQuery = async (id: number): Promise<ControlCategory | null>
```

- **Description**: Deletes a control category by ID
- **Parameters**: `id` - Control Category ID
- **Returns**: Promise resolving to the deleted ControlCategory object or null if not found
- **SQL Query**: `DELETE FROM control_categories WHERE id = $1 RETURNING *`

## Data Types

```typescript
interface ControlCategory {
  id?: number;
  projectId: number;
  name: string;
}
```

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Handle potential null cases for single-record operations
- Support partial updates
- Return typed promises using the ControlCategory interface
