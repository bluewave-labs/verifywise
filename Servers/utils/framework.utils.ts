import { sequelize } from "../database/db";
import { FrameworkModel } from "../models/frameworks.model";
import { ProjectFrameworksModel } from "../models/projectFrameworks.model";

export const getAllFrameworksQuery = async (
): Promise<FrameworkModel[]> => {
  const frameworks = await sequelize.query(
    "SELECT * FROM frameworks ORDER BY created_at DESC, id ASC;",
    {
      mapToModel: true,
      model: FrameworkModel
    }
  );
  for (let framework of frameworks) {
    const frameworkProjects = await sequelize.query(
      "SELECT * FROM projects_frameworks WHERE framework_id = :frameworkId",
      {
        replacements: { frameworkId: framework.id },
        mapToModel: true,
        model: ProjectFrameworksModel 
      }
    );
    (framework as any).projects = frameworkProjects;
  }
  return frameworks;
};

export const getAllFrameworkByIdQuery = async (
  id: number
): Promise<FrameworkModel | null> => {
  const result = await sequelize.query(
    "SELECT * FROM frameworks WHERE id = :id ORDER BY created_at DESC, id ASC",
    {
      replacements: { id },
      mapToModel: true,
      model: FrameworkModel
    }
  );
  const framework = result[0];
  const frameworkProjects = await sequelize.query(
    "SELECT * FROM projects_frameworks WHERE framework_id = :frameworkId",
    {
      replacements: { frameworkId: framework.id },
      mapToModel: true,
      model: ProjectFrameworksModel 
    }
  );
  (framework as any).projects = frameworkProjects;
  return framework;
};
