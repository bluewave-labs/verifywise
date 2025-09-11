# Logger Utility Update Summary

## Problem

The `logger.util.ts` file was using the old logging path structure (`path.join(__dirname, "..", "..", "logs", tenant, logFileName)`) which pointed to the local `./Servers/logs/` directory instead of the new tenant-aware Docker volume logging system.

## Solution

Updated the `logger.util.ts` to use the new tenant-aware logging infrastructure:

### Changes Made

1. **Updated Import**: Added import for the new tenant context utility

   ```typescript
   import { getTenantLogDirectory } from "./tenant/tenantContext";
   ```

2. **Fixed Log Path Resolution**: Changed from hardcoded relative path to dynamic tenant-aware path

   ```typescript
   // OLD:
   const logFilePath = path.join(
     __dirname,
     "..",
     "..",
     "logs",
     tenant,
     logFileName
   );

   // NEW:
   const tenantLogDir = getTenantLogDirectory(tenant);
   const logFilePath = path.join(tenantLogDir, logFileName);
   ```

3. **Enhanced Error Messages**: Added tenant information to error messages for better debugging

4. **Added New Functions**:
   - `getLogsByDateQuery()` - Get logs for a specific date
   - `getAvailableLogFilesQuery()` - List all available log files for a tenant

### New Infrastructure Created

1. **Tenant Context Utilities** (`utils/tenant/tenantContext.ts`):
   - `getTenantLogDirectory()` - Get tenant-specific log directory path
   - `ensureTenantLogDirectory()` - Create tenant directory if needed
   - `getLogBaseDirectory()` - Get base log directory (dev vs prod)

2. **Fixed File Structure**:
   - Moved `tenantContext.ts` from `utils/logger/` to `utils/tenant/`
   - Updated imports in `fileLogger.ts`
   - Removed duplicate/old files

3. **Enhanced Testing**:
   - Created `test-log-util.ts` for testing the utility functions
   - Tests cover tenant-specific logs, default tenant, and date-specific queries

### Path Resolution Logic

The system now correctly resolves paths based on environment:

- **Development**: `./Servers/logs/{tenantId}/app-YYYY-MM-DD.log`
- **Production**: `/app/logs/{tenantId}/app-YYYY-MM-DD.log` (Docker volume)

### Benefits

1. **Consistent Path Logic**: All logging components use the same path resolution
2. **Environment Aware**: Automatically handles dev vs production paths
3. **Better Error Handling**: More descriptive error messages with tenant info
4. **Enhanced Functionality**: Additional utility functions for log management
5. **Tenant Isolation**: Proper separation of logs per tenant
6. **Docker Ready**: Works correctly with Docker volume mounts

### Usage Examples

```typescript
// Get today's logs for a specific tenant
const logs = await getLogsQuery("tenant_abc123");

// Get logs for a specific date
const dateLogs = await getLogsByDateQuery("tenant_abc123", "2025-09-10", 100);

// List all available log files for a tenant
const files = await getAvailableLogFilesQuery("tenant_abc123");
```

The system now correctly sends log files from the tenant-specific Docker volume directories instead of the old local path structure.
