import { ControlCategory } from "../models/controlCategory.model";
import pool from "../database/db";
import { createNewControlsQuery } from "./control.utils";

export const getAllControlCategoriesQuery = async (): Promise<
  ControlCategory[]
> => {
  const controlCategories = await pool.query(
    "SELECT * FROM controlcategories"
  );
  return controlCategories.rows;
};

export const getControlCategoryByIdQuery = async (
  id: number
): Promise<ControlCategory | null> => {
  const result = await pool.query(
    "SELECT * FROM controlcategories WHERE id = $1",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const createControlCategoryQuery = async (
  controlCategory: ControlCategory
): Promise<ControlCategory> => {
  const result = await pool.query(
    "INSERT INTO controlcategories (project_id, name) VALUES ($1, $2) RETURNING *",
    [controlCategory.projectId, controlCategory.name]
  );
  return result.rows[0];
};

export const updateControlCategoryByIdQuery = async (
  id: number,
  controlCategory: Partial<ControlCategory>
): Promise<ControlCategory | null> => {
  const result = await pool.query(
    "UPDATE controlcategories SET name = $1 WHERE id = $2 RETURNING *",
    [controlCategory.name, id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const deleteControlCategoryByIdQuery = async (
  id: number
): Promise<ControlCategory | null> => {
  const result = await pool.query(
    "DELETE FROM controlcategories WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

const controlCategoriesMock = (projectId: number): ControlCategory[] => {
  return [
    { id: 1, projectId: projectId, name: "AI literacy" },
    {
      id: 2,
      projectId: projectId,
      name: "Transparency and provision of information to deployers",
    },
    { id: 3, projectId: projectId, name: "Human oversight" },
    {
      id: 4,
      projectId: projectId,
      name: "Corrective actions and duty of information",
    },
    {
      id: 5,
      projectId: projectId,
      name: "Responsibilities along the AI value chain",
    },
    {
      id: 6,
      projectId: projectId,
      name: "Obligations of deployers of high-risk AI systems",
    },
    {
      id: 7,
      projectId: projectId,
      name: "Fundamental rights impact assessments for high-risk AI systems",
    },
    {
      id: 8,
      projectId: projectId,
      name: "Transparency obligations for providers and users of certain AI systems",
    },
    { id: 9, projectId: projectId, name: "Registration" },
    {
      id: 10,
      projectId: projectId,
      name: "EU database for high-risk AI systems listed in Annex III",
    },
    {
      id: 11,
      projectId: projectId,
      name: "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems",
    },
    {
      id: 12,
      projectId: projectId,
      name: "Reporting of serious incidents",
    },
    {
      id: 13,
      projectId: projectId,
      name: "General-purpose AI models",
    },
  ]
}

export const createNewControlCategories = async (
  projectId: number
) => {
  let query = "INSERT INTO controlcategories(project_id, name) VALUES "
  const data = controlCategoriesMock(projectId).map((d) => {
    return `(${d.projectId}, '${d.name}')`;
  })
  query += data.join(",") + " RETURNING *;"
  const result = await pool.query(query)
  const controls = await createNewControlsQuery(result.rows.map(r => Number(r.id)))
  const controlCategories = result.rows

  let cPtr = 0, ccPtr = 0;

  while (cPtr < controls.length) {
    (controlCategories[ccPtr] as any).controls = []
    while (controlCategories[ccPtr].id === (controls[cPtr] as any)["control_group"]) {
      (controlCategories[ccPtr] as any).controls.push(controls[cPtr])
      cPtr += 1
      if (cPtr === controls.length) break
    }
    ccPtr += 1
  }
  return controlCategories
}
