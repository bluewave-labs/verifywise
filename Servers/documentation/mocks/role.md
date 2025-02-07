# Roles Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Data Structure](#data-structure)
- [Sample Data](#sample-data)

## Overview

This file defines the user roles and their associated permissions within the system.

## Dependencies

No external dependencies.

## Data Structure

```typescript
interface Role {
  id: number;
  name: string;
  description: string;
}
```

## Sample Data

The file contains four predefined roles:

```typescript
{
  id: 1,
  name: "Admin",
  description: "Administrator with full access to the system."
},
{
  id: 2,
  name: "Reviewer",
  description: "Reviewer with access to review compliance and reports."
},
{
  id: 3,
  name: "Editor",
  description: "Editor with permission to modify and update project details."
},
{
  id: 4,
  name: "Auditor",
  description: "Auditor with access to compliance and security audits."
}
```

System Roles:

- Admin: Full system access
- Reviewer: Compliance and report review
- Editor: Project modification rights
- Auditor: Audit access
