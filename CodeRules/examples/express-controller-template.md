# Express Controller Template

Copy-paste template for creating Express controllers in VerifyWise.

## Controller File

```typescript
// controllers/resource.ctrl.ts

import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";

// Import your database query functions
import {
  getAllResourcesQuery,
  getResourceByIdQuery,
  createResourceQuery,
  updateResourceQuery,
  deleteResourceQuery,
} from "../utils/resource.utils";

/**
 * Get all resources
 * GET /api/resources
 */
export async function getAllResources(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllResources",
    functionName: "getAllResources",
    fileName: "resource.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const tenantId = req.tenantId!;

    const resources = await getAllResourcesQuery(tenantId);

    await logSuccess({
      eventType: "Read",
      description: "Retrieved all resources",
      functionName: "getAllResources",
      fileName: "resource.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(200).json(STATUS_CODE[200](resources));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve resources",
      functionName: "getAllResources",
      fileName: "resource.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get resource by ID
 * GET /api/resources/:id
 */
export async function getResourceById(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getResourceById",
    functionName: "getResourceById",
    fileName: "resource.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    if (!id) {
      return res.status(400).json(STATUS_CODE[400]({ message: "ID is required" }));
    }

    const resource = await getResourceByIdQuery(id, tenantId);

    if (!resource) {
      return res.status(404).json(STATUS_CODE[404]({ message: "Resource not found" }));
    }

    await logSuccess({
      eventType: "Read",
      description: "Retrieved resource",
      functionName: "getResourceById",
      fileName: "resource.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(200).json(STATUS_CODE[200](resource));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve resource",
      functionName: "getResourceById",
      fileName: "resource.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Create resource
 * POST /api/resources
 */
export async function createResource(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting createResource",
    functionName: "createResource",
    fileName: "resource.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const tenantId = req.tenantId!;
    const userId = req.userId!;
    const data = req.body;

    const resource = await createResourceQuery(data, userId, tenantId);

    await logSuccess({
      eventType: "Create",
      description: "Created resource",
      functionName: "createResource",
      fileName: "resource.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(201).json(STATUS_CODE[201](resource));
  } catch (error) {
    await logFailure({
      eventType: "Create",
      description: "Failed to create resource",
      functionName: "createResource",
      fileName: "resource.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Update resource
 * PATCH /api/resources/:id
 */
export async function updateResource(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting updateResource",
    functionName: "updateResource",
    fileName: "resource.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;
    const data = req.body;

    const resource = await updateResourceQuery(id, data, tenantId);

    if (!resource) {
      return res.status(404).json(STATUS_CODE[404]({ message: "Resource not found" }));
    }

    await logSuccess({
      eventType: "Update",
      description: "Updated resource",
      functionName: "updateResource",
      fileName: "resource.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(200).json(STATUS_CODE[200](resource));
  } catch (error) {
    await logFailure({
      eventType: "Update",
      description: "Failed to update resource",
      functionName: "updateResource",
      fileName: "resource.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Delete resource
 * DELETE /api/resources/:id
 */
export async function deleteResource(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting deleteResource",
    functionName: "deleteResource",
    fileName: "resource.ctrl.ts",
    userId: req.userId!,
    tenantId: req.tenantId!,
  });

  try {
    const { id } = req.params;
    const tenantId = req.tenantId!;

    const deleted = await deleteResourceQuery(id, tenantId);

    if (!deleted) {
      return res.status(404).json(STATUS_CODE[404]({ message: "Resource not found" }));
    }

    await logSuccess({
      eventType: "Delete",
      description: "Deleted resource",
      functionName: "deleteResource",
      fileName: "resource.ctrl.ts",
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(200).json(STATUS_CODE[200]({ message: "Resource deleted" }));
  } catch (error) {
    await logFailure({
      eventType: "Delete",
      description: "Failed to delete resource",
      functionName: "deleteResource",
      fileName: "resource.ctrl.ts",
      error: error as Error,
      userId: req.userId!,
      tenantId: req.tenantId!,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
```

## Route File

```typescript
// routes/resource.route.ts

import express from "express";
import authenticateJWT from "../middleware/auth.middleware";
import {
  getAllResources,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from "../controllers/resource.ctrl";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticateJWT);

router.get("/", getAllResources);
router.get("/:id", getResourceById);
router.post("/", createResource);
router.patch("/:id", updateResource);
router.delete("/:id", deleteResource);

export default router;
```

## Utils (Database Queries) File

```typescript
// utils/resource.utils.ts

import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";

export async function getAllResourcesQuery(tenantId: string) {
  const results = await sequelize.query(
    `SELECT * FROM "${tenantId}".resources ORDER BY created_at DESC`,
    { type: QueryTypes.SELECT }
  );
  return results;
}

export async function getResourceByIdQuery(
  id: string | number,
  tenantId: string
) {
  const [result] = await sequelize.query(
    `SELECT * FROM "${tenantId}".resources WHERE id = :id`,
    {
      replacements: { id },
      type: QueryTypes.SELECT,
    }
  );
  return result || null;
}

export async function createResourceQuery(
  data: { name: string; description?: string },
  userId: number,
  tenantId: string
) {
  const [result] = await sequelize.query(
    `INSERT INTO "${tenantId}".resources (name, description, created_by, created_at)
     VALUES (:name, :description, :userId, NOW())
     RETURNING *`,
    {
      replacements: {
        name: data.name,
        description: data.description || null,
        userId,
      },
      type: QueryTypes.INSERT,
    }
  );
  return result[0];
}

export async function updateResourceQuery(
  id: string | number,
  data: { name?: string; description?: string },
  tenantId: string
) {
  const [result] = await sequelize.query(
    `UPDATE "${tenantId}".resources
     SET name = COALESCE(:name, name),
         description = COALESCE(:description, description),
         updated_at = NOW()
     WHERE id = :id
     RETURNING *`,
    {
      replacements: { id, name: data.name || null, description: data.description || null },
      type: QueryTypes.UPDATE,
    }
  );
  return result[0] || null;
}

export async function deleteResourceQuery(
  id: string | number,
  tenantId: string
) {
  const [result] = await sequelize.query(
    `DELETE FROM "${tenantId}".resources WHERE id = :id RETURNING id`,
    {
      replacements: { id },
      type: QueryTypes.DELETE,
    }
  );
  return result.length > 0;
}
```

## Register Route

```typescript
// In Servers/index.ts
import resourceRoutes from "./routes/resource.route";
app.use("/api/resources", resourceRoutes);
```

## Directory Structure

```
Servers/
├── controllers/
│   └── resource.ctrl.ts       # Request handlers
├── routes/
│   └── resource.route.ts      # Route definitions
├── utils/
│   └── resource.utils.ts      # Database queries
└── index.ts                   # Route registration
```
