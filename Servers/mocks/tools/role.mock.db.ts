/**
 * @file role.mock.db.ts
 * @description This file contains mock implementations for role-related database operations.
 * It provides functions to get all roles, get a role by ID, create a new role, update an existing role by ID, and delete a role by ID.
 */

import { roles } from "../roles/roles.data";

/**
 * Retrieves all mock roles.
 * @returns {Array} An array of all mock roles.
 */
const getAllMockRoles = (): Array<any> => {
  return roles;
};

/**
 * Retrieves a mock role by its ID.
 * @param {number} id - The ID of the role to retrieve.
 * @returns {Object | undefined} The role object if found, otherwise undefined.
 */
const getMockRoleById = (id: number): object | undefined => {
  return roles.find((role) => role.id === id);
};

/**
 * Creates a new mock role.
 * @param {Object} newRole - The new role object to add.
 * @returns {Object} The newly created role object.
 */
const createMockRole = (newRole: any): object => {
  roles.push(newRole);
  return newRole;
};

/**
 * Updates an existing mock role by its ID.
 * @param {number} id - The ID of the role to update.
 * @param {Object} updatedRole - The updated role object.
 * @returns {Object | null} The updated role object if the role was found and updated, otherwise null.
 */
const updateMockRoleById = (id: number, updatedRole: any): object | null => {
  const index = roles.findIndex((role) => role.id === id);
  if (index !== -1) {
    roles[index] = { ...roles[index], ...updatedRole };
    return roles[index];
  }
  return null;
};

/**
 * Deletes a mock role by its ID.
 * @param {number} id - The ID of the role to delete.
 * @returns {Object | null} The deleted role object if the role was found and deleted, otherwise null.
 */
const deleteMockRoleById = (id: number): object | null => {
  const index = roles.findIndex((role) => role.id === id);
  if (index !== -1) {
    const deletedRole = roles.splice(index, 1)[0];
    return deletedRole;
  }
  return null;
};

export {
  getAllMockRoles,
  getMockRoleById,
  createMockRole,
  updateMockRoleById,
  deleteMockRoleById,
};
