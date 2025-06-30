import {
  ControlCategory,
  ControlCategoryModel,
} from "../domain.layer/models/controlCategory/controlCategory.model";
import { sequelize } from "../database/db";
import { createNewControlsQuery } from "./control.utils";
import { ControlCategories } from "../structures/EU-AI-Act/compliance-tracker/controlCategories.struct";
import { QueryTypes, Transaction } from "sequelize";

export const getAllControlCategoriesQuery = async (
  tenant: string
): Promise<
  ControlCategory[]
> => {
  const controlCategories = await sequelize.query(
    `SELECT * FROM "${tenant}".controlcategories ORDER BY created_at DESC, id ASC`,
    {
      mapToModel: true,
      model: ControlCategoryModel,
    }
  );
  return controlCategories;
};

export const getControlCategoryByIdQuery = async (
  id: number,
  tenant: string
): Promise<ControlCategory | null> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".controlcategories WHERE id = :id`,
    {
      replacements: { id },
      mapToModel: true,
      model: ControlCategoryModel,
    }
  );
  return result[0];
};

export const getControlCategoryByTitleAndProjectIdQuery = async (
  title: string,
  projectId: number
): Promise<ControlCategory | null> => {
  const result = await sequelize.query(
    "SELECT * FROM controlcategories WHERE title = :title AND project_id = :project_id",
    {
      replacements: { title, project_id: projectId },
      mapToModel: true,
      model: ControlCategoryModel,
    }
  );
  return result[0];
};

export const getControlCategoryByProjectIdQuery = async (
  projectId: number,
  tenant: string
): Promise<ControlCategory[]> => {
  const result = await sequelize.query(
    `SELECT * FROM "${tenant}".controlcategories WHERE project_id = :project_id ORDER BY created_at DESC, id ASC`,
    {
      replacements: { project_id: projectId },
      mapToModel: true,
      model: ControlCategoryModel,
    }
  );
  return result;
};

export const createControlCategoryQuery = async (
  controlCategory: ControlCategory,
  tenant: string,
  transaction: Transaction
): Promise<ControlCategory> => {
  const result = await sequelize.query(
    `INSERT INTO "${tenant}".controlcategories (
      project_id, title, order_no
    ) VALUES (:project_id, :title, :order_no) RETURNING *`,
    {
      replacements: {
        project_id: controlCategory.project_id,
        title: controlCategory.title,
        order_no: controlCategory.order_no || null,
      },
      mapToModel: true,
      model: ControlCategoryModel,
      // type: QueryTypes.INSERT
      transaction,
    }
  );
  return result[0];
};

export const updateControlCategoryByIdQuery = async (
  id: number,
  controlCategory: Partial<ControlCategory>,
  tenant: string,
  transaction: Transaction
): Promise<ControlCategory | null> => {
  const updateControlCategory: Partial<Record<keyof ControlCategory, any>> = {};
  const setClause = ["title"]
    .filter((f) => {
      if (
        controlCategory[f as keyof ControlCategory] !== undefined &&
        controlCategory[f as keyof ControlCategory]
      ) {
        updateControlCategory[f as keyof ControlCategory] =
          controlCategory[f as keyof ControlCategory];
        return true;
      }
    })
    .map((f) => `${f} = :${f}`)
    .join(", ");

  const query = `UPDATE "${tenant}".controlcategories SET ${setClause} WHERE id = :id RETURNING *;`;

  updateControlCategory.id = id;

  const result = await sequelize.query(query, {
    replacements: updateControlCategory,
    mapToModel: true,
    model: ControlCategoryModel,
    // type: QueryTypes.UPDATE,
    transaction,
  });

  return result[0];
};

export const deleteControlCategoryByIdQuery = async (
  id: number,
  tenant: string,
  transaction: Transaction
): Promise<Boolean> => {
  const result = await sequelize.query(
    `DELETE FROM "${tenant}".controlcategories WHERE id = :id RETURNING *`,
    {
      replacements: { id },
      mapToModel: true,
      model: ControlCategoryModel,
      type: QueryTypes.DELETE,
      transaction,
    }
  );
  return result.length > 0;
};

export const createNewControlCategories = async (
  projectId: number,
  enable_ai_data_insertion: boolean,
  tenant: string,
  transaction: Transaction
) => {
  const createdControlCategories = [];
  let query = `INSERT INTO "${tenant}".controlcategories(
    project_id, title, order_no
  ) VALUES (:project_id, :title, :order_no) RETURNING *;`;
  for (let controlCategoryStruct of ControlCategories) {
    const result = await sequelize.query(query, {
      replacements: {
        project_id: projectId,
        title: controlCategoryStruct.title,
        order_no: controlCategoryStruct.order_no,
      },
      mapToModel: true,
      model: ControlCategoryModel,
      // type: QueryTypes.INSERT
      transaction,
    });
    const control_category_id = result[0].id!;
    const controls = await createNewControlsQuery(
      control_category_id,
      controlCategoryStruct.controls,
      enable_ai_data_insertion,
      tenant,
      transaction
    );
    createdControlCategories.push({ ...result[0].dataValues, controls });
  }
  return createdControlCategories;
};
