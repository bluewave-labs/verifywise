import { ProjectModel } from "../domain.layer/models/project/project.model";
import { sequelize } from "../database/db";
import { ProjectsMembersModel } from "../domain.layer/models/projectsMembers/projectsMembers.model";
import { QueryTypes, Transaction } from "sequelize";
import { VendorsProjectsModel } from "../domain.layer/models/vendorsProjects/vendorsProjects.model";
import { VendorModel } from "../domain.layer/models/vendor/vendor.model";
import { VendorRiskModel } from "../domain.layer/models/vendorRisk/vendorRisk.model";
import { RiskModel } from "../domain.layer/models/risks/risk.model";
import { FileModel } from "../domain.layer/models/file/file.model";
import { ProjectFrameworksModel } from "../domain.layer/models/projectFrameworks/projectFrameworks.model";
import { frameworkDeletionMap } from "../types/framework.type";
import { IProjectAttributes } from "../domain.layer/interfaces/i.project";
import { IRoleAttributes } from "../domain.layer/interfaces/i.role";
import { TenantAutomationActionModel } from "../domain.layer/models/tenantAutomationAction/tenantAutomationAction.model";
import { replaceTemplateVariables } from "./automation/automation.utils";
import { enqueueAutomationAction } from "../services/automations/automationProducer";
import { buildProjectReplacements, buildProjectUpdateReplacements } from "./automation/project.automation.utils";

interface GetUserProjectsOptions {
  userId: number;
  role: IRoleAttributes["name"];
  transaction?: Transaction;
}

export const getUserProjects = async (
  { userId, role, transaction }: GetUserProjectsOptions,
  tenant: string
) => {
  const baseQueryParts: string[] = [
    `SELECT DISTINCT p.*`,
    `FROM "${tenant}".projects p`,
  ];

  const whereConditions: string[] = [];
  const replacements: { [key: string]: any } = {};

  // // Filter out organizational projects from Dashboard
  // whereConditions.push("p.is_organizational = false");

  if (role !== "Admin") {
    baseQueryParts.push(
      `LEFT JOIN "${tenant}".projects_members pm ON pm.project_id = p.id`
    );
    whereConditions.push("(p.owner = :userId OR pm.user_id = :userId)");
    replacements.userId = userId;
  }

  if (whereConditions.length > 0) {
    baseQueryParts.push("WHERE " + whereConditions.join(" AND "));
  }

  baseQueryParts.push("ORDER BY p.created_at DESC, p.id ASC");

  const finalQuery = baseQueryParts.join("\n");

  return sequelize.query(finalQuery, {
    replacements,
    model: ProjectModel,
    mapToModel: true,
    type: QueryTypes.SELECT,
    transaction,
  });
};

export const getAllProjectsQuery = async (
  {
    userId,
    role,
  }: {
    userId: number;
    role: IRoleAttributes["name"];
  },
  tenant: string
): Promise<IProjectAttributes[]> => {
  if (!userId || !role) {
    throw new Error("User ID and role are required to fetch projects.");
  }

  const projects = await getUserProjects({ userId, role }, tenant);

  if (!projects || projects.length === 0) return [];

  for (let project of projects) {
    const projectFramework = (await sequelize.query(
      `
        SELECT 
          pf.id AS project_framework_id, pf.framework_id,
          f.name AS name
        FROM "${tenant}".projects_frameworks pf
        JOIN public.frameworks f ON pf.framework_id = f.id
        WHERE project_id = :project_id`,
      {
        replacements: { project_id: project.id },
      }
    )) as [
        { project_framework_id: number; framework_id: number; name: string }[],
        number,
      ];
    (project.dataValues as any)["framework"] = [];
    for (let pf of projectFramework[0]) {
      (project.dataValues as any)["framework"].push(pf);
    }

    const members = await sequelize.query(
      `SELECT user_id FROM "${tenant}".projects_members WHERE project_id = :project_id`,
      {
        replacements: { project_id: project.id },
        mapToModel: true,
        model: ProjectsMembersModel,
      }
    );
    (project.dataValues as any)["members"] = members.map((m) => m.user_id);
  }

  return projects;
};

