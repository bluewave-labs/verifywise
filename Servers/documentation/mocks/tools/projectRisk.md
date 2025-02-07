# Project Risk Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for project risk-related operations, including CRUD functionality for project risks.

## Dependencies

```typescript
import mockProjectRisks from "../projectRisks.mock.data";
import { ProjectRisk } from "../../models/projectRisk.model";
```

## Service Methods

### Get All Project Risks

```typescript
getAllMockProjectRisks(): Array<any>
```

- **Description**: Retrieves all mock project risks
- **Returns**: Array of project risk objects

### Get Project Risk by ID

```typescript
getMockProjectRiskById(id: number): object | undefined
```

- **Description**: Retrieves a specific project risk by ID
- **Parameters**: `id` (number)
- **Returns**: Project risk object if found, undefined otherwise

### Create Project Risk

```typescript
createMockProjectRisk(newProjectRisk: any): object
```

- **Description**: Creates a new project risk
- **Parameters**: `newProjectRisk` (Project Risk object)
- **Returns**: Created project risk object

### Update Project Risk

```typescript
updateMockProjectRiskById(id: number, updatedProjectRisk: any): object | null
```

- **Description**: Updates an existing project risk
- **Parameters**:
  - `id` (number)
  - `updatedProjectRisk` (Partial Project Risk object)
- **Returns**: Updated project risk object if found, null otherwise

### Delete Project Risk

```typescript
deleteMockProjectRiskById(id: number): object | null
```

- **Description**: Deletes a project risk by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted project risk object if found, null otherwise

## Data Types

```typescript
interface ProjectRisk {
  id: number;
  // Additional project risk properties
}
```

Note: The actual ProjectRisk interface should be referenced from projectRisk.model.ts
