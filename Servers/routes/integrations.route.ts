import { Router, Request, Response } from 'express';
import { MLFlowService } from '../src/services/mlflow.service';
import authenticateJWT from '../middleware/auth.middleware';
import { ValidationException } from '../domain.layer/exceptions/custom.exception';

const router = Router();
const mlflowService = new MLFlowService();

// All MLFlow integration routes require authentication
router.use(authenticateJWT);

// POST /api/integrations/mlflow/test - Test MLFlow connection
router.post('/test', async (req: Request, res: Response) => {
  try {
    const runtimeConfig = await mlflowService.resolveRuntimeConfig(req.tenantId!, req.body);
    const connectionResult = await mlflowService.testConnection(runtimeConfig);
    await mlflowService.recordTestResult(connectionResult, req.tenantId!);
    return res.status(connectionResult.success ? 200 : 400).json(connectionResult);
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    console.error('MLFlow connection test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during connection test',
    });
  }
});

// GET /api/integrations/mlflow/config - Get stored configuration
router.get('/config', async (req: Request, res: Response) => {
  try {
    const config = await mlflowService.getConfigurationSummary(req.tenantId!);
    return res.status(200).json(config);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to load MLFlow configuration',
    });
  }
});

// POST /api/integrations/mlflow/configure - Configure MLFlow
router.post('/configure', async (req: Request, res: Response) => {
  try {
    const config = req.body;

    // Basic validation
    if (!config.trackingServerUrl) {
      return res.status(400).json({
        success: false,
        error: 'MLFlow tracking server URL is required',
      });
    }

    const result = await mlflowService.saveConfiguration(req.userId, config, req.tenantId!);

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    console.error('MLFlow configuration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save MLFlow configuration',
    });
  }
});

// GET /api/integrations/mlflow/models - Get MLFlow models
router.get('/models', async (req: Request, res: Response) => {
  try {
    // First check if MLFlow is configured
    const configSummary = await mlflowService.getConfigurationSummary(req.tenantId!);
    if (!configSummary.configured) {
      // Return 200 with empty models and configured: false
      // This is not an error - MLFlow simply isn't set up yet
      return res.status(200).json({
        configured: false,
        models: [],
      });
    }

    const models = await mlflowService.getModels(req.tenantId!);
    return res.status(200).json({
      configured: true,
      models: models,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch MLFlow models';
    const errorCode = (error as any)?.code || '';

    // Check if this is a configuration-related error
    if (error instanceof ValidationException ||
        (error instanceof Error && (
          message.includes('not configured') ||
          message.includes('URL is required') ||
          message.includes('tracking server')
        ))) {
      return res.status(200).json({
        configured: false,
        models: [],
      });
    }

    // Check if this is a connection error (MLflow server unreachable)
    // Handle gracefully without logging - this is expected when MLflow isn't running
    if (errorCode === 'ECONNREFUSED' ||
        errorCode === 'ETIMEDOUT' ||
        errorCode === 'ENOTFOUND' ||
        errorCode === 'ECONNRESET' ||
        message.includes('ECONNREFUSED') ||
        message.includes('ETIMEDOUT') ||
        message.includes('connect') ||
        message.includes('timeout') ||
        message.includes('network')) {
      return res.status(200).json({
        configured: true,
        connected: false,
        models: [],
        message: 'MLFlow server is not reachable',
      });
    }

    // Only log unexpected errors
    console.error('Error fetching MLFlow models:', error);

    return res.status(200).json({
      configured: true,
      connected: false,
      models: [],
      error: 'Failed to fetch MLFlow models',
    });
  }
});

// GET /api/integrations/mlflow/sync-status - Get last sync info
router.get('/sync-status', async (req: Request, res: Response) => {
  try {
    const status = await mlflowService.getSyncStatus(req.tenantId!);
    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error loading MLFlow sync status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load MLFlow sync status',
    });
  }
});

// GET /api/integrations/mlflow/health - Health check endpoint
router.get('/health', async (_req: Request, res: Response) => {
  try {
    return res.status(200).json({
      status: 'healthy',
      service: 'mlflow-integration',
      timestamp: new Date().toISOString(),
      endpoints: {
        test: '/api/integrations/mlflow/test',
        configure: '/api/integrations/mlflow/configure',
        models: '/api/integrations/mlflow/models'
      }
    });
  } catch (error) {
    console.error('MLFlow health check error:', error);
    return res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed'
    });
  }
});

export default router;
