# Question Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing questions and associated file uploads in a PostgreSQL database.

## Dependencies

```typescript
import { Question } from "../models/question.model";
import pool from "../database/db";
import { deleteFileById, getFileById, uploadFile } from "./fileUpload.utils";
import { Request } from "express";
```

## Database Functions

### Get All Questions

```typescript
export const getAllQuestionsQuery = async (): Promise<Question[]>
```

- **Description**: Retrieves all questions with associated evidence files
- **Returns**: Promise resolving to an array of Question objects
- **SQL Query**: `SELECT * FROM questions`
- **Additional Processing**: Retrieves file details for each evidence file ID

### Get Question by ID

```typescript
export const getQuestionByIdQuery = async (id: number): Promise<Question | null>
```

- **Description**: Retrieves a specific question with evidence files
- **Parameters**: `id` - Question ID
- **Returns**: Promise resolving to a Question object or null if not found
- **SQL Query**: `SELECT * FROM questions WHERE id = $1`

### Create Question

```typescript
export const createNewQuestionQuery = async (
  question: {
    subtopicId: number;
    questionText: string;
    answerType: string;
    evidenceFileRequired: boolean;
    hint: string;
    isRequired: boolean;
    priorityLevel: string;
    answer: string;
  },
  files?: UploadedFile[]
): Promise<Question>
```

- **Description**: Creates a new question and uploads associated files
- **Parameters**: question object and optional files array
- **Returns**: Promise resolving to the created Question object
- **SQL Query**: INSERT with all fields and RETURNING clause

### Update Question

```typescript
export const updateQuestionByIdQuery = async (
  id: number,
  question: Partial<Question>,
  files: UploadedFile[]
): Promise<Question | null>
```

- **Description**: Updates a question and its associated files
- **Parameters**:
  - `id` - Question ID
  - `question` - Partial question object
  - `files` - Array of files to upload
- **Returns**: Promise resolving to the updated Question object or null if not found

### Delete Question

```typescript
export const deleteQuestionByIdQuery = async (id: number): Promise<Question | null>
```

- **Description**: Deletes a question and its associated files
- **Parameters**: `id` - Question ID
- **Returns**: Promise resolving to the deleted Question object or null if not found
- **Additional Processing**: Deletes associated evidence files

## Data Types

```typescript
interface Question {
  id?: number;
  subtopicId: number;
  questionText: string;
  answerType: string;
  evidenceFileRequired: boolean;
  hint: string;
  isRequired: boolean;
  priorityLevel: string;
  answer: string;
  evidence_files: string[];
}

interface UploadedFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

interface RequestWithFile extends Request {
  files?: UploadedFile[];
}
```

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Include console logging for debugging
- Handle file uploads and deletions
- Process evidence files associations
- Return typed promises using the Question interface
