import { Vendor } from "../models/vendor.model";
import pool from "../database/db";
import { deleteVendorRisksForVendorQuery } from "./vendorRisk.util";

export const getAllVendorsQuery = async (): Promise<Vendor[]> => {
  const vendors = await pool.query("SELECT * FROM vendors");
  for (let vendor of vendors.rows) {
    const projects = await pool.query("SELECT project_id FROM vendors_projects WHERE vendor_id = $1", [vendor.id])
    vendor["projects"] = projects.rows.map(p => p.project_id)
  }
  return vendors.rows
};

export const getVendorByIdQuery = async (
  id: number
): Promise<Vendor | null> => {
  const result = await pool.query("SELECT * FROM vendors WHERE id = $1", [id]);
  if (!result.rows.length) return null;
  const projects = await pool.query("SELECT project_id FROM vendors_projects WHERE vendor_id = $1", [id])
  return { ...result.rows[0], projects: projects.rows.map(p => p.project_id) }
};

export const getVendorByProjectIdQuery = async (
  project_id: number
): Promise<Vendor[] | null> => {
  const result = await pool.query("SELECT vendor_id FROM vendors_projects WHERE project_id = $1", [project_id]);
  if (!result.rows.length) return null;
  const vendors: Vendor[] = []
  for (let vendors_project of result.rows) {
    const vendor = await pool.query("SELECT * FROM vendors WHERE id = $1", [vendors_project.vendor_id]);
    // commenting as, for the current functionality, project and vendor have 1:1 mapping
    // const projects = await pool.query("SELECT project_id FROM vendors_projects WHERE vendor_id = $1", [vendors_project.vendor_id])
    // vendors.push({ ...vendor.rows[0], projects: projects.rows.map(p => p.project_id) })
    vendors.push({ ...vendor.rows[0], projects: [project_id] })
  }
  return vendors
};

export const createNewVendorQuery = async (vendor: Vendor): Promise<Vendor | null> => {
  try {
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

    if (!result || !result.rows || result.rows.length === 0) {
      console.error(" Error: Vendor insert query did not return any data.");
      return null;
    }

    const createdVendor = result.rows[0]
    const vendorId = createdVendor.id;

    if (!vendor.projects || vendor.projects.length === 0) {
      console.error(" Error: vendor.projects is empty or undefined.");
      return createdVendor;
    }

    const vendors_projects = await pool.query(
      `INSERT INTO vendors_projects (vendor_id, project_id) VALUES ($1, $2) RETURNING *`,
      [vendorId, vendor.projects[0]]
    );
    createdVendor["projects"] = vendors_projects.rows.map(p => p.project_id)

    return createdVendor;
  } catch (error) {
    console.error(" Error in createNewVendorQuery:", error);
    return null;
  }
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
  await deleteVendorRisksForVendorQuery(id);
  await pool.query(`DELETE FROM vendors_projects WHERE vendor_id = $1`, [id]);
  const result = await pool.query(
    "DELETE FROM vendors WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
