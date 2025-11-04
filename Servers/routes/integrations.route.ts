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
    const models = await mlflowService.getModels(req.tenantId!);
    // await mlflowService.recordSyncResult(
    //   "success",
    //   req.tenantId!,
    //   `Synced ${models.length} model(s) via manual request`,
    // );
    return res.status(200).json(models);
  } catch (error) {
    console.error('Error fetching MLFlow models:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Failed to fetch MLFlow models';

    // await mlflowService.recordSyncResult("error", req.tenantId!, message);

    if (error instanceof Error && error.message.includes('not configured')) {
      return res.status(400).json({
        success: false,
        error: 'MLFlow integration is not configured. Please configure it first.',
      });
    }

    return res.status(500).json({
      success: false,
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
router.get('/health', async (req: Request, res: Response) => {
  try {
    res.status(200).json({
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
