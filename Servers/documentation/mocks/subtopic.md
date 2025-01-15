# Subtopics Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file defines subtopics that categorize specific aspects of AI system compliance and assessment requirements.

## Dependencies

```typescript
import { Subtopic } from "../models/subtopic.model";
```

## Data Structure

```typescript
interface Subtopic {
  id: number;
  topicId: number;
  name: string;
}
```

## Sample Data

The file contains predefined subtopic records organized by topics. Example:

```typescript
{
  id: 1,
  topicId: 1,
  name: "Transparency and provision of information to deployers"
}
```

Key Categories:

- AI System Information
  - Transparency requirements
  - Model capability assessment
  - System validation and documentation
- Compliance Requirements
  - EU database registration
  - Post-market monitoring
  - Fundamental rights impact assessments
- Operational Aspects
  - Human oversight
  - User notification
  - Environmental impact
  - Value chain responsibilities
