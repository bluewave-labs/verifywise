# Subtopic Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for subtopic-related operations, including CRUD functionality for subtopics.

## Dependencies

```typescript
import { subtopics } from "../subtopic.mock.data";
import { Subtopic } from "../../models/subtopic.model";
```

## Service Methods

### Get All Subtopics

```typescript
getAllMockSubtopics(): Array<any>
```

- **Description**: Retrieves all mock subtopics
- **Returns**: Array of subtopic objects

### Get Subtopic by ID

```typescript
getMockSubtopicById(id: number): object | undefined
```

- **Description**: Retrieves a specific subtopic by ID
- **Parameters**: `id` (number)
- **Returns**: Subtopic object if found, undefined otherwise

### Create Subtopic

```typescript
createMockSubtopic(topicId: number, newSubtopic: any): object
```

- **Description**: Creates a new subtopic
- **Parameters**:
  - `topicId` (number)
  - `newSubtopic` (Subtopic name)
- **Returns**: Created subtopic object with:
  - Auto-generated ID
  - Associated topicId
  - Subtopic name

### Update Subtopic

```typescript
updateMockSubtopicById(id: number, updatedSubtopic: any): object | null
```

- **Description**: Updates an existing subtopic
- **Parameters**:
  - `id` (number)
  - `updatedSubtopic` (Partial Subtopic object)
- **Returns**: Updated subtopic object if found, null otherwise

### Delete Subtopic

```typescript
deleteMockSubtopicById(id: number): object | null
```

- **Description**: Deletes a subtopic by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted subtopic object if found, null otherwise

## Data Types

```typescript
interface Subtopic {
  id: number;
  topicId: number;
  name: string;
}
```

Note: The actual Subtopic interface should be referenced from subtopic.model.ts
