import { Request, Response } from "express";
import { createAutomationQuery, deleteAutomationByIdQuery, getAllAutomationActionsByTriggerIdQuery, getAllAutomationsQuery, getAllAutomationTriggersQuery, getAutomationByIdQuery, updateAutomationByIdQuery } from "../utils/automation.utils";
import { sequelize } from "../database/db";
import { ITenantAutomationAction } from "../domain.layer/interfaces/i.tenantAutomationAction";
import { STATUS_CODE } from "../utils/statusCode.utils";

export const getAllAutomationTriggers = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getAllAutomationTriggersQuery();
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    console.error("Error fetching automation triggers:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const getAllAutomationActionsByTriggerId = async (
  req: Request,
  res: Response
) => {
  const triggerId = parseInt(req.params.triggerId, 10);
  if (isNaN(triggerId)) {
    return res.status(400).json({ message: "Invalid trigger ID" });
  }

  try {
    const result = await getAllAutomationActionsByTriggerIdQuery(triggerId);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    console.error(`Error fetching actions for trigger ID ${triggerId}:`, error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const getAllAutomations = async (
  req: Request,
  res: Response
) => {
  try {
    const result = await getAllAutomationsQuery(req.tenantId!);
    return res.status(200).json(STATUS_CODE[200](result));
  } catch (error) {
    console.error("Error fetching automations:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const getAutomationById = async (
  req: Request,
  res: Response
) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid automation ID" });
  }

  try {
    const automation = await getAutomationByIdQuery(id, req.tenantId!);
    if (!automation) {
      return res.status(404).json(STATUS_CODE[404]({ message: "Automation not found" }));
    }
    return res.status(200).json(STATUS_CODE[200](automation));
  } catch (error) {
    console.error(`Error fetching automation with ID ${id}:`, error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const createAutomation = async (
  req: Request,
  res: Response
) => {
  const transaction = await sequelize.transaction();
  try {
    const triggerId = req.body.triggerId as number;
    const name = req.body.name as string;
    const actions = req.body.actions as Partial<ITenantAutomationAction>[];

    if (!triggerId || !name || !Array.isArray(actions) || actions.length === 0) {
      await transaction.rollback();
      return res.status(400).json(STATUS_CODE[400]({ message: "Missing required fields: triggerId, name, actions" }));
    }

    const automation = await createAutomationQuery(
      triggerId,
      name,
      actions,
      req.userId!,
      req.tenantId!,
      transaction
    );

    await transaction.commit();
    return res.status(201).json(STATUS_CODE[201](automation));
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating automation:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const updateAutomation = async (
  req: Request,
  res: Response
) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json(STATUS_CODE[400]({ message: "Invalid automation ID" }));
  }

  const transaction = await sequelize.transaction();
  try {
    const actions = req.body.actions as Partial<ITenantAutomationAction>[];

    const automation = await updateAutomationByIdQuery(
      id,
      { name: req.body.name, is_active: req.body.is_active, trigger_id: req.body.triggerId },
      actions,
      req.tenantId!,
      transaction
    );

    await transaction.commit();
    return res.status(200).json(STATUS_CODE[200](automation));
  } catch (error) {
    await transaction.rollback();
    console.error(`Error updating automation with ID ${id}:`, error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export const deleteAutomationById = async (
  req: Request,
  res: Response
) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json(STATUS_CODE[400]({ message: "Invalid automation ID" }));
  }

  const transaction = await sequelize.transaction();
  try {
    const deleted = await deleteAutomationByIdQuery(id, req.tenantId!, transaction);
    if (!deleted) {
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]({ message: "Automation not found" }));
    }
    await transaction.commit();
    return res.status(200).json(STATUS_CODE[200]({ message: "Automation deleted successfully" }));
  } catch (error) {
    await transaction.rollback();
    console.error(`Error deleting automation with ID ${id}:`, error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
