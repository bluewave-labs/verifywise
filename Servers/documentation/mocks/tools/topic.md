# Topic Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for topic-related operations, including CRUD functionality for topics.

## Dependencies

```typescript
import { topics } from "../topic.mock.data";
import { Topic } from "../../models/topic.model";
```

## Service Methods

### Get All Topics

```typescript
getAllMockTopics(): Array<any>
```

- **Description**: Retrieves all mock topics
- **Returns**: Array of topic objects

### Get Topic by ID

```typescript
getMockTopicById(id: number): object | undefined
```

- **Description**: Retrieves a specific topic by ID
- **Parameters**: `id` (number)
- **Returns**: Topic object if found, undefined otherwise

### Create Topic

```typescript
createMockTopic(assessmentId: number, newTopic: any): object
```

- **Description**: Creates a new topic
- **Parameters**:
  - `assessmentId` (number)
  - `newTopic` (Topic title)
- **Returns**: Created topic object with:
  - Auto-generated ID
  - Associated assessmentId
  - Topic title

### Update Topic

```typescript
updateMockTopicById(id: number, updatedTopic: any): object | null
```

- **Description**: Updates an existing topic
- **Parameters**:
  - `id` (number)
  - `updatedTopic` (Partial Topic object)
- **Returns**: Updated topic object if found, null otherwise

### Delete Topic

```typescript
deleteMockTopicById(id: number): object | null
```

- **Description**: Deletes a topic by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted topic object if found, null otherwise

## Data Types

```typescript
interface Topic {
  id: number;
  assessmentId: number;
  title: string;
}
```

Note: The actual Topic interface should be referenced from topic.model.ts
