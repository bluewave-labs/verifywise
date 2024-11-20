import { Vendor } from "../models/vendor.model";
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
  projectId: number;
  vendorName: string;
  assignee: string;
  vendorProvides: string;
  website: string;
  vendorContactPerson: string;
  reviewResult: string;
  reviewStatus: string;
  reviewer: string;
  riskStatus: string;
  reviewDate: Date;
  riskDescription: string;
  impactDescription: string;
  impact: number;
  probability: number;
  actionOwner: string;
  actionPlan: string;
  riskSeverity: number;
  riskLevel: string;
  likelihood: number;
}): Promise<Vendor> => {
  console.log("createNewVendor", vendor);
  const result = await pool.query(
    `INSERT INTO vendors (
      projectId, vendorName, assignee, vendorProvides, website, vendorContactPerson, 
      reviewResult, reviewStatus, reviewer, riskStatus, reviewDate, riskDescription, 
      impactDescription, impact, probability, actionOwner, actionPlan, riskSeverity, 
      riskLevel, likelihood
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
    [
      vendor.projectId,
      vendor.vendorName,
      vendor.assignee,
      vendor.vendorProvides,
      vendor.website,
      vendor.vendorContactPerson,
      vendor.reviewResult,
      vendor.reviewStatus,
      vendor.reviewer,
      vendor.riskStatus,
      vendor.reviewDate,
      vendor.riskDescription,
      vendor.impactDescription,
      vendor.impact,
      vendor.probability,
      vendor.actionOwner,
      vendor.actionPlan,
      vendor.riskSeverity,
      vendor.riskLevel,
      vendor.likelihood,
    ]
  );
  return result.rows[0];
};

export const updateVendorByIdQuery = async (
  id: number,
  vendor: Partial<{
    projectId: number;
    vendorName: string;
    assignee: string;
    vendorProvides: string;
    website: string;
    vendorContactPerson: string;
    reviewResult: string;
    reviewStatus: string;
    reviewer: string;
    riskStatus: string;
    reviewDate: Date;
    riskDescription: string;
    impactDescription: string;
    impact: number;
    probability: number;
    actionOwner: string;
    actionPlan: string;
    riskSeverity: number;
    riskLevel: string;
    likelihood: number;
  }>
): Promise<Vendor | null> => {
  console.log("updateVendorById", id, vendor);
  const fields = [];
  const values = [];
  let query = "UPDATE vendors SET ";

  if (vendor.projectId !== undefined) {
    fields.push(`projectId = $${fields.length + 1}`);
    values.push(vendor.projectId);
  }
  if (vendor.vendorName !== undefined) {
    fields.push(`vendorName = $${fields.length + 1}`);
    values.push(vendor.vendorName);
  }
  if (vendor.assignee !== undefined) {
    fields.push(`assignee = $${fields.length + 1}`);
    values.push(vendor.assignee);
  }
  if (vendor.vendorProvides !== undefined) {
    fields.push(`vendorProvides = $${fields.length + 1}`);
    values.push(vendor.vendorProvides);
  }
  if (vendor.website !== undefined) {
    fields.push(`website = $${fields.length + 1}`);
    values.push(vendor.website);
  }
  if (vendor.vendorContactPerson !== undefined) {
    fields.push(`vendorContactPerson = $${fields.length + 1}`);
    values.push(vendor.vendorContactPerson);
  }
  if (vendor.reviewResult !== undefined) {
    fields.push(`reviewResult = $${fields.length + 1}`);
    values.push(vendor.reviewResult);
  }
  if (vendor.reviewStatus !== undefined) {
    fields.push(`reviewStatus = $${fields.length + 1}`);
    values.push(vendor.reviewStatus);
  }
  if (vendor.reviewer !== undefined) {
    fields.push(`reviewer = $${fields.length + 1}`);
    values.push(vendor.reviewer);
  }
  if (vendor.riskStatus !== undefined) {
    fields.push(`riskStatus = $${fields.length + 1}`);
    values.push(vendor.riskStatus);
  }
  if (vendor.reviewDate !== undefined) {
    fields.push(`reviewDate = $${fields.length + 1}`);
    values.push(vendor.reviewDate);
  }
  if (vendor.riskDescription !== undefined) {
    fields.push(`riskDescription = $${fields.length + 1}`);
    values.push(vendor.riskDescription);
  }
  if (vendor.impactDescription !== undefined) {
    fields.push(`impactDescription = $${fields.length + 1}`);
    values.push(vendor.impactDescription);
  }
  if (vendor.impact !== undefined) {
    fields.push(`impact = $${fields.length + 1}`);
    values.push(vendor.impact);
  }
  if (vendor.probability !== undefined) {
    fields.push(`probability = $${fields.length + 1}`);
    values.push(vendor.probability);
  }
  if (vendor.actionOwner !== undefined) {
    fields.push(`actionOwner = $${fields.length + 1}`);
    values.push(vendor.actionOwner);
  }
  if (vendor.actionPlan !== undefined) {
    fields.push(`actionPlan = $${fields.length + 1}`);
    values.push(vendor.actionPlan);
  }
  if (vendor.riskSeverity !== undefined) {
    fields.push(`riskSeverity = $${fields.length + 1}`);
    values.push(vendor.riskSeverity);
  }
  if (vendor.riskLevel !== undefined) {
    fields.push(`riskLevel = $${fields.length + 1}`);
    values.push(vendor.riskLevel);
  }
  if (vendor.likelihood !== undefined) {
    fields.push(`likelihood = $${fields.length + 1}`);
    values.push(vendor.likelihood);
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
