# Topics Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file defines topic records for different AI system assessment categories.

## Dependencies

```typescript
import { Topic } from "../models/topic.model";
```

## Data Structure

```typescript
interface Topic {
  id: number;
  assessmentId: number;
  title: string;
}
```

## Sample Data

The file contains predefined topic records organized by assessmentId. Example:

```typescript
{
  id: 1,
  assessmentId: 1,
  title: "Risk management system"
}
```

Key Categories:

- Technical Areas
  - Risk management system
  - Data governance
  - Technical documentation
  - Accuracy, robustness, cyber security
- Compliance Requirements
  - Record keeping
  - Conformity assessment
  - Post-market monitoring
- Operational Aspects
  - Human oversight
  - Transparency & user information
  - Explainability
  - Environmental impact
  - Accountability and governance
  - Bias monitoring and mitigation