export const getProjectByIdQuery = async (
  id: number,
  tenant: string
): Promise<IProjectAttributes | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".projects WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectModel,
    }
  );
  if (result.length === 0) return null;
  const project = result[0];
  const projectFramework = (await sequelize.query(
    `
      SELECT 
        pf.id AS project_framework_id, pf.framework_id,
        f.name AS name
      FROM "${tenant}".projects_frameworks pf
      JOIN public.frameworks f ON pf.framework_id = f.id
      WHERE project_id = :project_id`,
    {
      replacements: { project_id: project.id },
    }
  )) as [
      { project_framework_id: number; framework_id: number; name: string }[],
      number,
    ];
  (project.dataValues as any)["framework"] = [];
  for (let pf of projectFramework[0]) {
    (project.dataValues as any)["framework"].push(pf);
  }

  const projectOwner = await sequelize.query(
    `SELECT name || ' ' || surname AS full_name FROM public.users WHERE id = :owner_id;`,
    {
      replacements: { owner_id: project.owner },
    }
  ) as [{ full_name: string }[], number];
  (project.dataValues as any)["owner_name"] = projectOwner[0][0].full_name;

  const members = await sequelize.query(
    `SELECT user_id FROM "${tenant}".projects_members WHERE project_id = :project_id`,
    {
      replacements: { project_id: project.id },
      mapToModel: true,
      model: ProjectsMembersModel,
    }
  );
  (project.dataValues as any)["members"] = members.map((m) => m.user_id);

  return project;
};

export const countSubControlsByProjectId = async (
  project_id: number,
  tenant: string
): Promise<{
  totalSubcontrols: string;
  doneSubcontrols: string;
}> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) AS "totalSubcontrols", COUNT(CASE WHEN sc.status = 'Done' THEN 1 END) AS "doneSubcontrols" FROM
      "${tenant}".controlcategories cc JOIN "${tenant}".controls c ON cc.id = c.control_category_id
        JOIN "${tenant}".subcontrols sc ON c.id = sc.control_id WHERE cc.project_id = :project_id`,
    {
      replacements: { project_id },
      type: QueryTypes.SELECT,
    }
  );
  return result[0] as {
    totalSubcontrols: string;
    doneSubcontrols: string;
  };
};

export const countAnswersByProjectId = async (
  project_id: number,
  tenant: string
): Promise<{
  totalAssessments: string;
  answeredAssessments: string;
}> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) AS "totalAssessments", COUNT(CASE WHEN q.status = 'Done' THEN 1 END) AS "answeredAssessments" FROM
      "${tenant}".assessments a JOIN "${tenant}".topics t ON a.id = t.assessment_id
        JOIN "${tenant}".subtopics st ON t.id = st.topic_id
          JOIN "${tenant}".questions q ON st.id = q.subtopic_id WHERE a.project_id = :project_id`,
    {
      replacements: { project_id },
      type: QueryTypes.SELECT,
    }
  );
  return result[0] as {
    totalAssessments: string;
    answeredAssessments: string;
  };
};

