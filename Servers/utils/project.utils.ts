import { Project } from "../models/project.model";
import pool from "../database/db";

export const getAllProjectsQuery = async (): Promise<Project[]> => {
  const projects = await pool.query("SELECT * FROM projects");
  if (projects.rows.length) {
    for (let project of projects.rows) {
      const assessment = await pool.query(`SELECT id FROM assessments WHERE project_id = $1`, [project.id])
      project["assessment_id"] = assessment.rows[0].id
      const members = await pool.query("SELECT user_id FROM projects_members WHERE project_id = $1", [project.id])
      project["members"] = members.rows.map(m => m.user_id)
    }
  }
  return projects.rows;
};

export const getProjectByIdQuery = async (
  id: number
): Promise<Project | null> => {
  const result = await pool.query("SELECT * FROM projects WHERE id = $1", [id]);
  if (result.rows.length === 0) return null;
  const project = result.rows[0];
  const assessment = await pool.query(
    `SELECT id FROM assessments WHERE project_id = $1`,
    [project.id]
  );
  project["assessment_id"] = assessment.rows[0].id;

  const members = await pool.query("SELECT user_id FROM projects_members WHERE project_id = $1", [id])
  project["members"] = members.rows.map(m => m.user_id)

  return project;
};

export const createNewProjectQuery = async (
  project: Partial<Project>,
  members: number[]
): Promise<Project> => {
  const result = await pool.query(
    "INSERT INTO projects (project_title, owner, start_date, ai_risk_classification, type_of_high_risk_role, goal, last_updated, last_updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    [
      project.project_title,
      project.owner,
      project.start_date,
      project.ai_risk_classification,
      project.type_of_high_risk_role,
      project.goal,
      project.start_date,
      project.last_updated_by,
    ]
  );
  const createdProject = result.rows[0];
  createdProject["members"] = []
  for (let member of members) {
    await pool.query(
      `INSERT INTO projects_members (project_id, user_id) VALUES ($1, $2) RETURNING *`,
      [createdProject.id, member]
    )
    createdProject["members"].push(member)
  }
  return createdProject
};

export const updateProjectByIdQuery = async (
  id: number,
  project: Partial<Project>,
  members: number[]
): Promise<Project | null> => {
  const _ = await pool.query(
    `SELECT user_id FROM projects_members WHERE project_id = $1`, [id]
  )
  const currentMembers = _.rows.map(m => m.user_id)
  const deletedMembers = currentMembers.filter(m => !members.includes(m))
  const newMembers = members.filter(m => !currentMembers.includes(m))

  console.log(deletedMembers, newMembers);

  for (let member of deletedMembers) {
    await pool.query(
      `DELETE FROM projects_members WHERE user_id = $1 AND project_id = $2`,
      [member, id]
    )
  }

  for (let member of newMembers) {
    await pool.query(
      `INSERT INTO projects_members (project_id, user_id) VALUES ($1, $2);`,
      [id, member]
    )
  }
  const result = await pool.query(
    `UPDATE projects SET ${Object.keys(project).filter(k => k !== "members")
      .map((key, index) => `${key} = $${index + 1}`)
      .join(", ")} WHERE id = ${id} RETURNING *`,
    Object.values(project)
  );
  const updatedMembers = await pool.query(
    `SELECT user_id FROM projects_members WHERE project_id = $1`, [id]
  )
  return result.rows.length ? {
    ...result.rows[0],
    members: updatedMembers.rows.map(m => m.user_id)
  } : null;
};

export const deleteProjectByIdQuery = async (
  id: number
): Promise<Project | null> => {

  const deleteTable = async (
    entity: string,
    foreignKey: string,
    id: number
  ) => {
    let tableToDelete = entity;
    if (entity === "vendors") tableToDelete = "vendors_projects";
    await pool.query(`DELETE FROM ${tableToDelete} WHERE ${foreignKey} = $1;`, [
      id,
    ]);
  };

  const deleteHelper = async (childObject: Record<string, any>, parent_id: number) => {
    const childTableName = Object.keys(childObject).filter(k => k !== "foreignKey")[0]
    let childIds: any = {}
    if (childTableName === "vendors") {
      childIds = await pool.query(`SELECT vendor_id FROM vendors_projects WHERE project_id = $1`, [parent_id])
    } else {
      childIds = await pool.query(`SELECT id FROM ${childTableName} WHERE ${childObject[childTableName].foreignKey} = $1`, [parent_id])
    }
    await Promise.all(Object.keys(childObject[childTableName])
      .filter(k => k !== "foreignKey")
      .map(async k => {
        for (let ch of childIds.rows) {
          let childId = ch.id
          if (childTableName === "vendors") childId = ch.vendor_id
          await deleteHelper({ [k]: childObject[childTableName][k] }, childId)
        }
      }))
    await deleteTable(childTableName, childObject[childTableName].foreignKey, parent_id)
  }

  const dependantEntities = [
    { "vendors": { foreignKey: "project_id", "vendorrisks": { foreignKey: "vendor_id" } } },
    { "projectrisks": { foreignKey: "project_id" } },
    { "projects_members": { foreignKey: "project_id" } },
    {
      assessments: {
        foreignKey: "project_id",
        topics: {
          foreignKey: "assessment_id",
          subtopics: {
            foreignKey: "topic_id",
            questions: {
              foreignKey: "subtopic_id",
            },
          },
        },
        projectscopes: {
          foreignKey: "assessment_id",
        },
      },
    },
    {
      controlcategories: {
        foreignKey: "project_id",
        controls: {
          foreignKey: "control_category_id",
          subcontrols: {
            foreignKey: "control_id",
          },
        },
      },
    },
  ];
  for (let entity of dependantEntities) {
    await deleteHelper(entity, id);
  }

  const result = await pool.query(
    "DELETE FROM projects WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const calculateProjectRisks = async (
  project_id: number
): Promise<
  {
    risk_level_autocalculated: string;
    count: string;
  }[]
> => {
  const result = await pool.query(
    "SELECT risk_level_autocalculated, count(*) AS count FROM projectrisks WHERE project_id = $1 GROUP BY risk_level_autocalculated",
    [project_id]
  );
  return result.rows;
};

export const calculateVendirRisks = async (
  project_id: number
): Promise<
  {
    risk_level_autocalculated: string;
    count: string;
  }[]
> => {
  const result = await pool.query(
    "SELECT risk_level, count(*) AS count FROM vendorrisks WHERE project_id = $1 GROUP BY risk_level",
    [project_id]
  );
  return result.rows;
};
