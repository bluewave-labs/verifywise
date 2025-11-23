# Change History Implementation Guide

This guide explains how to add activity history tracking to any entity in the VerifyWise system.

## Overview

The change history system is a generic, reusable framework that tracks all changes to entities (Model Inventory, Vendors, Use Cases, etc.). It consists of:

- **Backend**: Generic utilities for recording and retrieving change history
- **Frontend**: Reusable `HistorySidebar` component and hooks
- **Configuration**: Entity-specific settings for tracking and display

## Architecture

```
Backend:
├── /Servers/config/changeHistory.config.ts          # Entity configurations
├── /Servers/utils/changeHistory.base.utils.ts       # Generic utilities
├── /Servers/utils/{entity}ChangeHistory.utils.ts    # Entity-specific wrappers
└── /Servers/routes/{entity}ChangeHistory.route.ts   # API routes

Frontend:
├── /Clients/src/config/changeHistory.config.ts            # UI configurations
├── /Clients/src/application/hooks/useEntityChangeHistory.ts    # Generic hook
├── /Clients/src/application/repository/changeHistory.repository.ts
└── /Clients/src/presentation/components/Common/HistorySidebar/  # Reusable UI
```

---

## Adding History to a New Entity

Follow these steps to add change history tracking to a new entity (e.g., "vendor"):

### 1. Backend: Create Database Migration

Create a migration file: `/Servers/migrations/YYYYMMDDHHMMSS-create-{entity}-change-history.ts`

```typescript
import { QueryInterface, DataTypes } from "sequelize";

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "{{TENANT_SCHEMA}}".vendor_change_history (
        id SERIAL PRIMARY KEY,
        vendor_id INTEGER NOT NULL REFERENCES "{{TENANT_SCHEMA}}".vendors(id) ON DELETE CASCADE,
        action VARCHAR(10) NOT NULL CHECK (action IN ('created', 'updated', 'deleted')),
        field_name VARCHAR(255),
        old_value TEXT,
        new_value TEXT,
        changed_by_user_id INTEGER NOT NULL REFERENCES public.users(id),
        changed_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_vendor_change_history_vendor_id
        ON "{{TENANT_SCHEMA}}".vendor_change_history(vendor_id);

      CREATE INDEX idx_vendor_change_history_changed_at
        ON "{{TENANT_SCHEMA}}".vendor_change_history(changed_at DESC);
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.sequelize.query(
      'DROP TABLE IF EXISTS "{{TENANT_SCHEMA}}".vendor_change_history CASCADE;'
    );
  },
};
```

**Key Points:**
- Replace `vendor` with your entity name
- Foreign key should reference your entity table
- Always include indexes on foreign key and `changed_at` for performance

### 2. Backend: Add Entity Configuration

Edit `/Servers/config/changeHistory.config.ts`:

```typescript
export type EntityType =
  | "model_inventory"
  | "vendor"          // Add your entity here
  | "use_case"
  // ... other entities

export const ENTITY_CONFIGS: { [key in EntityType]: EntityConfig } = {
  // ... existing configs

  vendor: {
    tableName: "vendor_change_history",
    foreignKeyField: "vendor_id",
    fieldsToTrack: [
      "name",
      "website",
      "poc_name",
      "poc_email",
      "reviewer",
      "review_date",
      // Add all fields you want to track
    ],
    fieldLabels: {
      name: "Name",
      website: "Website",
      poc_name: "POC name",
      poc_email: "POC email",
      reviewer: "Reviewer",
      review_date: "Review date",
      // Map field names to display labels (sentence case)
    },
    fieldFormatters: {
      // Optional: Add custom formatters for specific fields
      review_date: GENERIC_FORMATTERS.date,
      reviewer: GENERIC_FORMATTERS.user,
      // Use GENERIC_FORMATTERS.boolean, .array, .user, .date, or .text
    },
  },
};
```

**Field Formatters:**
- `GENERIC_FORMATTERS.boolean`: For true/false fields (displays "Yes"/"No")
- `GENERIC_FORMATTERS.date`: For date fields (formats consistently)
- `GENERIC_FORMATTERS.user`: For user ID fields (looks up and displays user name)
- `GENERIC_FORMATTERS.array`: For array fields (sorts and joins)
- `GENERIC_FORMATTERS.text`: Default text formatter

### 3. Backend: Create Entity-Specific Utils (Optional)

Create `/Servers/utils/vendorChangeHistory.utils.ts`:

