import {
  VendorRiskModel,
} from "../domain.layer/models/vendorRisk/vendorRisk.model";
import { IVendorRisk } from "../domain.layer/interfaces/i.vendorRisk";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";

export const getVendorRisksByProjectIdQuery = async (
  projectId: number,
  tenant: string,
  filter: 'active' | 'deleted' | 'all' = 'active'
): Promise<IVendorRisk[]> => {
  let whereClause = '';
  switch (filter) {
    case 'active':
      whereClause = 'AND is_deleted = false';
      break;
    case 'deleted':
      whereClause = 'AND is_deleted = true';
      break;
    case 'all':
      whereClause = '';
      break;
  }
  
  const vendorRisks = await sequelize.query(
    `SELECT * FROM "${tenant}".vendorRisks WHERE vendor_id IN (SELECT vendor_id FROM "${tenant}".vendors_projects WHERE project_id = :project_id) ${whereClause} ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: VendorRiskModel,
    }
  );
  return vendorRisks;
};

export const getVendorRisksByVendorIdQuery = async (
  vendorId: number,
  tenant: string,
  filter: 'active' | 'deleted' | 'all' = 'active'
): Promise<IVendorRisk[]> => {
  let whereClause = '';
  switch (filter) {
    case 'active':
      whereClause = 'AND is_deleted = false';
      break;
    case 'deleted':
      whereClause = 'AND is_deleted = true';
      break;
    case 'all':
      whereClause = '';
      break;
  }
  
  const vendorRisks = await sequelize.query(
    `SELECT * FROM "${tenant}".vendorRisks WHERE vendor_id = :vendor_id ${whereClause} ORDER BY created_at DESC, id ASC;`,
    {
      replacements: { vendor_id: vendorId },
      mapToModel: true,
      model: VendorRiskModel,
    }
  );
  return vendorRisks;
};

export const getVendorRiskByIdQuery = async (
  id: number,
  tenant: string,
  includeDeleted: boolean = false
): Promise<IVendorRisk | null> => {
  const whereClause = includeDeleted ? 'WHERE id = :id' : 'WHERE id = :id AND is_deleted = false';
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".vendorRisks ${whereClause} ORDER BY created_at DESC, id ASC`,
    {
      replacements: { id },
      mapToModel: true,
      model: VendorRiskModel,
    }
  );
  return result[0];
};

export const createNewVendorRiskQuery = async (
  vendorRisk: IVendorRisk,
  tenant: string,
  transaction: Transaction
): Promise<VendorRiskModel> => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".vendorRisks (
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
  vendorRisk: Partial<VendorRiskModel>,
  tenant: string,
  transaction: Transaction
): Promise<VendorRiskModel | null> => {
  const updateVendorRisk: Partial<Record<keyof VendorRiskModel, any>> = {};
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
        vendorRisk[f as keyof VendorRiskModel] !== undefined &&
        vendorRisk[f as keyof VendorRiskModel]
      ) {
        updateVendorRisk[f as keyof VendorRiskModel] =
          vendorRisk[f as keyof VendorRiskModel];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE "${tenant}".vendorrisks SET ${setClause} WHERE id = :id RETURNING *;`;

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
    `UPDATE "${tenant}".vendorrisks SET is_deleted = true, deleted_at = NOW(), updated_at = NOW() WHERE id = :id AND is_deleted = false RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: VendorRiskModel,
      type: QueryTypes.UPDATE,
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
    `DELETE FROM "${tenant}".vendorrisks WHERE vendor_id = :vendor_id RETURNING id`,
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
  tenant: string,
  filter: 'active' | 'deleted' | 'all' = 'active'
) => {
  let whereClause = '';
  switch (filter) {
    case 'active':
      whereClause = 'WHERE vr.is_deleted = false';
      break;
    case 'deleted':
      whereClause = 'WHERE vr.is_deleted = true';
      break;
    case 'all':
      whereClause = '';
      break;
  }
  
  const risks = await sequelize.query(
    `SELECT 
      vr.id AS risk_id,
      vr.*, 
      v.*, 
      vp.project_id AS project_id, 
      p.project_title AS project_title
    FROM "${tenant}".vendorRisks AS vr
    JOIN "${tenant}".vendors AS v ON vr.vendor_id = v.id
    LEFT JOIN "${tenant}".vendors_projects AS vp ON v.id = vp.vendor_id
    LEFT JOIN "${tenant}".projects AS p ON vp.project_id = p.id
    ${whereClause}
    ORDER BY vp.project_id, v.id, vr.id`,
    {
      mapToModel: true,
      model: VendorRiskModel,
      type: QueryTypes.SELECT,
    }
  );
  return risks;
};
