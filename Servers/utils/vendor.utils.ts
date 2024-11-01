import { Vendor } from "../models/Vendor";
import pool from "../database/db";

export const getAllVendorsQuery = async (): Promise<Vendor[]> => {
  console.log("getAllVendors");
  const vendors = await pool.query("SELECT * FROM vendors");
  return vendors.rows;
};

export const getVendorByIdQuery = async (
  id: number
): Promise<Vendor | null> => {
  console.log("getVendorById", id);
  const result = await pool.query("SELECT * FROM vendors WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewVendorQuery = async (vendor: {
  name: string;
  type: string;
  description: string;
  website: string;
  contact_person: string;
  assignee: string;
  status: string;
  review_result: string;
  reviewer: string;
  review_date: string;
  review_status: string;
  risk_status: string;
}): Promise<Vendor> => {
  console.log("createNewVendor", vendor);
  const result = await pool.query(
    "INSERT INTO vendors (name, type, description, website, contact_person, assignee, status, review_result, reviewer, review_date, review_status, risk_status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *",
    [
      vendor.name,
      vendor.type,
      vendor.description,
      vendor.website,
      vendor.contact_person,
      vendor.assignee,
      vendor.status,
      vendor.review_result,
      vendor.reviewer,
      vendor.review_date,
      vendor.review_status,
      vendor.risk_status,
    ]
  );
  return result.rows[0];
};

export const updateVendorByIdQuery = async (
  id: number,
  vendor: {
    name?: string;
    type?: string;
    description?: string;
    website?: string;
    contact_person?: string;
    assignee?: string;
    status?: string;
    review_result?: string;
    reviewer?: string;
    review_date?: string;
    review_status?: string;
    risk_status?: string;
  }
): Promise<Vendor | null> => {
  console.log("updateVendorById", id, vendor);
  const fields = [];
  const values = [];
  let query = "UPDATE vendors SET ";

  if (vendor.name) {
    fields.push(`name = $${fields.length + 1}`);
    values.push(vendor.name);
  }
  if (vendor.type) {
    fields.push(`type = $${fields.length + 1}`);
    values.push(vendor.type);
  }
  if (vendor.description) {
    fields.push(`description = $${fields.length + 1}`);
    values.push(vendor.description);
  }
  if (vendor.website) {
    fields.push(`website = $${fields.length + 1}`);
    values.push(vendor.website);
  }
  if (vendor.contact_person) {
    fields.push(`contact_person = $${fields.length + 1}`);
    values.push(vendor.contact_person);
  }
  if (vendor.assignee) {
    fields.push(`assignee = $${fields.length + 1}`);
    values.push(vendor.assignee);
  }
  if (vendor.status) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(vendor.status);
  }
  if (vendor.review_result) {
    fields.push(`review_result = $${fields.length + 1}`);
    values.push(vendor.review_result);
  }
  if (vendor.reviewer) {
    fields.push(`reviewer = $${fields.length + 1}`);
    values.push(vendor.reviewer);
  }
  if (vendor.review_date) {
    fields.push(`review_date = $${fields.length + 1}`);
    values.push(vendor.review_date);
  }
  if (vendor.review_status) {
    fields.push(`review_status = $${fields.length + 1}`);
    values.push(vendor.review_status);
  }
  if (vendor.risk_status) {
    fields.push(`risk_status = $${fields.length + 1}`);
    values.push(vendor.risk_status);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + ` WHERE id = $${fields.length + 1} RETURNING *`;
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
