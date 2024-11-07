import { VendorRisk } from "../models/VendorRisk";
import pool from "../database/db";

export const getAllVendorRisksQuery = async (): Promise<VendorRisk[]> => {
  console.log("getAllVendorRisks");
  const vendorRisks = await pool.query("SELECT * FROM vendorRisks");
  return vendorRisks.rows;
};

export const getVendorRiskByIdQuery = async (id: number): Promise<VendorRisk | null> => {
  console.log("getVendorRiskById", id);
  const result = await pool.query("SELECT * FROM vendorRisks WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewVendorRiskQuery = async (vendorRisk: {
  vendor_id: number
  risk_description: string
  impact_description: string
  project_id: number
  probability: string
  impact: string
  action_plan: string
  action_owner_id: number
  risk_severity: string
  likelihood: string
  risk_level: string
}): Promise<VendorRisk> => {
  console.log("createNewVendorRisk", vendorRisk);
  const result = await pool.query(
    "INSERT INTO vendorRisks (vendor_id, risk_description, impact_description, project_id, probability, impact, action_plan, action_owner_id, risk_severity, likelihood, risk_level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *",
    [vendorRisk.vendor_id, vendorRisk.risk_description, vendorRisk.impact_description, vendorRisk.project_id, vendorRisk.probability, vendorRisk.impact, vendorRisk.action_plan, vendorRisk.action_owner_id, vendorRisk.risk_severity, vendorRisk.likelihood, vendorRisk.risk_level]
  );
  return result.rows[0];
};

export const updateVendorRiskByIdQuery = async (
  id: number,
  vendorRisk: {
    vendor_id?: number
    risk_description?: string
    impact_description?: string
    project_id?: number
    probability?: string
    impact?: string
    action_plan?: string
    action_owner_id?: number
    risk_severity?: string
    likelihood?: string
    risk_level?: string
  }
): Promise<VendorRisk | null> => {
  console.log("updateVendorRiskById", id, vendorRisk);
  const fields = [];
  const values = [];
  let query = "UPDATE vendorRisks SET ";

  if(vendorRisk.vendor_id) {
    fields.push("vendor_id = $1")
    values.push(vendorRisk.vendor_id)
  }
  if(vendorRisk.risk_description) {
    fields.push("risk_description = $2")
    values.push(vendorRisk.risk_description)
  }
  if(vendorRisk.impact_description) {
    fields.push("impact_description = $3")
    values.push(vendorRisk.impact_description)
  }
  if(vendorRisk.project_id) {
    fields.push("project_id = $4")
    values.push(vendorRisk.project_id)
  }
  if(vendorRisk.probability) {
    fields.push("probability = $5")
    values.push(vendorRisk.probability)
  }
  if(vendorRisk.impact) {
    fields.push("impact = $6")
    values.push(vendorRisk.impact)
  }
  if(vendorRisk.action_plan) {
    fields.push("action_plan = $7")
    values.push(vendorRisk.action_plan)
  }
  if(vendorRisk.action_owner_id) {
    fields.push("action_owner_id = $8")
    values.push(vendorRisk.action_owner_id)
  }
  if(vendorRisk.risk_severity) {
    fields.push("risk_severity = $9")
    values.push(vendorRisk.risk_severity)
  }
  if(vendorRisk.likelihood) {
    fields.push("likelihood = $10")
    values.push(vendorRisk.likelihood)
  }
  if(vendorRisk.risk_level) {
    fields.push("risk_level = $11")
    values.push(vendorRisk.risk_level)
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $12 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteVendorRiskByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteVendorRiskById", id);
  const result = await pool.query(
    "DELETE FROM vendorRisks WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
