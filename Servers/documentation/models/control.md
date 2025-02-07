# Control Type Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the Control type which represents the structure for control data.

## Data Type Definition

```typescript
type Control = {
  id: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
  controlGroup: number;
};
```

## Properties

| Property              | Type   | Description                                 |
| --------------------- | ------ | ------------------------------------------- |
| id                    | number | Unique identifier for the control           |
| status                | string | Current status of the control               |
| approver              | string | Name or identifier of the control approver  |
| riskReview            | string | Risk review details                         |
| owner                 | string | Name or identifier of the control owner     |
| reviewer              | string | Name or identifier of the control reviewer  |
| dueDate               | Date   | Due date for the control implementation     |
| implementationDetails | string | Details about control implementation        |
| controlGroup          | number | Identifier for the associated control group |
