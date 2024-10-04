import { Request, Response } from "express";
const MOCK_DATA_ON = process.env.MOCK_DATA_ON;
import {
  createMockRole,
  deleteMockRoleById,
  getAllMockRoles,
  getMockRoleById,
  updateMockRoleById,
} from "../mocks/tools/role.mock.db";
import {
  createNewRoleQuery,
  deleteRoleByIdQuery,
  getAllRolesQuery,
  getRoleByIdQuery,
  updateRoleByIdQuery,
} from "../utils/role.utils";

export async function getAllRoles(req: Request, res: Response): Promise<any> {
  console.log("getAllRoles");
  try {
    if (MOCK_DATA_ON === "true") {
      // using getAllMockRoles
      const roles = getAllMockRoles();

      if (roles) {
        return res.status(200).json(roles);
      }

      return res.status(400);
    } else {
      const roles = await getAllRolesQuery();

      if (roles) {
        return res.status(200).json({
          roles,
        });
      }

      return res.status(400);
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

export async function getRoleById(req: Request, res: Response): Promise<any> {
  console.log("getRoleById");
  try {
    const roleId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      // using getMockRoleById
      const role = getMockRoleById(roleId);

      if (role) {
        return res.status(200).json(role);
      }

      return res.status(404).json({ message: "Role not found" });
    } else {
      const role = await getRoleByIdQuery(roleId);

      if (role) {
        return res.status(200).json(role);
      }

      return res.status(404).json({ message: "Role not found" });
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

export async function createRole(req: Request, res: Response): Promise<any> {
  console.log("createRole");
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Name and description are required" });
    }

    if (MOCK_DATA_ON === "true") {
      const newRole = createMockRole({ name, description });

      if (newRole) {
        return res.status(201).json(newRole);
      }

      return res.status(400).json({ message: "Failed to create role" });
    } else {
      const newRole = await createNewRoleQuery({ name, description });

      if (newRole) {
        return res.status(201).json(newRole);
      }

      return res.status(400).json({ message: "Failed to create role" });
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

export async function updateRoleById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("updateRoleById");
  try {
    const roleId = parseInt(req.params.id);
    const { name, description } = req.body;

    if (!name || !description) {
      return res
        .status(400)
        .json({ message: "Name and description are required" });
    }

    if (MOCK_DATA_ON === "true") {
      // Update mock role logic here
      const updatedRole = updateMockRoleById(roleId, { name, description });

      if (updatedRole) {
        return res.status(200).json(updatedRole);
      }

      return res.status(404).json({ message: "Role not found" });
    } else {
      const updatedRole = await updateRoleByIdQuery(roleId, {
        name,
        description,
      });

      if (updatedRole) {
        return res.status(200).json(updatedRole);
      }

      return res.status(404).json({ message: "Role not found" });
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}

export async function deleteRoleById(
  req: Request,
  res: Response
): Promise<any> {
  console.log("deleteRoleById");
  try {
    const roleId = parseInt(req.params.id);

    if (MOCK_DATA_ON === "true") {
      // Delete mock role logic here
      const deletedRole = deleteMockRoleById(roleId);

      if (deletedRole) {
        return res.status(200).json({ message: "Role deleted successfully" });
      }

      return res.status(404).json({ message: "Role not found" });
    } else {
      const deletedRole = await deleteRoleByIdQuery(roleId);

      if (deletedRole) {
        return res.status(200).json({ message: "Role deleted successfully" });
      }

      return res.status(404).json({ message: "Role not found" });
    }
  } catch (error) {
    return res.status(500).json({
      error: (error as Error).message,
    });
  }
}
