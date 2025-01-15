# Vendor Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for vendor-related operations, including CRUD functionality for vendors.

## Dependencies

```typescript
import { vendors } from "../vendor.mock.data";
```

## Service Methods

### Get All Vendors

```typescript
getAllMockVendors(): Array<any>
```

- **Description**: Retrieves all mock vendors
- **Returns**: Array of vendor objects

### Get Vendor by ID

```typescript
getMockVendorById(id: number): object | undefined
```

- **Description**: Retrieves a specific vendor by ID
- **Parameters**: `id` (number)
- **Returns**: Vendor object if found, undefined otherwise

### Create Vendor

```typescript
createMockVendor(newVendor: any): object
```

- **Description**: Creates a new vendor
- **Parameters**: `newVendor` (Vendor object)
- **Returns**: Created vendor object

### Update Vendor

```typescript
updateMockVendorById(id: number, updatedVendor: any): object | null
```

- **Description**: Updates an existing vendor
- **Parameters**:
  - `id` (number)
  - `updatedVendor` (Partial Vendor object)
- **Returns**: Updated vendor object if found, null otherwise

### Delete Vendor

```typescript
deleteMockVendorById(id: number): object | null
```

- **Description**: Deletes a vendor by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted vendor object if found, null otherwise

## Data Types

```typescript
interface Vendor {
  id: number;
  // Additional vendor properties
}
```

Note: The actual Vendor interface should be referenced from the mock data structure
