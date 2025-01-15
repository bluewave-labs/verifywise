# Control Category Type Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the ControlCategory type which represents the structure for control category data.

## Data Type Definition

```typescript
type ControlCategory = {
  id?: number;
  projectId: number;
  name: string;
};
```

## Properties

| Property  | Type              | Description                                |
| --------- | ----------------- | ------------------------------------------ |
| id        | number (optional) | Unique identifier for the control category |
| projectId | number            | Reference to the associated project        |
| name      | string            | Name of the control category               |
