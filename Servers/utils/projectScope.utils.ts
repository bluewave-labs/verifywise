import { ProjectScope } from "../models/projectScope.model";
import pool from "../database/db";

export const getAllProjectScopesQuery = async (): Promise<ProjectScope[]> => {
  console.log("getAllProjectScopes");
  const projectScopes = await pool.query("SELECT * FROM projectscopes");
  return projectScopes.rows;
};

export const getProjectScopeByIdQuery = async (
  id: number
): Promise<ProjectScope | null> => {
  console.log("getProjectScopeById", id);
  const result = await pool.query(
    "SELECT * FROM projectscopes WHERE id = $1",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const createProjectScopeQuery = async (
  projectScope: {
    assessmentId: number;
    describeAiEnvironment: string;
    isNewAiTechnology: boolean;
    usesPersonalData: boolean;
    projectScopeDocuments: string;
    technologyType: string;
    hasOngoingMonitoring: boolean;
    unintendedOutcomes: string;
    technologyDocumentation: string;
  }
): Promise<ProjectScope> => {
  console.log("createProjectScope", projectScope);
  const result = await pool.query(
    "INSERT INTO projectscopes (assessment_id, describe_ai_environment, is_new_ai_technology, uses_personal_data, project_scope_documents, technology_type, has_ongoing_monitoring, unintended_outcomes, technology_documentation) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
    [
      projectScope.assessmentId,
      projectScope.describeAiEnvironment,
      projectScope.isNewAiTechnology,
      projectScope.usesPersonalData,
      projectScope.projectScopeDocuments,
      projectScope.technologyType,
      projectScope.hasOngoingMonitoring,
      projectScope.unintendedOutcomes,
      projectScope.technologyDocumentation,
    ]
  );
  return result.rows[0];
};

export const updateProjectScopeByIdQuery = async (
  id: number,
  projectScope: Partial<{
    assessmentId: number;
    describeAiEnvironment: string;
    isNewAiTechnology: boolean;
    usesPersonalData: boolean;
    projectScopeDocuments: string;
    technologyType: string;
    hasOngoingMonitoring: boolean;
    unintendedOutcomes: string;
    technologyDocumentation: string;
  }>
): Promise<ProjectScope | null> => {
  console.log("updateProjectScopeById", id, projectScope);
  const result = await pool.query(
    `UPDATE projectscopes SET 
      assessment_id = $1, 
      describe_ai_environment = $2, 
      is_new_ai_technology = $3, 
      uses_personal_data = $4, 
      project_scope_documents = $5, 
      technology_type = $6, 
      has_ongoing_monitoring = $7, 
      unintended_outcomes = $8, 
      technology_documentation = $9 
      WHERE id = $10 RETURNING *`,
    [
      projectScope.assessmentId,
      projectScope.describeAiEnvironment,
      projectScope.isNewAiTechnology,
      projectScope.usesPersonalData,
      projectScope.projectScopeDocuments,
      projectScope.technologyType,
      projectScope.hasOngoingMonitoring,
      projectScope.unintendedOutcomes,
      projectScope.technologyDocumentation,
      id,
    ]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteProjectScopeByIdQuery = async (
  id: number
): Promise<ProjectScope | null> => {
  console.log("deleteProjectScopeById", id);
  const result = await pool.query(
    "DELETE FROM projectscopes WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};
