import { Control } from "../models/control.model";
import pool from "../database/db";
import { createNewSubControlsQuery } from "./subControl.utils";

export const getAllControlsQuery = async (): Promise<Control[]> => {
  const controls = await pool.query("SELECT * FROM controls");
  return controls.rows;
};

export const getControlByIdQuery = async (
  id: number
): Promise<Control | null> => {
  const result = await pool.query("SELECT * FROM controls WHERE id = $1", [id]);
  return result.rows.length ? result.rows[0] : null;
};

export const getAllControlsByControlGroupQuery = async (
  controlGroupId: any
): Promise<Control[]> => {
  const controls = await pool.query(
    "SELECT * FROM controls WHERE control_category_id = $1",
    [controlGroupId]
  );
  return controls.rows;
};

export const getControlByIdAndControlTitleAndControlDescriptionQuery = async (
  id: number,
  controlTitle: string,
  controlDescription: string
): Promise<Control | null> => {
  const result = await pool.query(
    "SELECT * FROM controls WHERE control_category_id = $1 AND control_title = $2 AND control_description = $3",
    [id, controlTitle, controlDescription]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const createNewControlQuery = async (
  control: Partial<Control>
): Promise<Control> => {
  const result = await pool.query(
    `INSERT INTO controls (
      title, description, order_no, 
      status, approver, risk_review, 
      owner, reviewer, due_date, 
      implementation_details, control_category_id
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
    [
      control.title,
      control.description,
      control.order_no,
      control.status,
      control.approver,
      control.risk_review,
      control.owner,
      control.reviewer,
      control.due_date,
      control.implementation_details,
      control.control_category_id,
    ]
  );
  return result.rows[0];
};

export const updateControlByIdQuery = async (
  id: number,
  control: Partial<Control>
): Promise<Control | null> => {
  const fields = [];
  const values = [];
  let query = "UPDATE controls SET ";
  if (control.title !== undefined) {
    fields.push(`title = $${fields.length + 1}`);
    values.push(control.title);
  }
  if (control.description !== undefined) {
    fields.push(`description = $${fields.length + 1}`);
    values.push(control.description);
  }
  if (control.order_no !== undefined) {
    fields.push(`order_no = $${fields.length + 1}`);
    values.push(control.order_no);
  }
  if (control.status !== undefined) {
    fields.push(`status = $${fields.length + 1}`);
    values.push(control.status);
  }
  if (control.approver !== undefined) {
    fields.push(`approver = $${fields.length + 1}`);
    values.push(control.approver);
  }
  if (control.risk_review !== undefined) {
    fields.push(`risk_review = $${fields.length + 1}`);
    values.push(control.risk_review);
  }
  if (control.owner !== undefined) {
    fields.push(`owner = $${fields.length + 1}`);
    values.push(control.owner);
  }
  if (control.reviewer !== undefined) {
    fields.push(`reviewer = $${fields.length + 1}`);
    values.push(control.reviewer);
  }
  if (control.due_date !== undefined) {
    fields.push(`due_date = $${fields.length + 1}`);
    values.push(control.due_date);
  }
  if (control.implementation_details !== undefined) {
    fields.push(`implementation_details = $${fields.length + 1}`);
    values.push(control.implementation_details);
  }
  if (control.control_category_id !== undefined) {
    fields.push(`control_category_id = $${fields.length + 1}`);
    values.push(control.control_category_id);
  }

  query += fields.join(", ");
  query += ` WHERE id = ${id} RETURNING *`;

  const result = await pool.query(query, values);
  return result.rows.length ? result.rows[0] : null;
};

export const deleteControlByIdQuery = async (
  id: number
): Promise<Control | null> => {
  const result = await pool.query(
    "DELETE FROM controls WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows.length ? result.rows[0] : null;
};

export const createNewControlsQuery = async (
  controlCategoryId: number,
  controls: {
    order_no: number;
    title: string;
    description: string;
    subControls: {
      order_no: number;
      title: string;
      description: string;
    }[];
  }[]
) => {
  const createdControls = [];
  let query = `INSERT INTO controls(
    title, description, order_no, control_category_id
  ) VALUES ($1, $2, $3, $4) RETURNING *;`;
  for (let controlStruct of controls) {
    const result = await pool.query(query, [
      controlStruct.title,
      controlStruct.description,
      controlStruct.order_no,
      controlCategoryId,
    ]);
    const control_id = result.rows[0].id;
    const subControls = await createNewSubControlsQuery(
      control_id,
      controlStruct.subControls
    );
    createdControls.push({ ...result.rows[0], subControls });
  }
  return createdControls;
};