export const createNewProjectQuery = async (
  project: Partial<ProjectModel>,
  members: number[],
  frameworks: number[],
  tenant: string,
  userId: number,
  transaction: Transaction,
  isDemo: boolean = false
): Promise<ProjectModel> => {
  const allowedFrameworks: number[] = [];
  if (project.is_organizational === true) {
    const result = (await sequelize.query(
      `SELECT id FROM public.frameworks WHERE is_organizational = true;`,
      { transaction }
    )) as [{ id: number }[], number];
    allowedFrameworks.push(...result[0].map((f) => f.id));
  } else {
    const result = (await sequelize.query(
      `SELECT id FROM public.frameworks WHERE is_organizational = false;`,
      { transaction }
    )) as [{ id: number }[], number];
    allowedFrameworks.push(...result[0].map((f) => f.id));
  }
  for (let framework of frameworks) {
    if (!allowedFrameworks.includes(framework)) {
      throw new Error(
        `Framework with ID ${framework} is not allowed for this project.`
      );
    }
  }

  const result = await sequelize.query(
    `INSERT INTO "${tenant}".projects (
      project_title, owner, start_date, geography, ai_risk_classification, 
      type_of_high_risk_role, goal, status, last_updated, last_updated_by, is_demo, is_organizational
    ) VALUES (
      :project_title, :owner, :start_date, :geography, :ai_risk_classification, 
      :type_of_high_risk_role, :goal, :status, :last_updated, :last_updated_by, :is_demo, :is_organizational
    ) RETURNING *`,
    {
      replacements: {
        project_title: project.project_title,
        owner: project.owner,
        start_date: project.start_date,
        geography: project.geography || 1,
        ai_risk_classification: project.ai_risk_classification || null,
        type_of_high_risk_role: project.type_of_high_risk_role || null,
        goal: project.goal || null,
        status: project.status || "Not started",
        last_updated: new Date(Date.now()),
        last_updated_by: userId,
        is_demo: isDemo,
        is_organizational: project.is_organizational || false,
      },
      mapToModel: true,
      model: ProjectModel,
      // type: QueryTypes.INSERT
      transaction,
    }
  );
  const createdProject = result[0];
  (createdProject.dataValues as any)["members"] = [];
  for (let member of members) {
    await sequelize.query(
      `INSERT INTO "${tenant}".projects_members (project_id, user_id, is_demo) VALUES (:project_id, :user_id, :is_demo) RETURNING *`,
      {
        replacements: {
          project_id: createdProject.id,
          user_id: member,
          is_demo: isDemo,
        },
        mapToModel: true,
        model: ProjectsMembersModel,
        // type: QueryTypes.INSERT
        transaction,
      }
    );
    (createdProject.dataValues as any)["members"].push(member);
  }
  (createdProject.dataValues as any)["framework"] = [];
  for (let framework of frameworks) {
    await sequelize.query(
      `INSERT INTO "${tenant}".projects_frameworks (project_id, framework_id, is_demo) VALUES (:project_id, :framework_id, :is_demo) RETURNING *`,
      {
        replacements: {
          project_id: createdProject.id,
          framework_id: framework,
          is_demo: isDemo,
        },
        mapToModel: true,
        model: ProjectFrameworksModel,
        transaction,
      }
    );
    (createdProject.dataValues as any)["framework"].push(framework);
  }

  const automations = await sequelize.query(
    `SELECT
      pat.key AS trigger_key,
      paa.key AS action_key,
      aa.*
    FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'project_added' AND a.is_active ORDER BY aa."order" ASC;`, { transaction }
  ) as [(TenantAutomationActionModel & { trigger_key: string, action_key: string })[], number];
  if (automations[0].length > 0) {
    const automation = automations[0][0];
    if (automation["trigger_key"] === "project_added") {
      const owner_name = await sequelize.query(
        `SELECT name || ' ' || surname AS full_name FROM public.users WHERE id = :owner_id;`,
        {
          replacements: { owner_id: createdProject.dataValues.owner },
          transaction
        }
      ) as [{ full_name: string }[], number];

      const params = automation.params!;

      // Build replacements
      const replacements = buildProjectReplacements({ ...createdProject.dataValues, owner_name: owner_name[0][0].full_name });

      // Replace variables in subject and body
      const processedParams = {
        ...params,
        subject: replaceTemplateVariables(params.subject || '', replacements),
        body: replaceTemplateVariables(params.body || '', replacements)
      };

      // Enqueue with processed params
      await enqueueAutomationAction(automation.action_key, processedParams);
    } else {
      console.warn(`No matching trigger found for key: ${automation["trigger_key"]}`);
    }
  }

  return createdProject;
};

