import { Request, Response } from "express";
import { STATUS_CODE } from "../utils/statusCode.utils";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";
import {
  createSubscription,
  getSubscription,
  getSubscriptionById,
  updateSubscription,
} from "../utils/subscription.util";
import { sequelize } from "../database/db";
import { SubscriptionModel } from "../domain.layer/models/subscriptions/subscriptions.model";
import {
  validateCompleteSubscriptionCreation,
  validateSubscriptionIdParam,
  validateCompleteSubscriptionUpdate
} from "../utils/validations/subscriptionsValidation.utils";
import { ValidationError } from "../utils/validations/validation.utils";

export async function getSubscriptionController(req: Request, res: Response) {
  logStructured(
    "processing",
    "Fetching subscriptions",
    "getSubscriptionController",
    "subscriptions.ctrl.ts"
  );
  logger.debug("🔍 Fetching subscriptions");

  try {
    const subscriptions = await getSubscription();

    if (subscriptions && subscriptions.length > 0) {
      logStructured(
        "successful",
        "Subscriptions fetched successfully",
        "getSubscriptionController",
        "subscriptions.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](subscriptions));
    }

    logStructured(
      "error",
      "No subscriptions found",
      "getSubscriptionController",
      "subscriptions.ctrl.ts"
    );
    return res
      .status(404)
      .json(STATUS_CODE[404]({ message: "No subscriptions found" }));
  } catch (error) {
    logStructured(
      "error",
      "Error fetching subscriptions",
      "getSubscriptionController",
      "subscriptions.ctrl.ts"
    );
    logger.error("❌ Error fetching subscriptions:", error);
    return res
      .status(500)
      .json(STATUS_CODE[500]({ message: "Internal server error" }));
  }
}

export async function createSubscriptionController(
  req: Request,
  res: Response
) {
  // Validate subscription creation request
  const validationErrors = validateCompleteSubscriptionCreation(req.body);
  if (validationErrors.length > 0) {
    logStructured(
      "error",
      "Subscription creation validation failed",
      "createSubscriptionController",
      "subscriptions.ctrl.ts"
    );
    return res.status(400).json({
      status: 'error',
      message: 'Subscription creation validation failed',
      errors: validationErrors.map((err: ValidationError) => ({
        field: err.field,
        message: err.message,
        code: err.code
      }))
    });
  }

  const transaction = await sequelize.transaction();
  const {
    organization_id,
    tier_id,
    stripe_sub_id,
    status,
    start_date,
    end_date,
  } = req.body;

  logStructured(
    "processing",
    "Creating subscription",
    "createSubscriptionController",
    "subscriptions.ctrl.ts"
  );
  logger.debug("🔍 Creating subscription");

  try {
    const subscriptionModel = await SubscriptionModel.createNewSubscription({
      organization_id,
      tier_id,
      stripe_sub_id,
      status,
      start_date,
      end_date,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const subscription = await createSubscription(
      subscriptionModel,
      transaction
    );
    if (subscription) {
      await transaction.commit();
      logStructured(
        "successful",
        "Subscription created successfully",
        "createSubscriptionController",
        "subscriptions.ctrl.ts"
      );
      return res.status(201).json(STATUS_CODE[201](subscription));
    }

    logStructured(
      "error",
      "Failed to create subscription",
      "createSubscriptionController",
      "subscriptions.ctrl.ts"
    );
    await logEvent("Error", `Failed to create subscription`);
    await transaction.rollback();
    return res
      .status(400)
      .json(STATUS_CODE[400]({ message: "Failed to create subscription" }));
  } catch (error) {
    logStructured(
      "error",
      "Error creating subscription",
      "createSubscriptionController",
      "subscriptions.ctrl.ts"
    );
    logger.error("❌ Error creating subscription:", error);
    await transaction.rollback();
    return res
      .status(500)
      .json(STATUS_CODE[500]({ message: (error as Error).message }));
  }
}

export async function updateSubscriptionController(
  req: Request,
  res: Response
) {
  const subscriptionId = parseInt(req.params.id);

  // Validate subscription ID parameter
  const subscriptionIdValidation = validateSubscriptionIdParam(subscriptionId);
  if (!subscriptionIdValidation.isValid) {
    logStructured(
      "error",
      `Invalid subscription ID parameter: ${req.params.id}`,
      "updateSubscriptionController",
      "subscriptions.ctrl.ts"
    );
    return res.status(400).json({
      status: 'error',
      message: subscriptionIdValidation.message || 'Invalid subscription ID',
      code: subscriptionIdValidation.code || 'INVALID_PARAMETER'
    });
  }

  // Get existing subscription for business rule validation
  let existingSubscription = null;
  try {
    existingSubscription = await getSubscriptionById(subscriptionId);
  } catch (error) {
    // Continue without existing data if query fails
  }

  // Validate subscription update request
  const validationErrors = validateCompleteSubscriptionUpdate(req.body, existingSubscription);
  if (validationErrors.length > 0) {
    logStructured(
      "error",
      `Subscription update validation failed for ID ${subscriptionId}`,
      "updateSubscriptionController",
      "subscriptions.ctrl.ts"
    );
    return res.status(400).json({
      status: 'error',
      message: 'Subscription update validation failed',
      errors: validationErrors.map((err: ValidationError) => ({
        field: err.field,
        message: err.message,
        code: err.code
      }))
    });
  }

  const transaction = await sequelize.transaction();
  const { tier_id, stripe_sub_id, status, start_date, end_date } = req.body;

  logStructured(
    "processing",
    "Updating subscription",
    "updateSubscriptionController",
    "subscriptions.ctrl.ts"
  );
  logger.debug("✏️ Updating subscription");

  try {
    const subscription = await getSubscriptionById(subscriptionId);
    if (subscription) {
      await subscription.updateSubscription({
        tier_id,
        stripe_sub_id,
        status,
        start_date,
        end_date,
      });

      const updatedSubscription = (await updateSubscription(
        subscriptionId,
        {
          tier_id: subscription.tier_id,
          stripe_sub_id: subscription.stripe_sub_id,
          status: subscription.status,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
          updated_at: new Date(),
        },
        transaction
      )) as SubscriptionModel;

      await transaction.commit();
      logStructured(
        "successful",
        "Subscription updated successfully",
        "updateSubscriptionController",
        "subscriptions.ctrl.ts"
      );
      await logEvent("Update", `Subscription updated successfully`);
      return res.status(200).json(STATUS_CODE[200](updatedSubscription));
    }

    logStructured(
      "error",
      "Subscription not found",
      "updateSubscriptionController",
      "subscriptions.ctrl.ts"
    );
    await logEvent("Error", `Subscription not found`);
    await transaction.rollback();
    return res
      .status(404)
      .json(STATUS_CODE[404]({ message: "Subscription not found" }));
  } catch (error) {
    logStructured(
      "error",
      "Error updating subscription",
      "updateSubscriptionController",
      "subscriptions.ctrl.ts"
    );
    logger.error("❌ Error updating subscription:", error);
    await transaction.rollback();
    return res
      .status(500)
      .json(STATUS_CODE[500]({ message: (error as Error).message }));
  }
}
