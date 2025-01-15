# Control Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for control-related operations, including CRUD functionality for controls.

## Dependencies

```typescript
import { mockControls } from "../control.mock.data";
import { Control } from "../../models/control.model";
```

## Service Methods

### Get All Controls

```typescript
getAllMockControls(): Array<any>
```

- **Description**: Retrieves all mock controls
- **Returns**: Array of control objects

### Get Control by ID

```typescript
getMockControlById(id: number): object | undefined
```

- **Description**: Retrieves a specific control by ID
- **Parameters**: `id` (number)
- **Returns**: Control object if found, undefined otherwise

### Create Control

```typescript
createMockControl(newControl: any): object
```

- **Description**: Creates a new control
- **Parameters**: `newControl` (Control object)
- **Returns**: Created control object with the following structure:

```typescript
{
  id: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  implementationDetails: string;
  dueDate: string;
  projectId: number;
  controlGroup: string;
}
```

### Update Control

```typescript
updateMockControlById(id: number, updatedControl: any): object | null
```

- **Description**: Updates an existing control
- **Parameters**:
  - `id` (number)
  - `updatedControl` (Partial Control object)
- **Returns**: Updated control object if found, null otherwise

### Delete Control

```typescript
deleteMockControlById(id: number): object | null
```

- **Description**: Deletes a control by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted control object if found, null otherwise

## Data Types

```typescript
interface Control {
  id: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  implementationDetails: string;
  dueDate: string;
  projectId: number;
  controlGroup: string;
}
```

Note: The actual Control interface should be referenced from control.model.ts
