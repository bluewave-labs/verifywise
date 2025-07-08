/**
 * @file organization.util.ts
 * @description This file contains utility functions for performing CRUD operations on the 'organizations' table in the database.
 *
 * The functions included are:
 * - `getAllOrganizationsQuery`: Fetches all organizations from the database.
 * - `getOrganizationByIdQuery`: Fetches an organization by its ID.
 * - `createOrganizationQuery`: Creates a new organization in the database.
 * - `updateOrganizationByIdQuery`: Updates organization details by its ID.
 * - `deleteOrganizationByIdQuery`: Deletes an organization by its ID.
 * - `getOrganizationMembersQuery`: Fetches members of an organization.
 * - `getOrganizationProjectsQuery`: Fetches projects of an organization.
 * - `addMemberToOrganizationQuery`: Adds a member to an organization.
 * - `removeMemberFromOrganizationQuery`: Removes a member from an organization.
 * - `addProjectToOrganizationQuery`: Adds a project to an organization.
 * - `removeProjectFromOrganizationQuery`: Removes a project from an organization.
 *
 * Each function interacts with the database using SQL queries and returns the result.
 *
 * @module utils/organization.util
 */

import {
  Organization,
  OrganizationModel,
} from "../domain.layer/models/organization/organization.model";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";

/**
 * Retrieves all organizations from the database.
 *
 * This function executes a SQL query to select all records from the `organizations` table.
 * It returns a promise that resolves to an array of `Organization` objects.
 *
 * @returns {Promise<Organization[]>} A promise that resolves to an array of `Organization` objects.
 *
 * @throws {Error} If there is an error executing the SQL query.
 */
export const getAllOrganizationsQuery = async (
  transaction: Transaction | null = null
): Promise<Organization[]> => {
  const organizations = await sequelize.query(
    "SELECT * FROM organizations ORDER BY created_at DESC, id ASC",
    {
      mapToModel: true,
      model: OrganizationModel,
      ...(transaction && { transaction }),
    }
  );
  return organizations;
};

/**
 * Retrieves an organization from the database by its unique identifier.
 *
 * @param {number} id - The unique identifier of the organization.
 * @returns {Promise<Organization | null>} A promise that resolves to the organization object or null if not found.
 *
 * @throws {Error} If the query fails.
 */
export const getOrganizationByIdQuery = async (
  id: number
): Promise<Organization | null> => {
  const result = await sequelize.query(
    "SELECT * FROM organizations WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: OrganizationModel,
    }
  );
  return result[0] || null;
};

/**
 * Creates a new organization in the database.
 *
 * @param organization - An object containing the organization details.
 * @param transaction - The transaction object for database operations.
 * @returns A promise that resolves to the newly created organization object.
 *
 * @throws Will throw an error if the database query fails.
 */
export const createOrganizationQuery = async (
  organization: Partial<Organization>,
  transaction: Transaction
): Promise<Organization> => {
  const result = await sequelize.query(
    `INSERT INTO organizations(name, logo, created_at) 
     VALUES (:name, :logo, :created_at) RETURNING *`,
    {
      replacements: {
        name: organization.name,
        logo: organization.logo || null,
        created_at: new Date(),
      },
      mapToModel: true,
      model: OrganizationModel,
      transaction,
    }
  );
  return result[0];
};

/**
 * Updates an organization in the database by its ID.
 *
 * @param id - The ID of the organization to update.
 * @param organization - The organization data to update.
 * @param transaction - The transaction object for database operations.
 * @returns A promise that resolves to the updated organization object or null if not found.
 *
 * @throws Will throw an error if the database query fails.
 */
export const updateOrganizationByIdQuery = async (
  id: number,
  organization: Partial<Organization>,
  transaction: Transaction
): Promise<Organization | null> => {
  const updateOrg: Partial<Record<keyof Organization, any>> = {};
  const updateFields = ["name", "logo", "members", "projects"];

  const setClause = updateFields
    .filter((field) => {
      if (organization[field as keyof Organization] !== undefined) {
        updateOrg[field as keyof Organization] =
          organization[field as keyof Organization];
        return true;
      }
      return false;
    })
    .map((field) => `${field} = :${field}`)
    .join(", ");

  if (!setClause) {
    return getOrganizationByIdQuery(id); // No fields to update, return current state
  }

  updateOrg.id = id;

  const query = `UPDATE organizations SET ${setClause} WHERE id = :id RETURNING *`;

  const result = await sequelize.query(query, {
    replacements: updateOrg,
    mapToModel: true,
    model: OrganizationModel,
    transaction,
  });

  return result[0] || null;
};

/**
 * Deletes an organization from the database by its ID.
 *
 * @param id - The ID of the organization to delete.
 * @param transaction - The transaction object for database operations.
 * @returns A promise that resolves to a boolean indicating if the organization was deleted.
 *
 * @throws Will throw an error if the database query fails.
 */
