# Assessment Data Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file defines a static array of assessment data, providing a mock dataset for development and testing purposes.

## Dependencies

```typescript
import { Assessment } from "../models/assessment.model";
```

## Data Structure

```typescript
export const Assessments: Assessment[] = Assessment[];
```

## Sample Data

The file contains predefined assessment records:

```typescript
[
  { id: 1, projectId: 1 },
  { id: 2, projectId: 2 },
];
```

Each assessment object contains:

- id: unique identifier for the assessment
- projectId: reference to associated project
