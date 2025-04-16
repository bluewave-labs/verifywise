import { Project, ProjectModel } from "../models/project.model";
import { sequelize } from "../database/db";
import { AssessmentModel } from "../models/assessment.model";
import { ProjectsMembersModel } from "../models/projectsMembers.model";
import { QueryTypes } from "sequelize";
import { VendorsProjectsModel } from "../models/vendorsProjects.model";
import { VendorModel } from "../models/vendor.model";
import { VendorRiskModel } from "../models/vendorRisk.model";
import { ProjectRiskModel } from "../models/projectRisk.model";
import { TopicModel } from "../models/topic.model";
import { SubcontrolModel } from "../models/subcontrol.model";
import { QuestionModel } from "../models/question.model";
import { ProjectScopeModel } from "../models/projectScope.model";
import { ControlCategoryModel } from "../models/controlCategory.model";
import { ControlModel } from "../models/control.model";
import { SubtopicModel } from "../models/subtopic.model";
import { FileModel } from "../models/file.model";
import { table } from "console";

export const getAllProjectsQuery = async (): Promise<Project[]> => {
  const projects = await sequelize.query(
    "SELECT * FROM projects ORDER BY created_at DESC, id ASC",
    {
      mapToModel: true,
      model: ProjectModel
    }
  );
  if (projects.length) {
    for (let project of projects) {
      const assessment = await sequelize.query(
        `SELECT id FROM assessments WHERE project_id = :project_id`,
        {
          replacements: { project_id: project.id },
          mapToModel: true,
          model: AssessmentModel
        }
      );
      (project.dataValues as any)["assessment_id"] = assessment[0].id

      const members = await sequelize.query(
        "SELECT user_id FROM projects_members WHERE project_id = :project_id",
        {
          replacements: { project_id: project.id },
          mapToModel: true,
          model: ProjectsMembersModel
        }
      );
      (project.dataValues as any)["members"] = members.map(m => m.user_id)
    }
  }
  return projects;
};

export const getProjectByIdQuery = async (
  id: number
): Promise<Project | null> => {
  const result = await sequelize.query(
    "SELECT * FROM projects WHERE id = :id",
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectModel
    }
  );
  if (result.length === 0) return null;
  const project = result[0];
  const assessment = await sequelize.query(
    `SELECT id FROM assessments WHERE project_id = :project_id`,
    {
      replacements: { project_id: project.id },
      mapToModel: true,
      model: AssessmentModel
    }
  );
  (project.dataValues as any)["assessment_id"] = assessment[0].id

  const members = await sequelize.query(
    "SELECT user_id FROM projects_members WHERE project_id = :project_id",
    {
      replacements: { project_id: project.id },
      mapToModel: true,
      model: ProjectsMembersModel
    }
  );
  (project.dataValues as any)["members"] = members.map(m => m.user_id)

  return project;
};

