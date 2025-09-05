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

export async function getSubscriptionByIdController(
  req: Request,
  res: Response
) {
  const id = parseInt(req.params.id);
  
  logStructured(
    "processing",
    `Fetching subscription by ID: ${id}`,
    "getSubscriptionByIdController",
    "subscriptions.ctrl.ts"
  );
  logger.debug(`🔍 Looking up subscription with ID: ${id}`);

  try {
    const subscription = await getSubscriptionById(id);
    if (subscription) {
      logStructured(
        "successful",
        `Subscription found: ID ${id}`,
        "getSubscriptionByIdController",
        "subscriptions.ctrl.ts"
      );
      return res.status(200).json(STATUS_CODE[200](subscription));
    }

    logStructured(
      "error",
      `Subscription not found: ID ${id}`,
      "getSubscriptionByIdController",
      "subscriptions.ctrl.ts"
    );
    return res.status(404).json(STATUS_CODE[404]({ message: "Subscription not found" }));
  } catch (error) {
    logStructured(
      "error",
      `Failed to fetch subscription: ID ${id}`,
      "getSubscriptionByIdController",
      "subscriptions.ctrl.ts"
    );
    logger.error("❌ Error in getSubscriptionByIdController:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateSubscriptionController(
  req: Request,
  res: Response
) {
  const transaction = await sequelize.transaction();
  const id = parseInt(req.params.id);
  const { tier_id, stripe_sub_id, status, start_date, end_date } = req.body;

  logStructured(
    "processing",
    "Updating subscription",
    "updateSubscriptionController",
    "subscriptions.ctrl.ts"
  );
  logger.debug("✏️ Updating subscription");

  try {
    const subscription = await getSubscriptionById(id);
    if (subscription) {
      await subscription.updateSubscription({
        tier_id,
        stripe_sub_id,
        status,
        start_date,
        end_date,
      });

      const updatedSubscription = (await updateSubscription(
        id,
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
