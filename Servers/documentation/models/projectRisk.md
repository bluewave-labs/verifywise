# Project Risk Type Documentation

## Table of Contents

- [Overview](#overview)
- [Data Type Definition](#data-type-definition)
- [Properties](#properties)

## Overview

This file defines the ProjectRisk type which represents the structure for project risk data.

## Data Type Definition

```typescript
type ProjectRisk = {
  id: number;
  project_id: number;
  risk_name: string;
  risk_owner: string;
  ai_lifecycle_phase: string;
  risk_description: string;
  risk_category: string;
  impact: string;
  assessment_mapping: string;
  controls_mapping: string;
  likelihood: string;
  severity: string;
  risk_level_autocalculated:
    | "No risk"
    | "Low risk"
    | "Medium risk"
    | "High risk"
    | "Very high risk";
  review_notes: string;
  mitigation_status: string;
  current_risk_level: string;
  deadline: Date;
  mitigation_plan: string;
  implementation_strategy: string;
  mitigation_evidence_document: string;
  likelihood_mitigation: string;
  risk_severity: string;
  final_risk_level: string;
  risk_approval: string;
  approval_status: string;
  date_of_assessment: Date;
};
```

## Properties

| Property                     | Type   | Description                                     |
| ---------------------------- | ------ | ----------------------------------------------- |
| id                           | number | Unique identifier for the project risk          |
| project_id                   | number | Foreign key reference to the associated project |
| risk_name                    | string | Name of the risk                                |
| risk_owner                   | string | Owner responsible for the risk                  |
| ai_lifecycle_phase           | string | Phase of AI lifecycle where risk occurs         |
| risk_description             | string | Detailed description of the risk                |
| risk_category                | string | Category classification of the risk             |
| impact                       | string | Impact description of the risk                  |
| assessment_mapping           | string | Mapping to related assessments                  |
| controls_mapping             | string | Mapping to related controls                     |
| likelihood                   | string | Likelihood of risk occurrence                   |
| severity                     | string | Severity of the risk                            |
| risk_level_autocalculated    | enum   | Automatically calculated risk level             |
| review_notes                 | string | Notes from risk review                          |
| mitigation_status            | string | Current status of risk mitigation               |
| current_risk_level           | string | Current level of risk                           |
| deadline                     | Date   | Deadline for risk mitigation                    |
| mitigation_plan              | string | Plan for mitigating the risk                    |
| implementation_strategy      | string | Strategy for implementing mitigation            |
| mitigation_evidence_document | string | Documentation of mitigation evidence            |
| likelihood_mitigation        | string | Likelihood after mitigation                     |
| risk_severity                | string | Severity assessment of the risk                 |
| final_risk_level             | string | Final determined risk level                     |
| risk_approval                | string | Risk approval status                            |
| approval_status              | string | Overall approval status                         |
| date_of_assessment           | Date   | Date when risk was assessed                     |
