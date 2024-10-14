import { Project } from "../models/Project";
import pool from "../database/db";

export const getAllProjectsQuery = async (): Promise<Project[]> => {
  console.log("getAllProjects");
  const projects = await pool.query("SELECT * FROM projects");
  return projects.rows;
};

export const getProjectByIdQuery = async (id: number): Promise<Project | null> => {
  console.log("getProjectById", id);
  const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewProjectQuery = async (project: {
  name: string;
  description: string;
}): Promise<Project> => {
  console.log("createNewProject", project);
  const result = await pool.query(
    "INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *",
    [project.name, project.description]
  );
  return result.rows[0];
};

export const updateProjectByIdQuery = async (
  id: number,
  project: { name?: string; description?: string }
): Promise<Project | null> => {
  console.log("updateProjectById", id, project);
  const fields = [];
  const values = [];
  let query = "UPDATE projects SET ";

  if (project.name) {
    fields.push("name = $1");
    values.push(project.name);
  }
  if (project.description) {
    fields.push("description = $2");
    values.push(project.description);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $3 RETURNING *";
  values.push(id);

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteProjectByIdQuery = async (id: number): Promise<boolean> => {
  console.log("deleteProjectById", id);
  const result = await pool.query(
    "DELETE FROM projects WHERE id = $1 RETURNING id",
    [id]
  );
  return result.rowCount !== null && result.rowCount > 0;
};
