import { ControlCategory } from "../models/controlCategory.model";
import pool from "../database/db";
import { createNewControlsQuery } from "./control.utils";

export const getAllControlCategoriesQuery = async (): Promise<
  ControlCategory[]
> => {
  const controlCategories = await pool.query("SELECT * FROM controlcategories");
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

export const getControlCategoryByTitleAndProjectIdQuery = async (
  title: string,
  projectId: number
): Promise<ControlCategory | null> => {
  const result = await pool.query(
    "SELECT * FROM controlcategories WHERE name = $1 AND project_id = $2",
    [title, projectId]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const getControlCategoryByProjectIdQuery = async (
  projectId: number
): Promise<ControlCategory[]> => {
  const result = await pool.query(
    "SELECT * FROM controlcategories WHERE project_id = $1",
    [projectId]
  );
  return result.rows;
};

export const createControlCategoryQuery = async (
  controlCategory: ControlCategory
): Promise<ControlCategory> => {
  const result = await pool.query(
    "INSERT INTO controlcategories (project_id, name, order_no) VALUES ($1, $2, $3) RETURNING *",
    [controlCategory.projectId, controlCategory.name, controlCategory.orderNo]
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
    { id: 1, projectId: projectId, name: "AI literacy", orderNo: 1 },
    {
      id: 2,
      projectId: projectId,
      name: "Transparency and provision of information to deployers",
      orderNo: 2
    },
    {
      id: 3, projectId: projectId, name: "Human oversight", orderNo: 3
    },
    {
      id: 4,
      projectId: projectId,
      name: "Corrective actions and duty of information",
      orderNo: 4
    },
    {
      id: 5,
      projectId: projectId,
      name: "Responsibilities along the AI value chain",
      orderNo: 5
    },
    {
      id: 6,
      projectId: projectId,
      name: "Obligations of deployers of high-risk AI systems",
      orderNo: 6
    },
    {
      id: 7,
      projectId: projectId,
      name: "Fundamental rights impact assessments for high-risk AI systems",
      orderNo: 7
    },
    {
      id: 8,
      projectId: projectId,
      name: "Transparency obligations for providers and users of certain AI systems",
      orderNo: 8
    },
    { id: 9, projectId: projectId, name: "Registration", orderNo: 9 },
    {
      id: 10,
      projectId: projectId,
      name: "EU database for high-risk AI systems listed in Annex III",
      orderNo: 10
    },
    {
      id: 11,
      projectId: projectId,
      name: "Post-market monitoring by providers and post-market monitoring plan for high-risk AI systems",
      orderNo: 11
    },
    {
      id: 12,
      projectId: projectId,
      name: "Reporting of serious incidents",
      orderNo: 12
    },
    {
      id: 13,
      projectId: projectId,
      name: "General-purpose AI models",
      orderNo: 13
    },
  ];
};

export const createNewControlCategories = async (projectId: number) => {
  let query = "INSERT INTO controlcategories(project_id, name, order_no) VALUES ";
  const data = controlCategoriesMock(projectId).map((d) => {
    return `(${d.projectId}, '${d.name}', ${d.orderNo})`;
  });
  query += data.join(",") + " RETURNING *;";
  const result = await pool.query(query);
  const controls = await createNewControlsQuery(
    result.rows.map((r) => Number(r.id))
  );
  const controlCategories = result.rows;

  let cPtr = 0,
    ccPtr = 0;

  while (cPtr < controls.length) {
    (controlCategories[ccPtr] as any).controls = [];
    while (
      controlCategories[ccPtr].id === (controls[cPtr] as any)["control_category_id"]
    ) {
      (controlCategories[ccPtr] as any).controls.push(controls[cPtr]);
      cPtr += 1;
      if (cPtr === controls.length) break;
    }
    ccPtr += 1;
  }
  return controlCategories;
};
