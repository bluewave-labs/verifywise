import { ProjectRisk, ProjectRiskModel } from "../models/projectRisk.model";
import { sequelize } from "../database/db";
import { ProjectsMembers, ProjectsMembersModel } from "../models/projectsMembers.model";
import { FileModel } from "../models/file.model";

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

export const getMembersByProjectIdQuery = async (
  projectId: number
): Promise<ProjectsMembers[]> => {
  const members = await sequelize.query(
    "SELECT * FROM projects_members WHERE project_id = :project_id",
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ProjectsMembersModel
    }
  );
  return members;
};

export const getGeneratedReportsQuery = async () => {
  const reports = await sequelize.query(
    "SELECT * FROM files WHERE source = 'Report'",
    {
      mapToModel: true,
      model: FileModel
    }
  );
  return reports;
}