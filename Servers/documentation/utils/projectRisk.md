# Project Risk Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing project risks in a PostgreSQL database.

## Dependencies

```typescript
import { ProjectRisk } from "../models/projectRisk.model";
import pool from "../database/db";
```

## Database Functions

### Get All Project Risks

```typescript
export const getAllProjectRisksQuery = async (): Promise<ProjectRisk[]>
```

- **Description**: Retrieves all project risks from the database
- **Returns**: Promise resolving to an array of ProjectRisk objects
- **SQL Query**: `SELECT * FROM project_risks`

### Get Project Risk by ID

```typescript
export const getProjectRiskByIdQuery = async (id: number): Promise<ProjectRisk | null>
```

- **Description**: Retrieves a specific project risk by ID
- **Parameters**: `id` - Project Risk ID
- **Returns**: Promise resolving to a ProjectRisk object or null if not found
- **SQL Query**: `SELECT * FROM project_risks WHERE id = $1`

### Create Project Risk

```typescript
export const createProjectRiskQuery = async (projectRisk: ProjectRisk): Promise<ProjectRisk>
```

- **Description**: Creates a new project risk
- **Parameters**: projectRisk object with required fields
- **Returns**: Promise resolving to the created ProjectRisk object
- **SQL Query**: INSERT with all fields and RETURNING clause

### Update Project Risk

```typescript
export const updateProjectRiskByIdQuery = async (
  id: number,
  projectRisk: Partial<ProjectRisk>
): Promise<ProjectRisk | null>
```

- **Description**: Updates an existing project risk
- **Parameters**:
  - `id` - Project Risk ID
  - `projectRisk` - Partial project risk object with fields to update
- **Returns**: Promise resolving to the updated ProjectRisk object or null if not found
- **SQL Query**: UPDATE query with all fields

### Delete Project Risk

```typescript
export const deleteProjectRiskByIdQuery = async (id: number): Promise<ProjectRisk | null>
```

- **Description**: Deletes a project risk by ID
- **Parameters**: `id` - Project Risk ID
- **Returns**: Promise resolving to the deleted ProjectRisk object or null if not found
- **SQL Query**: `DELETE FROM project_risks WHERE id = $1 RETURNING *`

## Data Types

```typescript
interface ProjectRisk {
  id?: number;
  project_id: number;
  risk_name: string;
  risk_owner: string;
  ai_lifecycle_phase: string;
  risk_description: string;
  risk_category: string;
  impact: string;
  assessment_mapping: string;
  controls_mapping: string;
  likelihood: string;
  severity: string;
  risk_level_autocalculated: string;
  review_notes: string;
  mitigation_status: string;
  current_risk_level: string;
  deadline: Date;
  mitigation_plan: string;
  implementation_strategy: string;
  mitigation_evidence_document: string;
  likelihood_mitigation: string;
  risk_severity: string;
  final_risk_level: string;
  risk_approval: string;
  approval_status: string;
  date_of_assessment: Date;
}
```

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Include console logging for debugging
- Handle potential null cases for single-record operations
- Support partial updates
- Return typed promises using the ProjectRisk interface
