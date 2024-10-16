import { Evidence } from "../models/Evidence";
import pool from "../database/db";

export const getAllEvidencesQuery = async (): Promise<Evidence[]> => {
  console.log("getAllEvidences");
  const evidences = await pool.query("SELECT * FROM evidences");
  return evidences.rows;
};

export const getEvidenceByIdQuery = async (id: number): Promise<Evidence | null> => {
  console.log("getEvidenceById", id);
  const result = await pool.query("SELECT * FROM evidences WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewEvidenceQuery = async (evidence: {
  name: string;
  description: string;
}): Promise<Evidence> => {
  console.log("createNewEvidence", evidence);
  const result = await pool.query(
    "INSERT INTO evidences (name, description) VALUES ($1, $2) RETURNING *",
    [evidence.name, evidence.description]
  );
  return result.rows[0];
};

export const updateEvidenceByIdQuery = async (
  id: number,
  evidence: { name?: string; description?: string }
): Promise<Evidence | null> => {
  console.log("updateEvidenceById", id, evidence);
  const fields = [];
  const values = [];
  let query = "UPDATE evidences SET ";

  if (evidence.name) {
    fields.push("name = $1");
    values.push(evidence.name);
  }
  if (evidence.description) {
    fields.push("description = $2");
    values.push(evidence.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteEvidenceByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteEvidenceById", id);
  const result = await pool.query(
    "DELETE FROM evidences WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