export const updateProjectUpdatedByIdQuery = async (
  id: number, // this is not the project id,
  byTable:
    | "controls"
    | "answers"
    // | "projectrisks"
    | "vendors"
    | "subclauses"
    | "annexcategories"
    | "annexcontrols_iso27001"
    | "subclauses_iso27001",
  tenant: string,
  transaction: Transaction
): Promise<void> => {
  const queryMap = {
    controls: `SELECT pf.project_id as id FROM "${tenant}".controls_eu c JOIN "${tenant}".projects_frameworks pf ON pf.id = c.projects_frameworks_id WHERE c.id = :id;`,
    answers: `SELECT pf.project_id as id FROM "${tenant}".assessments a JOIN "${tenant}".answers_eu ans ON ans.assessment_id = a.id JOIN "${tenant}".projects_frameworks pf ON pf.id = a.projects_frameworks_id WHERE ans.id = :id;`,
    // projectrisks: `SELECT p.id FROM
    //   "${tenant}".projects p JOIN "${tenant}".projectrisks pr ON p.id = pr.project_id
    //     WHERE pr.id = :id;`,
    vendors: `SELECT project_id as id FROM "${tenant}".vendors_projects WHERE vendor_id = :id;`,
    subclauses: `SELECT pf.project_id as id FROM "${tenant}".subclauses_iso sc JOIN "${tenant}".projects_frameworks pf ON pf.id = sc.projects_frameworks_id WHERE sc.id = :id;`,
    annexcategories: `SELECT pf.project_id as id FROM "${tenant}".annexcategories_iso a JOIN "${tenant}".projects_frameworks pf ON pf.id = a.projects_frameworks_id WHERE a.id = :id;`,
    subclauses_iso27001: `SELECT pf.project_id as id FROM "${tenant}".subclauses_iso27001 sc JOIN "${tenant}".projects_frameworks pf ON pf.id = sc.projects_frameworks_id WHERE sc.id = :id;`,
    annexcontrols_iso27001: `SELECT pf.project_id as id FROM "${tenant}".annexcontrols_iso27001 a JOIN "${tenant}".projects_frameworks pf ON pf.id = a.projects_frameworks_id WHERE a.id = :id;`,
  };
  const query = queryMap[byTable];
  const result = (await sequelize.query(query, {
    replacements: { id },
    transaction,
  })) as [{ id: number }[], number];
  if (result[0].length > 0) {
    const projectIds = result[0].map(({ id }) => id);
    await sequelize.query(
      `UPDATE "${tenant}".projects SET last_updated = :last_updated WHERE id IN (:project_ids);`,
      {
        replacements: {
          last_updated: new Date(),
          project_ids: projectIds,
        },
        transaction,
      }
    );
  }
};

