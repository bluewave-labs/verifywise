import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { FrameworkModel } from "../models/frameworks.model";
import { ProjectFrameworksModel } from "../models/projectFrameworks.model";
import { frameworkAdditionMap, frameworkDeletionMap } from "../types/framework.type";

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
  const [[{ exists }]] = await sequelize.query(
    "SELECT EXISTS (SELECT 1 FROM projects_frameworks WHERE project_id = :projectId AND framework_id = :frameworkId) AS exists;",
    { replacements: { projectId, frameworkId }, transaction }
  ) as [[{ exists: boolean }], number];
  if (exists) {
    return false; // Framework already added
  }

  const frameworkAdditionFunction = frameworkAdditionMap[frameworkId];
  if (!frameworkAdditionFunction) {
    return false;
  }

  // add the framework to the project
  const result = await sequelize.query(
    "INSERT INTO projects_frameworks (project_id, framework_id) VALUES (:projectId, :frameworkId) RETURNING *;",
    { replacements: { projectId, frameworkId }, transaction }
  ) as [ProjectFrameworksModel[], number];
  if (!result[0]?.length) {
    return false;
  }
  // call framework addition function only if insert was successful
  await frameworkAdditionFunction(projectId, false, transaction);
  return true;
};

export const deleteFrameworkFromProjectQuery = async (
  frameworkId: number,
  projectId: number,
  transaction: Transaction
): Promise<boolean> => {
  const [[{ exists }]] = await sequelize.query(
    "SELECT EXISTS (SELECT 1 FROM projects_frameworks WHERE project_id = :projectId AND framework_id = :frameworkId) AS exists;",
    { replacements: { projectId, frameworkId }, transaction }
  ) as [[{ exists: boolean }], number];
  if (!exists) {
    return false; // Framework not found in the project
  }

  const frameworkDeletionFunction = frameworkDeletionMap[frameworkId];
  if (!frameworkDeletionFunction) {
    return false;
  }

  // call framework deletion function
  const result = await frameworkDeletionFunction(projectId, transaction);
  return result;
}
