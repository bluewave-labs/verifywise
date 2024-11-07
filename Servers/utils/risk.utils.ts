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
  project_id: number
  risk_description: string
  impact: string
  probability: string
  owner_id: number
  severity: string
  likelihood: string
  risk_level: string
}): Promise<Risk> => {
  console.log("createNewRisk", risk);
  const result = await pool.query(
    "INSERT INTO risks (project_id, risk_description, impact, probability, owner_id, severity, likelihood, risk_level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    [risk.project_id, risk.risk_description, risk.impact, risk.probability, risk.owner_id, risk.severity, risk.likelihood, risk.risk_level]
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
  risk: {
    project_id?: number
    risk_description?: string
    impact?: string
    probability?: string
    owner_id?: number
    severity?: string
    likelihood?: string
    risk_level?: string
  }
): Promise<Risk | null> => {
  console.log("updateRiskById", id, risk);
  const fields = [];
  const values = [];
  let query = "UPDATE risks SET ";

  if(risk.project_id) {
    fields.push("project_id = $1")
    values.push(risk.project_id)
  }
  if(risk.risk_description) {
    fields.push("risk_description = $2")
    values.push(risk.risk_description)
  }
  if(risk.impact) {
    fields.push("impact = $3")
    values.push(risk.impact)
  }
  if(risk.probability) {
    fields.push("probability = $4")
    values.push(risk.probability)
  }
  if(risk.owner_id) {
    fields.push("owner_id = $5")
    values.push(risk.owner_id)
  }
  if(risk.severity) {
    fields.push("severity = $6")
    values.push(risk.severity)
  }
  if(risk.likelihood) {
    fields.push("likelihood = $7")
    values.push(risk.likelihood)
  }
  if(risk.risk_level) {
    fields.push("risk_level = $8")
    values.push(risk.risk_level)
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $9 RETURNING *";
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
