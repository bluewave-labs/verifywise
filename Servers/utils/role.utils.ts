import { Role } from "../models/role.model";
import pool from "../database/db";

export const getAllRolesQuery = async (): Promise<Role[]> => {
  console.log("getAllRoles");
  const roles = await pool.query("SELECT * FROM roles");
  return roles.rows;
};

export const getRoleByIdQuery = async (
  id: number
): Promise<Role | null> => {
  console.log("getRoleById", id);
  const result = await pool.query("SELECT * FROM roles WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewRoleQuery = async (role: {
  name: string;
  description: string;
}): Promise<Role> => {
  console.log("createNewRole", role);
  const result = await pool.query(
    `INSERT INTO roles(name, description) VALUES ($1, $2) RETURNING *`,
    [role.name, role.description]
  );
  return result.rows[0];
};

export const updateRoleByIdQuery = async (
  id: number,
  role: Partial<{
    name: string;
    description: string;
  }>
): Promise<Role | null> => {
  console.log("updateRoleById", id, role);
  const result = await pool.query(
    `UPDATE roles SET name = $1, description = $2 WHERE id = $2 RETURNING *`,
    [role.name, role.description, id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteRoleByIdQuery = async (
  id: number
): Promise<Role | null> => {
  console.log("deleteRoleById", id);
  const result = await pool.query(
    `DELETE FROM roles WHERE id = $1 RETURNING *`,
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};