```typescript
import { VendorModel } from "../domain.layer/models/vendor/vendor.model";
import { Transaction } from "sequelize";
import {
  recordEntityChange,
  recordMultipleFieldChanges as recordMultipleFieldChangesGeneric,
  getEntityChangeHistory,
  trackEntityChanges,
  recordEntityCreation,
  recordEntityDeletion,
} from "./changeHistory.base.utils";

export const recordVendorChange = async (
  vendorId: number,
  action: "created" | "updated" | "deleted",
  changedByUserId: number,
  tenant: string,
  fieldName?: string,
  oldValue?: string,
  newValue?: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityChange(
    "vendor",
    vendorId,
    action,
    changedByUserId,
    tenant,
    fieldName,
    oldValue,
    newValue,
    transaction
  );
};

export const getVendorChangeHistory = async (
  vendorId: number,
  tenant: string
): Promise<any[]> => {
  return getEntityChangeHistory("vendor", vendorId, tenant);
};

export const trackVendorChanges = async (
  oldVendor: VendorModel,
  newVendor: Partial<VendorModel>
): Promise<Array<{ fieldName: string; oldValue: string; newValue: string }>> => {
  return trackEntityChanges("vendor", oldVendor, newVendor);
};

export const recordVendorCreation = async (
  vendorId: number,
  changedByUserId: number,
  tenant: string,
  vendorData: Partial<VendorModel>,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityCreation(
    "vendor",
    vendorId,
    changedByUserId,
    tenant,
    vendorData,
    transaction
  );
};

export const recordVendorDeletion = async (
  vendorId: number,
  changedByUserId: number,
  tenant: string,
  transaction?: Transaction
): Promise<void> => {
  return recordEntityDeletion(
    "vendor",
    vendorId,
    changedByUserId,
    tenant,
    transaction
  );
};
```

**Note:** This step is optional but recommended for better code organization and type safety.

### 4. Backend: Create API Route

Create `/Servers/routes/vendorChangeHistory.route.ts`:

```typescript
import { Router } from "express";
import { getVendorChangeHistory } from "../utils/vendorChangeHistory.utils";

const router = Router();

router.get("/:vendorId", async (req, res) => {
  try {
    const vendorId = parseInt(req.params.vendorId);
    const tenant = req.tenant; // From auth middleware

    const history = await getVendorChangeHistory(vendorId, tenant);

    res.json({
      message: "OK",
      data: history,
    });
  } catch (error) {
    console.error("Error fetching vendor change history:", error);
    res.status(500).json({
      message: "Error fetching change history",
      error: error.message,
    });
  }
});

export default router;
```

### 5. Backend: Register Route

Edit `/Servers/routes/index.ts` (or your main router file):

```typescript
import vendorChangeHistoryRoutes from "./vendorChangeHistory.route";

// ... other imports

app.use("/api/vendor-change-history", vendorChangeHistoryRoutes);
```

### 6. Backend: Integrate with CRUD Operations

In your vendor controller (e.g., `/Servers/controllers/vendor.ctrl.ts`):

**On Create:**
```typescript
import { recordVendorCreation } from "../utils/vendorChangeHistory.utils";

export const createVendor = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const vendor = await VendorModel.create(req.body, { transaction });

    // Record creation in history
    await recordVendorCreation(
      vendor.id,
      req.userId, // From auth middleware
      req.tenant,
      req.body,
      transaction
    );

    await transaction.commit();
    res.json({ message: "OK", data: vendor });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: "Error creating vendor" });
  }
};
```

**On Update:**
```typescript
import { trackVendorChanges, recordMultipleFieldChanges } from "../utils/vendorChangeHistory.utils";

export const updateVendor = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const vendor = await VendorModel.findByPk(req.params.id);

    // Track what changed
    const changes = await trackVendorChanges(vendor, req.body);

    // Update vendor
    await vendor.update(req.body, { transaction });

    // Record changes in history
    if (changes.length > 0) {
      await recordMultipleFieldChanges(
        vendor.id,
        req.userId,
        req.tenant,
        changes,
        transaction
      );
    }

    await transaction.commit();
    res.json({ message: "OK", data: vendor });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: "Error updating vendor" });
  }
};
```

**On Delete:**
```typescript
import { recordVendorDeletion } from "../utils/vendorChangeHistory.utils";

export const deleteVendor = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const vendor = await VendorModel.findByPk(req.params.id);

    // Record deletion in history
    await recordVendorDeletion(
      vendor.id,
      req.userId,
      req.tenant,
      transaction
    );

    await vendor.destroy({ transaction });

    await transaction.commit();
    res.json({ message: "OK" });
  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ message: "Error deleting vendor" });
  }
};
```

---

### 7. Frontend: Add Entity Configuration

Edit `/Clients/src/config/changeHistory.config.ts`:

```typescript
export type EntityType =
  | "model_inventory"
  | "vendor"          // Add your entity here
  // ... other entities

export const ENTITY_HISTORY_CONFIGS: {
  [key in EntityType]: EntityHistoryConfig;
} = {
  // ... existing configs

  vendor: {
    entityName: "Vendor",
    emptyStateTitle: "Activity history",
    emptyStateMessage:
      "Automatically tracks every change to this vendor. See what your team is working on and what updates they've made, in real time.",
  },
};
```

