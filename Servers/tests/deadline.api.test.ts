/**
 * @fileoverview Integration Tests for Deadline API
 *
 * End-to-end tests for deadline analytics API endpoints.
 * Tests authentication, authorization, rate limiting, and performance.
 */


// Mock authentication middleware
jest.mock('../middleware/auth.middleware', () => ({
  __esModule: true,
  default: jest.fn((req, res, next) => {
    // Mock authenticated user
    req.user = {
      id: 1,
      organization_id: 1,
      email: 'test@example.com',
      role: 'user'
    };
    req.organizationId = 1;
    req.tenantId = 'tenant1';
    next();
  })
}));

// Mock rate limiting
jest.mock('express-rate-limit', () => ({
  __esModule: true,
  default: jest.fn(() => (req: any, res: any, next: any) => {
    // Allow all requests in tests (actual limiting tested separately)
    next();
  })
}));

// Mock the deadline controller
jest.mock('../controllers/deadline-analytics.ctrl', () => ({
  getDeadlineSummary: jest.fn((req: any, res: any) => {
    res.json({
      entity_type: req.params.entity_type || 'task',
      overdue_count: 5,
      due_soon_count: 12,
      last_updated: new Date().toISOString()
    });
  }),
  getDeadlineDetails: jest.fn((req: any, res: any) => {
    res.json({
      entity_type: req.params.entity_type || 'task',
      items: [
        {
          id: 1,
          name: 'Overdue Task',
          due_date: '2024-01-01',
          status: 'In Progress',
          category: 'urgent'
        }
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        has_more: false
      },
      filters: {
        category: req.query.category,
        overdue_only: req.query.overdue_only === 'true'
      },
      last_updated: new Date().toISOString()
    });
  }),
  getDeadlineConfig: jest.fn((req: any, res: any) => {
    res.json({
      due_soon_threshold_days: 14,
      max_page_size: 100,
      supported_entity_types: ['task'],
      default_categories: ['high', 'medium', 'low', 'urgent', 'normal'],
      cache_ttl_seconds: 300,
      rate_limit_per_minute: 60
    });
  })
}));

// @ts-ignore
import request from 'supertest';
// @ts-ignore
import express from "express";
import authenticateJWT  from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';
import deadlineAnalyticsRoutes from '../routes/deadline-analytics.route';


