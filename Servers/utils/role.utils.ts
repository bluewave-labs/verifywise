/**
 * @file role.utils.ts
 * @description This file contains utility functions for managing roles in the database.
 * It includes functions to get all roles, get a role by ID, create a new role, update a role by ID, and delete a role by ID.
 * Each function interacts with the database using SQL queries and returns the appropriate results.
 */

import { Role } from "../models/Role";
import pool from "../database/db";

/**
 * Fetches all roles from the database.
 * @returns {Promise<Role[]>} A promise that resolves to an array of Role objects.
 */
export const getAllRolesQuery = async (): Promise<Role[]> => {
  console.log("getAllRoles");
  const roles = await pool.query("SELECT * FROM roles");
  return roles.rows;
};

/**
 * Fetches a role by its ID from the database.
 * @param {number} id - The ID of the role to fetch.
 * @returns {Promise<Role | null>} A promise that resolves to the Role object if found, otherwise null.
 */
export const getRoleByIdQuery = async (id: number): Promise<Role | null> => {
  console.log("getRoleById", id);
  const result = await pool.query("SELECT * FROM roles WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

/**
 * Creates a new role in the database.
 * @param {Object} role - The role to create.
 * @param {string} role.name - The name of the role.
 * @param {string} role.description - The description of the role.
 * @returns {Promise<Role>} A promise that resolves to the created Role object.
 */
export const createNewRoleQuery = async (role: {
  name: string;
  description: string;
}): Promise<Role> => {
  console.log("createNewRole", role);
  const result = await pool.query(
    "INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING *",
    [role.name, role.description]
  );
  return result.rows[0];
};

/**
 * Updates a role by its ID in the database.
 * @param {number} id - The ID of the role to update.
 * @param {Object} role - The role fields to update.
 * @param {string} [role.name] - The new name of the role.
 * @param {string} [role.description] - The new description of the role.
 * @returns {Promise<Role | null>} A promise that resolves to the updated Role object if found, otherwise null.
 * @throws {Error} If no fields to update are provided.
 */
export const updateRoleByIdQuery = async (
  id: number,
  role: { name?: string; description?: string }
): Promise<Role | null> => {
  console.log("updateRoleById", id, role);
  const fields = [];
  const values = [];
  let query = "UPDATE roles SET ";

  if (role.name) {
    fields.push("name = $1");
    values.push(role.name);
  }
  if (role.description) {
    fields.push("description = $2");
    values.push(role.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

/**
 * Deletes a role by its ID from the database.
 * @param {number} id - The ID of the role to delete.
 * @returns {Promise<boolean>} A promise that resolves to true if the role was deleted, otherwise false.
 */
export const deleteRoleByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteRoleById", id);
  const result = await pool.query(
    "DELETE FROM roles WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
