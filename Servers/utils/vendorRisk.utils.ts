import {
  VendorRisk,
  VendorRiskModel,
} from "../domain.layer/models/vendorRisk/vendorRisk.model";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";

export const getVendorRisksByProjectIdQuery = async (
  projectId: number,
  tenant: string
): Promise<VendorRisk[]> => {
  const vendorRisks = await sequelize.query(
    `SELECT * FROM ${tenant}.vendorRisks WHERE vendor_id IN (SELECT vendor_id FROM ${tenant}.vendors_projects WHERE project_id = :project_id) ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: VendorRiskModel,
    }
  );
  return vendorRisks;
};

export const getVendorRiskByIdQuery = async (
  id: number,
  tenant: string
): Promise<VendorRisk | null> => {
  const result = await sequelize.query(
    `SELECT * FROM ${tenant}.vendorRisks WHERE id = :id ORDER BY created_at DESC, id ASC`,
    {
      replacements: { id },
      mapToModel: true,
      model: VendorRiskModel,
    }
  );
  return result[0];
};

export const createNewVendorRiskQuery = async (
  vendorRisk: VendorRisk,
  tenant: string,
  transaction: Transaction
): Promise<VendorRisk> => {
  const result = await sequelize.query(
    `INSERT INTO ${tenant}.vendorRisks (
      vendor_id, order_no, risk_description, impact_description,
      likelihood, risk_severity, action_plan, action_owner, risk_level
    ) VALUES (
      :vendor_id, :order_no, :risk_description, :impact_description,
      :likelihood, :risk_severity, :action_plan, :action_owner, :risk_level
    ) RETURNING *`,
    {
      replacements: {
        vendor_id: vendorRisk.vendor_id,
        order_no: vendorRisk.order_no || null,
        risk_description: vendorRisk.risk_description,
        impact_description: vendorRisk.impact_description,
        likelihood: vendorRisk.likelihood,
        risk_severity: vendorRisk.risk_severity,
        action_plan: vendorRisk.action_plan,
        action_owner: vendorRisk.action_owner,
        risk_level: vendorRisk.risk_level,
      },
      mapToModel: true,
      model: VendorRiskModel,
      // type: QueryTypes.INSERT
      transaction,
    }
  );
  return result[0];
};

export const updateVendorRiskByIdQuery = async (
  id: number,
  vendorRisk: Partial<VendorRisk>,
  tenant: string,
  transaction: Transaction
): Promise<VendorRisk | null> => {
  const updateVendorRisk: Partial<Record<keyof VendorRisk, any>> = {};
  const setClause = [
    "vendor_id",
    "risk_description",
    "impact_description",
    "likelihood",
    "risk_severity",
    "action_plan",
    "action_owner",
    "risk_level",
  ]
    .filter((f) => {
      if (
        vendorRisk[f as keyof VendorRisk] !== undefined &&
        vendorRisk[f as keyof VendorRisk]
      ) {
        updateVendorRisk[f as keyof VendorRisk] =
          vendorRisk[f as keyof VendorRisk];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE ${tenant}.vendorrisks SET ${setClause} WHERE id = :id RETURNING *;`;

  updateVendorRisk.id = id;

  const result = await sequelize.query(query, {
    replacements: updateVendorRisk,
    mapToModel: true,
    model: VendorRiskModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  return result[0];
};

export const deleteVendorRiskByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM ${tenant}.vendorRisks WHERE id = :id RETURNING id`,
    {
      replacements: { id },
      mapToModel: true,
      model: VendorRiskModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

export const deleteVendorRisksForVendorQuery = async (
  vendorId: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM ${tenant}.vendorrisks WHERE vendor_id = :vendor_id RETURNING id`,
    {
      replacements: { vendor_id: vendorId },
      mapToModel: true,
      model: VendorRiskModel,
      type: QueryTypes.UPDATE,
      transaction,
    }
  );
  return result.length > 0;
};

export const getAllVendorRisksAllProjectsQuery = async (
  tenant: string
) => {
  const risks = await sequelize.query(
    `SELECT 
      vendorRisks.id AS risk_id,
      vendorRisks.*, 
      vendors.*, 
      vendors_projects.*, 
      projects.project_title
    FROM ${tenant}.vendorRisks
    JOIN ${tenant}.vendors ON vendorRisks.vendor_id = vendors.id
    JOIN ${tenant}.vendors_projects ON vendors.id = vendors_projects.vendor_id
    JOIN ${tenant}.projects ON vendors_projects.project_id = projects.id
    ORDER BY vendors_projects.project_id, vendors.id, vendorRisks.id`,
    {
      mapToModel: true,
      model: VendorRiskModel,
      type: QueryTypes.SELECT,
    }
  );
  return risks;
};
