# Controller Guidelines

Guidelines for implementing Express.js controllers in VerifyWise.

## Controller Structure

### VerifyWise Controller Pattern

VerifyWise controllers use standalone exported async functions (not controller objects), `STATUS_CODE` response helpers, and structured logging.

```typescript
// controllers/entity.ctrl.ts
import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";
import { getEntityByIdQuery, createEntityQuery } from "../utils/entity.utils";

/**
 * Get entity by ID
 * GET /api/entities/:id
 */
export async function getEntity(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getEntity",
    functionName: "getEntity",
    fileName: "entity.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    if (!id) {
      return res.status(400).json(STATUS_CODE[400]({ message: "ID required" }));
    }

    const entity = await getEntityByIdQuery(id, tenantId);

    if (!entity) {
      return res.status(404).json(STATUS_CODE[404]({ message: "Not found" }));
    }

    await logSuccess({
      eventType: "Read",
      description: "Retrieved entity",
      functionName: "getEntity",
      fileName: "entity.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(200).json(STATUS_CODE[200](entity));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve entity",
      functionName: "getEntity",
      fileName: "entity.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Create entity
 * POST /api/entities
 */
export async function createEntity(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting createEntity",
    functionName: "createEntity",
    fileName: "entity.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const tenantId = req.tenantId!;
    const userId = req.userId!;
    const data = req.body;

    const entity = await createEntityQuery(data, tenantId);

    await logSuccess({
      eventType: "Create",
      description: "Created entity",
      functionName: "createEntity",
      fileName: "entity.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(201).json(STATUS_CODE[201](entity));
  } catch (error) {
    await logFailure({
      eventType: "Create",
      description: "Failed to create entity",
      functionName: "createEntity",
      fileName: "entity.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
```

### Key Differences from Generic Express Patterns

| Generic Express | VerifyWise Pattern |
|----------------|-------------------|
| `next(error)` | `return res.status(xxx).json(STATUS_CODE[xxx](...))` |
| `{ success: true, data }` | `STATUS_CODE[200](entity)` |
| `req.user?.id` | `req.userId!` |
| `req.user?.orgId` | `req.organizationId!` |
| N/A | `req.tenantId!` (tenant hash for schema isolation) |
| Controller objects | Standalone exported functions |
| `NextFunction` param | Not used (errors handled in-place) |

## Request Properties

After `authenticateJWT` middleware, these properties are available:

```typescript
req.userId         // number - User ID
req.tenantId       // string - Tenant hash (e.g., "a1b2c3d4e5")
req.organizationId // number - Organization ID
req.role           // string - "Admin" | "Reviewer" | "Editor" | "Auditor"
```

## Response Patterns

### Using STATUS_CODE Helper

```typescript
import { STATUS_CODE } from "../utils/statusCode.utils";

// Success responses
return res.status(200).json(STATUS_CODE[200](data));
return res.status(201).json(STATUS_CODE[201](newEntity));

// Error responses
return res.status(400).json(STATUS_CODE[400]({ message: "Invalid input" }));
return res.status(404).json(STATUS_CODE[404]({ message: "Entity not found" }));
return res.status(500).json(STATUS_CODE[500]((error as Error).message));
```

## Structured Logging

Every controller function should use the three-phase logging pattern:

```typescript
// 1. Log start (synchronous)
logProcessing({
  description: "starting functionName",
  functionName: "functionName",
  fileName: "controller.ctrl.ts",
  userId: req.userId!,
  tenantId: req.tenantId!,
});

// 2. Log success (async, inside try after operation)
await logSuccess({
  eventType: "Create",  // "Create" | "Read" | "Update" | "Delete"
  description: "Created entity successfully",
  functionName: "functionName",
  fileName: "controller.ctrl.ts",
  userId: req.userId!,
  tenantId: req.tenantId!,
});

// 3. Log failure (async, inside catch)
await logFailure({
  eventType: "Create",
  description: "Failed to create entity",
  functionName: "functionName",
  fileName: "controller.ctrl.ts",
  error: error as Error,
  userId: req.userId!,
  tenantId: req.tenantId!,
});
```

## Multi-Tenancy in Controllers

All database queries must include the tenant hash for schema isolation:

```typescript
export async function getEntities(req: Request, res: Response): Promise<any> {
  try {
    const tenantId = req.tenantId!;

    // Pass tenantId to all database queries
    const entities = await getEntitiesQuery(tenantId);

    return res.status(200).json(STATUS_CODE[200](entities));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
```

## Route Pattern

```typescript
// routes/entity.route.ts
import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import { getEntity, createEntity, updateEntity, deleteEntity } from "../controllers/entity.ctrl";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateJWT);

router.get("/", getAllEntities);
router.get("/:id", getEntity);
router.post("/", createEntity);
router.patch("/:id", updateEntity);
router.delete("/:id", deleteEntity);

export default router;
```

**Register in `Servers/index.ts`:**

```typescript
import entityRoutes from "./routes/entity.route";
app.use("/api/entities", entityRoutes);
```

## Database Queries (Utils Pattern)

Controllers call utils functions for database access:

```typescript
// utils/entity.utils.ts
import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

export async function getEntityByIdQuery(
  id: string | number,
  tenantId: string
): Promise<EntityType | null> {
  const [result] = await sequelize.query(
    `SELECT * FROM "${tenantId}".entities WHERE id = :id`,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
    }
  );
  return result || null;
}
```

## Controller Best Practices

| Principle | Description |
|-----------|-------------|
| **Standalone functions** | Export individual async functions, not controller objects |
| **STATUS_CODE responses** | Use `STATUS_CODE[xxx](...)` for all responses |
| **Structured logging** | Use `logProcessing` / `logSuccess` / `logFailure` |
| **Tenant isolation** | Always pass `req.tenantId!` to database queries |
| **In-place error handling** | Handle errors with try/catch and return responses directly |
| **No NextFunction** | Errors are not forwarded to middleware |

## Related Documents

- [Express Patterns](./express-patterns.md)
- [Middleware Guidelines](./middleware-guidelines.md)
- [Backend Testing](../07-testing/backend-testing.md)
