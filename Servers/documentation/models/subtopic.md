# Subtopic Type Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the Subtopic type which represents the structure for subtopic data.

## Data Type Definition

```typescript
type Subtopic = {
  id: number;
  topicId: number;
  name: string;
};
```

## Properties

| Property | Type   | Description                        |
| -------- | ------ | ---------------------------------- |
| id       | number | Unique identifier for the subtopic |
| topicId  | number | Reference to the associated topic  |
| name     | string | Name of the subtopic               |
