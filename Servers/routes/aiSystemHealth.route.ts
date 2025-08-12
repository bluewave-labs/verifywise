import { Router } from 'express';
import {
  getAISystemsHealth,
  getHealthOverview,
  getActiveAlerts,
  getRiskPredictions,
  createOrUpdateSystemHealth,
  createHealthAlert,
  resolveHealthAlert,
  recordHealthMetrics
} from '../controllers/aiSystemHealth.ctrl';
import auth from '../middleware/auth.middleware';
import { checkMultiTenancy } from '../middleware/multiTenancy.middleware';

const router = Router();

// Apply authentication and multi-tenancy middleware to all routes
router.use(auth);
router.use(checkMultiTenancy);

/**
 * @swagger
 * /api/ai-system-health/{organizationId}:
 *   get:
 *     tags:
 *       - AI System Health
 *     summary: Get all AI systems health data for an organization
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: systemType
 *         schema:
 *           type: string
 *         description: Filter by system type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [excellent, good, fair, poor]
 *         description: Filter by health status
 *     responses:
 *       200:
 *         description: AI systems health data retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/:organizationId', getAISystemsHealth);

/**
 * @swagger
 * /api/ai-system-health/{organizationId}/overview:
 *   get:
 *     tags:
 *       - AI System Health
 *     summary: Get health overview and metrics for dashboard
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Health overview retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/:organizationId/overview', getHealthOverview);

/**
 * @swagger
 * /api/ai-system-health/{organizationId}/alerts:
 *   get:
 *     tags:
 *       - AI System Health
 *     summary: Get active alerts for the organization
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of alerts to return
 *     responses:
 *       200:
 *         description: Active alerts retrieved successfully
 *       500:
 *         description: Internal server error
 */
router.get('/:organizationId/alerts', getActiveAlerts);

/**
 * @swagger
 * /api/ai-system-health/{organizationId}/predictions:
 *   get:
 *     tags:
 *       - AI System Health
 *     summary: Get risk predictions based on historical data
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Organization ID
 *     responses:
 *       200:
 *         description: Risk predictions generated successfully
 *       500:
 *         description: Internal server error
 */
router.get('/:organizationId/predictions', getRiskPredictions);

/**
 * @swagger
 * /api/ai-system-health:
 *   post:
 *     tags:
 *       - AI System Health
 *     summary: Create or update AI system health record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - systemName
 *               - systemType
 *               - overallScore
 *               - performanceScore
 *               - securityScore
 *               - complianceScore
 *               - reliabilityScore
 *               - organizationId
 *             properties:
 *               systemName:
 *                 type: string
 *               systemType:
 *                 type: string
 *                 enum: [recommendation_engine, fraud_detection, nlp_service, image_recognition, sentiment_analysis, chatbot, predictive_analytics, other]
 *               overallScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               performanceScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               securityScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               complianceScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               reliabilityScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *               uptime:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               organizationId:
 *                 type: integer
 *               projectId:
 *                 type: integer
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: System health record created successfully
 *       200:
 *         description: System health record updated successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post('/', createOrUpdateSystemHealth);

/**
 * @swagger
 * /api/ai-system-health/alerts:
 *   post:
 *     tags:
 *       - AI System Health
 *     summary: Create health alert
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - systemHealthId
 *               - alertType
 *               - title
 *               - description
 *               - severity
 *             properties:
 *               systemHealthId:
 *                 type: integer
 *               alertType:
 *                 type: string
 *                 enum: [error, warning, info]
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               severity:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *               organizationId:
 *                 type: integer
 *               projectId:
 *                 type: integer
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Health alert created successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post('/alerts', createHealthAlert);

/**
 * @swagger
 * /api/ai-system-health/alerts/{alertId}/resolve:
 *   patch:
 *     tags:
 *       - AI System Health
 *     summary: Resolve health alert
 *     parameters:
 *       - in: path
 *         name: alertId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Alert ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resolvedBy
 *             properties:
 *               resolvedBy:
 *                 type: integer
 *                 description: User ID who resolved the alert
 *     responses:
 *       200:
 *         description: Alert resolved successfully
 *       404:
 *         description: Alert not found
 *       500:
 *         description: Internal server error
 */
router.patch('/alerts/:alertId/resolve', resolveHealthAlert);

/**
 * @swagger
 * /api/ai-system-health/metrics:
 *   post:
 *     tags:
 *       - AI System Health
 *     summary: Record health metrics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - systemHealthId
 *               - metricType
 *               - metricValue
 *             properties:
 *               systemHealthId:
 *                 type: integer
 *               metricType:
 *                 type: string
 *                 enum: [response_time, accuracy, throughput, error_rate, cpu_usage, memory_usage, disk_usage, network_latency, model_drift, data_quality, prediction_confidence, custom]
 *               metricValue:
 *                 type: number
 *               metricUnit:
 *                 type: string
 *               threshold:
 *                 type: number
 *               organizationId:
 *                 type: integer
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Health metrics recorded successfully
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post('/metrics', recordHealthMetrics);

export default router;