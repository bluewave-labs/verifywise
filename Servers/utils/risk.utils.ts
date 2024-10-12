import { Risk } from "../models/Risk";
import pool from "../database/db";

/**
 * send the list of risks from the db
 * @returns list if risks
 */
export const getAllRisksQuery = async (): Promise<Risk[]> => {
  console.log("getAllRisks");
  const risks = await pool.query("SELECT * FROM risks");
  return risks.rows;
};

/**
 * send the risk entry from the db based on the id
 * @param id id of the risk
 * @returns risk object or null
 */
export const getRiskByIdQuery = async (id: number): Promise<Risk | null> => {
  console.log("getRiskById", id);
  const result = await pool.query("SELECT * FROM risks WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

/**
 * create a risk entry in the db
 * @param risk risk object
 * @returns new created risk object
 */
export const createNewRiskQuery = async (risk: {
  name: string;
  description: string;
}): Promise<Risk> => {
  console.log("createNewRisk", risk);
  const result = await pool.query(
    "INSERT INTO risks (name, description) VALUES ($1, $2) RETURNING *",
    [risk.name, risk.description]
  );
  return result.rows[0];
};

/**
 * update the risk in the db based on the id and new value
 * @param id id of the risk
 * @param risk risk object
 * @returns risk object
 */
export const updateRiskByIdQuery = async (
  id: number,
  risk: { name?: string; description?: string }
): Promise<Risk | null> => {
  console.log("updateRiskById", id, risk);
  const fields = [];
  const values = [];
  let query = "UPDATE risks SET ";

  if (risk.name) {
    fields.push("name = $1");
    values.push(risk.name);
  }
  if (risk.description) {
    fields.push("description = $2");
    values.push(risk.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

/**
 * delete the risk entry from the db based on the id
 * @param id id of the risk
 * @returns row count after operation
 */
export const deleteRiskByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteRiskById", id);
  const result = await pool.query(
    "DELETE FROM risks WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