export const updateProjectByIdQuery = async (
  id: number,
  project: Partial<ProjectModel>,
  members: number[],
  tenant: string,
  transaction: Transaction
): Promise<(IProjectAttributes & { members: number[] }) | null> => {
  const oldProject = await getProjectByIdQuery(id, tenant);
  const _currentMembers = await sequelize.query(
    `SELECT user_id FROM "${tenant}".projects_members WHERE project_id = :project_id`,
    {
      replacements: { project_id: id },
      mapToModel: true,
      model: ProjectsMembersModel,
      transaction,
    }
  );
  const currentMembers = _currentMembers.map((m) => m.user_id);
  const deletedMembers = currentMembers.filter((m) => !members.includes(m));
  const newMembers = members.filter((m) => !currentMembers.includes(m));

  for (let member of deletedMembers) {
    await sequelize.query(
      `DELETE FROM "${tenant}".projects_members WHERE user_id = :user_id AND project_id = :project_id`,
      {
        replacements: { user_id: member, project_id: id },
        mapToModel: true,
        model: ProjectsMembersModel,
        type: QueryTypes.DELETE,
        transaction,
      }
    );
  }

  for (let member of newMembers) {
    await sequelize.query(
      `INSERT INTO "${tenant}".projects_members (project_id, user_id) VALUES (:project_id, :user_id);`,
      {
        replacements: { user_id: member, project_id: id },
        mapToModel: true,
        model: ProjectsMembersModel,
        // type: QueryTypes.INSERT
        transaction,
      }
    );
  }

  const updateProject: Partial<Record<keyof ProjectModel, any>> = {};
  const setClause = [
    "project_title",
    "owner",
    "start_date",
    "ai_risk_classification",
    "type_of_high_risk_role",
    "goal",
    "last_updated",
    "last_updated_by",
    "status",
  ]
    .filter((f) => {
      if (
        project[f as keyof ProjectModel] !== undefined &&
        project[f as keyof ProjectModel]
      ) {
        updateProject[f as keyof ProjectModel] =
          project[f as keyof ProjectModel];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE "${tenant}".projects SET ${setClause} WHERE id = :id RETURNING *;`;

  updateProject.id = id;

  const result = await sequelize.query(query, {
    replacements: updateProject,
    mapToModel: true,
    model: ProjectModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  const updatedMembers = await sequelize.query(
    `SELECT user_id FROM "${tenant}".projects_members WHERE project_id = :project_id`,
    {
      replacements: { project_id: id },
      mapToModel: true,
      model: ProjectsMembersModel,
      transaction,
    }
  );
  const updatedProject = result[0];
  const automations = await sequelize.query(
    `SELECT
      pat.key AS trigger_key,
      paa.key AS action_key,
      aa.*
    FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'project_added' AND a.is_active ORDER BY aa."order" ASC;`, { transaction }
  ) as [(TenantAutomationActionModel & { trigger_key: string, action_key: string })[], number];
  if (automations[0].length > 0) {
    const automation = automations[0][0];
    if (automation["trigger_key"] === "project_added") {
      const owner_name = await sequelize.query(
        `SELECT name || ' ' || surname AS full_name FROM public.users WHERE id = :owner_id;`,
        {
          replacements: { owner_id: updatedProject.dataValues.owner },
          transaction
        }
      ) as [{ full_name: string }[], number];

      const params = automation.params!;

      // Build replacements
      const replacements = buildProjectUpdateReplacements(oldProject, { ...updatedProject.dataValues, owner_name: owner_name[0][0].full_name });

      // Replace variables in subject and body
      const processedParams = {
        ...params,
        subject: replaceTemplateVariables(params.subject || '', replacements),
        body: replaceTemplateVariables(params.body || '', replacements)
      };

      // Enqueue with processed params
      await enqueueAutomationAction(automation.action_key, processedParams);
    } else {
      console.warn(`No matching trigger found for key: ${automation["trigger_key"]}`);
    }
  }
  return result.length
    ? {
      ...updatedProject.dataValues,
      members: updatedMembers.map((m) => m.user_id),
    }
    : null;
};

const deleteTable = async (
  entity: string,
  foreignKey: string,
  id: number,
  tenant: string,
  transaction: Transaction
) => {
  let tableToDelete = entity;
  if (entity === "vendors") {
    tableToDelete = "vendors_projects";
    // model = VendorsProjectsModel
  }
  await sequelize.query(
    `DELETE FROM "${tenant}".${tableToDelete} WHERE ${foreignKey} = :x;`,
    {
      replacements: { x: id },
      mapToModel: true,
      // model: model,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
};

export const deleteHelper = async (
  childObject: Record<string, any>,
  parent_id: number,
  tenant: string,
  transaction: Transaction
) => {
  const childTableName = Object.keys(childObject).filter(
    (k) => !["foreignKey", "model"].includes(k)
  )[0];
  let childIds: any = {};
  if (
    childTableName !== "projects_members" &&
    childTableName !== "projects_frameworks" &&
    childTableName !== "projects_risks"
  ) {
    if (childTableName === "vendors") {
      childIds = await sequelize.query(
        `SELECT vendor_id FROM "${tenant}".vendors_projects WHERE project_id = :project_id`,
        {
          replacements: { project_id: parent_id },
          mapToModel: true,
          model: VendorsProjectsModel,
          transaction,
        }
      );
    } else {
      childIds = await sequelize.query(
        `SELECT id FROM "${tenant}".${childTableName} WHERE ${childObject[childTableName].foreignKey} = :x`,
        {
          replacements: { x: parent_id },
          mapToModel: true,
          model: childObject[childTableName].model,
          transaction,
        }
      );
    }
  }
  await Promise.all(
    Object.keys(childObject[childTableName])
      .filter((k) => !["foreignKey", "model"].includes(k))
      .map(async (k) => {
        for (let ch of childIds) {
          let childId = ch.id;
          if (childTableName === "vendors") childId = ch.vendor_id;
          await deleteHelper(
            { [k]: childObject[childTableName][k] },
            childId,
            tenant,
            transaction
          );
        }
      })
  );
  await deleteTable(
    childTableName,
    childObject[childTableName].foreignKey,
    parent_id,
    tenant,
    transaction
  );
};

export const deleteProjectByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<boolean> => {
  const frameworks = await sequelize.query(
    `SELECT framework_id FROM "${tenant}".projects_frameworks WHERE project_id = :project_id`,
    {
      replacements: { project_id: id },
      mapToModel: true,
      model: ProjectFrameworksModel,
      transaction,
    }
  );
  const dependantEntities = [
    // {
    //   vendors: {
    //     foreignKey: "project_id",
    //     model: VendorModel,
    //     vendorrisks: {
    //       foreignKey: "vendor_id",
    //       model: VendorRiskModel,
    //     },
    //   },
    // },
    { files: { foreignKey: "project_id", model: FileModel } },
    { projects_risks: { foreignKey: "project_id", model: RiskModel } },
    {
      projects_members: {
        foreignKey: "project_id",
        model: ProjectsMembersModel,
      },
    },
  ];
  for (let entity of dependantEntities) {
    await deleteHelper(entity, id, tenant, transaction);
  }
  await Promise.all(
    frameworks.map(({ framework_id }) => {
      const deleteFunction = frameworkDeletionMap[framework_id];
      if (!deleteFunction) {
        throw new Error(
          `Unsupported framework_id encountered: ${framework_id}`
        );
      }
      return deleteFunction(id, tenant, transaction);
    })
  );

  const result = await sequelize.query(
    `DELETE FROM "${tenant}".projects WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  const deletedProject = result[0];
  const automations = await sequelize.query(
    `SELECT
      pat.key AS trigger_key,
      paa.key AS action_key,
      aa.*
    FROM public.automation_triggers pat JOIN "${tenant}".automations a ON a.trigger_id = pat.id JOIN "${tenant}".automation_actions aa ON a.id = aa.automation_id JOIN public.automation_actions paa ON aa.action_type_id = paa.id WHERE pat.key = 'project_deleted' AND a.is_active ORDER BY aa."order" ASC;`, { transaction }
  ) as [(TenantAutomationActionModel & { trigger_key: string, action_key: string })[], number];
  if (automations[0].length > 0) {
    const automation = automations[0][0];
    if (automation["trigger_key"] === "project_deleted") {
      const owner_name = await sequelize.query(
        `SELECT name || ' ' || surname AS full_name FROM public.users WHERE id = :owner_id;`,
        {
          replacements: { owner_id: deletedProject.owner },
          transaction
        }
      ) as [{ full_name: string }[], number];

      const params = automation.params!;

      // Build replacements
      const replacements = buildProjectReplacements({ ...deletedProject, owner_name: owner_name[0][0].full_name });

      // Replace variables in subject and body
      const processedParams = {
        ...params,
        subject: replaceTemplateVariables(params.subject || '', replacements),
        body: replaceTemplateVariables(params.body || '', replacements)
      };

      // Enqueue with processed params
      await enqueueAutomationAction(automation.action_key, processedParams);
    } else {
      console.warn(`No matching trigger found for key: ${automation["trigger_key"]}`);
    }
  }
  return result.length > 0;
};

export const calculateProjectRisks = async (
  project_id: number,
  tenant: string
): Promise<
  {
    risk_level_autocalculated: string;
    count: string;
  }[]
> => {
  const result = await sequelize.query<{
    risk_level_autocalculated: string;
    count: string;
  }>(
    `SELECT risk_level_autocalculated, count(*) AS count FROM "${tenant}".risks r JOIN "${tenant}".projects_risks pr ON r.id = pr.risk_id WHERE pr.project_id = :project_id GROUP BY risk_level_autocalculated`,
    {
      replacements: { project_id },
      type: QueryTypes.SELECT,
    }
  );
  return result;
};

export const calculateVendirRisks = async (
  project_id: number,
  tenant: string
): Promise<
  {
    risk_level: string;
    count: string;
  }[]
> => {
  const result = await sequelize.query<{ risk_level: string; count: string }>(
    `SELECT risk_level, count(*) AS count FROM "${tenant}".vendorrisks WHERE project_id = :project_id GROUP BY risk_level`,
    {
      replacements: { project_id },
      type: QueryTypes.SELECT,
    }
  );
  return result;
};


/**
 * Gets current project members to identify newly added ones
 * @param projectId - The project ID to get members for
 * @param tenant - The tenant name for schema
 * @param transaction - Optional transaction for database consistency
 * @returns Array of user IDs that are currently members of the project
 */
export const getCurrentProjectMembers = async (
  projectId: number,
  tenant: string,
  transaction?: Transaction
): Promise<number[]> => {
  const currentMembersResult = await sequelize.query(
    `SELECT user_id FROM "${tenant}".projects_members WHERE project_id = :project_id`,
    {
      replacements: { project_id: projectId },
      type: QueryTypes.SELECT,
      transaction,
    }
  );
  return (currentMembersResult as any[]).map((m) => m.user_id);
};

