import { Request, Response } from "express";
import { getTiersFeaturesQuery } from "../utils/tiers.utils";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import {
  validateTierIdParam
} from "../utils/validations/tiersValidation.utils";
import { ValidationError } from "../utils/validations/validation.utils";

async function getTiersFeatures(req: Request, res: Response) {
    const tierId = parseInt(req.params.id);

    // Validate tier ID parameter
    const tierIdValidation = validateTierIdParam(tierId);
    if (!tierIdValidation.isValid) {
        logStructured("error", `Invalid tier ID parameter: ${req.params.id}`, "getTiersFeatures", "tiers.ctrl.ts");
        return res.status(400).json({
            status: 'error',
            message: tierIdValidation.message || 'Invalid tier ID',
            code: tierIdValidation.code || 'INVALID_PARAMETER'
        });
    }

    logStructured("processing", "Fetching tiers features", "getTiersFeatures", "tiers.ctrl.ts");
    logger.debug('🔍 Fetching tiers features');

    try {
        const tiersFeatures = await getTiersFeaturesQuery(tierId);

        if (tiersFeatures) {
            logStructured("successful", "Tiers features fetched successfully", "getTiersFeatures", "tiers.ctrl.ts");
            return res.status(200).json(STATUS_CODE[200](tiersFeatures));
        }

        logStructured("error", "Tiers features not found", "getTiersFeatures", "tiers.ctrl.ts");
        return res.status(404).json(STATUS_CODE[404]({ message: 'Tiers features not found' }));
    } catch (error) {
        logStructured("error", `Error fetching tier with id: ${tierId}`, "getTiersFeatures", "tiers.ctrl.ts");
        logger.error('❌ Error fetching tiers features:', error);
        return res.status(500).json(STATUS_CODE[500]({ message: 'Internal server error' }));
    }
}


export { getTiersFeatures };