# Project Scope Type Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the ProjectScope type which represents the structure for project scope data.

## Data Type Definition

```typescript
type ProjectScope = {
  id: number;
  assessmentId: number;
  describeAiEnvironment: string;
  isNewAiTechnology: boolean;
  usesPersonalData: boolean;
  projectScopeDocuments: string;
  technologyType: string;
  hasOngoingMonitoring: boolean;
  unintendedOutcomes: string;
  technologyDocumentation: string;
};
```

## Properties

| Property                | Type    | Description                                  |
| ----------------------- | ------- | -------------------------------------------- |
| id                      | number  | Unique identifier for the project scope      |
| assessmentId            | number  | Reference to the associated assessment       |
| describeAiEnvironment   | string  | Description of the AI environment            |
| isNewAiTechnology       | boolean | Indicates if new AI technology is being used |
| usesPersonalData        | boolean | Indicates if personal data is being used     |
| projectScopeDocuments   | string  | Documentation related to project scope       |
| technologyType          | string  | Type of technology being used                |
| hasOngoingMonitoring    | boolean | Indicates if ongoing monitoring is in place  |
| unintendedOutcomes      | string  | Description of potential unintended outcomes |
| technologyDocumentation | string  | Documentation of the technology              |
