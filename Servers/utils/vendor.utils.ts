import { Vendor } from "../models/vendor.model";
import pool from "../database/db";

export const getAllVendorsQuery = async (): Promise<Vendor[]> => {
  const vendors = await pool.query("SELECT * FROM vendors");
  return vendors.rows;
};

export const getVendorByIdQuery = async (
  id: number
): Promise<Vendor | null> => {
  const result = await pool.query("SELECT * FROM vendors WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewVendorQuery = async (vendor: Vendor): Promise<Vendor> => {
  console.log("createNewVendor", vendor);
  const result = await pool.query(
    `INSERT INTO vendors (
      order_no, vendor_name, vendor_provides, assignee, website, vendor_contact_person, 
      review_result, review_status, reviewer, risk_status, review_date
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      vendor.order_no,
      vendor.vendor_name,
      vendor.vendor_provides,
      vendor.assignee,
      vendor.website,
      vendor.vendor_contact_person,
      vendor.review_result,
      vendor.review_status,
      vendor.reviewer,
      vendor.risk_status,
      vendor.review_date
    ]
  );
  const vendorId = result.rows[0].id;
  await pool.query(`INSERT INTO vendors_projects VALUES ($1, $2)`, [vendorId, vendor.projects[0]]);
  return result.rows[0];
};

export const updateVendorByIdQuery = async (
  id: number,
  vendor: Partial<Vendor>
): Promise<Vendor | null> => {
  const fields = [];
  const values = [];
  let query = "UPDATE vendors SET ";

  if (vendor.order_no !== undefined) {
    fields.push(`order_no = $${fields.length + 1}`);
    values.push(vendor.order_no);
  }
  if (vendor.vendor_name !== undefined) {
    fields.push(`vendor_name = $${fields.length + 1}`);
    values.push(vendor.vendor_name);
  }
  if (vendor.vendor_provides !== undefined) {
    fields.push(`vendor_provides = $${fields.length + 1}`);
    values.push(vendor.vendor_provides);
  }
  if (vendor.assignee !== undefined) {
    fields.push(`assignee = $${fields.length + 1}`);
    values.push(vendor.assignee);
  }
  if (vendor.website !== undefined) {
    fields.push(`website = $${fields.length + 1}`);
    values.push(vendor.website);
  }
  if (vendor.vendor_contact_person !== undefined) {
    fields.push(`vendor_contact_person = $${fields.length + 1}`);
    values.push(vendor.vendor_contact_person);
  }
  if (vendor.review_result !== undefined) {
    fields.push(`review_result = $${fields.length + 1}`);
    values.push(vendor.review_status);
  }
  if (vendor.review_status !== undefined) {
    fields.push(`review_status = $${fields.length + 1}`);
    values.push(vendor.review_status);
  }
  if (vendor.reviewer !== undefined) {
    fields.push(`reviewer = $${fields.length + 1}`);
    values.push(vendor.reviewer);
  }
  if (vendor.risk_status !== undefined) {
    fields.push(`risk_status = $${fields.length + 1}`);
    values.push(vendor.risk_status);
  }
  if (vendor.review_date !== undefined) {
    fields.push(`review_date = $${fields.length + 1}`);
    values.push(vendor.review_date);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + ` WHERE id = $${fields.length + 1} RETURNING *`;
  values.push(id);

  const result = await pool.query(query, values);
  await pool.query(`UPDATE vendors_projects SET project_id = $1 WHERE vendor_id = $2`, [vendor.projects![0], id]);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteVendorByIdQuery = async (id: number): Promise<boolean> => {
  await pool.query(`DELETE FROM vendors_projects WHERE vendor_id = $1`, [id]);
  const result = await pool.query(
    "DELETE FROM vendors WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
