# Role Interface Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the Role interface which represents the structure for role data.

## Data Type Definition

```typescript
interface Role {
  id: number;
  name: string;
  description: string;
}
```

## Properties

| Property    | Type   | Description                    |
| ----------- | ------ | ------------------------------ |
| id          | number | Unique identifier for the role |
| name        | string | Name of the role               |
| description | string | Description of the role        |
