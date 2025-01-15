# Assessment Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for assessment-related operations, including CRUD functionality for assessments.

## Dependencies

```typescript
import { Assessments } from "../assessment.mock.data";
import { Assessment } from "../../models/assessment.model";
```

## Service Methods

### Get All Assessments

```typescript
getAllMockAssessments(): Array<any>
```

- **Description**: Retrieves all mock assessments
- **Returns**: Array of assessment objects

### Get Assessment by ID

```typescript
getMockAssessmentById(id: number): object | undefined
```

- **Description**: Retrieves a specific assessment by ID
- **Parameters**: `id` (number)
- **Returns**: Assessment object if found, undefined otherwise

### Create Assessment

```typescript
createMockAssessment(newAssessment: any): object
```

- **Description**: Creates a new assessment
- **Parameters**: `newAssessment` (Assessment object)
- **Returns**: Created assessment object

### Update Assessment

```typescript
updateMockAssessmentById(id: number, updatedAssessment: any): object | null
```

- **Description**: Updates an existing assessment
- **Parameters**:
  - `id` (number)
  - `updatedAssessment` (Partial Assessment object)
- **Returns**: Updated assessment object if found, null otherwise

### Delete Assessment

```typescript
deleteMockAssessmentById(id: number): object | null
```

- **Description**: Deletes an assessment by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted assessment object if found, null otherwise

## Data Types

```typescript
interface Assessment {
  id: number;
  // Additional assessment properties
}
```

Note: The actual Assessment interface should be referenced from assessment.model.ts
