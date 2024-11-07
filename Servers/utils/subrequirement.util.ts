import { Subrequirement } from "../models/Subrequirement";
import pool from "../database/db";

export const getAllSubrequirementsQuery = async (): Promise<Subrequirement[]> => {
  console.log("getAllSubrequirements");
  const subrequirements = await pool.query("SELECT * FROM subrequirements");
  return subrequirements.rows;
};

export const getSubrequirementByIdQuery = async (id: number): Promise<Subrequirement | null> => {
  console.log("getSubrequirementById", id);
  const result = await pool.query("SELECT * FROM subrequirements WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewSubrequirementQuery = async (subrequirement: {
  requirement_id: number;
  name: string;
  description: string;
  status: string;
}): Promise<Subrequirement> => {
  console.log("createNewSubrequirement", subrequirement);
  const result = await pool.query(
    "INSERT INTO subrequirements (requirement_id, name, description, status) VALUES ($1, $2, $3, $4) RETURNING *",
    [subrequirement.requirement_id, subrequirement.name, subrequirement.description, subrequirement.status]
  );
  return result.rows[0];
};

export const updateSubrequirementByIdQuery = async (
  id: number,
  subrequirement: {
    requirement_id?: number;
    name?: string;
    description?: string;
    status?: string;
  }
): Promise<Subrequirement | null> => {
  console.log("updateSubrequirementById", id, subrequirement);
  const fields = [];
  const values = [];
  let query = "UPDATE subrequirements SET ";

  if(subrequirement.requirement_id) {
    fields.push("requirement_id = $1")
    values.push(subrequirement.requirement_id)
  }
  if(subrequirement.name) {
    fields.push("name = $2")
    values.push(subrequirement.name)
  }
  if(subrequirement.description) {
    fields.push("description = $3")
    values.push(subrequirement.description)
  }
  if(subrequirement.status) {
    fields.push("status = $4")
    values.push(subrequirement.status)
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $5 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteSubrequirementByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteSubrequirementById", id);
  const result = await pool.query(
    "DELETE FROM subrequirements WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
