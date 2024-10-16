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
  name: string;
  description: string;
}): Promise<Overview> => {
  console.log("createNewOverview", overview);
  const result = await pool.query(
    "INSERT INTO overviews (name, description) VALUES ($1, $2) RETURNING *",
    [overview.name, overview.description]
  );
  return result.rows[0];
};

export const updateOverviewByIdQuery = async (
  id: number,
  overview: { name?: string; description?: string }
): Promise<Overview | null> => {
  console.log("updateOverviewById", id, overview);
  const fields = [];
  const values = [];
  let query = "UPDATE overviews SET ";

  if (overview.name) {
    fields.push("name = $1");
    values.push(overview.name);
  }
  if (overview.description) {
    fields.push("description = $2");
    values.push(overview.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
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
