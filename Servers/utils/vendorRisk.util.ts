import { VendorRisk, VendorRiskModel } from "../models/vendorRisk.model";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";

export const getVendorRisksByProjectIdQuery = async (
  projectId: number
): Promise<VendorRisk[]> => {
  const vendorRisks = await sequelize.query(
    `SELECT 
        vendorrisks.id AS id,
        vendorrisks.vendor_id,
        vendorrisks.order_no,
        vendorrisks.risk_description,
        vendorrisks.impact_description,
        vendorrisks.impact,
        vendorrisks.likelihood,
        vendorrisks.risk_severity,
        vendorrisks.action_plan,
        vendorrisks.action_owner,
        vendorrisks.risk_level,
        vendorrisks.is_demo,
        vendorrisks.created_at,
        vendors.vendor_name,
        vendors_projects.project_id
     FROM vendorrisks
     JOIN vendors ON vendorrisks.vendor_id = vendors.id
     JOIN vendors_projects ON vendors.id = vendors_projects.vendor_id
     WHERE vendorrisks.vendor_id IN (SELECT vendor_id FROM vendors_projects WHERE project_id = :project_id)
     ORDER BY vendorrisks.created_at DESC, vendorrisks.id ASC;`,
    {
      replacements: { project_id: projectId },
      type: QueryTypes.SELECT
    }
  );
  return vendorRisks;
};

export const getVendorRiskByIdQuery = async (
  id: number
): Promise<VendorRisk | null> => {
  const result = await sequelize.query(
    `SELECT 
        vendorrisks.id AS id,
        vendorrisks.vendor_id,
        vendorrisks.order_no,
        vendorrisks.risk_description,
        vendorrisks.impact_description,
        vendorrisks.impact,
        vendorrisks.likelihood,
        vendorrisks.risk_severity,
        vendorrisks.action_plan,
        vendorrisks.action_owner,
        vendorrisks.risk_level,
        vendorrisks.is_demo,
        vendorrisks.created_at,
        vendors.vendor_name,
        vendors_projects.project_id
     FROM vendorrisks
     JOIN vendors ON vendorrisks.vendor_id = vendors.id
     JOIN vendors_projects ON vendors.id = vendors_projects.vendor_id
     WHERE vendorrisks.id = :id
     ORDER BY vendorrisks.created_at DESC, vendorrisks.id ASC`,
    {
      replacements: { id },
      type: QueryTypes.SELECT
    }
  );
  return result[0] || null;
};

export const createNewVendorRiskQuery = async (vendorRisk: VendorRisk, transaction: Transaction): Promise<VendorRisk> => {
  const result = await sequelize.query(
    `INSERT INTO vendorrisks (
      vendor_id, order_no, risk_description, impact_description, impact,
      likelihood, risk_severity, action_plan, action_owner, risk_level
    ) VALUES (
      :vendor_id, :order_no, :risk_description, :impact_description, :impact,
      :likelihood, :risk_severity, :action_plan, :action_owner, :risk_level
    ) RETURNING *`,
    {
      replacements: {
        vendor_id: vendorRisk.vendor_id,
        order_no: vendorRisk.order_no || null,
        risk_description: vendorRisk.risk_description,
        impact_description: vendorRisk.impact_description,
        impact: vendorRisk.impact,
        likelihood: vendorRisk.likelihood,
        risk_severity: vendorRisk.risk_severity,
        action_plan: vendorRisk.action_plan,
        action_owner: vendorRisk.action_owner,
        risk_level: vendorRisk.risk_level,
      },
      type: QueryTypes.INSERT, // Specify the query type for INSERT
      transaction
    }
  );
  return result[0][0];
};

export const updateVendorRiskByIdQuery = async (
  id: number,
  vendorRisk: Partial<VendorRisk>,
  transaction: Transaction
): Promise<VendorRisk | null> => {
  const updateVendorRisk: Partial<Record<keyof VendorRisk, any>> = {};
  const setClause = [
    "vendor_id",
    "risk_description",
    "impact_description",
    "impact",
    "likelihood",
    "risk_severity",
    "action_plan",
    "action_owner",
    "risk_level",
  ].filter(f => {
    if (vendorRisk[f as keyof VendorRisk] !== undefined && vendorRisk[f as keyof VendorRisk]) {
      updateVendorRisk[f as keyof VendorRisk] = vendorRisk[f as keyof VendorRisk]
      return true
    }
  }).map(f => `${f} = :${f}`).join(", ");

  const query = `UPDATE vendorrisks SET ${setClause} WHERE id = :id RETURNING *;`;

  updateVendorRisk.id = id;

  const result = await sequelize.query(query, {
    replacements: updateVendorRisk,
    mapToModel: true,
    model: VendorRiskModel,
    transaction
  });

  return result[0][0] || null;
};

export const deleteVendorRiskByIdQuery = async (
  id: number,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    "DELETE FROM vendorrisks WHERE id = :id RETURNING id",
    {
      replacements: { id },
      mapToModel: true,
      model: VendorRiskModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result[0].length > 0;
};

export const deleteVendorRisksForVendorQuery = async (
  vendorId: number,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM vendorrisks WHERE vendor_id = :vendor_id RETURNING id`,
    {
      replacements: { vendor_id: vendorId },
      mapToModel: true,
      model: VendorRiskModel,
      type: QueryTypes.UPDATE,
      transaction,
    }
  )
  return result[0].length > 0;
}

export const getAllVendorRisksAllProjectsQuery = async () => {
  const risks = await sequelize.query(
    `SELECT
        vendorrisks.id AS id,
        vendorrisks.vendor_id,
        vendorrisks.order_no,
        vendorrisks.risk_description,
        vendorrisks.impact_description,
        vendorrisks.impact,
        vendorrisks.likelihood,
        vendorrisks.risk_severity,
        vendorrisks.action_plan,
        vendorrisks.action_owner,
        vendorrisks.risk_level,
        vendorrisks.is_demo,
        vendorrisks.created_at,
        vendors.vendor_name,
        vendors_projects.project_id
     FROM vendorrisks
     JOIN vendors ON vendorrisks.vendor_id = vendors.id
     JOIN vendors_projects ON vendors.id = vendors_projects.vendor_id
     ORDER BY vendors_projects.project_id, vendors.id, vendorrisks.id`,
    {
      type: QueryTypes.SELECT,
    }
  );
  return risks;
};

