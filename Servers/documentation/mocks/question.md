# Questions Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file contains a comprehensive set of assessment questions related to AI system implementation, ethical considerations, and organizational compliance.

## Dependencies

```typescript
import { Question } from "../models/question.model";
```

## Data Structure

```typescript
interface Question {
  id: number;
  subtopicId: number;
  questionText: string;
  answerType: string;
  evidenceFileRequired: boolean;
  hint: string;
  isRequired: boolean;
  priorityLevel: string;
  answer: string;
}
```

## Sample Data

The file contains predefined questions organized by subtopics. Example question:

```typescript
{
  id: 1,
  subtopicId: 1,
  questionText: "Will you make substantial modifications to the high-risk AI system already on the EU market, and if so, what additional training or fine-tuning will be performed on the model after these modifications?",
  answerType: "Long text",
  evidenceFileRequired: false,
  hint: "As a deployer, you are responsible for any additional changes made to the high-risk AI system and must fulfill additional requirements based on the data used and the specific use case you are deploying.",
  isRequired: true,
  priorityLevel: "high priority",
  answer: ""
}
```

Question Attributes:

- Answer Type: Long text
- Evidence Requirements: Required/Not Required
- Priority Level: high priority
- Required Status: true/false
- Subtopic Association: Mapped to subtopicId
