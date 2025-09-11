# Multi-Tenant Logging System

This document describes the updated logging system that stores logs in tenant-specific Docker volumes instead of the local `./Servers` folder.

## Overview

The logging system has been updated to support multi-tenancy by:

1. **Tenant-specific log directories**: Each tenant gets their own log folder
2. **Docker volume storage**: Logs are stored in persistent Docker volumes
3. **Daily log rotation**: Log files rotate daily with 14-day retention
4. **Environment-aware paths**: Different paths for development vs production

## Architecture

### Directory Structure

```
/app/logs/                    (Docker volume)
├── default/                  (fallback for unauthenticated requests)
│   ├── app-2025-09-10.log
│   └── app-2025-09-11.log
├── tenant_hash_1/            (tenant-specific folder)
│   ├── app-2025-09-10.log
│   └── app-2025-09-11.log
└── tenant_hash_2/
    ├── app-2025-09-10.log
    └── app-2025-09-11.log
```

### Tenant Identification

- Tenants are identified by their hashed organization ID (using `getTenantHash`)
- The tenant context is extracted from the authenticated JWT token
- If no tenant context is available, logs go to the `default` folder

## Docker Configuration

### Volumes Added

**docker-compose.yml:**

```yaml
services:
  backend:
    volumes:
      - app_logs:/app/logs

volumes:
  app_logs:
```

**docker-compose.override.yml (Development):**

```yaml
services:
  backend:
    volumes:
      - ./Servers/:/app
      - app_logs:/app/logs
```

**docker-compose.prod.yml (Production):**

```yaml
services:
  backend:
    volumes:
      - app_logs_prod:/app/logs

volumes:
  app_logs_prod:
```

## Usage

### Structured Logging (Existing)

The existing `logStructured` function now automatically routes logs to tenant-specific directories:

```typescript
import { logStructured } from "../utils/logger/fileLogger";

logStructured(
  "successful",
  "User login completed",
  "loginUser",
  "user.ctrl.ts"
);
```

### General Logging (New)

For non-structured logging, use the new tenant-aware logger:

```typescript
import { getTenantAwareLogger } from "../utils/logger/fileLogger";

const logger = getTenantAwareLogger();
logger.info("User performed action");
logger.error("An error occurred");
logger.debug("Debug information");
```

### Default Logger (Fallback)

The default export still works but will use the 'default' tenant folder when no context is available:

```typescript
import logger from "../utils/logger/fileLogger";

logger.info("This goes to the default tenant folder");
```

## Implementation Details

### Files Modified

1. **`utils/logger/fileLogger.ts`**: Updated to support tenant-specific directories
2. **`utils/tenant/tenantContext.ts`**: New utility for tenant context management
3. **`utils/context/context.ts`**: Extended to include tenant information
4. **`middleware/auth.middleware.ts`**: Updated to store tenant context
5. **Docker Compose files**: Added log volume mounts

### Key Functions

- `getTenantIdForLogging()`: Extracts tenant ID from request context
- `ensureTenantLogDirectory()`: Creates tenant directories as needed
- `createTenantRotatingFileTransport()`: Creates tenant-specific log transports
- `getTenantLogger()`: Returns a configured logger for a specific tenant

## Environment Differences

### Development

- Logs stored in `./Servers/logs/{tenantId}/`
- Console + file logging enabled
- Source code mounted as volume

### Production

- Logs stored in `/app/logs/{tenantId}/` (Docker volume)
- File logging only
- Optimized for performance

## Log Rotation

- **Pattern**: `app-YYYY-MM-DD.log` (using UTC dates)
- **Max Size**: 10MB per file
- **Retention**: 14 days
- **Compression**: Automatic for older files
- **Timezone**: UTC (consistent across all server deployments)

## Benefits

1. **Multi-tenant isolation**: Each organization's logs are separated
2. **Persistent storage**: Logs survive container restarts
3. **Scalable**: Easy to backup/restore tenant-specific logs
4. **Compliance**: Better data isolation for regulatory requirements
5. **Debugging**: Easier to debug tenant-specific issues

## Migration Notes

- Existing log calls continue to work without changes
- Old logs in `./Servers/logs/` are not automatically migrated
- The system gracefully falls back to 'default' tenant for unauthenticated requests
