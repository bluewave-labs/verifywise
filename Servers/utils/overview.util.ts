import { Overview } from "../models/Overview";
import pool from "../database/db";

export const getAllOverviewsQuery = async (): Promise<Overview[]> => {
  console.log("getAllOverviews");
  const overviews = await pool.query("SELECT * FROM overviews");
  return overviews.rows;
};

export const getOverviewByIdQuery = async (id: number): Promise<Overview | null> => {
  console.log("getOverviewById", id);
  const result = await pool.query("SELECT * FROM overviews WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewOverviewQuery = async (overview: {
  subrequirement_id: number
  control_name: string
  control_description: string
  control_owner: string
  control_status: string
  implementation_description: string
  implementation_evidence: string
  effective_date: string
  review_date: string
  comments: string
}): Promise<Overview> => {
  console.log("createNewOverview", overview);
  const result = await pool.query(
    "INSERT INTO overviews (subrequirement_id, control_name, control_description, control_owner, control_status, implementation_description, implementation_evidence, effective_date, review_date, comments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
    [overview.subrequirement_id, overview.control_name, overview.control_description, overview.control_owner, overview.control_status, overview.implementation_description, overview.implementation_evidence, overview.effective_date, overview.review_date, overview.comments]
  );
  return result.rows[0];
};

export const updateOverviewByIdQuery = async (
  id: number,
  overview: {
    subrequirement_id?: number
    control_name?: string
    control_description?: string
    control_owner?: string
    control_status?: string
    implementation_description?: string
    implementation_evidence?: string
    effective_date?: string
    review_date?: string
    comments?: string
  }
): Promise<Overview | null> => {
  console.log("updateOverviewById", id, overview);
  const fields = [];
  const values = [];
  let query = "UPDATE overviews SET ";

  if(overview.subrequirement_id) {
    fields.push("subrequirement_id = $1");
    values.push(overview.subrequirement_id)
  }
  if(overview.control_name) {
    fields.push("control_name = $2");
    values.push(overview.control_name)
  }
  if(overview.control_description) {
    fields.push("control_description = $3");
    values.push(overview.control_description)
  }
  if(overview.control_owner) {
    fields.push("control_owner = $4");
    values.push(overview.control_owner)
  }
  if(overview.control_status) {
    fields.push("control_status = $5");
    values.push(overview.control_status)
  }
  if(overview.implementation_description) {
    fields.push("implementation_description = $6");
    values.push(overview.implementation_description)
  }
  if(overview.implementation_evidence) {
    fields.push("implementation_evidence = $7");
    values.push(overview.implementation_evidence)
  }
  if(overview.effective_date) {
    fields.push("effective_date = $8");
    values.push(overview.effective_date)
  }
  if(overview.review_date) {
    fields.push("review_date = $9");
    values.push(overview.review_date)
  }
  if(overview.comments) {
    fields.push("comments = $10");
    values.push(overview.comments)
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $11 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteOverviewByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteOverviewById", id);
  const result = await pool.query(
    "DELETE FROM overviews WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
