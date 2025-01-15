# Question Type Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the Question type which represents the structure for question data.

## Data Type Definition

```typescript
type Question = {
  id: number;
  subtopicId: number;
  questionText: string;
  answerType: string;
  evidenceFileRequired: boolean;
  hint: string;
  isRequired: boolean;
  priorityLevel: "high priority" | "medium priority" | "low priority";
  evidenceFiles?: string[];
  answer?: string;
};
```

## Properties

| Property             | Type                | Description                                                           |
| -------------------- | ------------------- | --------------------------------------------------------------------- |
| id                   | number              | Unique identifier for the question                                    |
| subtopicId           | number              | Reference to the associated subtopic                                  |
| questionText         | string              | Text content of the question                                          |
| answerType           | string              | Type of answer expected                                               |
| evidenceFileRequired | boolean             | Indicates if evidence file is required                                |
| hint                 | string              | Hint or guidance for answering                                        |
| isRequired           | boolean             | Indicates if question is mandatory                                    |
| priorityLevel        | enum                | Priority level: "high priority", "medium priority", or "low priority" |
| evidenceFiles        | string[] (optional) | Array of evidence file references                                     |
| answer               | string (optional)   | The provided answer to the question                                   |
