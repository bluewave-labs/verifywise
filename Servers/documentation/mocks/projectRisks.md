# Project Risks Mock Data Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file contains mock project risk data that defines various risk scenarios and their assessment details for AI projects.

## Dependencies

```typescript
import { ProjectRisk } from "../models/projectRisk.model";
```

## Data Structure

```typescript
interface ProjectRisk {
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
  risk_level_autocalculated: string;
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
}
```

## Sample Data

The file contains predefined project risk records. Example:

```typescript
{
  id: 1,
  project_id: 1,
  risk_name: "Data Privacy Compliance",
  risk_owner: "Alice",
  ai_lifecycle_phase: "Deployment",
  risk_description: "Risk of non-compliance with data privacy regulations.",
  risk_category: "Regulatory",
  impact: "High",
  assessment_mapping: "GDPR Compliance Check",
  controls_mapping: "Data Access Controls",
  likelihood: "Moderate",
  severity: "High",
  risk_level_autocalculated: "Medium risk",
  review_notes: "Need for regular audits.",
  mitigation_status: "In Progress",
  current_risk_level: "Medium",
  deadline: new Date("2024-12-31"),
  mitigation_plan: "Implement data anonymization.",
  implementation_strategy: "Anonymize user data in production environments.",
  mitigation_evidence_document: "Data_Anonymization_Plan.pdf",
  likelihood_mitigation: "Reduced",
  risk_severity: "Moderate",
  final_risk_level: "Low",
  risk_approval: "Pending",
  approval_status: "Under Review",
  date_of_assessment: new Date("2024-11-01")
}
```

Key Fields:

- Risk Categories: Regulatory, Ethical
- Impact Levels: High, Medium, Low
- AI Lifecycle Phases: Deployment, Development
- Mitigation Status: In Progress, Mitigated
- Approval Status: Under Review, Completed
- Risk Levels: High risk, Medium risk, Low
