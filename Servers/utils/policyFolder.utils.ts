/**
 * @fileoverview Policy Folder Utility Functions
 *
 * Database query functions for policy-to-virtual-folder mappings.
 * Mirrors the file_folder_mappings pattern for policies.
 *
 * @module utils/policyFolder.utils
 */

import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { IVirtualFolder } from "../domain.layer/interfaces/i.virtualFolder";

/**
 * Validate tenant identifier to prevent SQL injection.
 */
const validateTenant = (tenant: string): void => {
  if (!tenant || !/^[a-zA-Z0-9]+$/.test(tenant)) {
    throw new Error("Invalid tenant identifier");
  }
};

/**
 * Get all folders that a policy belongs to
 */
export const getPolicyFoldersQuery = async (
  tenant: string,
  policyId: number
): Promise<IVirtualFolder[]> => {
  validateTenant(tenant);
  const result = await sequelize.query(
    `SELECT vf.*
    FROM "${tenant}".virtual_folders vf
    INNER JOIN "${tenant}".policy_folder_mappings pfm ON vf.id = pfm.folder_id
    WHERE pfm.policy_id = :policyId
    ORDER BY vf.name ASC`,
    {
      replacements: { policyId },
      type: QueryTypes.SELECT,
    }
  );
  return result as IVirtualFolder[];
};

/**
 * Bulk update policy folder assignments (replace all folder assignments for a policy)
 */
export const bulkUpdatePolicyFoldersQuery = async (
  tenant: string,
  policyId: number,
  folderIds: number[],
  userId: number,
  transaction?: Transaction
): Promise<void> => {
  validateTenant(tenant);

  // Delete existing assignments
  await sequelize.query(
    `DELETE FROM "${tenant}".policy_folder_mappings WHERE policy_id = :policyId`,
    {
      replacements: { policyId },
      transaction,
    }
  );

  // Add new assignments
  if (folderIds.length > 0) {
    const values = folderIds
      .map((_, i) => `(:policyId, :folder_id_${i}, :userId, NOW())`)
      .join(", ");

    const replacements: Record<string, unknown> = {
      policyId,
      userId,
    };
    folderIds.forEach((folderId, i) => {
      replacements[`folder_id_${i}`] = folderId;
    });

    await sequelize.query(
      `INSERT INTO "${tenant}".policy_folder_mappings (policy_id, folder_id, assigned_by, assigned_at)
       VALUES ${values}`,
      {
        replacements,
        transaction,
      }
    );
  }
};
