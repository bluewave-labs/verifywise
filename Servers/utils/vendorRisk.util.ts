import { VendorRisk } from "../models/vendorRisk.model";
import pool from "../database/db";

export const getAllVendorRisksQuery = async (
  vendorId: number
): Promise<VendorRisk[]> => {
  console.log("getAllVendorRisks for vendor", vendorId);
  const vendorRisks = await pool.query(
    "SELECT * FROM vendorRisks WHERE vendor_id = $1",
    [vendorId]
  );
  return vendorRisks.rows;
};

export const getVendorRiskByIdQuery = async (
  id: number
): Promise<VendorRisk | null> => {
  console.log("getVendorRiskById", id);
  const result = await pool.query("SELECT * FROM vendorRisks WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewVendorRiskQuery = async (vendorRisk: VendorRisk): Promise<VendorRisk> => {
  console.log("createNewVendorRisk", vendorRisk);
  const result = await pool.query(
    `INSERT INTO vendorRisks (
      vendor_id, order_no, risk_description, impact_description, impact, 
      likelihood, risk_severity, action_plan, action_owner, risk_level
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [
      vendorRisk.vendor_id,
      vendorRisk.order_no,
      vendorRisk.risk_description,
      vendorRisk.impact_description,
      vendorRisk.impact,
      vendorRisk.likelihood,
      vendorRisk.risk_severity,
      vendorRisk.action_plan,
      vendorRisk.action_owner,
      vendorRisk.risk_level,
    ]
  );
  return result.rows[0];
};

export const updateVendorRiskByIdQuery = async (
  id: number,
  vendorRisk: Partial<VendorRisk>
): Promise<VendorRisk | null> => {
  console.log("updateVendorRiskById", id, vendorRisk);
  const fields = [];
  const values = [];
  let query = "UPDATE vendorRisks SET ";

  if (vendorRisk.vendor_id !== undefined) {
    fields.push(`vendor_id = $${fields.length + 1}`);
    values.push(vendorRisk.vendor_id);
  }
  if (vendorRisk.order_no !== undefined) {
    fields.push(`order_no = $${fields.length + 1}`);
    values.push(vendorRisk.order_no);
  }
  if (vendorRisk.risk_description !== undefined) {
    fields.push(`risk_description = $${fields.length + 1}`);
    values.push(vendorRisk.risk_description);
  }
  if (vendorRisk.impact_description !== undefined) {
    fields.push(`impact_description = $${fields.length + 1}`);
    values.push(vendorRisk.impact_description);
  }
  if (vendorRisk.impact !== undefined) {
    fields.push(`impact = $${fields.length + 1}`);
    values.push(vendorRisk.impact);
  }
  if (vendorRisk.likelihood !== undefined) {
    fields.push(`likelihood = $${fields.length + 1}`);
    values.push(vendorRisk.likelihood);
  }
  if (vendorRisk.risk_severity !== undefined) {
    fields.push(`risk_severity = $${fields.length + 1}`);
    values.push(vendorRisk.risk_severity);
  }
  if (vendorRisk.action_plan !== undefined) {
    fields.push(`action_plan = $${fields.length + 1}`);
    values.push(vendorRisk.action_plan);
  }
  if (vendorRisk.action_owner !== undefined) {
    fields.push(`action_owner = $${fields.length + 1}`);
    values.push(vendorRisk.action_owner);
  }
  if (vendorRisk.risk_level !== undefined) {
    fields.push(`risk_level = $${fields.length + 1}`);
    values.push(vendorRisk.risk_level);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + ` WHERE id = $${fields.length + 1} RETURNING *`;
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteVendorRiskByIdQuery = async (
  id: number
): Promise<boolean> => {
  console.log("deleteVendorRiskById", id);
  const result = await pool.query(
    "DELETE FROM vendorRisks WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
