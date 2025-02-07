# Project Scope Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for project scope-related operations, including CRUD functionality for project scopes.

## Dependencies

```typescript
import { projectScopes } from "../projectScope.mock.data";
import { ProjectScope } from "../../models/projectScope.model";
```

## Service Methods

### Get All Project Scopes

```typescript
getAllMockProjectScopes(): Array<any>
```

- **Description**: Retrieves all mock project scopes
- **Returns**: Array of project scope objects

### Get Project Scope by ID

```typescript
getMockProjectScopeById(id: number): object | undefined
```

- **Description**: Retrieves a specific project scope by ID
- **Parameters**: `id` (number)
- **Returns**: Project scope object if found, undefined otherwise

### Create Project Scope

```typescript
createMockProjectScope(newProjectScope: any): object
```

- **Description**: Creates a new project scope
- **Parameters**: `newProjectScope` (Project Scope object)
- **Returns**: Created project scope object

### Update Project Scope

```typescript
updateMockProjectScopeById(id: number, updatedProjectScope: any): object | null
```

- **Description**: Updates an existing project scope
- **Parameters**:
  - `id` (number)
  - `updatedProjectScope` (Partial Project Scope object)
- **Returns**: Updated project scope object if found, null otherwise

### Delete Project Scope

```typescript
deleteMockProjectScopeById(id: number): object | null
```

- **Description**: Deletes a project scope by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted project scope object if found, null otherwise

## Data Types

```typescript
interface ProjectScope {
  id: number;
  // Additional project scope properties
}
```

Note: The actual ProjectScope interface should be referenced from projectScope.model.ts
