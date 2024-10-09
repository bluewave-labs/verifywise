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
  name: string;
  description: string;
}): Promise<VendorRisk> => {
  console.log("createNewVendorRisk", vendorRisk);
  const result = await pool.query(
    "INSERT INTO vendorRisks (name, description) VALUES ($1, $2) RETURNING *",
    [vendorRisk.name, vendorRisk.description]
  );
  return result.rows[0];
};

export const updateVendorRiskByIdQuery = async (
  id: number,
  vendorRisk: { name?: string; description?: string }
): Promise<VendorRisk | null> => {
  console.log("updateVendorRiskById", id, vendorRisk);
  const fields = [];
  const values = [];
  let query = "UPDATE vendorRisks SET ";

  if (vendorRisk.name) {
    fields.push("name = $1");
    values.push(vendorRisk.name);
  }
  if (vendorRisk.description) {
    fields.push("description = $2");
    values.push(vendorRisk.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
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
