/**
 * Feature Settings Controller
 *
 * Handles GET and PATCH for per-tenant feature toggles.
 */

import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  logProcessing,
  logSuccess,
  logFailure,
} from "../utils/logger/logHelper";
import {
  getFeatureSettingsQuery,
  updateFeatureSettingsQuery,
} from "../utils/featureSettings.utils";

const FILE_NAME = "featureSettings.ctrl.ts";

export async function getFeatureSettings(req: Request, res: Response) {
  const fn = "getFeatureSettings";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "fetching feature settings", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    const settings = await getFeatureSettingsQuery(tenantId);
    await logSuccess({ eventType: "Read", description: "feature settings fetched", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](settings));
  } catch (error) {
    await logFailure({ eventType: "Read", description: "failed to fetch feature settings", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateFeatureSettings(req: Request, res: Response) {
  const fn = "updateFeatureSettings";
  const userId = req.userId!;
  const tenantId = req.tenantId!;

  logProcessing({ description: "updating feature settings", functionName: fn, fileName: FILE_NAME, userId, tenantId });

  try {
    if (req.role !== "Admin") {
      return res.status(403).json(STATUS_CODE[403]("Only admins can manage feature settings"));
    }

    const { lifecycle_enabled } = req.body;

    if (lifecycle_enabled !== undefined && typeof lifecycle_enabled !== "boolean") {
      return res.status(400).json(STATUS_CODE[400]("lifecycle_enabled must be a boolean"));
    }

    const updated = await updateFeatureSettingsQuery(tenantId, {
      lifecycle_enabled,
      updated_by: userId,
    });

    await logSuccess({ eventType: "Update", description: "feature settings updated", functionName: fn, fileName: FILE_NAME, userId, tenantId });
    return res.status(200).json(STATUS_CODE[200](updated));
  } catch (error) {
    await logFailure({ eventType: "Update", description: "failed to update feature settings", functionName: fn, fileName: FILE_NAME, userId, tenantId, error: error as Error });
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
