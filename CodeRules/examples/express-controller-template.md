# Express Controller Template

Copy-paste template for creating Express controllers in VerifyWise.

## Controller File

```typescript
// controllers/resource.controller.ts

import { Request, Response, NextFunction } from 'express';
import { resourceService } from '../services/resource.service';
import { AppError, NotFoundError, ConflictError } from '../utils/errors';
import { HTTP_STATUS } from '../utils/httpStatus';

// Types for request parameters
interface GetResourceParams {
  id: string;
}

interface ListResourcesQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const ResourceController = {
  /**
   * List resources with pagination
   * GET /api/v1/resources
   */
  async getAll(
    req: Request<{}, {}, {}, ListResourcesQuery>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        page = '1',
        limit = '10',
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = Math.max(1, parseInt(page, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

      const result = await resourceService.findAll({
        page: pageNum,
        limit: limitNum,
        search,
        sortBy,
        sortOrder,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.items,
        meta: {
          page: pageNum,
          perPage: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get resource by ID
   * GET /api/v1/resources/:id
   */
  async getById(
    req: Request<GetResourceParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const resource = await resourceService.findById(id);

      if (!resource) {
        throw new NotFoundError('Resource', id);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create resource
   * POST /api/v1/resources
   */
  async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Body is pre-validated by middleware
      const data = req.body;

      // Business validation
      const existing = await resourceService.findByName(data.name);
      if (existing) {
        throw new ConflictError('Resource with this name already exists');
      }

      const resource = await resourceService.create(data);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update resource
   * PUT /api/v1/resources/:id
   */
  async update(
    req: Request<GetResourceParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      const resource = await resourceService.update(id, data);

      if (!resource) {
        throw new NotFoundError('Resource', id);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Partial update resource
   * PATCH /api/v1/resources/:id
   */
  async patch(
    req: Request<GetResourceParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data = req.body;

      const resource = await resourceService.update(id, data);

      if (!resource) {
        throw new NotFoundError('Resource', id);
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: resource,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete resource
   * DELETE /api/v1/resources/:id
   */
  async delete(
    req: Request<GetResourceParams>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const deleted = await resourceService.delete(id);

      if (!deleted) {
        throw new NotFoundError('Resource', id);
      }

      res.status(HTTP_STATUS.NO_CONTENT).send();
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get resources for current user
   * GET /api/v1/resources/me
   */
  async getMine(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.id;

      const resources = await resourceService.findByUserId(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: resources,
      });
    } catch (error) {
      next(error);
    }
  },
};
```

## Route File

```typescript
// routes/resource.routes.ts

import { Router } from 'express';
import { ResourceController } from '../controllers/resource.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createResourceSchema,
  updateResourceSchema,
  patchResourceSchema,
  listResourcesSchema,
  resourceIdSchema,
} from '../schemas/resource.schema';

const router = Router();

// Public routes (if any)
// router.get('/public', ResourceController.getPublic);

// Protected routes - require authentication
router.use(authenticate);

// List resources
router.get(
  '/',
  validate(listResourcesSchema),
  ResourceController.getAll
);

// Get current user's resources
router.get(
  '/me',
  ResourceController.getMine
);

// Get single resource
router.get(
  '/:id',
  validate(resourceIdSchema),
  ResourceController.getById
);

// Create resource
router.post(
  '/',
  validate(createResourceSchema),
  ResourceController.create
);

// Update resource (full)
router.put(
  '/:id',
  validate(resourceIdSchema),
  validate(updateResourceSchema),
  ResourceController.update
);

// Update resource (partial)
router.patch(
  '/:id',
  validate(resourceIdSchema),
  validate(patchResourceSchema),
  ResourceController.patch
);

// Delete resource
router.delete(
  '/:id',
  validate(resourceIdSchema),
  ResourceController.delete
);

// Admin-only routes
router.get(
  '/admin/all',
  authorize('admin'),
  ResourceController.getAll
);

export default router;
```

## Schema File

