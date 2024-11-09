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
  name: string
  description: string
  last_updated: Date
  owner_id: number
  compliance_status: string
  controls_completed: number
  requirements_completed: number
}): Promise<Project> => {
  console.log("createNewProject", project);
  const result = await pool.query(
    "INSERT INTO projects (name, description, last_updated, owner_id, compliance_status, controls_completed, requirements_completed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
    [project.name, project.description, project.last_updated, project.owner_id, project.compliance_status, project.controls_completed, project.requirements_completed]
  );
  return result.rows[0];
};

export const updateProjectByIdQuery = async (
  id: number,
  project: {
    name?: string
    description?: string
    last_updated?: Date
    owner_id?: number
    compliance_status?: string
    controls_completed?: number
    requirements_completed?: number
  }
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
  if(project.last_updated) {
    fields.push("last_updated = $3")
    values.push(project.last_updated)
  }
  if(project.owner_id) {
    fields.push("owner_id = $4")
    values.push(project.owner_id)
  }
  if(project.compliance_status) {
    fields.push("compliance_status = $5")
    values.push(project.compliance_status)
  }
  if(project.controls_completed !== undefined) {
    fields.push("controls_completed = $6")
    values.push(project.controls_completed)
  }
  if(project.requirements_completed !== undefined) {
    fields.push("requirements_completed = $7")
    values.push(project.requirements_completed)
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + " WHERE id = $8 RETURNING *";
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
