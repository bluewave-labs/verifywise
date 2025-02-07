# Vendors Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file defines vendor records with their assessment details, risk analysis, and review status information.

## Dependencies

```typescript
import { Vendor } from "../models/vendor.model";
```

## Data Structure

```typescript
interface Vendor {
  id: number;
  projectId: number;
  vendorName: string;
  assignee: string;
  vendorProvides: string;
  website: string;
  vendorContactPerson: string;
  reviewResult: string;
  reviewStatus: string;
  reviewer: string;
  riskStatus: string;
  reviewDate: Date;
  riskDescription: string;
  impactDescription: string;
  impact: number;
  probability: number;
  actionOwner: string;
  actionPlan: string;
  riskSeverity: number;
  riskLevel: string;
  likelihood: number;
}
```

## Sample Data

The file contains predefined vendor records with assessment details. Example:

```typescript
{
  id: 1,
  projectId: 1,
  vendorName: "Vendor A",
  assignee: "John Doe",
  vendorProvides: "Consulting Services",
  website: "www.vendora.com",
  vendorContactPerson: "Jane Smith",
  reviewResult: "Positive",
  reviewStatus: "Completed",
  reviewer: "Bob Johnson",
  riskStatus: "Not active",
  reviewDate: new Date("2023-05-15"),
  riskDescription: "Limited experience with new technology",
  impactDescription: "Potential delays in project timeline",
  impact: 3,
  probability: 0.4,
  actionOwner: "Alice Williams",
  actionPlan: "Provide additional training",
  riskSeverity: 2,
  riskLevel: "Low risk",
  likelihood: 0.5
}
```

Key Categories:

- Vendor Information
  - Basic details (name, website, services)
  - Contact information
  - Project association
- Risk Assessment
  - Risk status and severity
  - Impact analysis
  - Probability metrics
  - Action plans
- Review Process
  - Review status and results
  - Reviewer details
  - Assessment dates
  - Assignment tracking
