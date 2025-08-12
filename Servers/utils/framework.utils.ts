import { QueryTypes, Transaction } from "sequelize";
import { sequelize } from "../database/db";
import { FrameworkModel } from "../domain.layer/models/frameworks/frameworks.model";
import { ProjectFrameworksModel } from "../domain.layer/models/projectFrameworks/projectFrameworks.model";
import {
  frameworkAdditionMap,
  frameworkDeletionMap,
  frameworkFilesDeletionSourceMap,
} from "../types/framework.type";

export const getAllFrameworksQuery = async (
  tenant: string
): Promise<FrameworkModel[]> => {
  const frameworks = await sequelize.query(
    `SELECT * FROM public.frameworks ORDER BY created_at DESC, id ASC;`,
    {
      mapToModel: true,
      model: FrameworkModel,
    }
  );
  for (let framework of frameworks) {
    const frameworkProjects = await sequelize.query(
      `SELECT * FROM "${tenant}".projects_frameworks WHERE framework_id = :frameworkId`,
      {
        replacements: { frameworkId: framework.id },
        mapToModel: true,
        model: ProjectFrameworksModel,
      }
    );
    (framework as any).projects = frameworkProjects;
  }
  return frameworks;
};

export const getAllFrameworkByIdQuery = async (
  id: number,
  tenant: string
): Promise<FrameworkModel | null> => {
  const result = await sequelize.query(
    `SELECT * FROM public.frameworks WHERE id = :id ORDER BY created_at DESC, id ASC`,
    {
      replacements: { id },
      mapToModel: true,
      model: FrameworkModel,
    }
  );
  const framework = result[0];
  const frameworkProjects = await sequelize.query(
    `SELECT * FROM "${tenant}".projects_frameworks WHERE framework_id = :frameworkId`,
    {
      replacements: { frameworkId: framework.id },
      mapToModel: true,
      model: ProjectFrameworksModel,
    }
  );
  (framework as any).projects = frameworkProjects;
  return framework;
};

const checkFrameworkExistsQuery = async (
  frameworkId: number,
  projectId: number,
  tenant: string,
  transaction: Transaction
): Promise<boolean> => {
  const [[{ exists }]] = (await sequelize.query(
    `SELECT EXISTS (SELECT 1 FROM "${tenant}".projects_frameworks WHERE project_id = :projectId AND framework_id = :frameworkId) AS exists;`,
    { replacements: { projectId, frameworkId }, transaction }
  )) as [[{ exists: boolean }], number];
  if (exists) {
    return false; // Framework already added
  }
  return true; // Framework can be added
}

export const canAddFrameworkToProjectQuery = async (
  frameworkId: number,
  projectId: number,
  tenant: string,
  transaction: Transaction
): Promise<boolean> => {
  const exists = await checkFrameworkExistsQuery(frameworkId, projectId, tenant, transaction);
  if (exists) {
    return false; // Framework already added
  }

  const [[{ is_framework_organizational }]] = (await sequelize.query(
    `SELECT is_organizational AS is_framework_organizational FROM "${tenant}".frameworks WHERE id = :frameworkId;`,
    { replacements: { frameworkId }, transaction }
  )) as [[{ is_framework_organizational: boolean }], number];
  const [[{ is_project_organizational }]] = (await sequelize.query(
    `SELECT is_organizational AS is_project_organizational FROM "${tenant}".projects WHERE id = :projectId;`,
    { replacements: { projectId }, transaction }
  )) as [[{ is_project_organizational: boolean }], number];

  if (is_framework_organizational !== is_project_organizational) {
    return false; // Cannot add organizational framework to non-organizational project
  }

  return true; // Framework can be added
}

export const addFrameworkToProjectQuery = async (
  frameworkId: number,
  projectId: number,
  tenant: string,
  transaction: Transaction
): Promise<boolean> => {
  const canAdd = await canAddFrameworkToProjectQuery(frameworkId, projectId, tenant, transaction);
  if (!canAdd) {
    return false;
  }

  const frameworkAdditionFunction = frameworkAdditionMap[frameworkId];
  if (!frameworkAdditionFunction) {
    return false;
  }

  // add the framework to the project
  const result = (await sequelize.query(
    `INSERT INTO "${tenant}".projects_frameworks (project_id, framework_id) VALUES (:projectId, :frameworkId) RETURNING *;`,
    { replacements: { projectId, frameworkId }, transaction }
  )) as [ProjectFrameworksModel[], number];
  if (!result[0]?.length) {
    return false;
  }
  // call framework addition function only if insert was successful
  await frameworkAdditionFunction(projectId, false, tenant, transaction);
  return true;
};

const deleteFrameworkEvidenceFiles = async (
  projectId: number,
  source: string[],
  tenant: string,
  transaction: Transaction
): Promise<void> => {
  await sequelize.query(
    `DELETE FROM "${tenant}".files WHERE project_id = :project_id AND source IN (:source)`,
    {
      replacements: { project_id: projectId, source },
      transaction,
    }
  );
};

export const deleteFrameworkFromProjectQuery = async (
  frameworkId: number,
  projectId: number,
  tenant: string,
  transaction: Transaction
): Promise<boolean> => {
  const exists = await checkFrameworkExistsQuery(frameworkId, projectId, tenant, transaction);
  if (!exists) {
    return false; // Framework not found in the project
  }

  // delete evidence files for the framework
  const frameworkFilesDeletionSource =
    frameworkFilesDeletionSourceMap[frameworkId];
  if (!frameworkFilesDeletionSource) {
    return false;
  }
  await deleteFrameworkEvidenceFiles(
    projectId,
    frameworkFilesDeletionSource,
    tenant,
    transaction
  );

  const frameworkDeletionFunction = frameworkDeletionMap[frameworkId];
  if (!frameworkDeletionFunction) {
    return false;
  }
  // call framework deletion function
  const result = await frameworkDeletionFunction(projectId, tenant, transaction);
  return result;
};
