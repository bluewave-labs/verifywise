# Controls Mock Data Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file contains mock control data for development and testing purposes, providing a comprehensive dataset of control records with various statuses and responsibilities.

## Dependencies

```typescript
import { Control } from "../models/control.model";
```

## Data Structure

```typescript
export const mockControls: Control[] = Control[];
```

Each control object contains the following properties:

- id: number
- status: string
- approver: string
- riskReview: string
- owner: string
- reviewer: string
- dueDate: Date
- implementationDetails: string
- controlGroup: number

## Sample Data

The file contains six predefined control records with varying attributes. Example record:

```typescript
{
  id: 1,
  status: "In progress",
  approver: "John Doe",
  riskReview: "Acceptable risk",
  owner: "Bob Johnson",
  reviewer: "Alice Williams",
  dueDate: new Date("2023-12-31"),
  implementationDetails: "Implement new feature",
  controlGroup: 1
}
```

Status types include:

- In progress
- Waiting
- Done

Risk review categories:

- Acceptable risk
- Residual risk
- Unacceptable risk
