# Subcontrols Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file defines subcontrol data that manages the detailed implementation and tracking of control measures within the system.

## Dependencies

```typescript
import { Subcontrol } from "../models/subcontrol.model";
```

## Data Structure

```typescript
interface Subcontrol {
  id: number;
  controlId: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
  evidence: string;
  attachment: string;
  feedback: string;
}
```

## Sample Data

The file contains predefined subcontrol records. Example:

```typescript
{
  id: 1,
  controlId: 1,
  status: "In progress",
  approver: "John Doe",
  riskReview: "Acceptable risk",
  owner: "Bob Johnson",
  reviewer: "Alice Williams",
  dueDate: new Date("2023-12-31"),
  implementationDetails: "Implement new feature",
  evidence: "evidence1.pdf",
  attachment: "attachment1.docx",
  feedback: "Great work so far."
}
```

Key Fields:

- Status Types: In progress, Waiting, Done
- Risk Review Categories: Acceptable risk, Residual risk, Unacceptable risk
- Supported File Types for Evidence/Attachments: pdf, doc, docx, png, jpg, xlsx, pptx
