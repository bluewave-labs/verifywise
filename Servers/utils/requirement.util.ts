import { Requirement } from "../models/Requirement";
import pool from "../database/db";

export const getAllRequirementsQuery = async (): Promise<Requirement[]> => {
  console.log("getAllRequirements");
  const requirements = await pool.query("SELECT * FROM requirements");
  return requirements.rows;
};

export const getRequirementByIdQuery = async (id: number): Promise<Requirement | null> => {
  console.log("getRequirementById", id);
  const result = await pool.query("SELECT * FROM requirements WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewRequirementQuery = async (requirement: {
  name: string;
  description: string;
}): Promise<Requirement> => {
  console.log("createNewRequirement", requirement);
  const result = await pool.query(
    "INSERT INTO requirements (name, description) VALUES ($1, $2) RETURNING *",
    [requirement.name, requirement.description]
  );
  return result.rows[0];
};

export const updateRequirementByIdQuery = async (
  id: number,
  requirement: { name?: string; description?: string }
): Promise<Requirement | null> => {
  console.log("updateRequirementById", id, requirement);
  const fields = [];
  const values = [];
  let query = "UPDATE requirements SET ";

  if (requirement.name) {
    fields.push("name = $1");
    values.push(requirement.name);
  }
  if (requirement.description) {
    fields.push("description = $2");
    values.push(requirement.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteRequirementByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteRequirementById", id);
  const result = await pool.query(
    "DELETE FROM requirements WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
