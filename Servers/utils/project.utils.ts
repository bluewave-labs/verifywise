import { Project } from "../models/project.model";
import pool from "../database/db";

export const getAllProjectsQuery = async (): Promise<Project[]> => {
  console.log("getAllProjects");
  const projects = await pool.query("SELECT * FROM projects");
  for (let project of projects.rows) {
    const assessment = await pool.query(`SELECT id FROM assessments WHERE project_id = $1`, [project.id])
    project["assessment_id"] = assessment.rows[0].id
  }
  return projects.rows;
};

export const getProjectByIdQuery = async (
  id: number
): Promise<Project | null> => {
  console.log("getProjectById", id);
  const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
  if (result.rows.length === 0) return null;
  const project = result.rows[0];
  const assessment = await pool.query(`SELECT id FROM assessments WHERE project_id = $1`, [project.id]);
  project["assessment_id"] = assessment.rows[0].id
  return project
};

export const createNewProjectQuery = async (
  project: {
    project_title: string;
    owner: number;
    users: string;
    start_date: Date;
    ai_risk_classification: string;
    type_of_high_risk_role: string;
    goal: string;
    last_updated: Date;
    last_updated_by: number;
  }
): Promise<Project> => {
  console.log("createProject");
  const result = await pool.query(
    "INSERT INTO projects (project_title, owner, users, start_date, ai_risk_classification, type_of_high_risk_role, goal, last_updated, last_updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
    [
      project.project_title,
      project.owner,
      project.users,
      project.start_date,
      project.ai_risk_classification,
      project.type_of_high_risk_role,
      project.goal,
      project.last_updated,
      project.last_updated_by,
    ]
  );
  return result.rows[0];
};

export const updateProjectByIdQuery = async (
  id: number,
  project: Partial<{
    project_title: string;
    owner: string;
    users: string;
    start_date: Date;
    ai_risk_classification: string;
    type_of_high_risk_role: string;
    goal: string;
    last_updated: Date;
    last_updated_by: string;
  }>
): Promise<Project | null> => {
  console.log("updateProjectById", id);
  const result = await pool.query(
    `UPDATE projects SET ${Object.keys(project)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ")} WHERE id = ${id} RETURNING *`,
    Object.values(project)
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteProjectByIdQuery = async (
  id: number
): Promise<Project | null> => {
  console.log("deleteProjectById", id);
  // projects:
  //    vendors
  //    assessments: topics, projectscopes
  //    topics: subtopics
  //    subtopics: questions
  //    controlcategories: controls
  //    controls: subcontrols
  //    projectrisks
  //    vendorrisks

  const deleteTable = async (entity: string, foreignKey: string, id: number) => {
    console.log(`Deleting from records from ${entity}`);
    let tableToDelete = entity;
    if (entity === "vendors") tableToDelete = "vendors_projects";
    await pool.query(
      `DELETE FROM ${tableToDelete} WHERE ${foreignKey} = $1;`,
      [id]
    );
  }

  const deleteHelper = async (childObject: Record<string, any>, parent_id: number) => {
    const childTableName = Object.keys(childObject).filter(k => k !== "foreignKey")[0]
    if (childTableName !== "vendors") {
      const childIds = await pool.query(`SELECT id FROM ${childTableName} WHERE ${childObject[childTableName].foreignKey} = $1`, [parent_id])
      await Promise.all(Object.keys(childObject[childTableName])
        .filter(k => k !== "foreignKey")
        .map(async k => {
          for (let ch of childIds.rows) {
            await deleteHelper({ [k]: childObject[childTableName][k] }, ch.id)
          }
        }))
    }
    await deleteTable(childTableName, childObject[childTableName].foreignKey, parent_id)
  }

  const dependantEntities = [
    { "vendors": { foreignKey: "project_id" } },
    { "projectrisks": { foreignKey: "project_id" } },
    { "vendorrisks": { foreignKey: "project_id" } },
    {
      "assessments": {
        foreignKey: "project_id",
        "topics": {
          foreignKey: "assessment_id",
          "subtopics": {
            foreignKey: "topic_id",
            "questions": {
              foreignKey: "subtopic_id"
            }
          }
        },
        "projectscopes": {
          foreignKey: "assessment_id"
        }
      }
    },
    {
      "controlcategories": {
        foreignKey: "project_id",
        "controls": {
          foreignKey: "control_group",
          "subcontrols": {
            foreignKey: "control_id"
          }
        }
      }
    }
  ]
  for (let entity of dependantEntities) {
    await deleteHelper(entity, id)
  }
  console.log(`Deleting the project with id ${id}`);

  const result = await pool.query(
    "DELETE FROM projects WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const calculateProjectRisks = async (project_id: number): Promise<
  {
    risk_level_autocalculated: string,
    count: string
  }[]
> => {
  console.log("calculateProjectRisks");
  const result = await pool.query("SELECT risk_level_autocalculated, count(*) AS count FROM projectrisks WHERE project_id = $1 GROUP BY risk_level_autocalculated",
    [project_id]
  )
  return result.rows
}

export const calculateVendirRisks = async (project_id: number): Promise<
  {
    risk_level_autocalculated: string,
    count: string
  }[]
> => {
  console.log("calculateVendorRisks");
  const result = await pool.query("SELECT risk_level, count(*) AS count FROM vendorrisks WHERE project_id = $1 GROUP BY risk_level",
    [project_id]
  )
  return result.rows
}
