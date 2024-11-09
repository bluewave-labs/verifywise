import { Control } from "../models/control.model";
import pool from "../database/db";

export const getAllControlsQuery = async (): Promise<Control[]> => {
  console.log("getAllControls");
  const controls = await pool.query("SELECT * FROM controls");
  return controls.rows;
};

export const getControlByIdQuery = async (
  id: number
): Promise<Control | null> => {
  console.log("getControlById", id);
  const result = await pool.query("SELECT * FROM controls WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewControlQuery = async (control: {
  projectId: number;
  status: string;
  approver: string;
  riskReview: string;
  owner: string;
  reviewer: string;
  dueDate: Date;
  implementationDetails: string;
}): Promise<Control> => {
  console.log("createNewControl", control);
  const result = await pool.query(
    `INSERT INTO controls (
      projectId, status, approver, riskReview, owner, reviewer, dueDate, implementationDetails
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      control.projectId,
      control.status,
      control.approver,
      control.riskReview,
      control.owner,
      control.reviewer,
      control.dueDate,
      control.implementationDetails,
    ]
  );
  return result.rows[0];
};

export const updateControlByIdQuery = async (
  id: number,
  control: Partial<Control>
): Promise<Control | null> => {
  console.log("updateControlById", id, control);
  const fields = [];
  const values = [];
  let query = "UPDATE controls SET ";

  if (control.projectId !== undefined) {
    fields.push(`projectId = $${fields.length + 1}`);
    values.push(control.projectId);
  }
  if (control.status !== undefined) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(control.status);
  }
  if (control.approver !== undefined) {
    fields.push(`approver = $${fields.length + 1}`);
    values.push(control.approver);
  }
  if (control.riskReview !== undefined) {
    fields.push(`riskReview = $${fields.length + 1}`);
    values.push(control.riskReview);
  }
  if (control.owner !== undefined) {
    fields.push(`owner = $${fields.length + 1}`);
    values.push(control.owner);
  }
  if (control.reviewer !== undefined) {
    fields.push(`reviewer = $${fields.length + 1}`);
    values.push(control.reviewer);
  }
  if (control.dueDate !== undefined) {
    fields.push(`dueDate = $${fields.length + 1}`);
    values.push(control.dueDate);
  }
  if (control.implementationDetails !== undefined) {
    fields.push(`implementationDetails = $${fields.length + 1}`);
    values.push(control.implementationDetails);
  }

  query += fields.join(", ");
  query += ` WHERE id = ${id} RETURNING *`;

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteControlByIdQuery = async (
  id: number
): Promise<Control | null> => {
  console.log("deleteControlById", id);
  const result = await pool.query(
    "DELETE FROM controls WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};
