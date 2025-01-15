# Question Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for question-related operations, including CRUD functionality for questions.

## Dependencies

```typescript
import { questions } from "../question.mock.data";
```

## Service Methods

### Get All Questions

```typescript
getAllMockQuestions(): Array<any>
```

- **Description**: Retrieves all mock questions
- **Returns**: Array of question objects

### Get Question by ID

```typescript
getMockQuestionById(id: number): object | undefined
```

- **Description**: Retrieves a specific question by ID
- **Parameters**: `id` (number)
- **Returns**: Question object if found, undefined otherwise

### Create Question

```typescript
createMockQuestion(subtopicId: number, newQuestion: any): object
```

- **Description**: Creates a new question
- **Parameters**:
  - `subtopicId` (number)
  - `newQuestion` (Question object)
- **Returns**: Created question object with:
  - Auto-generated ID
  - Associated subtopicId

### Update Question

```typescript
updateMockQuestionById(id: number, updatedQuestion: any): object | null
```

- **Description**: Updates an existing question
- **Parameters**:
  - `id` (number)
  - `updatedQuestion` (Partial Question object)
- **Returns**: Updated question object if found, null otherwise

### Delete Question

```typescript
deleteMockQuestionById(id: number): object | null
```

- **Description**: Deletes a question by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted question object if found, null otherwise

## Data Types

```typescript
interface Question {
  id: number;
  subtopicId: number;
  // Additional question properties
}
```

Note: The actual Question interface should be referenced from the mock data structure
