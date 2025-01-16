# Vendor Risk Database Queries Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Database Functions](#database-functions)
- [Data Types](#data-types)
- [Query Operations](#query-operations)

## Overview

This module provides database query functions for managing vendor risks in a PostgreSQL database.

## Dependencies

```typescript
import { VendorRisk } from "../models/vendorRisk.model";
import pool from "../database/db";
```

## Database Functions

### Get All Vendor Risks

```typescript
export const getAllVendorRisksQuery = async (): Promise<VendorRisk[]>
```

- **Description**: Retrieves all vendor risks from the database
- **Returns**: Promise resolving to an array of VendorRisk objects
- **SQL Query**: `SELECT * FROM vendorRisks`

### Get Vendor Risk by ID

```typescript
export const getVendorRiskByIdQuery = async (id: number): Promise<VendorRisk | null>
```

- **Description**: Retrieves a specific vendor risk by ID
- **Parameters**: `id` - Vendor Risk ID
- **Returns**: Promise resolving to a VendorRisk object or null if not found
- **SQL Query**: `SELECT * FROM vendorRisks WHERE id = $1`

### Create Vendor Risk

```typescript
export const createNewVendorRiskQuery = async (vendorRisk: {
  project_id: number;
  vendor_name: string;
  risk_name: string;
  owner: string;
  risk_level: string;
  review_date: Date;
}): Promise<VendorRisk>
```

- **Description**: Creates a new vendor risk
- **Parameters**: vendorRisk object with required fields
- **Returns**: Promise resolving to the created VendorRisk object
- **SQL Query**: INSERT with all fields and RETURNING clause

### Update Vendor Risk

```typescript
export const updateVendorRiskByIdQuery = async (
  id: number,
  vendorRisk: Partial<VendorRisk>
): Promise<VendorRisk | null>
```

- **Description**: Updates an existing vendor risk
- **Parameters**:
  - `id` - Vendor Risk ID
  - `vendorRisk` - Partial vendor risk object with fields to update
- **Returns**: Promise resolving to the updated VendorRisk object or null if not found
- **SQL Query**: Dynamic UPDATE query based on provided fields

### Delete Vendor Risk

```typescript
export const deleteVendorRiskByIdQuery = async (id: number): Promise<boolean>
```

- **Description**: Deletes a vendor risk by ID
- **Parameters**: `id` - Vendor Risk ID
- **Returns**: Promise resolving to boolean indicating deletion success
- **SQL Query**: `DELETE FROM vendorRisks WHERE id = $1 RETURNING id`

## Data Types

```typescript
interface VendorRisk {
  id?: number;
  project_id: number;
  vendor_name: string;
  risk_name: string;
  owner: string;
  risk_level: string;
  review_date: Date;
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
- Return typed promises using the VendorRisk interface
