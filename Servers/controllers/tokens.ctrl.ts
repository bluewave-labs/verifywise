import { Request, Response } from "express";
import { sequelize } from "../database/db";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import { logEvent } from "../utils/logger/dbLogger";
import { STATUS_CODE } from "../utils/statusCode.utils";
import { generateUserTokens } from "../utils/auth.utils";
import { getUserByIdQuery } from "../utils/user.utils";
import { createApiTokenQuery, deleteApiTokenQuery, getApiTokensQuery } from "../utils/tokens.utils";

export const createApiToken = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  const { name } = req.body;
  logStructured('processing', `starting API token creation for ${name}`, 'createApiToken', 'tokens.ctrl.ts');
  logger.debug(`🛠️ Creating API token: ${name}`);
  try {
    const user = await getUserByIdQuery(req.userId!, transaction);
    logStructured('processing', `fetched user ${user.id} for API token creation`, 'createApiToken', 'tokens.ctrl.ts');
    logger.debug(`🔍 Fetched user: ${user.id}`);

    const { accessToken } = generateUserTokens({
      id: user.id!,
      email: user.email!,
      roleName: "Admin",
      organizationId: req.organizationId!,
    }, res);
    logStructured('processing', `generated token for API token creation`, 'createApiToken', 'tokens.ctrl.ts');
    logger.debug(`🔐 Generated token for user: ${user.id}`);

    const tokenResponse = await createApiTokenQuery({
      name: name,
      token: accessToken,
      expires_at: new Date(Date.now() + 1 * 3600 * 1000 * 24 * 30), // 30 days
      created_by: req.userId!,
    }, req.tenantId!, transaction);
    logStructured('successful', `created API token ${tokenResponse.id} for user ${user.id}`, 'createApiToken', 'tokens.ctrl.ts');
    logger.debug(`✅ Created API token: ${tokenResponse.id} for user: ${user.id}`);

    await transaction.commit();
    return res.status(201).json(STATUS_CODE[201](tokenResponse));
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationException) {
      logStructured('error', `validation failed: ${error.message}`, 'createApiToken', 'tokens.ctrl.ts');
      await logEvent('Error', `Validation error during API token creation: ${error.message}`);
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured('error', `unexpected error: ${name}`, 'createApiToken', 'tokens.ctrl.ts');
    await logEvent('Error', `Unexpected error during API token creation: ${(error as Error).message}`);
    logger.error('❌ Error in createApiToken:', error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const getApiTokens = async (req: Request, res: Response) => {
  logger.debug(`🛠️ Fetching API tokens`);
  logStructured('processing', `starting API tokens fetch`, 'getApiTokens', 'tokens.ctrl.ts');
  try {
    const tokens = await getApiTokensQuery(req.tenantId!);
    logStructured('successful', `fetched ${tokens.length} API tokens`, 'getApiTokens', 'tokens.ctrl.ts');
    logger.debug(`✅ Fetched ${tokens.length} API tokens`);
    return res.status(200).json(STATUS_CODE[200](tokens));
  } catch (error) {
    logStructured('error', `unexpected error fetching API tokens`, 'getApiTokens', 'tokens.ctrl.ts');
    await logEvent('Error', `Unexpected error fetching API tokens: ${(error as Error).message}`);
    logger.error('❌ Error in getApiTokens:', error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const deleteApiToken = async (req: Request, res: Response) => {
  const { id } = req.params;
  logger.debug(`🛠️ Deleting API token: ${id}`);
  logStructured('processing', `starting API token deletion for ${id}`, 'deleteApiToken', 'tokens.ctrl.ts');
  try {
    const success = await deleteApiTokenQuery(parseInt(id), req.tenantId!);
    if (!success) {
      logStructured('error', `API token not found: ${id}`, 'deleteApiToken', 'tokens.ctrl.ts');
      await logEvent('Error', `API token not found for deletion: ${id}`);
      return res.status(404).json(STATUS_CODE[404]({ message: "API token not found" }));
    }
    logStructured('successful', `deleted API token: ${id}`, 'deleteApiToken', 'tokens.ctrl.ts');
    logger.debug(`✅ Deleted API token: ${id}`);
    return res.status(200).json(STATUS_CODE[200]({ message: "API token deleted successfully" }));
  } catch (error) {
    logStructured('error', `unexpected error: ${id}`, 'deleteApiToken', 'tokens.ctrl.ts');
    await logEvent('Error', `Unexpected error during API token deletion: ${(error as Error).message}`);
    logger.error('❌ Error in deleteApiToken:', error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
