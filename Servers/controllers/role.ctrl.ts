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

export async function getAllRoles(req: Request, res: Response): Promise<any> {
  try {
    const roles = await getAllRolesQuery();

    if (roles) {
      return res.status(200).json(STATUS_CODE[200](roles));
    }

    return res.status(204).json(STATUS_CODE[204](roles));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getRoleById(req: Request, res: Response): Promise<any> {
  try {
    const roleId = parseInt(req.params.id);

    const role = await getRoleByIdQuery(roleId);

    if (role) {
      return res.status(200).json(STATUS_CODE[200](role));
    }

    return res.status(404).json(STATUS_CODE[404](role));
  } catch (error) {
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createRole(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const newRole: {
      name: string;
      description: string;
    } = req.body;

    const createdRole = await createNewRoleQuery(newRole, transaction);

    if (createdRole) {
      await transaction.commit();
      return res.status(201).json(STATUS_CODE[201](createdRole));
    }

    return res.status(503).json(STATUS_CODE[503]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateRoleById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const roleId = parseInt(req.params.id);
    const updatedRole: {
      name: string;
      description: string;
    } = req.body;

    const role = await updateRoleByIdQuery(roleId, updatedRole, transaction);

    if (role) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](role));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteRoleById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const roleId = parseInt(req.params.id);

    const deletedRole = await deleteRoleByIdQuery(roleId, transaction);

    if (deletedRole) {
      await transaction.commit();
      return res.status(202).json(STATUS_CODE[202](deletedRole));
    }

    return res.status(404).json(STATUS_CODE[404]({}));
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
