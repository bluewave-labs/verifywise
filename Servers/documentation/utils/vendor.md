# Vendor Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing vendors in a PostgreSQL database.

## Dependencies

```typescript
import { Vendor } from "../models/vendor.model";
import pool from "../database/db";
```

## Database Functions

### Get All Vendors

```typescript
export const getAllVendorsQuery = async (): Promise<Vendor[]>
```

- **Description**: Retrieves all vendors from the database
- **Returns**: Promise resolving to an array of Vendor objects
- **SQL Query**: `SELECT * FROM vendors`

### Get Vendor by ID

```typescript
export const getVendorByIdQuery = async (id: number): Promise<Vendor | null>
```

- **Description**: Retrieves a specific vendor by ID
- **Parameters**: `id` - Vendor ID
- **Returns**: Promise resolving to a Vendor object or null if not found
- **SQL Query**: `SELECT * FROM vendors WHERE id = $1`

### Create Vendor

```typescript
export const createNewVendorQuery = async (vendor: {
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
}): Promise<Vendor>
```

- **Description**: Creates a new vendor
- **Parameters**: vendor object with required fields
- **Returns**: Promise resolving to the created Vendor object
- **SQL Query**: INSERT with all fields and RETURNING clause

### Update Vendor

```typescript
export const updateVendorByIdQuery = async (
  id: number,
  vendor: Partial<Vendor>
): Promise<Vendor | null>
```

- **Description**: Updates an existing vendor
- **Parameters**:
  - `id` - Vendor ID
  - `vendor` - Partial vendor object with fields to update
- **Returns**: Promise resolving to the updated Vendor object or null if not found
- **SQL Query**: Dynamic UPDATE query based on provided fields

### Delete Vendor

```typescript
export const deleteVendorByIdQuery = async (id: number): Promise<boolean>
```

- **Description**: Deletes a vendor by ID
- **Parameters**: `id` - Vendor ID
- **Returns**: Promise resolving to boolean indicating deletion success
- **SQL Query**: `DELETE FROM vendors WHERE id = $1 RETURNING id`

## Data Types

```typescript
interface Vendor {
  id?: number;
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

## Query Operations

All database operations:

- Use parameterized queries for security
- Return the affected rows using `RETURNING *`
- Include console logging for debugging
- Handle potential null cases for single-record operations
- Support partial updates with dynamic query building
- Include error handling for invalid update requests
- Return typed promises using the Vendor interface
