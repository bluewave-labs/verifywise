import { Vendor } from "../models/Vendor";
import pool from "../database/db";

export const getAllVendorsQuery = async (): Promise<Vendor[]> => {
  console.log("getAllVendors");
  const vendors = await pool.query("SELECT * FROM vendors");
  return vendors.rows;
};

export const getVendorByIdQuery = async (id: number): Promise<Vendor | null> => {
  console.log("getVendorById", id);
  const result = await pool.query("SELECT * FROM vendors WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewVendorQuery = async (vendor: {
  name: string;
  description: string;
}): Promise<Vendor> => {
  console.log("createNewVendor", vendor);
  const result = await pool.query(
    "INSERT INTO vendors (name, description) VALUES ($1, $2) RETURNING *",
    [vendor.name, vendor.description]
  );
  return result.rows[0];
};

export const updateVendorByIdQuery = async (
  id: number,
  vendor: { name?: string; description?: string }
): Promise<Vendor | null> => {
  console.log("updateVendorById", id, vendor);
  const fields = [];
  const values = [];
  let query = "UPDATE vendors SET ";

  if (vendor.name) {
    fields.push("name = $1");
    values.push(vendor.name);
  }
  if (vendor.description) {
    fields.push("description = $2");
    values.push(vendor.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteVendorByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteVendorById", id);
  const result = await pool.query(
    "DELETE FROM vendors WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
