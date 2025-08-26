import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  getAllIntegrationsQuery,
  getIntegrationConnectionQuery,
  createOrUpdateIntegrationConnectionQuery,
  deleteIntegrationConnectionQuery,
  getIntegrationSettingsQuery,
  updateIntegrationSettingsQuery,
} from "../utils/integration.utils";
import { sequelize } from "../database/db";
import {
  logFailure,
  logProcessing,
  logSuccess,
} from "../utils/logger/logHelper";

// GET /api/integrations - Get all available integrations with their status
export async function getAllIntegrations(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllIntegrations",
    functionName: "getAllIntegrations",
    fileName: "integration.ctrl.ts",
  });

  try {
    const integrations = await getAllIntegrationsQuery(req.tenantId!);

    await logSuccess({
      eventType: "Read",
      description: `Retrieved ${integrations.length} integrations`,
      functionName: "getAllIntegrations",
      fileName: "integration.ctrl.ts",
    });
    
    return res.status(200).json(STATUS_CODE[200](integrations));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve integrations",
      functionName: "getAllIntegrations",
      fileName: "integration.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// GET /api/integrations/confluence - Get Confluence integration details
export async function getConfluenceIntegration(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getConfluenceIntegration",
    functionName: "getConfluenceIntegration",
    fileName: "integration.ctrl.ts",
  });

  try {
    const connection = await getIntegrationConnectionQuery('confluence', req.tenantId!);

    if (connection) {
      await logSuccess({
        eventType: "Read",
        description: "Retrieved Confluence integration",
        functionName: "getConfluenceIntegration",
        fileName: "integration.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200](connection));
    }

    await logSuccess({
      eventType: "Read",
      description: "Confluence integration not found",
      functionName: "getConfluenceIntegration",
      fileName: "integration.ctrl.ts",
    });
    return res.status(404).json(STATUS_CODE[404]({ message: "Confluence integration not configured" }));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve Confluence integration",
      functionName: "getConfluenceIntegration",
      fileName: "integration.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}


// POST /api/integrations/confluence/disconnect - Disconnect from Confluence
export async function disconnectConfluence(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  logProcessing({
    description: "starting disconnectConfluence",
    functionName: "disconnectConfluence",
    fileName: "integration.ctrl.ts",
  });

  try {
    const { userId } = req;
    if (!userId) {
      await logFailure({
        eventType: "Delete",
        description: "Unauthorized access attempt to disconnect Confluence",
        functionName: "disconnectConfluence",
        fileName: "integration.ctrl.ts",
        error: new Error("Unauthorized"),
      });
      return res.status(401).json(STATUS_CODE[401]("Unauthorized"));
    }

    // Check if connection exists
    const existingConnection = await getIntegrationConnectionQuery('confluence', req.tenantId!);
    if (!existingConnection) {
      await logSuccess({
        eventType: "Delete",
        description: "Confluence connection not found for disconnect",
        functionName: "disconnectConfluence",
        fileName: "integration.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404]({ message: "Confluence integration not found" }));
    }

    // In a real implementation, you would also:
    // 1. Revoke OAuth tokens with Atlassian
    // 2. Clean up any sync data
    
    const deleted = await deleteIntegrationConnectionQuery('confluence', req.tenantId!, transaction);

    if (deleted) {
      await transaction.commit();
      await logSuccess({
        eventType: "Delete",
        description: "Disconnected from Confluence",
        functionName: "disconnectConfluence",
        fileName: "integration.ctrl.ts",
      });
      return res.status(200).json(STATUS_CODE[200]({ message: "Confluence disconnected successfully" }));
    } else {
      await transaction.rollback();
      await logSuccess({
        eventType: "Delete",
        description: "Confluence connection not found for disconnect",
        functionName: "disconnectConfluence",
        fileName: "integration.ctrl.ts",
      });
      return res.status(404).json(STATUS_CODE[404]({ message: "Confluence integration not found" }));
    }

  } catch (error) {
    await transaction.rollback();
    await logFailure({
      eventType: "Delete",
      description: "Failed to disconnect Confluence",
      functionName: "disconnectConfluence",
      fileName: "integration.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// Get integration settings for a specific integration type
export async function getIntegrationSettings(req: Request, res: Response): Promise<any> {
  const { integrationType } = req.params;
  
  logProcessing({
    description: `getting settings for integration type: ${integrationType}`,
    functionName: "getIntegrationSettings",
    fileName: "integration.ctrl.ts",
  });


  try {
    const settings = await getIntegrationSettingsQuery(req.tenantId!, integrationType);
    
    // Mask sensitive data for security
    const maskedSettings = settings ? {
      ...settings,
      oauth_client_secret: settings.oauth_client_secret ? '***masked***' : undefined,
    } : null;

    await logSuccess({
      eventType: "Read",
      description: `Retrieved settings for ${integrationType}`,
      functionName: "getIntegrationSettings",
      fileName: "integration.ctrl.ts",
    });

    return res.status(200).json(STATUS_CODE[200](maskedSettings));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: `Failed to retrieve settings for ${integrationType}`,
      functionName: "getIntegrationSettings",
      fileName: "integration.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

// Update integration settings for a specific integration type
export async function updateIntegrationSettings(req: Request, res: Response): Promise<any> {
  const { integrationType } = req.params;
  const settingsData = req.body;
  
  logProcessing({
    description: `updating settings for integration type: ${integrationType}`,
    functionName: "updateIntegrationSettings",
    fileName: "integration.ctrl.ts",
  });

  

  const transaction = await sequelize.transaction();

  try {
    // Validate integration type
    if (!['confluence'].includes(integrationType)) {
      return res.status(400).json(STATUS_CODE[400]("Invalid integration type"));
    }

    // Update or create settings
    const updatedSettings = await updateIntegrationSettingsQuery(
      req.tenantId!,
      integrationType,
      settingsData,
      transaction
    );

    await transaction.commit();

    await logSuccess({
      eventType: "Update",
      description: `Updated settings for ${integrationType}`,
      functionName: "updateIntegrationSettings",
      fileName: "integration.ctrl.ts",
    });

    // Mask sensitive data in response
    const maskedSettings = {
      ...updatedSettings,
      oauth_client_secret: updatedSettings.oauth_client_secret ? '***masked***' : undefined,
    };

    return res.status(200).json(STATUS_CODE[200](maskedSettings));
  } catch (error) {
    await transaction.rollback();
    
    await logFailure({
      eventType: "Update",
      description: `Failed to update settings for ${integrationType}`,
      functionName: "updateIntegrationSettings",
      fileName: "integration.ctrl.ts",
      error: error as Error,
    });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
