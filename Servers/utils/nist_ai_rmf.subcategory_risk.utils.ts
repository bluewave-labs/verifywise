import { sequelize } from "../database/db";
import { QueryTypes } from "sequelize";
import { getTenantHash } from "../tools/getTenantHash";
import { validateRiskArray } from "./utility.utils";

/**
 * Utility functions for managing NIST AI RMF subcategory risk linking
 * Following the exact same pattern as ISO 27001 and ISO 4201 implementations
 */

/**
 * Links risks to a NIST AI RMF subcategory
 * @param subcategoryId - ID of the subcategory
 * @param riskIds - Array of risk IDs to link
 * @param tenant - Tenant schema name
 * @param transaction - Sequelize transaction
 */
export const linkRisksToNISTSubcategoryQuery = async (
  subcategoryId: number,
  riskIds: number[],
  tenant: string,
  transaction: any
) => {
  try {
    // Get current risks from database
    const currentRisksQuery = await sequelize.query(
      `SELECT projects_risks_id FROM "${tenant}".nist_ai_rmf_subcategories__risks WHERE subcategory_id = :id;`,
      {
        replacements: { id: subcategoryId },
        transaction,
        type: QueryTypes.SELECT,
      }
    );

    let currentRisks = currentRisksQuery.map((r: any) => r.projects_risks_id);

    // Calculate new risk set (current risks + new risks - deleted risks)
    // For now, we'll replace all risks with the new set (same as ISO pattern)
    const newRisks = riskIds;

    // Delete existing associations
    await sequelize.query(
      `DELETE FROM "${tenant}".nist_ai_rmf_subcategories__risks WHERE subcategory_id = :id;`,
      { replacements: { id: subcategoryId }, transaction }
    );

    // Insert new associations (if any)
    if (newRisks.length > 0) {
      const placeholders = newRisks.map((_, i) => `(:subclause_id${i}, :projects_risks_id${i})`).join(", ");
      const replacements: { [key: string]: any } = {};
      newRisks.forEach((risk, i) => {
        replacements[`subclause_id${i}`] = subcategoryId;
        replacements[`projects_risks_id${i}`] = risk;
      });

      await sequelize.query(
        `INSERT INTO "${tenant}".nist_ai_rmf_subcategories__risks (subcategory_id, projects_risks_id) VALUES ${placeholders}`,
        { replacements, transaction }
      );
    }

    return newRisks;
  } catch (error) {
    console.error("Error linking risks to NIST subcategory:", error);
    throw error;
  }
};

/**
 * Gets all risks linked to a specific NIST AI RMF subcategory
 * @param subcategoryId - ID of the subcategory
 * @param tenant - Tenant schema name
 * @param transaction - Sequelize transaction (optional)
 * @returns Array of linked risks
 */
export const getRisksForNISTSubcategoryQuery = async (
  subcategoryId: number,
  tenant: string,
  transaction?: any
) => {
  try {
    const result = await sequelize.query(
      `SELECT
        pr.*,
        CONCAT(u.name, ' ', u.surname) as owner_name
      FROM "${tenant}".nist_ai_rmf_subcategories__risks nsrs
      JOIN public.projectrisks pr ON nsrs.projects_risks_id = pr.id
      LEFT JOIN public.users u ON pr.owner = u.id
      WHERE nsrs.subcategory_id = :id
      ORDER BY pr.risk ASC;`,
      {
        replacements: { id: subcategoryId },
        transaction,
        type: QueryTypes.SELECT,
      }
    );
    return result;
  } catch (error) {
    console.error("Error getting risks for NIST subcategory:", error);
    throw error;
  }
};

/**
 * Updates risk associations for a NIST AI RMF subcategory
 * @param subcategoryId - ID of the subcategory
 * @param data - Update data including risk arrays
 * @param tenant - Tenant schema name
 * @param transaction - Sequelize transaction
 * @returns Updated subcategory data
 */
export const updateNISTSubcategoryRiskLinksQuery = async (
  subcategoryId: number,
  data: any,
  tenant: string,
  transaction: any
) => {
  try {
    const { risksDelete, risksMitigated } = data;

    // Validate risk arrays
    const risksToDelete = validateRiskArray(risksDelete, "risksDelete");
    const risksToMitigate = validateRiskArray(risksMitigated, "risksMitigated");

    // Delete specified risks
    if (risksToDelete.length > 0) {
      const placeholders = risksToDelete.map((_, i) => `:projects_risks_id${i}`).join(", ");
      const replacements: { [key: string]: any } = {};
      risksToDelete.forEach((risk, i) => {
        replacements[`projects_risks_id${i}`] = risk;
      });

      await sequelize.query(
        `DELETE FROM "${tenant}".nist_ai_rmf_subcategories__risks WHERE subcategory_id = :id AND projects_risks_id IN (${placeholders});`,
        {
          replacements: { id: subcategoryId, ...replacements },
          transaction,
        }
      );
    }

    // Add new risk links
    if (risksToMitigate.length > 0) {
      const placeholders = risksToMitigate.map((_, i) => `(:subclause_id${i}, :projects_risks_id${i})`).join(", ");
      const replacements: { [key: string]: any } = {};
      risksToMitigate.forEach((risk, i) => {
        replacements[`subclause_id${i}`] = subcategoryId;
        replacements[`projects_risks_id${i}`] = risk;
      });

      await sequelize.query(
        `INSERT INTO "${tenant}".nist_ai_rmf_subcategories__risks (subcategory_id, projects_risks_id) VALUES ${placeholders};`,
        { replacements, transaction }
      );
    }

    return data;
  } catch (error) {
    console.error("Error updating NIST subcategory risk links:", error);
    throw error;
  }
};

/**
 * Removes a specific risk from a NIST AI RMF subcategory
 * @param subcategoryId - ID of the subcategory
 * @param riskId - ID of the risk to remove
 * @param tenant - Tenant schema name
 * @param transaction - Sequelize transaction
 * @returns Updated subcategory data
 */
export const removeRiskFromNISTSubcategoryQuery = async (
  subcategoryId: number,
  riskId: number,
  tenant: string,
  transaction: any
) => {
  try {
    await sequelize.query(
      `DELETE FROM "${tenant}".nist_ai_rmf_subcategories__risks WHERE subcategory_id = :subcategoryId AND projects_risks_id = :riskId;`,
      {
        replacements: { subcategoryId, riskId },
        transaction,
      }
    );
    return { subcategoryId, removedRiskId: riskId };
  } catch (error) {
    console.error("Error removing risk from NIST subcategory:", error);
    throw error;
  }
};