### 8. Frontend: Add HistorySidebar to Modal

In your vendor modal component (e.g., `/Clients/src/presentation/components/Modals/NewVendor/index.tsx`):

```typescript
import HistorySidebar from "../../Common/HistorySidebar";
import { useEntityChangeHistory } from "../../../../application/hooks/useEntityChangeHistory";
import { useQueryClient } from "@tanstack/react-query";
import { History as HistoryIcon } from "lucide-react";

// Inside your component:
const queryClient = useQueryClient();
const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState(false);

// Prefetch history data when modal opens (optional but recommended)
useEntityChangeHistory(
  isOpen && isEdit ? "vendor" : undefined,
  isOpen && isEdit ? selectedVendorId : undefined
);

// IMPORTANT: Invalidate cache when modal closes to ensure fresh data on reopen
const handleClose = () => {
  setIsOpen(false);
  // Invalidate change history cache when modal closes
  queryClient.invalidateQueries({
    queryKey: ["changeHistory", "vendor", selectedVendorId]
  });
};

// Add history button to modal header
<IconButton
  onClick={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
  sx={{
    color: isHistorySidebarOpen
      ? theme.palette.primary.main
      : theme.palette.text.secondary,
  }}
>
  <HistoryIcon size={20} />
</IconButton>

// Add HistorySidebar to modal content
<Stack direction="row" spacing={2}>
  <Box flex={1}>
    {/* Your modal content */}
  </Box>

  {isEdit && (
    <HistorySidebar
      isOpen={isHistorySidebarOpen}
      entityType="vendor"
      entityId={selectedVendorId}
    />
  )}
</Stack>
```

**Why cache invalidation is important:**
- React Query caches history data for 30 seconds
- Without invalidation, reopening the modal shows stale cached data
- Invalidating on close ensures fresh data is fetched when the modal reopens
- This shows updates made in the previous session

---

## Testing

After implementation, test the following:

1. **Create Entity**: Verify history records are created with initial field values
2. **Update Entity**: Verify only changed fields are tracked
3. **Delete Entity**: Verify deletion is recorded
4. **Frontend Display**:
   - History sidebar opens/closes correctly
   - History entries display properly grouped
   - User avatars load correctly
   - Timestamps display in relative format
   - Field changes show old → new values
   - Empty state displays when no history exists
   - Fade overlay appears when content overflows

---

## Multi-Tenancy

The change history system is multi-tenant aware:

- Each tenant has their own `{entity}_change_history` table in their schema
- User data is stored in the global `public.users` table
- API routes use `req.tenant` to query the correct tenant schema

---

## Performance Considerations

1. **Indexes**: Always create indexes on `{entity}_id` and `changed_at` columns
2. **Batch Operations**: Use transactions when recording multiple changes
3. **Caching**: The frontend hook caches data for 30 seconds
4. **Prefetching**: Prefetch history when modal opens to avoid loading spinners

---

## Examples

See the Model Inventory implementation as a reference:
- Backend: `/Servers/utils/modelInventoryChangeHistory.utils.ts`
- Frontend: `/Clients/src/presentation/components/Modals/NewModelInventory/index.tsx`
- Route: `/Servers/routes/modelInventoryChangeHistory.route.ts`

---

## Troubleshooting

**Issue**: History not showing up
- Check API route is registered correctly
- Verify tenant schema exists
- Check browser network tab for API errors

**Issue**: Field names not formatted
- Check `fieldLabels` in entity configuration
- Field labels should use sentence case (e.g., "Security assessment")

**Issue**: User names showing as "User #123"
- Verify user exists in `public.users` table
- Check `GENERIC_FORMATTERS.user` is used for user ID fields

**Issue**: Fade overlay always visible
- Check if content actually overflows the container
- Verify `scrollContainerRef` is attached to scroll container
- Check `showFade` state is being updated correctly

**Issue**: Updated fields don't show in history after closing/reopening modal
- You forgot to invalidate the cache in `handleClose`
- Add `queryClient.invalidateQueries({ queryKey: ["changeHistory", entityType, entityId] })`
- See Step 8 for the complete pattern

---

## Future Enhancements

Potential improvements to the system:

1. **Bulk Change Summary**: Group multiple related changes into a single event
2. **Revert Changes**: Add ability to revert to previous values
3. **Search/Filter**: Add search within history entries
4. **Export History**: Export history as CSV or PDF
5. **Real-time Updates**: Use WebSockets to show live changes from other users
6. **Field-Level Permissions**: Hide certain field changes based on user role
