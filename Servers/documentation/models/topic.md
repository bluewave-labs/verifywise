# Topic Type Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the Topic type which represents the structure for topic data.

## Data Type Definition

```typescript
type Topic = {
  id: number;
  assessmentId: number;
  title: string;
};
```

## Properties

| Property     | Type   | Description                            |
| ------------ | ------ | -------------------------------------- |
| id           | number | Unique identifier for the topic        |
| assessmentId | number | Reference to the associated assessment |
| title        | string | Title of the topic                     |