```typescript
// schemas/resource.schema.ts

import { z } from 'zod';

// Reusable schemas
const uuidSchema = z.string().uuid('Invalid ID format');

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// List resources
export const listResourcesSchema = z.object({
  query: paginationSchema.extend({
    search: z.string().max(100).optional(),
    sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

// Resource ID parameter
export const resourceIdSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
});

// Create resource
export const createResourceSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less')
      .trim(),
    description: z
      .string()
      .max(500, 'Description must be 500 characters or less')
      .optional(),
    type: z.enum(['type1', 'type2', 'type3']),
    isPublic: z.boolean().default(false),
  }),
});

// Update resource (all fields required)
export const updateResourceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(500).optional(),
    type: z.enum(['type1', 'type2', 'type3']),
    isPublic: z.boolean(),
  }),
});

// Patch resource (all fields optional)
export const patchResourceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(500).optional(),
    type: z.enum(['type1', 'type2', 'type3']).optional(),
    isPublic: z.boolean().optional(),
  }),
});

// Type exports
export type CreateResourceInput = z.infer<typeof createResourceSchema>['body'];
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>['body'];
export type PatchResourceInput = z.infer<typeof patchResourceSchema>['body'];
```

## Service File

```typescript
// services/resource.service.ts

import { Op } from 'sequelize';
import { Resource } from '../models/Resource';
import { NotFoundError } from '../utils/errors';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CreateInput {
  name: string;
  description?: string;
  type: string;
  isPublic: boolean;
}

interface UpdateInput {
  name?: string;
  description?: string;
  type?: string;
  isPublic?: boolean;
}

export const resourceService = {
  async findAll(options: FindAllOptions) {
    const { page, limit, search, sortBy, sortOrder } = options;
    const offset = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const { rows: items, count: total } = await Resource.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortBy, sortOrder.toUpperCase()]],
    });

    return { items, total };
  },

  async findById(id: string): Promise<Resource | null> {
    return Resource.findByPk(id);
  },

  async findByName(name: string): Promise<Resource | null> {
    return Resource.findOne({ where: { name } });
  },

  async findByUserId(userId: string): Promise<Resource[]> {
    return Resource.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  },

  async create(data: CreateInput): Promise<Resource> {
    return Resource.create(data);
  },

  async update(id: string, data: UpdateInput): Promise<Resource | null> {
    const resource = await Resource.findByPk(id);
    if (!resource) {
      return null;
    }
    return resource.update(data);
  },

  async delete(id: string): Promise<boolean> {
    const deleted = await Resource.destroy({ where: { id } });
    return deleted > 0;
  },
};
```

## Test File

```typescript
// controllers/resource.controller.test.ts

import request from 'supertest';
import { createApp } from '../app';
import { Resource } from '../models/Resource';
import { createUser, createResource } from '../test/factories';

const app = createApp();

describe('ResourceController', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await createUser();
    userId = user.id;
    authToken = generateToken(user.id);
  });

  describe('GET /api/v1/resources', () => {
    it('returns paginated resources', async () => {
      await createResource({ userId });
      await createResource({ userId });

      const response = await request(app)
        .get('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toMatchObject({
        page: 1,
        perPage: 10,
        total: 2,
      });
    });

    it('supports search', async () => {
      await createResource({ userId, name: 'Test Resource' });
      await createResource({ userId, name: 'Other Resource' });

      const response = await request(app)
        .get('/api/v1/resources?search=test')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Test Resource');
    });
  });

  describe('POST /api/v1/resources', () => {
    it('creates a resource', async () => {
      const response = await request(app)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Resource',
          type: 'type1',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('New Resource');
    });

    it('returns 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Empty name
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns 409 for duplicate name', async () => {
      await createResource({ userId, name: 'Existing' });

      const response = await request(app)
        .post('/api/v1/resources')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Existing',
          type: 'type1',
        })
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });
  });

  describe('DELETE /api/v1/resources/:id', () => {
    it('deletes a resource', async () => {
      const resource = await createResource({ userId });

      await request(app)
        .delete(`/api/v1/resources/${resource.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const deleted = await Resource.findByPk(resource.id);
      expect(deleted).toBeNull();
    });

    it('returns 404 for non-existent resource', async () => {
      await request(app)
        .delete('/api/v1/resources/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

## Directory Structure

```
src/
├── controllers/
│   └── resource.controller.ts
├── routes/
│   └── resource.routes.ts
├── services/
│   └── resource.service.ts
├── schemas/
│   └── resource.schema.ts
├── models/
│   └── Resource.ts
└── tests/
    └── resource.controller.test.ts
```
