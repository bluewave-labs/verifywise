# Assessment Type Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the Assessment type which represents the structure for assessment data.

## Data Type Definition

```typescript
type Assessment = {
  id: number;
  projectId: number;
};
```

## Properties

| Property  | Type   | Description                          |
| --------- | ------ | ------------------------------------ |
| id        | number | Unique identifier for the assessment |
| projectId | number | Reference to the associated project  |
