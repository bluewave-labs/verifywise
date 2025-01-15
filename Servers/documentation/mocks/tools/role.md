# Role Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for role-related operations, including CRUD functionality for roles.

## Dependencies

```typescript
import { roles } from "../role.mock.data";
import { Role } from "../../models/role.model";
```

## Service Methods

### Get All Roles

```typescript
getAllMockRoles(): Array<any>
```

- **Description**: Retrieves all mock roles
- **Returns**: Array of role objects

### Get Role by ID

```typescript
getMockRoleById(id: number): object | undefined
```

- **Description**: Retrieves a specific role by ID
- **Parameters**: `id` (number)
- **Returns**: Role object if found, undefined otherwise

### Create Role

```typescript
createMockRole(newRole: any): object
```

- **Description**: Creates a new role
- **Parameters**: `newRole` (Role object)
- **Returns**: Created role object

### Update Role

```typescript
updateMockRoleById(id: number, updatedRole: any): object | null
```

- **Description**: Updates an existing role
- **Parameters**:
  - `id` (number)
  - `updatedRole` (Partial Role object)
- **Returns**: Updated role object if found, null otherwise

### Delete Role

```typescript
deleteMockRoleById(id: number): object | null
```

- **Description**: Deletes a role by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted role object if found, null otherwise

## Data Types

```typescript
interface Role {
  id: number;
  // Additional role properties
}
```

Note: The actual Role interface should be referenced from role.model.ts
