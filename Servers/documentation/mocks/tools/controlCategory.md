# Control Category Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for control category-related operations, including CRUD functionality for control categories.

## Dependencies

```typescript
import { ControlCategories } from "../controlCategory.mock.data";
import { ControlCategory } from "../../models/controlCategory.model";
```

## Service Methods

### Get All Control Categories

```typescript
getAllMockControlCategories(): Array<any>
```

- **Description**: Retrieves all mock control categories
- **Returns**: Array of control category objects

### Get Control Category by ID

```typescript
getMockControlCategoryById(id: number): object | undefined
```

- **Description**: Retrieves a specific control category by ID
- **Parameters**: `id` (number)
- **Returns**: Control category object if found, undefined otherwise

### Create Control Category

```typescript
createMockControlCategory(newControlCategory: any): object
```

- **Description**: Creates a new control category
- **Parameters**: `newControlCategory` (Control Category object)
- **Returns**: Created control category object with auto-generated ID

### Update Control Category

```typescript
updateMockControlCategoryById(id: number, updatedControlCategory: any): object | null
```

- **Description**: Updates an existing control category
- **Parameters**:
  - `id` (number)
  - `updatedControlCategory` (Partial Control Category object)
- **Returns**: Updated control category object if found, null otherwise

### Delete Control Category

```typescript
deleteMockControlCategoryById(id: number): object | null
```

- **Description**: Deletes a control category by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted control category object if found, null otherwise

## Data Types

```typescript
interface ControlCategory {
  id: number;
  // Additional control category properties
}
```

Note: The actual ControlCategory interface should be referenced from controlCategory.model.ts
