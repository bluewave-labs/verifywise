# UTC Date Fix Summary

## Problem

The logging system was experiencing date inconsistencies where log files were being created with dates that didn't match when trying to read them. Specifically:

- Log files were being created as `app-2025-09-11.log`
- But the current date was `2025-09-10`
- This was caused by timezone differences between winston-daily-rotate-file and the date calculation in logger.util.ts

## Root Cause

- `winston-daily-rotate-file` was using local server timezone for file naming
- `logger.util.ts` was using UTC via `new Date().toISOString().split("T")[0]`
- This created a mismatch when the server was in a timezone ahead of UTC

## Solution

Standardized on **UTC timezone** for all date calculations:

### 1. Fixed winston-daily-rotate-file Configuration

```typescript
return new DailyRotateFile({
  filename: path.join(tenantLogDir, "app-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxSize: "10m",
  maxFiles: "14d",
  level: "info",
  utc: true, // Force UTC timezone to prevent date inconsistencies
});
```

### 2. Created UTC Date Utility Function

```typescript
/**
 * Get current date in YYYY-MM-DD format using UTC timezone
 * This ensures consistency with winston-daily-rotate-file when utc: true
 */
export function getCurrentDateStringUTC(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}
```

### 3. Updated logger.util.ts to Use UTC

- Replaced `new Date().toISOString().split("T")[0]` with `getCurrentDateStringUTC()`
- Applied to both `getLogsQuery` and `getLogsByDateQuery` functions

## Benefits of UTC Standardization

1. **Consistent File Naming**: Log files will always use UTC dates regardless of server timezone
2. **Reliable Log Reading**: The utility functions will always look for the correct file
3. **Cross-Timezone Compatibility**: Works consistently across different server deployments
4. **Predictable Behavior**: No more confusion about which date format is being used

## Files Modified

1. `utils/logger/fileLogger.ts` - Added `utc: true` to DailyRotateFile config
2. `utils/tenant/tenantContext.ts` - Added `getCurrentDateStringUTC()` function
3. `utils/logger.util.ts` - Updated to use UTC date function
4. `tests/test-utc-date.ts` - Created test to verify UTC consistency
5. `documentation/logging/MULTI_TENANT_LOGGING.md` - Updated documentation

## Testing

Run the UTC date consistency test:

```typescript
import { testUTCDateConsistency } from "./tests/test-utc-date";
testUTCDateConsistency();
```

This will verify that:

- Log files are created with UTC dates
- The reading utilities can find those files
- Dates are consistent between creation and reading

## Result

✅ The logging system now uses UTC consistently, ensuring that log files are created and read using the same date format regardless of server timezone.
