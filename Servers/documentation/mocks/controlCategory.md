# Control Categories Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file defines a comprehensive list of control categories specifically related to AI systems and regulatory compliance, organized by project.

## Dependencies

```typescript
import { ControlCategory } from "../models/controlCategory.model";
```

## Data Structure

```typescript
export const ControlCategories: ControlCategory[] = ControlCategory[];
```

Each control category object contains:

- id: number
- projectId: number
- name: string

## Sample Data

The file contains 26 predefined control categories spanning two projects (projectId: 1 and 2). Categories include:

Project 1 Categories (id: 1-13):

```typescript
{
  id: 1,
  projectId: 1,
  name: "AI literacy"
}
```

Project 2 Categories (id: 14-26):

```typescript
{
  id: 14,
  projectId: 2,
  name: "AI literacy"
}
```

Key category areas:

- AI literacy
- Human oversight
- Transparency obligations
- Registration
- High-risk AI systems monitoring
- Incident reporting
- General-purpose AI models
- Fundamental rights impact assessments
