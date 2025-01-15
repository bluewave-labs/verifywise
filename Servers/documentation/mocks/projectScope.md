# Project Scopes Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file defines project scope data that outlines the AI environment, technology specifications, and potential implications for each project assessment.

## Dependencies

```typescript
import { ProjectScope } from "../models/projectScope.model";
```

## Data Structure

```typescript
interface ProjectScope {
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
}
```

## Sample Data

The file contains predefined project scope records:

```typescript
{
  id: 1,
  assessmentId: 1,
  describeAiEnvironment: "This project involves the development of a new AI-powered virtual assistant.",
  isNewAiTechnology: true,
  usesPersonalData: true,
  projectScopeDocuments: "project-scope-v1.pdf",
  technologyType: "Natural Language Processing",
  hasOngoingMonitoring: true,
  unintendedOutcomes: "Potential bias in the assistant's responses.",
  technologyDocumentation: "technology-documentation.docx"
}
```

Technology Types:

- Natural Language Processing
- Computer Vision

Key Considerations:

- AI Environment Description
- Personal Data Usage
- Technology Documentation
- Monitoring Requirements
- Unintended Outcomes Assessment
