import { ProjectScopeModel } from "../domain.layer/models/projectScope/projectScope.model";
import { sequelize } from "../database/db";
import { QueryTypes, Transaction } from "sequelize";
import { IProjectScope } from "../domain.layer/interfaces/i.projectScope";

export const getAllProjectScopesQuery = async (): Promise<IProjectScope[]> => {
  const projectScopes = await sequelize.query(
    "SELECT * FROM projectscopes ORDER BY created_at DESC, id ASC",
    {
      mapToModel: true,
      model: ProjectScopeModel,
    }
  );
  return projectScopes;
};

export const getProjectScopeByIdQuery = async (
  id: number
): Promise<IProjectScope | null> => {
  const result = await sequelize.query(
    "SELECT * FROM projectscopes WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectScopeModel,
    }
  );
  return result[0];
};

export const createProjectScopeQuery = async (
  projectScope: Partial<ProjectScopeModel>,
  transaction: Transaction
): Promise<ProjectScopeModel> => {
  const result = await sequelize.query(
    `INSERT INTO projectscopes (
      assessment_id, describe_ai_environment, is_new_ai_technology,
      uses_personal_data, project_scope_documents, technology_type,
      has_ongoing_monitoring, unintended_outcomes, technology_documentation
    ) VALUES (
      :assessment_id, :describe_ai_environment, :is_new_ai_technology,
      :uses_personal_data, :project_scope_documents, :technology_type,
      :has_ongoing_monitoring, :unintended_outcomes, :technology_documentation
    ) RETURNING *`,
    {
      replacements: {
        assessmentId: projectScope.assessmentId,
        describeAiEnvironment: projectScope.describeAiEnvironment,
        isNewAiTechnology: projectScope.isNewAiTechnology,
        usesPersonalData: projectScope.usesPersonalData,
        projectScopeDocuments: projectScope.projectScopeDocuments,
        technologyType: projectScope.technologyType,
        hasOngoingMonitoring: projectScope.hasOngoingMonitoring,
        unintendedOutcomes: projectScope.unintendedOutcomes,
        technologyDocumentation: projectScope.technologyDocumentation,
      },
      mapToModel: true,
      model: ProjectScopeModel,
      // type: QueryTypes.INSERT
      transaction,
    }
  );
  return result[0];
};

export const updateProjectScopeByIdQuery = async (
  id: number,
  projectScope: Partial<ProjectScopeModel>,
  transaction: Transaction
): Promise<ProjectScopeModel | null> => {
  const updateProjectScope: Partial<Record<keyof ProjectScopeModel, any>> = {};
  const setClause = [
    "assessment_id",
    "describe_ai_environment",
    "is_new_ai_technology",
    "uses_personal_data",
    "project_scope_documents",
    "technology_type",
    "has_ongoing_monitoring",
    "unintended_outcomes",
    "technology_documentation",
  ]
    .filter((f) => {
      if (
        projectScope[f as keyof ProjectScopeModel] !== undefined &&
        projectScope[f as keyof ProjectScopeModel]
      ) {
        updateProjectScope[f as keyof ProjectScopeModel] =
          projectScope[f as keyof ProjectScopeModel];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE projectscopes SET ${setClause} WHERE id = :id RETURNING *;`;

  updateProjectScope.id = id;

  const result = await sequelize.query(query, {
    replacements: updateProjectScope,
    mapToModel: true,
    model: ProjectScopeModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  return result[0];
};

export const deleteProjectScopeByIdQuery = async (
  id: number,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    "DELETE FROM projectscopes WHERE id = :id RETURNING *",
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectScopeModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};
