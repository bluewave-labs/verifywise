import { ProjectRisk, ProjectRiskModel } from "../models/projectRisk.model";
import { sequelize } from "../database/db";

export const getProjectRisksReportQuery = async (
  projectId: number
): Promise<ProjectRisk[]> => {
  const projectRisks = await sequelize.query(
    "SELECT * FROM projectrisks WHERE project_id = :project_id ORDER BY created_at DESC, id ASC",
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectRiskModel
    }
  );
  return projectRisks;
};