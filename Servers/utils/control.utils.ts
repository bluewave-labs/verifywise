import { Control, ControlModel } from "../models/control.model";
import { sequelize } from "../database/db";
import { createNewSubControlsQuery } from "./subControl.utils";
import { Model, QueryTypes } from "sequelize";

export const getAllControlsQuery = async (): Promise<Control[]> => {
  const controls = await sequelize.query(
    "SELECT * FROM controls ORDER BY created_at DESC, id ASC",
    {
      mapToModel: true,
      model: ControlModel
    }
  );
  return controls;
};

export const getControlByIdQuery = async (
  id: number
): Promise<Control | null> => {
  const result = await sequelize.query(
    "SELECT * FROM controls WHERE id = :id",
    {
      mapToModel: true,
      model: ControlModel,
      replacements: { id: id }
    }
  );
  return result[0];
};

export const getAllControlsByControlGroupQuery = async (
  controlGroupId: any
): Promise<Control[]> => {
  const controls = await sequelize.query(
    "SELECT * FROM controls WHERE control_category_id = :control_category_id ORDER BY created_at DESC, id ASC",
    {
      replacements: { control_category_id: controlGroupId },
      mapToModel: true,
      model: ControlModel
    }
  );
  return controls;
};

export const getControlByIdAndControlTitleAndControlDescriptionQuery = async (
  id: number,
  controlTitle: string,
  controlDescription: string
): Promise<Control | null> => {
  const result = await sequelize.query(
    `SELECT * FROM controls WHERE
      control_category_id = : control_category_id 
      AND control_title = :control_title 
      AND control_description = :control_description`,
    {
      replacements: {
        control_category_id: id,
        control_title: controlTitle,
        control_description: controlDescription
      },
      mapToModel: true,
      model: ControlModel
    }
  );
  return result[0];
};

export const createNewControlQuery = async (
  control: Partial<Control>
): Promise<Control> => {
  const result = await sequelize.query(
    `INSERT INTO controls (
      title, description, order_no, 
      status, approver, risk_review, 
      owner, reviewer, due_date, 
      implementation_details, control_category_id
    ) VALUES (
      :title, :description, :order_no,
      :status, :approver, :risk_review,
      :owner, :reviewer, :due_date,
      :implementation_details, :control_category_id) RETURNING *`,
    {
      replacements: {
        title: control.title,
        description: control.description,
        order_no: control.order_no || null,
        status: control.status,
        approver: control.approver,
        risk_review: control.risk_review,
        owner: control.owner,
        reviewer: control.reviewer,
        due_date: control.due_date,
        implementation_details: control.implementation_details,
        control_category_id: control.control_category_id,
      },
      mapToModel: true,
      model: ControlModel
    }
  );
  return result[0];
};

export const updateControlByIdQuery = async (
  id: number,
  control: Partial<Control>
): Promise<Control> => {
  const updateControl: Partial<Record<keyof Control, any>> = {};
  const setClause = [
    "title",
    "description",
    "status",
    "approver",
    "risk_review",
    "owner",
    "reviewer",
    "due_date",
    "implementation_details"
  ].filter(f => {
    if (control[f as keyof Control] !== undefined) {
      updateControl[f as keyof Control] = control[f as keyof Control]
      return true
    }
  }).map(f => `${f} = :${f}`).join(", ");

  const query = `UPDATE controls SET ${setClause} WHERE id = :id RETURNING *;`;

  updateControl.id = id;

  const result = await sequelize.query(query, {
    replacements: updateControl,
    mapToModel: true,
    model: ControlModel,
    // type: QueryTypes.UPDATE,
  });
  return result[0];
};

export const deleteControlByIdQuery = async (
  id: number
): Promise<Boolean> => {
  const result = await sequelize.query(
    "DELETE FROM controls WHERE id = :id RETURNING *",
    {
      replacements: { id },
      mapToModel: true,
      model: ControlModel,
      type: QueryTypes.DELETE
    }
  );
  return result.length > 0;
};

export const createNewControlsQuery = async (
  controlCategoryId: number,
  controls: {
    order_no: number;
    title: string;
    description: string;
    implementation_details: string;
    subControls: {
      order_no: number;
      title: string;
      description: string;
      implementation_details: string;
      evidence_description?: string;
      feedback_description?: string;
    }[];
  }[],
  enable_ai_data_insertion: boolean
) => {
  const createdControls = [];
  let query = `INSERT INTO controls(
    title, description, order_no, control_category_id,
    implementation_details, status
  ) VALUES (
    :title, :description, :order_no, :control_category_id,
    :implementation_details, :status
  ) RETURNING *;`;
  for (let controlStruct of controls) {
    const result = await sequelize.query(query, {
      replacements: {
        title: controlStruct.title,
        description: controlStruct.description,
        order_no: controlStruct.order_no,
        control_category_id: controlCategoryId,
        implementation_details: enable_ai_data_insertion ? controlStruct.implementation_details : null,
        status: enable_ai_data_insertion ? 'Waiting' : null
      },
      mapToModel: true,
      model: ControlModel,
      // type: QueryTypes.INSERT
    });
    const control_id = result[0].id!;
    const subControls = await createNewSubControlsQuery(
      control_id,
      controlStruct.subControls,
      enable_ai_data_insertion
    );
    createdControls.push({ ...result[0].dataValues, subControls });
  }
  return createdControls;
};
