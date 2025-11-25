import { Request, Response } from "express";
import { sequelize } from "../database/db";
import { getTenantHash } from "../tools/getTenantHash";
import {
  linkRisksToNISTSubcategoryQuery,
  getRisksForNISTSubcategoryQuery,
  updateNISTSubcategoryRiskLinksQuery,
  removeRiskFromNISTSubcategoryQuery,
} from "../utils/nist_ai_rmf.subcategory_risk.utils";

/**
 * Controller functions for NIST AI RMF subcategory risk linking
 * Following the exact same pattern as ISO 27001 and ISO 4201 implementations
 */

/**
 * GET /api/nist-ai-rmf/subcategories/:id/risks
 * Get all risks linked to a specific NIST AI RMF subcategory
 */
export const getRisksForNISTSubcategory = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const tenantHash = getTenantHash(parseInt(req.tenantId!));

    // Validate input
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        message: "Invalid subcategory ID",
        data: null,
      });
    }

    const subcategoryId = parseInt(id);
    if (subcategoryId <= 0) {
      return res.status(400).json({
        message: "Subcategory ID must be a positive number",
        data: null,
      });
    }

    const risks = await getRisksForNISTSubcategoryQuery(
      subcategoryId,
      tenantHash
    );

    res.status(200).json({
      message: "Risks retrieved successfully",
      data: risks,
    });
  } catch (error) {
    console.error("Error getting risks for NIST subcategory:", error);

    // Handle specific database errors
    if (error instanceof Error && error.message.includes("does not exist")) {
      return res.status(404).json({
        message:
          "Risk linking functionality not available. Risk management tables have not been set up for this organization.",
        data: [],
      });
    }

    res.status(500).json({
      message: "Failed to retrieve risks",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * POST /api/nist-ai-rmf/subcategories/:id/risks
 * Link risks to a specific NIST AI RMF subcategory
 */
export const linkRisksToNISTSubcategory = async (
  req: Request,
  res: Response
) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { riskIds } = req.body;
    const tenantHash = getTenantHash(parseInt(req.tenantId!));

    // Validate input
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        message: "Invalid subcategory ID",
        data: null,
      });
    }

    const subcategoryId = parseInt(id);
    if (subcategoryId <= 0) {
      return res.status(400).json({
        message: "Subcategory ID must be a positive number",
        data: null,
      });
    }

    if (!Array.isArray(riskIds)) {
      throw new Error("riskIds must be an array");
    }

    if (riskIds.some((id: any) => typeof id !== "number" || id <= 0)) {
      throw new Error("All risk IDs must be positive numbers");
    }

    await linkRisksToNISTSubcategoryQuery(
      subcategoryId,
      riskIds,
      tenantHash,
      transaction
    );

    await transaction.commit();

    res.status(200).json({
      message: "Risks linked successfully",
      data: { linkedRiskIds: riskIds },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error linking risks to NIST subcategory:", error);
    res.status(500).json({
      message: "Failed to link risks",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * PUT /api/nist-ai-rmf/subcategories/:id/risks
 * Update risk links for a specific NIST AI RMF subcategory
 */
export const updateNISTSubcategoryRiskLinks = async (
  req: Request,
  res: Response
) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { riskIds } = req.body;
    const tenantHash = getTenantHash(parseInt(req.tenantId!));

    // Validate input
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        message: "Invalid subcategory ID",
        data: null,
      });
    }

    const subcategoryId = parseInt(id);
    if (subcategoryId <= 0) {
      return res.status(400).json({
        message: "Subcategory ID must be a positive number",
        data: null,
      });
    }

    if (!Array.isArray(riskIds)) {
      throw new Error("riskIds must be an array");
    }

    if (riskIds.some((id: any) => typeof id !== "number" || id <= 0)) {
      throw new Error("All risk IDs must be positive numbers");
    }

    await updateNISTSubcategoryRiskLinksQuery(
      subcategoryId,
      riskIds,
      tenantHash,
      transaction
    );

    await transaction.commit();

    res.status(200).json({
      message: "Risk links updated successfully",
      data: { linkedRiskIds: riskIds },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating risk links for NIST subcategory:", error);
    res.status(500).json({
      message: "Failed to update risk links",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * DELETE /api/nist-ai-rmf/subcategories/:id/risks/:riskId
 * Remove a specific risk from a NIST AI RMF subcategory
 */
export const removeRiskFromNISTSubcategory = async (
  req: Request,
  res: Response
) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, riskId } = req.params;
    const tenantHash = getTenantHash(parseInt(req.tenantId!));

    // Validate input
    if (!id || isNaN(parseInt(id)) || !riskId || isNaN(parseInt(riskId))) {
      return res.status(400).json({
        message: "Invalid subcategory ID or risk ID",
        data: null,
      });
    }

    const subcategoryId = parseInt(id);
    if (subcategoryId <= 0) {
      return res.status(400).json({
        message: "Subcategory ID must be a positive number",
        data: null,
      });
    }

    await removeRiskFromNISTSubcategoryQuery(
      subcategoryId,
      parseInt(riskId),
      tenantHash,
      transaction
    );

    await transaction.commit();

    res.status(200).json({
      message: "Risk removed successfully",
      data: { subcategoryId, removedRiskId: parseInt(riskId) },
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error removing risk from NIST subcategory:", error);
    res.status(500).json({
      message: "Failed to remove risk",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
