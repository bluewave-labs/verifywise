# File Management Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing file uploads and retrievals in a PostgreSQL database.

## Dependencies

```typescript
import { UploadedFile } from "./question.utils";
import pool from "../database/db";
```

## Database Functions

### Upload File

```typescript
export const uploadFile = async (file: UploadedFile): Promise<any>
```

- **Description**: Stores a file in the database
- **Parameters**: `file` - UploadedFile object containing file details
- **Returns**: Promise resolving to the stored file record
- **SQL Query**: `INSERT INTO files (filename, content) VALUES ($1, $2) RETURNING *`

### Delete File

```typescript
export const deleteFileById = async (id: number): Promise<void>
```

- **Description**: Deletes a file by ID
- **Parameters**: `id` - File ID
- **Returns**: Promise resolving to void
- **SQL Query**: `DELETE FROM files WHERE id = $1`

### Get File

```typescript
export const getFileById = async (id: number): Promise<any>
```

- **Description**: Retrieves a file by ID
- **Parameters**: `id` - File ID
- **Returns**: Promise resolving to the file record
- **SQL Query**: `SELECT * FROM files WHERE id = $1`

## Data Types

```typescript
interface UploadedFile {
  originalname: string;
  buffer: Buffer;
}

interface FileRecord {
  id: number;
  filename: string;
  content: Buffer;
}
```

## Query Operations

All database operations:

- Use parameterized queries for security
- Handle binary file data through Buffer type
- Store filenames and file content separately
- Support basic CRUD operations for files
- Return typed promises for type safety
