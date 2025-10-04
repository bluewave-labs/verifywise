import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import { sequelize } from "../database/db";
import {
  ValidationException,
  BusinessLogicException,
  NotFoundException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";
import {
  getAllSlackWebhooksQuery,
  createNewSlackWebhookQuery,
  updateSlackWebhookByIdQuery,
  getSlackWebhookByIdAndChannelQuery,
} from "../utils/slackWebhook.utils";
import { SlackWebhookModel } from "../domain.layer/models/slackNotification/slackWebhook.model";
import { inviteBotToChannel, sendImmediateMessage } from "../services/slackNotificationService";
import { ISlackWebhook } from "../domain.layer/interfaces/i.slackWebhook";

const fileName = "slackWebhook.ctrl.ts";

export async function getAllSlackWebhooks(
  req: Request,
  res: Response,
): Promise<any> {
  const functionName = "getAllSlackWebhooks";
  logStructured(
    "processing",
    "starting getAllSlackWebhooks",
    functionName,
    fileName,
  );
  logger.debug("🔍 Fetching all slackWebhooks");
  const userId = req.query.userId as string;
  const channel = req.query.channel as string;
  if (!userId) {
    logStructured(
      "error",
      "userId query parameter is required",
      functionName,
      fileName,
    );
    return res
      .status(400)
      .json(STATUS_CODE[400]("userId query parameter is required"));
  }
  try {
    let slackWebhooks: ISlackWebhook[] = [];

    if (channel) {
      slackWebhooks = await getSlackWebhookByIdAndChannelQuery(
        parseInt(userId),
        channel,
      );
    } else {
      slackWebhooks = await getAllSlackWebhooksQuery(userId);
    }

    if (slackWebhooks) {
      logStructured(
        "successful",
        `${slackWebhooks.length} slackWebhooks found`,
        functionName,
        fileName,
      );
      return res.status(200).json(STATUS_CODE[200](slackWebhooks));
    }
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve slackWebhooks",
      functionName,
      fileName,
    );
    logger.error("❌ Error in getAllSlackWebhooks:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getSlackWebhookById(
  req: Request,
  res: Response,
): Promise<any> {
  const requestId = parseInt(req.params.id);
  const functionName = "getSlackWebhookById";
  logStructured(
    "processing",
    `fetching slackWebhook by ID: ${requestId}`,
    functionName,
    fileName,
  );
  logger.debug(`🔍 Looking up slackWebhook with ID: ${requestId}`);

  try {
    const slackWebhook =
      await SlackWebhookModel.findByIdWithValidation(requestId);

    if (slackWebhook) {
      logStructured(
        "successful",
        `slackWebhook found: ID ${requestId}`,
        functionName,
        fileName,
      );
      return res.status(200).json(STATUS_CODE[200](slackWebhook.toJSON()));
    }

    logStructured(
      "successful",
      `no slackWebhook found: ID ${requestId}`,
      functionName,
      fileName,
    );
    return res.status(404).json(STATUS_CODE[404](slackWebhook));
  } catch (error) {
    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        functionName,
        fileName,
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `slackWebhook not found: ID ${requestId}`,
        functionName,
        fileName,
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logStructured(
      "error",
      `failed to fetch slackWebhook: ID ${requestId}`,
      functionName,
      fileName,
    );
    logger.error("❌ Error in getSlackWebhookById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

async function validateSlackOAuth(code: string): Promise<any> {
  try {
    const url = process.env.SLACK_API_URL;
    const searchParams = {
      client_id: process.env.SLACK_CLIENT_ID || "",
      client_secret: process.env.SLACK_CLIENT_SECRET || "",
      code: code,
      redirect_uri: `${process.env.FRONTEND_URL}/setting/?activeTab=slack`,
    };
    if (!url) {
      throw new Error("Slack API URL is not configured");
    }
    const tokenResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(searchParams),
    });
    const data = await tokenResponse.json();

    if (data.ok) {
      return data;
    } else {
      throw new Error(data.error || "Slack OAuth failed");
    }
  } catch (error) {
    throw new Error("Failed to validate Slack OAuth code");
  }
}

export async function createNewSlackWebhook(
  req: Request,
  res: Response,
): Promise<any> {
  const functionName = "createNewSlackWebhook";
  const transaction = await sequelize.transaction();

  logStructured(
    "processing",
    `starting slackWebhook creation`,
    functionName,
    fileName,
  );
  logger.debug(`🛠️ Creating slackWebhook`);

  try {
    const slackWebhookData = await validateSlackOAuth(req.body.code);
    // Create slackWebhook using the enhanced SlackWebhookModel method
    const slackWebhookModel = await SlackWebhookModel.createNewSlackWebhook(
      slackWebhookData.access_token,
      slackWebhookData.scope,
      slackWebhookData.team.name,
      slackWebhookData.team.id,
      slackWebhookData.incoming_webhook.channel,
      slackWebhookData.incoming_webhook.channel_id,
      slackWebhookData.incoming_webhook.configuration_url,
      slackWebhookData.incoming_webhook.url,
      req.body.userId,
      true,
    );

    // Validate slackWebhook data before saving
    await slackWebhookModel.validateSlackWebhookData();

    const newSlackWebhook = await createNewSlackWebhookQuery(
      slackWebhookModel,
      transaction,
    );

    await inviteBotToChannel(slackWebhookData.authed_user.access_token, slackWebhookData.incoming_webhook.channel_id, slackWebhookData.bot_user_id);

    if (newSlackWebhook) {
      await transaction.commit();
      logStructured(
        "successful",
        `slackWebhook created: ID ${newSlackWebhook.id}`,
        functionName,
        fileName,
      );
      await logEvent(
        "Create",
        `slackWebhook created: ID ${newSlackWebhook.id}, title: ${slackWebhookData.title}`,
      );
      return res.status(201).json(STATUS_CODE[201](newSlackWebhook));
    }

    logStructured(
      "error",
      "failed to create slackWebhook",
      functionName,
      fileName,
    );
    await logEvent(
      "Error",
      `slackWebhook creation failed: ${slackWebhookData.title}`,
    );
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to create slackWebhook"));
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
        `Validation error during slackWebhook creation: ${error.message}`,
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        functionName,
        fileName,
      );
      await logEvent(
        "Error",
        `Business logic error during slackWebhook creation: ${error.message}`,
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error during slackWebhook creation`,
      functionName,
      fileName,
    );
    await logEvent(
      "Error",
      `Unexpected error during slackWebhook creation: ${(error as Error).message}`,
    );
    logger.error("❌ Error in createNewslackWebhook:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateSlackWebhookById(
  req: Request,
  res: Response,
): Promise<any> {
  const functionName = "updateSlackWebhookById";
  const transaction = await sequelize.transaction();
  const slackWebhookId = parseInt(req.params.id);
  const updateData = req.body;

  logStructured(
    "processing",
    `updating slackWebhook ID ${slackWebhookId}`,
    functionName,
    fileName,
  );
  logger.debug(`✏️ Update requested for slackWebhook ID ${slackWebhookId}`);

  try {
    // Find existing slackWebhook with validation
    const existingSlackWebhook =
      await SlackWebhookModel.findByIdWithValidation(slackWebhookId);

    if (!existingSlackWebhook) {
      logStructured(
        "error",
        `slackWebhook not found: ID ${slackWebhookId}`,
        functionName,
        fileName,
      );
      await logEvent(
        "Error",
        `Update failed — slackWebhook not found: ID ${slackWebhookId}`,
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("SlackWebhook not found"));
    }

    // Update slackWebhook using the enhanced method
    await existingSlackWebhook.updateSlackWebhook({
      is_active: updateData.is_active,
      routing_type: updateData.routing_type,
    });

    // Validate updated data
    await existingSlackWebhook.validateSlackWebhookData();

    const updatedSlackWebhook = await updateSlackWebhookByIdQuery(
      slackWebhookId,
      existingSlackWebhook,
      transaction,
    );

    if (updatedSlackWebhook) {
      await transaction.commit();
      logStructured(
        "successful",
        `slackWebhook updated: ID ${slackWebhookId}`,
        functionName,
        fileName,
      );
      await logEvent("Update", `SlackWebhook updated: ID ${slackWebhookId}`);
      return res.status(202).json(STATUS_CODE[202](updatedSlackWebhook));
    }

    logStructured(
      "error",
      `failed to update slackWebhook: ID ${slackWebhookId}`,
      functionName,
      fileName,
    );
    await logEvent("Error", `SlackWebhook update failed: ID ${slackWebhookId}`);
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]("Failed to update slackWebhook"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        functionName,
        fileName,
      );
      await logEvent(
        "Error",
        `Validation error during slackWebhook update: ${error.message}`,
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        functionName,
        fileName,
      );
      await logEvent(
        "Error",
        `Business logic error during slackWebhook update: ${error.message}`,
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `slackWebhook not found: ID ${slackWebhookId}`,
        functionName,
        fileName,
      );
      await logEvent(
        "Error",
        `Update failed — slackWebhook not found: ID ${slackWebhookId}`,
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logStructured(
      "error",
      `unexpected error for slackWebhook ID ${slackWebhookId}`,
      functionName,
      fileName,
    );
    await logEvent(
      "Error",
      `Unexpected error during slackWebhook update for ID ${slackWebhookId}: ${(error as Error).message}`,
    );
    logger.error("❌ Error in updateSlackWebhookById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function sendSlackMessage(
  req: Request,
  res: Response,
): Promise<any> {
  const functionName = "sendSlackMessage";
  const requestId = parseInt(req.params.id);
  const requestBody = req.body;

  logStructured(
    "processing",
    `sending slack message to ID ${requestId}`,
    functionName,
    fileName,
  );
  logger.debug(`✏️ Sending message to slack ID ${requestId}`);

  try {
    const slackWebhook =
      await SlackWebhookModel.findByIdWithValidation(requestId);

    if (!slackWebhook.is_active) {
      throw new Error("This slack channel is no longer active");
    }

    const slackMsgSent = await sendImmediateMessage(slackWebhook!, requestBody);

    if (slackMsgSent.success) {
      logStructured(
        "successful",
        `slackWebhook found: ID ${requestId}`,
        functionName,
        fileName,
      );
      return res.status(200).json(STATUS_CODE[200](slackMsgSent));
    }
  } catch (error: any) {
    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        functionName,
        fileName,
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof NotFoundException) {
      logStructured(
        "error",
        `SlackWebhook not found: ID ${requestId}`,
        functionName,
        fileName,
      );
      return res.status(404).json(STATUS_CODE[404](error.message));
    }

    logStructured(
      "error",
      `Failed to send slack message: ID ${requestId}`,
      functionName,
      fileName,
    );
    logger.error("❌ Error in sendSlackMessage:", error);
    return res.status(500).json({message: (error as Error).message});
  }
}

export async function disableSlackActivity(
  id: number
): Promise<any> {
  const slackWebhook = await SlackWebhookModel.findByIdWithValidation(id);
  const transaction = await sequelize.transaction();
  await slackWebhook.updateSlackWebhook({
    is_active: false
  });

  const updated = await updateSlackWebhookByIdQuery(id, slackWebhook, transaction);

  if (updated) {
    await transaction.commit();
    return;
  } else {
    await transaction.rollback();
    return;
  }
}