export const countSubControlsByProjectId = async (
  project_id: number
): Promise<{
  totalSubcontrols: string;
  doneSubcontrols: string;
}> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) AS "totalSubcontrols", COUNT(CASE WHEN sc.status = 'Done' THEN 1 END) AS "doneSubcontrols" FROM
      controlcategories cc JOIN controls c ON cc.id = c.control_category_id
        JOIN subcontrols sc ON c.id = sc.control_id WHERE cc.project_id = :project_id`,
    {
      replacements: { project_id },
      type: QueryTypes.SELECT
    }
  );
  return result[0] as {
    totalSubcontrols: string;
    doneSubcontrols: string;
  };
}

export const countAnswersByProjectId = async (
  project_id: number
): Promise<{
  totalAssessments: string;
  answeredAssessments: string;
}> => {
  const result = await sequelize.query(
    `SELECT COUNT(*) AS "totalAssessments", COUNT(CASE WHEN q.answer <> '' THEN 1 END) AS "answeredAssessments" FROM
      assessments a JOIN topics t ON a.id = t.assessment_id
        JOIN subtopics st ON t.id = st.topic_id
          JOIN questions q ON st.id = q.subtopic_id WHERE a.project_id = :project_id`,
    {
      replacements: { project_id },
      type: QueryTypes.SELECT
    }
  );
  return result[0] as {
    totalAssessments: string;
    answeredAssessments: string;
  };
}

export const createNewProjectQuery = async (
  project: Partial<Project>,
  members: number[]
): Promise<Project> => {
  const result = await sequelize.query(
    `INSERT INTO projects (
      project_title, owner, start_date, ai_risk_classification, 
      type_of_high_risk_role, goal, last_updated, last_updated_by
    ) VALUES (
      :project_title, :owner, :start_date, :ai_risk_classification, 
      :type_of_high_risk_role, :goal, :last_updated, :last_updated_by
    ) RETURNING *`,
    {
      replacements: {
        project_title: project.project_title,
        owner: project.owner,
        start_date: project.start_date,
        ai_risk_classification: project.ai_risk_classification,
        type_of_high_risk_role: project.type_of_high_risk_role,
        goal: project.goal,
        last_updated: new Date(Date.now()),
        last_updated_by: project.last_updated_by,
      },
      mapToModel: true,
      model: ProjectModel,
      // type: QueryTypes.INSERT
    }
  );
  const createdProject = result[0];
  (createdProject.dataValues as any)["members"] = []
  for (let member of members) {
    await sequelize.query(
      `INSERT INTO projects_members (project_id, user_id) VALUES (:project_id, :user_id) RETURNING *`,
      {
        replacements: {
          project_id: createdProject.id, user_id: member
        },
        mapToModel: true,
        model: ProjectsMembersModel,
        // type: QueryTypes.INSERT
      }
    );
    (createdProject.dataValues as any)["members"].push(member)
  }
  return createdProject
};

export const updateProjectUpdatedByIdQuery = async (
  id: number, // this is not the project id,
  byTable: "controls" | "questions" | "projectrisks" | "vendors",
): Promise<void> => {
  const queryMap = {
    "controls": `SELECT p.id FROM
      projects p JOIN controlcategories cc ON p.id = cc.project_id
        JOIN controls c ON cc.id = c.control_category_id
          WHERE c.id = :id;`,
    "questions": `SELECT p.id FROM
      projects p JOIN assessments a ON p.id = a.project_id
        JOIN topics t ON a.id = t.assessment_id
          JOIN subtopics st ON t.id = st.topic_id
            JOIN questions q ON st.id = q.subtopic_id
              WHERE q.id = :id;`,
    "projectrisks": `SELECT p.id FROM
      projects p JOIN projectrisks pr ON p.id = pr.project_id
        WHERE pr.id = :id;`,
    "vendors": `SELECT project_id as id FROM vendors_projects WHERE vendor_id = :id;`,
  };
  const query = queryMap[byTable];
  const result = await sequelize.query(query, {
    replacements: { id },
  })
  const projects = result[0] as { id: number }[]
  for (let p of projects) {
    await sequelize.query(
      `UPDATE projects SET last_updated = :last_updated WHERE id = :project_id;`,
      {
        replacements: {
          last_updated: new Date(Date.now()),
          project_id: p.id
        }
      }
    )
  }
}

export const updateProjectByIdQuery = async (
  id: number,
  project: Partial<Project>,
  members: number[]
): Promise<Project & { members: number[] } | null> => {
  const _ = await sequelize.query(
    `SELECT user_id FROM projects_members WHERE project_id = :project_id`,
    {
      replacements: { project_id: id },
      mapToModel: true,
      model: ProjectsMembersModel,
    }
  )
  const currentMembers = _.map(m => m.user_id)
  const deletedMembers = currentMembers.filter(m => !members.includes(m))
  const newMembers = members.filter(m => !currentMembers.includes(m))

  console.log(deletedMembers, newMembers);

  for (let member of deletedMembers) {
    await sequelize.query(
      `DELETE FROM projects_members WHERE user_id = :user_id AND project_id = :project_id`,
      {
        replacements: { user_id: member, project_id: id },
        mapToModel: true,
        model: ProjectsMembersModel,
        type: QueryTypes.DELETE
      }
    )
  }

  for (let member of newMembers) {
    await sequelize.query(
      `INSERT INTO projects_members (project_id, user_id) VALUES (:project_id, :user_id);`,
      {
        replacements: { user_id: member, project_id: id },
        mapToModel: true,
        model: ProjectsMembersModel,
        // type: QueryTypes.INSERT
      }
    )
  }

  const updateProject: Partial<Record<keyof Project, any>> = {};
  const setClause = [
    "project_title",
    "owner",
    "start_date",
    "ai_risk_classification",
    "type_of_high_risk_role",
    "goal",
    "last_updated",
    "last_updated_by"
  ].filter(f => {
    if (project[f as keyof Project] !== undefined) {
      updateProject[f as keyof Project] = project[f as keyof Project]
      return true
    }
  }).map(f => `${f} = :${f}`).join(", ");

  const query = `UPDATE projects SET ${setClause} WHERE id = :id RETURNING *;`;

  updateProject.id = id;

  const result = await sequelize.query(query, {
    replacements: updateProject,
    mapToModel: true,
    model: ProjectModel,
    // type: QueryTypes.UPDATE,
  });

  const updatedMembers = await sequelize.query(
    `SELECT user_id FROM projects_members WHERE project_id = :project_id`,
    {
      replacements: { project_id: id },
      mapToModel: true,
      model: ProjectsMembersModel,
    }
  )
  return result.length ? {
    ...result[0].dataValues,
    members: updatedMembers.map(m => m.user_id)
  } : null;
};

export const deleteProjectByIdQuery = async (
  id: number
): Promise<Boolean> => {
  const deleteTable = async (
    entity: string,
    foreignKey: string,
    id: number,
    // model: Object
  ) => {
    let tableToDelete = entity;
    if (entity === "vendors") {
      tableToDelete = "vendors_projects"
      // model = VendorsProjectsModel
    };
    await sequelize.query(`DELETE FROM ${tableToDelete} WHERE ${foreignKey} = :x;`,
      {
        replacements: { x: id },
        mapToModel: true,
        // model: model,
        type: QueryTypes.DELETE
      }
    );
  };

  const deleteHelper = async (childObject: Record<string, any>, parent_id: number) => {
    const childTableName = Object.keys(childObject).filter(k => !["foreignKey", "model"].includes(k))[0]
    let childIds: any = {}
    if (childTableName !== "projects_members") {
      if (childTableName === "vendors") {
        childIds = await sequelize.query(
          `SELECT vendor_id FROM vendors_projects WHERE project_id = :project_id`,
          {
            replacements: { project_id: parent_id },
            mapToModel: true,
            model: VendorsProjectsModel
          }
        )
      } else {
        childIds = await sequelize.query(`SELECT id FROM ${childTableName} WHERE ${childObject[childTableName].foreignKey} = :x`,
          {
            replacements: { x: parent_id },
            mapToModel: true,
            model: childObject[childTableName].model
          }
        )
      }
    }
    await Promise.all(Object.keys(childObject[childTableName])
      .filter(k => !["foreignKey", "model"].includes(k))
      .map(async k => {
        for (let ch of childIds) {
          let childId = ch.id
          if (childTableName === "vendors") childId = ch.vendor_id
          await deleteHelper({ [k]: childObject[childTableName][k] }, childId)
        }
      }))
    await deleteTable(childTableName, childObject[childTableName].foreignKey, parent_id)
  }

  const dependantEntities = [
    {
      "vendors": {
        foreignKey: "project_id",
        model: VendorModel,
        "vendorrisks": {
          foreignKey: "vendor_id",
          model: VendorRiskModel
        }
      }
    },
    { "files": { foreignKey: "project_id", model: FileModel } },
    { "projectrisks": { foreignKey: "project_id", model: ProjectRiskModel } },
    { "projects_members": { foreignKey: "project_id", model: ProjectsMembersModel } },
    {
      assessments: {
        foreignKey: "project_id",
        model: AssessmentModel,
        topics: {
          foreignKey: "assessment_id",
          model: TopicModel,
          subtopics: {
            foreignKey: "topic_id",
            model: SubtopicModel,
            questions: {
              foreignKey: "subtopic_id",
              model: QuestionModel,
            },
          },
        },
        projectscopes: {
          foreignKey: "assessment_id",
          model: ProjectScopeModel,
        },
      },
    },
    {
      controlcategories: {
        foreignKey: "project_id",
        model: ControlCategoryModel,
        controls: {
          foreignKey: "control_category_id",
          model: ControlModel,
          subcontrols: {
            foreignKey: "control_id",
            model: SubcontrolModel,
          },
        },
      },
    },
  ];
  for (let entity of dependantEntities) {
    await deleteHelper(entity, id);
  }

  const result = await sequelize.query(
    "DELETE FROM projects WHERE id = :id RETURNING *",
    {
      replacements: { id },
      mapToModel: true,
      model: ProjectModel,
      type: QueryTypes.DELETE
    }
  );
  return result.length > 0;
};

export const calculateProjectRisks = async (
  project_id: number
): Promise<
  {
    risk_level_autocalculated: string;
    count: string;
  }[]
> => {
  const result = await sequelize.query<{ risk_level_autocalculated: string; count: string }>(
    "SELECT risk_level_autocalculated, count(*) AS count FROM projectrisks WHERE project_id = :project_id GROUP BY risk_level_autocalculated",
    {
      replacements: { project_id },
      type: QueryTypes.SELECT
    }
  );
  return result
};

export const calculateVendirRisks = async (
  project_id: number
): Promise<
  {
    risk_level: string;
    count: string;
  }[]
> => {
  const result = await sequelize.query<{ risk_level: string; count: string }>(
    "SELECT risk_level, count(*) AS count FROM vendorrisks WHERE project_id = :project_id GROUP BY risk_level",
    {
      replacements: { project_id },
      type: QueryTypes.SELECT
    }
  );
  return result;
};
