import { Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { FrameworkModel } from "../models/frameworks.model";
import { ProjectFrameworksModel } from "../models/projectFrameworks.model";
import { frameworkAdditionMap } from "../types/framework.type";

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

export const addFrameworkToProjectQuery = async (
  frameworkId: number,
  projectId: number,
  transaction: Transaction
): Promise<boolean> => {
  const currentFrameworksResult = await sequelize.query(
    "SELECT * FROM projects_frameworks WHERE project_id = :projectId;",
    {
      replacements: { projectId }, transaction
    }
  ) as [ProjectFrameworksModel[], number];
  const currentFrameworks = currentFrameworksResult[0].map((framework) => framework.framework_id);
  if (currentFrameworks.includes(frameworkId)) {
    return false;
  }
  const frameworkAdditionFunction = frameworkAdditionMap[frameworkId];
  if (!frameworkAdditionFunction) {
    return false;
  }

  // add the framework to the project
  await sequelize.query(
    "INSERT INTO projects_frameworks (project_id, framework_id) VALUES (:projectId, :frameworkId);",
    {
      replacements: { projectId, frameworkId }, transaction
    }
  );
  // call the framework addition function
  await frameworkAdditionFunction(
    projectId,
    false,
    transaction
  );
  return true;
};
