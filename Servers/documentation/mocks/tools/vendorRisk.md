# Vendor Risk Mock Service Documentation

## Table of Contents

- [Overview](#overview)
- [Dependencies](#dependencies)
- [Service Methods](#service-methods)
- [Data Types](#data-types)

## Overview

This service provides mock implementations for vendor risk-related operations, including CRUD functionality for vendor risks.

## Dependencies

```typescript
import mockVendorRisks from "../vendorRisk.mock.data";
```

## Service Methods

### Get All Vendor Risks

```typescript
getAllMockVendorRisks(): Array<any>
```

- **Description**: Retrieves all mock vendor risks
- **Returns**: Array of vendor risk objects

### Get Vendor Risk by ID

```typescript
getMockVendorRiskById(id: number): object | undefined
```

- **Description**: Retrieves a specific vendor risk by ID
- **Parameters**: `id` (number)
- **Returns**: Vendor risk object if found, undefined otherwise

### Create Vendor Risk

```typescript
createMockVendorRisk(newVendorRisk: any): object
```

- **Description**: Creates a new vendor risk
- **Parameters**: `newVendorRisk` (Vendor Risk object)
- **Returns**: Created vendor risk object

### Update Vendor Risk

```typescript
updateMockVendorRiskById(id: number, updatedVendorRisk: any): object | null
```

- **Description**: Updates an existing vendor risk
- **Parameters**:
  - `id` (number)
  - `updatedVendorRisk` (Partial Vendor Risk object)
- **Returns**: Updated vendor risk object if found, null otherwise

### Delete Vendor Risk

```typescript
deleteMockVendorRiskById(id: number): object | null
```

- **Description**: Deletes a vendor risk by ID
- **Parameters**: `id` (number)
- **Returns**: Deleted vendor risk object if found, null otherwise

## Data Types

```typescript
interface VendorRisk {
  id: number;
  // Additional vendor risk properties
}
```

Note: The actual VendorRisk interface should be referenced from the mock data structure