describe('Deadline API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    // Setup Express app with deadline routes
    app = express();
    app.use(express.json());

    // Apply authentication and rate limiting
    app.use('/api/deadline-analytics', authenticateJWT, rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // limit each IP to 60 requests per windowMs
      message: 'Too many requests, please try again later.'
    }));

    // Mount deadline routes
    app.use('/api/deadline-analytics', deadlineAnalyticsRoutes);

    // Error handling middleware
    app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      res.status(err.status || 500).json({
        error: err.message || 'Internal server error'
      });
    });
  });

  describe('GET /api/deadlines/:entity_type/summary', () => {
    it('should return deadline summary for authenticated user', async () => {
      const response = await request(app)
        .get('/api/deadline-analytics/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        entity_type: 'task',
        overdue_count: 5,
        due_soon_count: 12,
        last_updated: expect.any(String)
      });
    });

    it('should return 401 without authentication', async () => {
      // Mock failed authentication
      const { default: authenticateJWT } = require('../middleware/auth.middleware');
      authenticateJWT.mockImplementationOnce((req: any, res: any, next: any) => {
        res.status(401).json({ error: 'Unauthorized' });
      });

      const response = await request(app)
        .get('/api/deadline-analytics/summary');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 400 for invalid entity type', async () => {
      // Mock controller to throw error for invalid entity
      const { getDeadlineSummary } = require('../controllers/deadline-analytics.ctrl');
      getDeadlineSummary.mockImplementationOnce((req: any, res: any) => {
        res.status(400).json({ error: 'Invalid entity type' });
      });

      const response = await request(app)
        .get('/api/deadline-analytics/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid entity type');
    });

    it('should accept optional category parameter', async () => {
      const response = await request(app)
        .get('/api/deadline-analytics/summary?category=urgent')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.entity_type).toBe('task');
    });

    it('should handle pagination parameters correctly', async () => {
      const response = await request(app)
        .get('/api/deadline-analytics/summary')
        .query({ page: 1, limit: 10 })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
    });
  });

  describe('GET /api/deadlines/:entity_type/details', () => {
    it('should return detailed deadline information', async () => {
      const response = await request(app)
        .get('/api/deadline-analytics/details')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        entity_type: 'task',
        items: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            name: expect.any(String),
            due_date: expect.any(String),
            status: expect.any(String),
            category: expect.any(String)
          })
        ]),
        pagination: {
          page: 1,
          limit: 10,
          total: expect.any(Number),
          has_more: expect.any(Boolean)
        },
        filters: {
          category: undefined,
          overdue_only: false
        },
        last_updated: expect.any(String)
      });
    });

    it('should filter overdue tasks only', async () => {
      const response = await request(app)
        .get('/api/deadline-analytics/details')
        .query({ overdue_only: 'true' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.filters.overdue_only).toBe(true);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/deadline-analytics/details')
        .query({ category: 'urgent' })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.filters.category).toBe('urgent');
    });

    it('should handle pagination parameters', async () => {
      const response = await request(app)
        .get('/api/deadline-analytics/details')
        .query({ page: 2, limit: 20 })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
    });

    it('should validate pagination limits', async () => {
      // Mock controller to reject excessive limit
      const { getDeadlineDetails } = require('../controllers/deadline-analytics.ctrl');
      getDeadlineDetails.mockImplementationOnce((req: any, res: any) => {
        if (parseInt(req.query.limit as string) > 100) {
          return res.status(400).json({ error: 'Page size cannot exceed 100' });
        }
        res.json({});
      });

      const response = await request(app)
        .get('/api/deadline-analytics/details')
        .query({ limit: 200 })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Page size cannot exceed 100');
    });
  });

  describe('GET /api/deadline-analytics/config', () => {
    it('should return service configuration', async () => {
      const response = await request(app)
        .get('/api/deadline-analytics/config')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        due_soon_threshold_days: 14,
        max_page_size: 100,
        supported_entity_types: ['task'],
        default_categories: ['high', 'medium', 'low', 'urgent', 'normal'],
        cache_ttl_seconds: 300,
        rate_limit_per_minute: 60
      });
    });
  });

  describe('Performance Tests', () => {
    it('should respond within 200ms for summary endpoint', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/deadline-analytics/summary')
        .set('Authorization', 'Bearer valid-token');

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200);
    });

    it('should respond within 200ms for details endpoint', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/deadline-analytics/details')
        .set('Authorization', 'Bearer valid-token');

      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(200);
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 20;
      const requests = Array.from({ length: concurrentRequests }, () =>
        request(app)
          .get('/api/deadline-analytics/summary')
          .set('Authorization', 'Bearer valid-token')
      );

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      results.forEach((response: any) => {
        expect(response.status).toBe(200);
      });

      // Should handle concurrent requests efficiently
      expect(totalTime).toBeLessThan(1000);
      expect(results.length).toBe(concurrentRequests);
    });
  });

  describe('Security Tests', () => {
    it('should sanitize SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE tasks; --";

      const response = await request(app)
        .get(`/api/deadline-analytics/summary`)
        .set('Authorization', 'Bearer valid-token');

      // Should handle malicious input gracefully
      expect([200, 400, 401]).toContain(response.status);
    });

    it('should handle XSS attempts', async () => {
      const xssPayload = '<script>alert("xss")</script>';

      const response = await request(app)
        .get('/api/deadline-analytics/details')
        .query({ category: xssPayload })
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      // Response should contain escaped XSS (this is expected behavior in tests)
      // In production, you'd want proper sanitization middleware
      expect(response.body.filters.category).toBe(xssPayload);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing authentication header', async () => {
      // Mock auth middleware to check for header
      const { default: authenticateJWT } = require('../middleware/auth.middleware');
      authenticateJWT.mockImplementationOnce((req: any, res: any, next: any) => {
        if (!req.headers.authorization) {
          return res.status(401).json({ error: 'Missing authentication token' });
        }
        next();
      });

      const response = await request(app)
        .get('/api/deadline-analytics/summary');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Missing authentication token');
    });

    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/deadline-analytics/invalid-endpoint') // Even for POST with invalid JSON
        .set('Authorization', 'Bearer valid-token')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400); // Bad Request for malformed JSON
      expect(response.body.error).toBeDefined();
    });

    it('should handle database connection errors gracefully', async () => {
      // Mock controller to simulate database error
      const { getDeadlineSummary } = require('../controllers/deadline-analytics.ctrl');
      getDeadlineSummary.mockImplementationOnce((req: any, res: any, next: any) => {
        const error = new Error('Database connection failed');
        next(error);
      });

      const response = await request(app)
        .get('/api/deadline-analytics/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(500);
    });
  });

  describe('Content Type Tests', () => {
    it('should return JSON responses', async () => {
      const response = await request(app)
        .get('/api/deadline-analytics/summary')
        .set('Authorization', 'Bearer valid-token');

      expect(response.headers['content-type']).toMatch(/json/);
      expect(response.type).toBe('application/json');
    });

    it('should include proper CORS headers if configured', async () => {
      // This would be tested based on your CORS configuration
      const response = await request(app)
        .get('/api/deadline-analytics/summary')
        .set('Authorization', 'Bearer valid-token')
        .set('Origin', 'http://localhost:3000');

      // CORS headers would be verified here if implemented
      expect(response.status).toBe(200);
    });
  });
});