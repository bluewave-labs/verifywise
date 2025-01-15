# Subcontrol Type Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the Subcontrol type which represents the structure for subcontrol data.

## Data Type Definition

```typescript
type Subcontrol = {
  id: number;
  controlId: number;
  status: "Waiting" | "In progress" | "Done";
  approver: string;
  riskReview: "Acceptable risk" | "Residual risk" | "Unacceptable risk";
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
  evidence: string;
  attachment: string;
  feedback: string;
};
```

## Properties

| Property              | Type   | Description                                                                    |
| --------------------- | ------ | ------------------------------------------------------------------------------ |
| id                    | number | Unique identifier for the subcontrol                                           |
| controlId             | number | Reference to the associated control                                            |
| status                | enum   | Current status: "Waiting", "In progress", or "Done"                            |
| approver              | string | Name or identifier of the subcontrol approver                                  |
| riskReview            | enum   | Risk review status: "Acceptable risk", "Residual risk", or "Unacceptable risk" |
| owner                 | string | Name or identifier of the subcontrol owner                                     |
| reviewer              | string | Name or identifier of the subcontrol reviewer                                  |
| dueDate               | Date   | Due date for the subcontrol implementation                                     |
| implementationDetails | string | Details about subcontrol implementation                                        |
| evidence              | string | Evidence of subcontrol implementation                                          |
| attachment            | string | Reference to attached documentation                                            |
| feedback              | string | Feedback on the subcontrol                                                     |
