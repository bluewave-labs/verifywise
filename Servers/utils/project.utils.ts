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

export const createNewProjectQuery = async (
  project: {
    project_title: string;
    owner: number;
    users: string;
    start_date: Date;
    ai_risk_classification: string;
    type_of_high_risk_role: string;
    goal: string;
    last_updated: Date;
    last_updated_by: number;
  }
): Promise<Project> => {
  console.log("createProject");
  const result = await pool.query(
    "INSERT INTO projects (project_title, owner, users, start_date, ai_risk_classification, type_of_high_risk_role, goal, last_updated, last_updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
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
  project: Partial<{
    project_title: string;
    owner: string;
    users: string;
    start_date: Date;
    ai_risk_classification: string;
    type_of_high_risk_role: string;
    goal: string;
    last_updated: Date;
    last_updated_by: string;
  }>
): Promise<Project | null> => {
  console.log("updateProjectById", id);
  const result = await pool.query(
    `UPDATE projects SET ${Object.keys(project)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ")} WHERE id = ${id} RETURNING *`,
    Object.values(project)
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteProjectByIdQuery = async (
  id: number
): Promise<Project | null> => {
  console.log("deleteProjectById", id);
  const result = await pool.query(
    "DELETE FROM projects WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const calculateProjectRisks = async (project_id: number): Promise<
  {
    risk_level_autocalculated: string,
    count: string
  }[]
> => {
  console.log("calculateProjectRisks");
  const result = await pool.query("SELECT risk_level_autocalculated, count(*) AS count FROM projectrisks WHERE project_id = $1 GROUP BY risk_level_autocalculated",
    [project_id]
  )
  return result.rows
}

export const calculateVendirRisks = async (project_id: number): Promise<
  {
    risk_level_autocalculated: string,
    count: string
  }[]
> => {
  console.log("calculateVendorRisks");
  const result = await pool.query("SELECT risk_level, count(*) AS count FROM vendorrisks WHERE project_id = $1 GROUP BY risk_level",
    [project_id]
  )
  return result.rows
}
