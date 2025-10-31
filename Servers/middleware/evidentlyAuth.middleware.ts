import { Request, Response, NextFunction } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { decryptText } from "../tools/createSecureValue";
import { getEvidentlyConfigByOrganizationId } from "../utils/evidentlyConfig.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";

const fileName = "evidentlyAuth.middleware.ts";

/**
 * Middleware to retrieve and decrypt Evidently credentials from database
 * Attaches credentials to req.evidentlyConfig for use in controllers
 */
export default async function evidentlyAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> {
  const functionName = "evidentlyAuthMiddleware";

  try {
    const organizationId = (req as any).user?.organizationId;

    if (!organizationId) {
      logStructured(
        "error",
        "Organization ID not found in token",
        functionName,
        fileName
      );
      return res
        .status(401)
        .json(STATUS_CODE[401]("Organization ID not found in authentication token"));
    }

    // Get config from database
    const config = await getEvidentlyConfigByOrganizationId(organizationId);

    if (!config) {
      logStructured(
        "error",
        `No Evidently configuration found for organization ${organizationId}`,
        functionName,
        fileName
      );
      return res
        .status(404)
        .json(STATUS_CODE[404]("Evidently configuration not found. Please configure Evidently first."));
    }

    if (!config.is_configured) {
      logStructured(
        "error",
        `Evidently not configured for organization ${organizationId}`,
        functionName,
        fileName
      );
      return res
        .status(404)
        .json(STATUS_CODE[404]("Evidently is not properly configured"));
    }

    // Decrypt API token
    const decryptResult = decryptText({
      value: config.api_token_encrypted,
      iv: config.api_token_iv,
    });

    if (!decryptResult.success || !decryptResult.data) {
      logStructured(
        "error",
        `Failed to decrypt Evidently API token: ${decryptResult.error}`,
        functionName,
        fileName
      );
      return res
        .status(500)
        .json(STATUS_CODE[500]("Failed to decrypt Evidently credentials"));
    }

    // Attach credentials to request object
    (req as any).evidentlyConfig = {
      url: config.evidently_url,
      apiToken: decryptResult.data,
      configId: config.id,
    };

    logStructured(
      "successful",
      `Evidently credentials retrieved for organization ${organizationId}`,
      functionName,
      fileName
    );

    next();
  } catch (error: any) {
    logStructured(
      "error",
      `Error in evidentlyAuthMiddleware: ${error.message}`,
      functionName,
      fileName
    );
    logger.error("Error in evidentlyAuthMiddleware:", error);
    return res
      .status(500)
      .json(STATUS_CODE[500]("Internal server error while retrieving Evidently configuration"));
  }
}
