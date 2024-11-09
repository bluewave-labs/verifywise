import { Project } from "../models/project.model";
import pool from "../database/db";

export const getAllProjectsQuery = async (): Promise<Project[]> => {
  console.log("getAllProjects");
  const projects = await pool.query("SELECT * FROM projects");
  return projects.rows;
};

export const getProjectByIdQuery = async (
  id: number
): Promise<Project | null> => {
  console.log("getProjectById", id);
  const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const createNewProjectQuery = async (project: {
  project_title: string;
  owner: string;
  users: number[];
  start_date: Date;
  ai_risk_classification: "high risk" | "limited risk" | "minimal risk";
  type_of_high_risk_role:
    | "deployer"
    | "provider"
    | "distributor"
    | "importer"
    | "product manufacturer"
    | "authorized representative";
  goal: string;
  last_updated: Date;
  last_updated_by: string;
}): Promise<Project> => {
  console.log("createNewProject", project);
  const result = await pool.query(
    `INSERT INTO projects (
      project_title, owner, users, start_date, ai_risk_classification, 
      type_of_high_risk_role, goal, last_updated, last_updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [
      project.project_title,
      project.owner,
      project.users,
      project.start_date,
      project.ai_risk_classification,
      project.type_of_high_risk_role,
      project.goal,
      project.last_updated,
      project.last_updated_by,
    ]
  );
  return result.rows[0];
};

export const updateProjectByIdQuery = async (
  id: number,
  project: Partial<Project>
): Promise<Project | null> => {
  console.log("updateProjectById", id, project);
  const fields = [];
  const values = [];
  let query = "UPDATE projects SET ";

  if (project.project_title) {
    fields.push(`project_title = $${fields.length + 1}`);
    values.push(project.project_title);
  }
  if (project.owner) {
    fields.push(`owner = $${fields.length + 1}`);
    values.push(project.owner);
  }
  if (project.users) {
    fields.push(`users = $${fields.length + 1}`);
    values.push(project.users);
  }
  if (project.start_date) {
    fields.push(`start_date = $${fields.length + 1}`);
    values.push(project.start_date);
  }
  if (project.ai_risk_classification) {
    fields.push(`ai_risk_classification = $${fields.length + 1}`);
    values.push(project.ai_risk_classification);
  }
  if (project.type_of_high_risk_role) {
    fields.push(`type_of_high_risk_role = $${fields.length + 1}`);
    values.push(project.type_of_high_risk_role);
  }
  if (project.goal) {
    fields.push(`goal = $${fields.length + 1}`);
    values.push(project.goal);
  }
  if (project.last_updated) {
    fields.push(`last_updated = $${fields.length + 1}`);
    values.push(project.last_updated);
  }
  if (project.last_updated_by) {
    fields.push(`last_updated_by = $${fields.length + 1}`);
    values.push(project.last_updated_by);
  }

  if (fields.length === 0) {
    throw new Error("No fields to update");
  }

  query += fields.join(", ") + ` WHERE id = $${fields.length + 1} RETURNING *`;
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
