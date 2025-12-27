import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { PluginService } from "../services/plugin/pluginService";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";

const fileName = "plugin.ctrl.ts";

/**
 * Get all available plugins from marketplace
 */
export async function getAllPlugins(
  req: Request,
  res: Response
): Promise<any> {
  const functionName = "getAllPlugins";
  logStructured(
    "processing",
    "starting getAllPlugins",
    functionName,
    fileName
  );

  const category = req.query.category as string;

  try {
    const plugins = await PluginService.getAllPlugins(category);

    logStructured(
      "successful",
      `${plugins.length} plugins found`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](plugins));
  } catch (error) {
    logStructured("error", "failed to retrieve plugins", functionName, fileName);
    logger.error("❌ Error in getAllPlugins:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get plugin by key
 */
export async function getPluginByKey(
  req: Request,
  res: Response
): Promise<any> {
  const pluginKey = req.params.key;
  const functionName = "getPluginByKey";
  logStructured(
    "processing",
    `fetching plugin by key: ${pluginKey}`,
    functionName,
    fileName
  );

  try {
    const plugin = await PluginService.getPluginByKey(pluginKey);

    if (!plugin) {
      return res.status(404).json(STATUS_CODE[404]("Plugin not found"));
    }

    logStructured("successful", `plugin ${pluginKey} found`, functionName, fileName);
    return res.status(200).json(STATUS_CODE[200](plugin));
  } catch (error) {
    logStructured("error", "failed to retrieve plugin", functionName, fileName);
    logger.error("❌ Error in getPluginByKey:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Search plugins
 */
export async function searchPlugins(
  req: Request,
  res: Response
): Promise<any> {
  const query = req.query.q as string;
  const functionName = "searchPlugins";
  logStructured(
    "processing",
    `searching plugins with query: ${query}`,
    functionName,
    fileName
  );

  if (!query) {
    return res
      .status(400)
      .json(STATUS_CODE[400]("Query parameter 'q' is required"));
  }

  try {
    const plugins = await PluginService.searchPlugins(query);

    logStructured(
      "successful",
      `${plugins.length} plugins found for query: ${query}`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](plugins));
  } catch (error) {
    logStructured("error", "failed to search plugins", functionName, fileName);
    logger.error("❌ Error in searchPlugins:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Install a plugin
 */
export async function installPlugin(
  req: Request,
  res: Response
): Promise<any> {
  const { pluginKey } = req.body;
  const userId = (req as any).userId;
  const organizationId = (req as any).organizationId;
  const tenantId = (req as any).tenantId;

  const functionName = "installPlugin";
  logStructured(
    "processing",
    `installing plugin ${pluginKey} for user ${userId}`,
    functionName,
    fileName
  );

  if (!pluginKey) {
    return res.status(400).json(STATUS_CODE[400]("pluginKey is required"));
  }

  if (!userId || !organizationId || !tenantId) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("User not authenticated"));
  }

  try {
    const installation = await PluginService.installPlugin(
      pluginKey,
      userId,
      tenantId
    );

    logStructured(
      "successful",
      `plugin ${pluginKey} installed`,
      functionName,
      fileName
    );

    return res.status(201).json(STATUS_CODE[201](installation));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    logStructured("error", "failed to install plugin", functionName, fileName);
    logger.error("❌ Error in installPlugin:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Uninstall a plugin
 */
export async function uninstallPlugin(
  req: Request,
  res: Response
): Promise<any> {
  const installationId = parseInt(req.params.id);
  const userId = (req as any).userId;
  const organizationId = (req as any).organizationId;
  const tenantId = (req as any).tenantId;

  const functionName = "uninstallPlugin";
  logStructured(
    "processing",
    `uninstalling plugin installation ${installationId}`,
    functionName,
    fileName
  );

  if (!userId || !organizationId || !tenantId) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("User not authenticated"));
  }

  try {
    await PluginService.uninstallPlugin(installationId, userId, tenantId);

    logStructured(
      "successful",
      `plugin installation ${installationId} uninstalled`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200]("Plugin uninstalled successfully"));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured("error", "failed to uninstall plugin", functionName, fileName);
    logger.error("❌ Error in uninstallPlugin:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get installed plugins for tenant
 */
export async function getInstalledPlugins(
  req: Request,
  res: Response
): Promise<any> {
  const tenantId = (req as any).tenantId;

  const functionName = "getInstalledPlugins";
  logStructured(
    "processing",
    `fetching installed plugins for tenant ${tenantId}`,
    functionName,
    fileName
  );

  if (!tenantId) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("User not authenticated"));
  }

  try {
    const installations = await PluginService.getInstalledPlugins(
      tenantId
    );

    logStructured(
      "successful",
      `${installations.length} installed plugins found`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](installations));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve installed plugins",
      functionName,
      fileName
    );
    logger.error("❌ Error in getInstalledPlugins:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get plugin categories
 */
export async function getCategories(
  _req: Request,
  res: Response
): Promise<any> {
  const functionName = "getCategories";
  logStructured("processing", "fetching plugin categories", functionName, fileName);

  try {
    const categories = await PluginService.getCategories();

    logStructured(
      "successful",
      `${categories.length} categories found`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](categories));
  } catch (error) {
    logStructured("error", "failed to retrieve categories", functionName, fileName);
    logger.error("❌ Error in getCategories:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Update plugin configuration
 */
export async function updatePluginConfiguration(
  req: Request,
  res: Response
): Promise<any> {
  const installationId = parseInt(req.params.id);
  const { configuration } = req.body;
  const userId = (req as any).userId;
  const organizationId = (req as any).organizationId;
  const tenantId = (req as any).tenantId;

  const functionName = "updatePluginConfiguration";
  logStructured(
    "processing",
    `updating configuration for plugin installation ${installationId}`,
    functionName,
    fileName
  );

  if (!configuration || typeof configuration !== "object") {
    return res
      .status(400)
      .json(STATUS_CODE[400]("Configuration object is required"));
  }

  if (!userId || !organizationId || !tenantId) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("User not authenticated"));
  }

  try {
    const updated = await PluginService.updateConfiguration(
      installationId,
      userId,
      tenantId,
      configuration
    );

    logStructured(
      "successful",
      `plugin installation ${installationId} configuration updated`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](updated));
  } catch (error) {
    if (error instanceof ValidationException) {
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      "failed to update plugin configuration",
      functionName,
      fileName
    );
    logger.error("❌ Error in updatePluginConfiguration:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Test plugin connection
 */
export async function testPluginConnection(
  req: Request,
  res: Response
): Promise<any> {
  const pluginKey = req.params.key;
  const { configuration } = req.body;
  const userId = (req as any).userId;
  const organizationId = (req as any).organizationId;
  const tenantId = (req as any).tenantId;

  const functionName = "testPluginConnection";
  logStructured(
    "processing",
    `testing connection for plugin ${pluginKey}`,
    functionName,
    fileName
  );

  if (!configuration || typeof configuration !== "object") {
    return res
      .status(400)
      .json(STATUS_CODE[400]("Configuration object is required"));
  }

  if (!userId || !organizationId || !tenantId) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("User not authenticated"));
  }

  try {
    const result = await PluginService.testConnection(
      pluginKey,
      configuration,
      { userId, tenantId }
    );

    logStructured(
      result.success ? "successful" : "error",
      `plugin ${pluginKey} connection test ${result.success ? 'succeeded' : 'failed'}`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    logStructured("error", "failed to test plugin connection", functionName, fileName);
    logger.error("❌ Error in testPluginConnection:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Connect OAuth workspace for plugin (Slack)
 */
export async function connectOAuthWorkspace(
  req: Request,
  res: Response
): Promise<any> {
  const pluginKey = req.params.key;
  const { code } = req.body;
  const userId = (req as any).userId;
  const organizationId = (req as any).organizationId;
  const tenantId = (req as any).tenantId;

  const functionName = "connectOAuthWorkspace";
  logStructured(
    "processing",
    `connecting OAuth workspace for plugin ${pluginKey}`,
    functionName,
    fileName
  );

  if (!code) {
    return res.status(400).json(STATUS_CODE[400]("OAuth code is required"));
  }

  if (!userId || !organizationId || !tenantId) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("User not authenticated"));
  }

  try {
    const result = await PluginService.connectOAuthWorkspace(
      pluginKey,
      code,
      userId,
      tenantId
    );

    logStructured(
      "successful",
      `OAuth workspace connected for plugin ${pluginKey}`,
      functionName,
      fileName
    );

    return res.status(201).json(STATUS_CODE[201](result));
  } catch (error) {
    logStructured("error", "failed to connect OAuth workspace", functionName, fileName);
    logger.error("❌ Error in connectOAuthWorkspace:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Get connected OAuth workspaces for plugin (Slack)
 */
export async function getOAuthWorkspaces(
  req: Request,
  res: Response
): Promise<any> {
  const pluginKey = req.params.key;
  const userId = (req as any).userId;
  const tenantId = (req as any).tenantId;

  const functionName = "getOAuthWorkspaces";
  logStructured(
    "processing",
    `fetching OAuth workspaces for plugin ${pluginKey}`,
    functionName,
    fileName
  );

  if (!userId || !tenantId) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("User not authenticated"));
  }

  try {
    const workspaces = await PluginService.getOAuthWorkspaces(
      pluginKey,
      userId,
      tenantId
    );

    logStructured(
      "successful",
      `${workspaces.length} OAuth workspaces found for plugin ${pluginKey}`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](workspaces));
  } catch (error) {
    logStructured("error", "failed to fetch OAuth workspaces", functionName, fileName);
    logger.error("❌ Error in getOAuthWorkspaces:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Update OAuth workspace settings (Slack routing types)
 */
export async function updateOAuthWorkspace(
  req: Request,
  res: Response
): Promise<any> {
  const pluginKey = req.params.key;
  const webhookId = parseInt(req.params.webhookId);
  const { routing_type, is_active } = req.body;
  const userId = (req as any).userId;
  const tenantId = (req as any).tenantId;

  const functionName = "updateOAuthWorkspace";
  logStructured(
    "processing",
    `updating OAuth workspace ${webhookId} for plugin ${pluginKey}`,
    functionName,
    fileName
  );

  if (!userId || !tenantId) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("User not authenticated"));
  }

  try {
    const result = await PluginService.updateOAuthWorkspace(
      pluginKey,
      webhookId,
      userId,
      tenantId,
      { routing_type, is_active }
    );

    logStructured(
      "successful",
      `OAuth workspace ${webhookId} updated for plugin ${pluginKey}`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    logStructured("error", "failed to update OAuth workspace", functionName, fileName);
    logger.error("❌ Error in updateOAuthWorkspace:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

/**
 * Disconnect OAuth workspace for plugin (Slack)
 */
export async function disconnectOAuthWorkspace(
  req: Request,
  res: Response
): Promise<any> {
  const pluginKey = req.params.key;
  const webhookId = parseInt(req.params.webhookId);
  const userId = (req as any).userId;
  const tenantId = (req as any).tenantId;

  const functionName = "disconnectOAuthWorkspace";
  logStructured(
    "processing",
    `disconnecting OAuth workspace ${webhookId} for plugin ${pluginKey}`,
    functionName,
    fileName
  );

  if (!userId || !tenantId) {
    return res
      .status(401)
      .json(STATUS_CODE[401]("User not authenticated"));
  }

  try {
    await PluginService.disconnectOAuthWorkspace(
      pluginKey,
      webhookId,
      userId,
      tenantId
    );

    logStructured(
      "successful",
      `OAuth workspace ${webhookId} disconnected for plugin ${pluginKey}`,
      functionName,
      fileName
    );

    return res.status(200).json(STATUS_CODE[200]("Workspace disconnected successfully"));
  } catch (error) {
    logStructured("error", "failed to disconnect OAuth workspace", functionName, fileName);
    logger.error("❌ Error in disconnectOAuthWorkspace:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