export const deleteOrganizationByIdQuery = async (
  id: number,
  transaction: Transaction
): Promise<boolean> => {
  const result = await sequelize.query(
    `DELETE FROM organizations WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: OrganizationModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

/**
 * Retrieves members of an organization by organization ID.
 *
 * @param id - The ID of the organization.
 * @returns A promise that resolves to an array of member IDs.
 *
 * @throws Will throw an error if the database query fails.
 */
export const getOrganizationMembersQuery = async (
  id: number
): Promise<number[]> => {
  const organization = await getOrganizationByIdQuery(id);
  return organization?.members || [];
};

/**
 * Retrieves projects of an organization by organization ID.
 *
 * @param id - The ID of the organization.
 * @returns A promise that resolves to an array of project IDs.
 *
 * @throws Will throw an error if the database query fails.
 */
export const getOrganizationProjectsQuery = async (
  id: number
): Promise<number[]> => {
  const organization = await getOrganizationByIdQuery(id);
  return organization?.projects || [];
};

/**
 * Adds a member to an organization.
 *
 * @param id - The ID of the organization.
 * @param memberId - The ID of the member to add.
 * @param transaction - The transaction object for database operations.
 * @returns A promise that resolves to the updated organization.
 *
 * @throws Will throw an error if the database query fails.
 */
export const addMemberToOrganizationQuery = async (
  id: number,
  memberId: number,
  transaction: Transaction
): Promise<Organization | null> => {
  const organization = await getOrganizationByIdQuery(id);
  if (!organization) return null;

  const members = organization.members || [];
  if (members.includes(memberId)) return organization;

  const updatedMembers = [...members, memberId];

  const result = await sequelize.query(
    `UPDATE organizations SET members = :members WHERE id = :id RETURNING *`,
    {
      replacements: {
        id,
        members: updatedMembers,
      },
      mapToModel: true,
      model: OrganizationModel,
      transaction,
    }
  );
  return result[0] || null;
};

/**
 * Removes a member from an organization.
 *
 * @param id - The ID of the organization.
 * @param memberId - The ID of the member to remove.
 * @param transaction - The transaction object for database operations.
 * @returns A promise that resolves to the updated organization.
 *
 * @throws Will throw an error if the database query fails.
 */
export const removeMemberFromOrganizationQuery = async (
  id: number,
  memberId: number,
  transaction: Transaction
): Promise<Organization | null> => {
  const organization = await getOrganizationByIdQuery(id);
  if (!organization) return null;

  const members = organization.members || [];
  if (!members.includes(memberId)) return organization;

  const updatedMembers = members.filter((id) => id !== memberId);

  const result = await sequelize.query(
    `UPDATE organizations SET members = :members WHERE id = :id RETURNING *`,
    {
      replacements: {
        id,
        members: updatedMembers,
      },
      mapToModel: true,
      model: OrganizationModel,
      transaction,
    }
  );
  return result[0] || null;
};

/**
 * Adds a project to an organization.
 *
 * @param id - The ID of the organization.
 * @param projectId - The ID of the project to add.
 * @param transaction - The transaction object for database operations.
 * @returns A promise that resolves to the updated organization.
 *
 * @throws Will throw an error if the database query fails.
 */
export const addProjectToOrganizationQuery = async (
  id: number,
  projectId: number,
  transaction: Transaction
): Promise<Organization | null> => {
  const organization = await getOrganizationByIdQuery(id);
  if (!organization) return null;

  const projects = organization.projects || [];
  if (projects.includes(projectId)) return organization;

  const updatedProjects = [...projects, projectId];

  const result = await sequelize.query(
    `UPDATE organizations SET projects = :projects WHERE id = :id RETURNING *`,
    {
      replacements: {
        id,
        projects: updatedProjects,
      },
      mapToModel: true,
      model: OrganizationModel,
      transaction,
    }
  );
  return result[0] || null;
};

/**
 * Removes a project from an organization.
 *
 * @param id - The ID of the organization.
 * @param projectId - The ID of the project to remove.
 * @param transaction - The transaction object for database operations.
 * @returns A promise that resolves to the updated organization.
 *
 * @throws Will throw an error if the database query fails.
 */
export const removeProjectFromOrganizationQuery = async (
  id: number,
  projectId: number,
  transaction: Transaction
): Promise<Organization | null> => {
  const organization = await getOrganizationByIdQuery(id);
  if (!organization) return null;

  const projects = organization.projects || [];
  if (!projects.includes(projectId)) return organization;

  const updatedProjects = projects.filter((id) => id !== projectId);

  const result = await sequelize.query(
    `UPDATE organizations SET projects = :projects WHERE id = :id RETURNING *`,
    {
      replacements: {
        id,
        projects: updatedProjects,
      },
      mapToModel: true,
      model: OrganizationModel,
      transaction,
    }
  );
  return result[0] || null;
};
