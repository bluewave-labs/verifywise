# Subcontrol Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for subcontrol-related operations, including CRUD functionality for subcontrols.

## Dependencies

```typescript
import { subcontrols } from "../subcontrol.mock.data";
import { Subcontrol } from "../../models/subcontrol.model";
```

## Service Methods

### Get All Subcontrols

```typescript
getAllMockSubcontrols(): Array<any>
```

- **Description**: Retrieves all mock subcontrols
- **Returns**: Array of subcontrol objects

### Get Subcontrol by ID

```typescript
getMockSubcontrolById(id: number): object | undefined
```

- **Description**: Retrieves a specific subcontrol by ID
- **Parameters**: `id` (number)
- **Returns**: Subcontrol object if found, undefined otherwise

### Create Subcontrol

```typescript
createMockSubcontrol(newSubcontrol: any): object
```

- **Description**: Creates a new subcontrol
- **Parameters**: `newSubcontrol` (Subcontrol object)
- **Returns**: Created subcontrol object

### Update Subcontrol

```typescript
updateMockSubcontrolById(id: number, updatedSubcontrol: any): object | null
```

- **Description**: Updates an existing subcontrol
- **Parameters**:
  - `id` (number)
  - `updatedSubcontrol` (Partial Subcontrol object)
- **Returns**: Updated subcontrol object if found, null otherwise

### Delete Subcontrol

```typescript
deleteMockSubcontrolById(id: number): object | null
```

- **Description**: Deletes a subcontrol by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted subcontrol object if found, null otherwise

## Data Types

```typescript
interface Subcontrol {
  id: number;
  // Additional subcontrol properties
}
```

Note: The actual Subcontrol interface should be referenced from subcontrol.model.ts
