# Vendor Risks Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file defines vendor risk records with their associated risk levels, owners, and review dates for project risk management.

## Dependencies

```typescript
import { VendorRisk } from "../models/vendorRisk.model";
```

## Data Structure

```typescript
interface VendorRisk {
  id: number;
  project_id: number;
  vendor_name: string;
  risk_name: string;
  owner: string;
  risk_level: string;
  review_date: Date;
}
```

## Sample Data

The file contains predefined vendor risk records organized by projects. Example:

```typescript
{
  id: 1,
  project_id: 1,
  vendor_name: "Tech Solutions Inc.",
  risk_name: "Data Security",
  owner: "Alice",
  risk_level: "High risk",
  review_date: new Date("2024-10-20")
}
```

Key Categories:

- Risk Classification
  - Very high risk
  - High risk
  - Medium risk
  - Low risk
  - No risk
- Risk Areas
  - Data Security
  - Service Reliability
  - Compliance
  - Network Vulnerability
  - Hardware Failure
  - Software Issues
- Project Management
  - Risk ownership
  - Review scheduling
  - Project association
