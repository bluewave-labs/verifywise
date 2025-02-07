# Project Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for project-related operations, including CRUD functionality for projects.

## Dependencies

```typescript
import mockProjects from "../project.mock.data";
import { Project } from "../../models/project.model";
```

## Service Methods

### Get All Projects

```typescript
getAllMockProjects(): Array<any>
```

- **Description**: Retrieves all mock projects
- **Returns**: Array of project objects

### Get Project by ID

```typescript
getMockProjectById(id: number): object | undefined
```

- **Description**: Retrieves a specific project by ID
- **Parameters**: `id` (number)
- **Returns**: Project object if found, undefined otherwise

### Create Project

```typescript
createMockProject(newProject: any): object
```

- **Description**: Creates a new project
- **Parameters**: `newProject` (Project object)
- **Returns**: Created project object with:
  - Auto-generated ID
  - Timestamp for last_updated field

### Update Project

```typescript
updateMockProjectById(id: number, updatedProject: any): object | null
```

- **Description**: Updates an existing project
- **Parameters**:
  - `id` (number)
  - `updatedProject` (Partial Project object)
- **Returns**: Updated project object if found, null otherwise

### Delete Project

```typescript
deleteMockProjectById(id: number): object | null
```

- **Description**: Deletes a project by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted project object if found, null otherwise

## Data Types

```typescript
interface Project {
  id: number;
  last_updated: string;
  // Additional project properties
}
```

Note: The actual Project interface should be referenced from project.model.ts
