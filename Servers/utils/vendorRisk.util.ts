import { VendorRisk } from "../models/vendorRisk.model";
import pool from "../database/db";

export const getAllVendorRisksQuery = async (
  projectId: number
): Promise<VendorRisk[]> => {
  const vendorRisks = await pool.query(
    "SELECT * FROM vendorRisks WHERE project_id = $1",
    [projectId]
  );
  return vendorRisks.rows;
};

export const getVendorRiskByIdQuery = async (
  id: number
): Promise<VendorRisk | null> => {
  const result = await pool.query("SELECT * FROM vendorRisks WHERE id = $1", [
    id,
  ]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewVendorRiskQuery = async (vendorRisk: {
  project_id: number;
  vendor_name: string;
  risk_name: string;
  owner: string;
  risk_level: string;
  review_date: Date;
}): Promise<VendorRisk> => {
  const result = await pool.query(
    `INSERT INTO vendorRisks (
      project_id, vendor_name, risk_name, owner, risk_level, review_date
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      vendorRisk.project_id,
      vendorRisk.vendor_name,
      vendorRisk.risk_name,
      vendorRisk.owner,
      vendorRisk.risk_level,
      vendorRisk.review_date,
    ]
  );
  return result.rows[0];
};

export const updateVendorRiskByIdQuery = async (
  id: number,
  vendorRisk: Partial<{
    project_id: number;
    vendor_name: string;
    risk_name: string;
    owner: string;
    risk_level: string;
    review_date: Date;
  }>
): Promise<VendorRisk | null> => {
  const fields = [];
  const values = [];
  let query = "UPDATE vendorRisks SET ";

  if (vendorRisk.project_id !== undefined) {
    fields.push(`project_id = $${fields.length + 1}`);
    values.push(vendorRisk.project_id);
  }
  if (vendorRisk.vendor_name !== undefined) {
    fields.push(`vendor_name = $${fields.length + 1}`);
    values.push(vendorRisk.vendor_name);
  }
  if (vendorRisk.risk_name !== undefined) {
    fields.push(`risk_name = $${fields.length + 1}`);
    values.push(vendorRisk.risk_name);
  }
  if (vendorRisk.owner !== undefined) {
    fields.push(`owner = $${fields.length + 1}`);
    values.push(vendorRisk.owner);
  }
  if (vendorRisk.risk_level !== undefined) {
    fields.push(`risk_level = $${fields.length + 1}`);
    values.push(vendorRisk.risk_level);
  }
  if (vendorRisk.review_date !== undefined) {
    fields.push(`review_date = $${fields.length + 1}`);
    values.push(vendorRisk.review_date);
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
  const result = await pool.query(
    "DELETE FROM vendorRisks WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
