# Database Utility Functions Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Usage Examples](#usage-examples)

## Overview

This module provides utility functions for database table management and data operations in a PostgreSQL database.

## Dependencies

```typescript
import pool from "../database/db";
```

## Database Functions

### Check Table Exists

```typescript
export async function checkTableExists(tableName: string): Promise<boolean>;
```

- **Description**: Checks if a table exists in the public schema
- **Parameters**: `tableName` - Name of the table to check
- **Returns**: Promise resolving to boolean indicating table existence
- **SQL Query**:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = $1
);
```

### Create Table

```typescript
export async function createTable(createQuery: string): Promise<void>;
```

- **Description**: Creates a new table using provided SQL query
- **Parameters**: `createQuery` - SQL query string for table creation
- **Returns**: Promise resolving to void

### Delete Existing Data

```typescript
export async function deleteExistingData(tableName: string): Promise<void>;
```

- **Description**: Deletes all records from specified table
- **Parameters**: `tableName` - Name of the table to clear
- **Returns**: Promise resolving to void
- **SQL Query**: `DELETE FROM ${tableName} WHERE 1=1;`

### Insert Data

```typescript
export async function insertData(insertQuery: string): Promise<void>;
```

- **Description**: Executes provided insert query to add data
- **Parameters**: `insertQuery` - SQL query string for data insertion
- **Returns**: Promise resolving to void

## Usage Examples

```typescript
// Check if table exists
const exists = await checkTableExists("users");

// Create new table
await createTable(`
  CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255)
  );
`);

// Clear table data
await deleteExistingData("users");

// Insert new data
await insertData(`
  INSERT INTO users (name)
  VALUES ('John Doe');
`);
```
