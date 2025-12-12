import { Request, Response } from "express";
import { sequelize } from "../database/db";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import { logEvent } from "../utils/logger/dbLogger";
import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createLLMKeyQuery,
  deleteLLMKeyQuery,
  getLLMKeyQuery,
  getLLMKeysQuery,
  getLLMProviderUrl,
  isValidLLMProvider,
  updateLLMKeyByIdQuery,
} from "../utils/llmKey.utils";
import { ILLMKey, LLMProvider } from "../domain.layer/interfaces/i.llmKey";

const fileName = "llmKey.ctrl.ts";

export const getLLMKeys = async (req: Request, res: Response) => {
  const functionName = "getLLMKeys";

  logger.debug(`🛠️ Fetching LLM Keys`);
  logStructured(
    "processing",
    `starting LLM Keys fetch`,
    functionName,
    fileName,
  );
  try {
    const llmKeys = await getLLMKeysQuery(req.tenantId!);
    logStructured(
      "successful",
      `fetched ${llmKeys.length} LLM Keys`,
      functionName,
      fileName,
    );
    logger.debug(`✅ Fetched ${llmKeys.length} LLM Keys`);
    return res.status(200).json(STATUS_CODE[200](llmKeys));
  } catch (error) {
    logStructured(
      "error",
      `unexpected error fetching LLM Keys`,
      functionName,
      fileName,
    );
    await logEvent(
      "Error",
      `Unexpected error fetching LLM Keys: ${(error as Error).message}`,
    );
    logger.error("❌ Error in getLLMKeys:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

export const getLLMKey = async (req: Request, res: Response) => {
  const functionName = "getLLMKey";

  logger.debug(`🛠️ Fetching LLM Keys`);
  logStructured("processing", `starting LLM Key fetch`, functionName, fileName);
  try {
    const name = req.params.name as string;
    const llmKey = await getLLMKeyQuery(req.tenantId!, name);
    logStructured("successful", `fetched LLM Key`, functionName, fileName);
    logger.debug(`✅ Fetched LLM Key with name: ${name}`);
    return res.status(200).json(STATUS_CODE[200](llmKey));
  } catch (error) {
    logStructured(
      "error",
      `unexpected error fetching LLM Key`,
      functionName,
      fileName,
    );
    await logEvent(
      "Error",
      `Unexpected error fetching LLM Key: ${(error as Error).message}`,
    );
    logger.error("❌ Error in getLLMKey:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

export const createLLMKey = async (req: Request, res: Response) => {
  const functionName = "createLLMKey";

  const transaction = await sequelize.transaction();
  const { name, key, model } = req.body;

  if (!name || typeof name !== "string" || !key || typeof key !== "string") {
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Name and key are required"));
  }

  // Validate that name is a valid LLM provider
  if (!isValidLLMProvider(name)) {
    await transaction.rollback();
    return res
      .status(400)
      .json(
        STATUS_CODE[400](
          "Invalid provider name. Must be one of: Anthropic, OpenAI, OpenRouter",
        ),
      );
  }

  logStructured(
    "processing",
    `starting LLM Key creation for ${name}`,
    functionName,
    fileName,
  );
  logger.debug(`🛠️ Creating LLM Key: ${name}`);
  try {
    // Auto-populate URL based on provider name
    const url = getLLMProviderUrl(name as LLMProvider);

    const data: ILLMKey = {
      name: name as LLMProvider,
      key,
      url,
      model,
    };
    const llmKey = await createLLMKeyQuery(data, req.tenantId!, transaction);
    logStructured(
      "successful",
      `created LLM Key ${llmKey.id}`,
      functionName,
      fileName,
    );
    logger.debug(`✅ Created LLM Key: ${llmKey.id}`);

    await transaction.commit();
    return res.status(201).json(STATUS_CODE[201](llmKey));
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        functionName,
        fileName,
      );
      await logEvent(
        "Error",
        `Validation error during LLM Key creation: ${error.message}`,
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", `unexpected error: ${name}`, functionName, fileName);
    await logEvent(
      "Error",
      `Unexpected error during LLM Key creation: ${(error as Error).message}`,
    );
    logger.error("❌ Error in createLLMKey:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

export const updateLLMKey = async (req: Request, res: Response) => {
  const functionName = "updateLLMKey";

  const transaction = await sequelize.transaction();
  const { name, key, model } = req.body;
  const id = parseInt(req.params.id);

  // Validate that name is a valid LLM provider if provided
  if (name && !isValidLLMProvider(name)) {
    await transaction.rollback();
    return res
      .status(400)
      .json(
        STATUS_CODE[400](
          "Invalid provider name. Must be one of: Anthropic, OpenAI, OpenRouter",
        ),
      );
  }

  logStructured(
    "processing",
    `starting LLM Key update for ${name}`,
    functionName,
    fileName,
  );
  logger.debug(`🛠️ Updating LLM Key: ${name}`);
  try {
    // Auto-populate URL based on provider name if name is being updated
    const url = name ? getLLMProviderUrl(name as LLMProvider) : undefined;

    const data: Partial<ILLMKey> = {
      ...(name && { name: name as LLMProvider }),
      ...(key && { key }),
      ...(url && { url }),
      ...(model && { model }),
    };
    const llmKey = await updateLLMKeyByIdQuery(
      id,
      data,
      req.tenantId!,
      transaction,
    );

    if (llmKey) {
      logStructured(
        "successful",
        `updated LLM Key ${id}`,
        functionName,
        fileName,
      );
      logger.debug(`✅ updated LLM Key: ${id}`);

      await transaction.commit();
      return res.status(200).json(STATUS_CODE[200](llmKey));
    }

    await transaction.rollback();
    logStructured(
      "error",
      `LLM Key not found for update: ID ${id}`,
      functionName,
      fileName,
    );

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        functionName,
        fileName,
      );
      await logEvent(
        "Error",
        `Validation error during LLM Key update: ${error.message}`,
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }
    logStructured("error", `unexpected error: ${name}`, functionName, fileName);
    await logEvent(
      "Error",
      `Unexpected error during LLM Key update: ${(error as Error).message}`,
    );
    logger.error("❌ Error in updateLLMKey:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};

export const deleteLLMKey = async (req: Request, res: Response) => {
  const functionName = "deleteLLMKey";

  const { id } = req.params;
  logger.debug(`🛠️ Deleting LLM Key: ${id}`);
  logStructured(
    "processing",
    `starting LLM Key deletion for ${id}`,
    functionName,
    fileName,
  );
  try {
    const success = await deleteLLMKeyQuery(parseInt(id), req.tenantId!);
    if (!success) {
      logStructured(
        "error",
        `LLM Key not found: ${id}`,
        functionName,
        fileName,
      );
      await logEvent("Error", `LLM Key not found for deletion: ${id}`);
      return res
        .status(404)
        .json(STATUS_CODE[404]({ message: "LLM Key not found" }));
    }
    logStructured(
      "successful",
      `deleted LLM Key: ${id}`,
      functionName,
      fileName,
    );
    logger.debug(`✅ Deleted LLM Key: ${id}`);
    return res
      .status(200)
      .json(STATUS_CODE[200]({ message: "LLM Key deleted successfully" }));
  } catch (error) {
    logStructured("error", `unexpected error: ${id}`, functionName, fileName);
    await logEvent(
      "Error",
      `Unexpected error during LLM Key deletion: ${(error as Error).message}`,
    );
    logger.error("❌ Error in deleteLLMKey:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
};
