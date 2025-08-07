import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewRoleQuery,
  deleteRoleByIdQuery,
  getAllRolesQuery,
  getRoleByIdQuery,
  updateRoleByIdQuery,
} from "../utils/role.utils";
import { sequelize } from "../database/db";
import { RoleModel } from "../domain.layer/models/role/role.model";
import { ValidationException } from "../domain.layer/exceptions/custom.exception";
import { logProcessing, logSuccess, logFailure } from "../utils/logger/logHelper";

export async function getAllRoles(req: Request, res: Response): Promise<any> {
  logProcessing({
    description: "starting getAllRoles",
    functionName: "getAllRoles",
    fileName: "role.ctrl.ts",
  });

  try {
    const roles = await getAllRolesQuery();

    await logSuccess({
      eventType: "Read",
      description: "Retrieved all roles",
      functionName: "getAllRoles",
      fileName: "role.ctrl.ts",
    });

    if (roles) {
      return res.status(200).json(STATUS_CODE[200](roles));
    }

    return res.status(204).json(STATUS_CODE[204](roles));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve roles",
      functionName: "getAllRoles",
      fileName: "role.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getRoleById(req: Request, res: Response): Promise<any> {
  const roleId = parseInt(req.params.id);
  logProcessing({
    description: `starting getRoleById for ID ${roleId}`,
    functionName: "getRoleById",
    fileName: "role.ctrl.ts",
  });

  try {
    const role = await getRoleByIdQuery(roleId);

    await logSuccess({
      eventType: "Read",
      description: `Retrieved role ID ${roleId}`,
      functionName: "getRoleById",
      fileName: "role.ctrl.ts",
    });

    if (role) {
      return res.status(200).json(STATUS_CODE[200](role));
    }

    return res.status(404).json(STATUS_CODE[404](role));
  } catch (error) {
    await logFailure({
      eventType: "Read",
      description: "Failed to retrieve role by ID",
      functionName: "getRoleById",
      fileName: "role.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createRole(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();

  logProcessing({
    description: "starting createRole",
    functionName: "createRole",
    fileName: "role.ctrl.ts",
  });

  try {
    const newRole = req.body;

    const roleObj = await RoleModel.createRole(newRole.name, newRole.description);
    const createdRole = await createNewRoleQuery(roleObj, transaction);

    if (createdRole) {
      await transaction.commit();

      await logSuccess({
        eventType: "Create",
        description: "Created new role",
        functionName: "createRole",
        fileName: "role.ctrl.ts",
      });

      return res.status(201).json(STATUS_CODE[201](createdRole));
    }

    await logFailure({
      eventType: "Create",
      description: "Role creation returned null",
      functionName: "createRole",
      fileName: "role.ctrl.ts",
      error: new Error("Role creation returned null")
    });

    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Create",
      description: "Failed to create role",
      functionName: "createRole",
      fileName: "role.ctrl.ts",
      error: error as Error,
    });

    if (error instanceof ValidationException) {
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateRoleById(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  const roleId = parseInt(req.params.id);

  logProcessing({
    description: `starting updateRoleById for ID ${roleId}`,
    functionName: "updateRoleById",
    fileName: "role.ctrl.ts",
  });

  try {
    const updatedRole = req.body;

    const role = await updateRoleByIdQuery(roleId, updatedRole, transaction);

    if (role) {
      await transaction.commit();

      await logSuccess({
        eventType: "Update",
        description: `Updated role ID ${roleId}`,
        functionName: "updateRoleById",
        fileName: "role.ctrl.ts",
      });

      return res.status(202).json(STATUS_CODE[202](role));
    }

    await logSuccess({
      eventType: "Update",
      description: `Role not found for update: ID ${roleId}`,
      functionName: "updateRoleById",
      fileName: "role.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Update",
      description: "Failed to update role",
      functionName: "updateRoleById",
      fileName: "role.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteRoleById(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  const roleId = parseInt(req.params.id);

  logProcessing({
    description: `starting deleteRoleById for ID ${roleId}`,
    functionName: "deleteRoleById",
    fileName: "role.ctrl.ts",
  });

  try {
    const deletedRole = await deleteRoleByIdQuery(roleId, transaction);

    if (deletedRole) {
      await transaction.commit();

      await logSuccess({
        eventType: "Delete",
        description: `Deleted role ID ${roleId}`,
        functionName: "deleteRoleById",
        fileName: "role.ctrl.ts",
      });

      return res.status(202).json(STATUS_CODE[202](deletedRole));
    }

    await logSuccess({
      eventType: "Delete",
      description: `Role not found for deletion: ID ${roleId}`,
      functionName: "deleteRoleById",
      fileName: "role.ctrl.ts",
    });

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();

    await logFailure({
      eventType: "Delete",
      description: "Failed to delete role",
      functionName: "deleteRoleById",
      fileName: "role.ctrl.ts",
      error: error as Error,
    });

    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
