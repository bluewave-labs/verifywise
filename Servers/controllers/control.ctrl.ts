import { Request, Response } from "express";

import { STATUS_CODE } from "../utils/statusCode.utils";
import {
  createNewControlQuery,
  deleteControlByIdQuery,
  getAllControlsByControlGroupQuery,
  getAllControlsQuery,
  getControlByIdQuery,
  updateControlByIdQuery,
} from "../utils/control.utils";
import {
  getAllSubcontrolsByControlIdQuery,
  updateSubcontrolByIdQuery,
} from "../utils/subControl.utils";
import { RequestWithFile, UploadedFile } from "../utils/question.utils";
import { ControlModel } from "../domain.layer/models/control/control.model";
import { deleteFileById, uploadFile } from "../utils/fileUpload.utils";
import { FileType } from "../domain.layer/models/file/file.model";
import { updateProjectUpdatedByIdQuery } from "../utils/project.utils";
import { sequelize } from "../database/db";
import { IControl } from "../domain.layer/interfaces/i.control";
import {
  ValidationException,
  BusinessLogicException,
} from "../domain.layer/exceptions/custom.exception";
import logger, { logStructured } from "../utils/logger/fileLogger";
import { logEvent } from "../utils/logger/dbLogger";

export async function getAllControls(
  req: Request,
  res: Response
): Promise<any> {
  logStructured(
    "processing",
    "starting getAllControls",
    "getAllControls",
    "control.ctrl.ts"
  );
  logger.debug("🔍 Fetching all controls");

  try {
    const controls = await getAllControlsQuery();

    if (controls && controls.length > 0) {
      logStructured(
        "successful",
        `retrieved ${controls.length} controls`,
        "getAllControls",
        "control.ctrl.ts"
      );
      await logEvent("Read", `Retrieved ${controls.length} controls`);
      return res.status(200).json(STATUS_CODE[200](controls));
    }

    logStructured(
      "successful",
      "no controls found",
      "getAllControls",
      "control.ctrl.ts"
    );
    await logEvent("Read", "No controls found");
    return res.status(204).json(STATUS_CODE[204](controls));
  } catch (error) {
    logStructured(
      "error",
      "failed to retrieve controls",
      "getAllControls",
      "control.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve controls: ${(error as Error).message}`
    );
    logger.error("❌ Error in getAllControls:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlById(
  req: Request,
  res: Response
): Promise<any> {
  const controlId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching control by ID: ${controlId}`,
    "getControlById",
    "control.ctrl.ts"
  );
  logger.debug(`🔍 Looking up control with ID: ${controlId}`);

  try {
    const control = await getControlByIdQuery(controlId);

    if (control) {
      logStructured(
        "successful",
        `control found: ID ${controlId}`,
        "getControlById",
        "control.ctrl.ts"
      );
      await logEvent("Read", `Control retrieved by ID: ${controlId}`);
      return res.status(200).json(STATUS_CODE[200](control));
    }

    logStructured(
      "successful",
      `no control found: ID ${controlId}`,
      "getControlById",
      "control.ctrl.ts"
    );
    await logEvent("Read", `No control found with ID: ${controlId}`);
    return res.status(204).json(STATUS_CODE[204](control));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch control: ID ${controlId}`,
      "getControlById",
      "control.ctrl.ts"
    );
    await logEvent("Error", `Failed to retrieve control by ID: ${controlId}`);
    logger.error("❌ Error in getControlById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function createControl(req: Request, res: Response): Promise<any> {
  const transaction = await sequelize.transaction();
  const {
    title,
    description,
    control_category_id,
    order_no,
    owner,
    reviewer,
    approver,
    due_date,
    implementation_details,
    is_demo = false,
  } = req.body;

  logStructured(
    "processing",
    `starting control creation: ${title}`,
    "createControl",
    "control.ctrl.ts"
  );
  logger.debug(`🛠️ Creating control: ${title}`);

  try {
    // Use the new ControlModel.createNewControl method with validation
    const controlModel = await ControlModel.createNewControl(
      title,
      description,
      control_category_id,
      order_no,
      owner,
      reviewer,
      approver,
      due_date,
      implementation_details,
      is_demo
    );

    // Validate the control data before saving
    await controlModel.validateControlData();

    const createdControl = await createNewControlQuery(
      controlModel,
      transaction
    );

    if (createdControl) {
      await transaction.commit();
      logStructured(
        "successful",
        `control created: ${title}`,
        "createControl",
        "control.ctrl.ts"
      );
      await logEvent("Create", `Control created: ${title}`, createdControl.id);
      return res.status(201).json(STATUS_CODE[201](createdControl.toJSON()));
    }

    logStructured(
      "error",
      `failed to create control: ${title}`,
      "createControl",
      "control.ctrl.ts"
    );
    await logEvent("Error", `Control creation failed: ${title}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to create control"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation failed: ${error.message}`,
        "createControl",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during control creation: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "createControl",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during control creation: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error: ${title}`,
      "createControl",
      "control.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during control creation: ${(error as Error).message}`
    );
    logger.error("❌ Error in createControl:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function updateControlById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const controlId = parseInt(req.params.id);
  const updateData = req.body;

  logStructured(
    "processing",
    `updating control ID ${controlId}`,
    "updateControlById",
    "control.ctrl.ts"
  );
  logger.debug(`✏️ Update requested for control ID ${controlId}`);

  try {
    // First, get the existing control to validate permissions and current state
    const existingControl = await getControlByIdQuery(controlId);

    if (!existingControl) {
      logStructured(
        "error",
        `control not found: ID ${controlId}`,
        "updateControlById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Update failed — control not found: ID ${controlId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Control not found"));
    }

    // Create a ControlModel instance from the existing control
    const controlModel = ControlModel.fromJSON(existingControl);

    // Check if the control can be modified (demo controls, permissions, etc.)
    const currentUserId = (req as any).user?.id;
    const isAdmin = (req as any).user?.roleName === "admin";

    if (!controlModel.canBeModifiedBy(currentUserId, isAdmin)) {
      logStructured(
        "error",
        `permission denied for control ID ${controlId}`,
        "updateControlById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Permission denied for control update: ID ${controlId}, user: ${currentUserId}`
      );
      await transaction.rollback();
      return res
        .status(403)
        .json(
          STATUS_CODE[403]("Insufficient permissions to modify this control")
        );
    }

    // Update the control using the model's updateControl method
    await controlModel.updateControl(updateData);

    // Validate the updated control data
    await controlModel.validateControlData();

    const updatedControl = await updateControlByIdQuery(
      controlId,
      controlModel,
      transaction
    );

    if (updatedControl) {
      await transaction.commit();
      logStructured(
        "successful",
        `control updated: ID ${controlId}`,
        "updateControlById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Update",
        `Control updated: ID ${controlId}, title: ${updatedControl.title}`
      );
      return res.status(200).json(STATUS_CODE[200](updatedControl.toJSON()));
    }

    logStructured(
      "error",
      `failed to update control: ID ${controlId}`,
      "updateControlById",
      "control.ctrl.ts"
    );
    await logEvent("Error", `Control update failed: ID ${controlId}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to update control"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "updateControlById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during control update: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "updateControlById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during control update: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error for control ID ${controlId}`,
      "updateControlById",
      "control.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during control update for ID ${controlId}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in updateControlById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function deleteControlById(
  req: Request,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  const controlId = parseInt(req.params.id);

  logStructured(
    "processing",
    `attempting to delete control ID ${controlId}`,
    "deleteControlById",
    "control.ctrl.ts"
  );
  logger.debug(`🗑️ Delete request for control ID ${controlId}`);

  try {
    // First, get the existing control to validate permissions and current state
    const existingControl = await getControlByIdQuery(controlId);

    if (!existingControl) {
      logStructured(
        "error",
        `control not found: ID ${controlId}`,
        "deleteControlById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Delete failed — control not found: ID ${controlId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Control not found"));
    }

    // Create a ControlModel instance from the existing control
    const controlModel = ControlModel.fromJSON(existingControl);

    // Check if the control can be deleted (demo controls, completed controls, etc.)
    if (!controlModel.canBeDeleted()) {
      logStructured(
        "error",
        `control cannot be deleted: ID ${controlId}`,
        "deleteControlById",
        "control.ctrl.ts"
      );
      await logEvent("Error", `Control deletion blocked: ID ${controlId}`);
      await transaction.rollback();
      return res
        .status(403)
        .json(STATUS_CODE[403]("This control cannot be deleted"));
    }

    // Check if the control can be modified by the current user
    const currentUserId = (req as any).user?.id;
    const isAdmin = (req as any).user?.roleName === "admin";

    if (!controlModel.canBeModifiedBy(currentUserId, isAdmin)) {
      logStructured(
        "error",
        `permission denied for control deletion ID ${controlId}`,
        "deleteControlById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Permission denied for control deletion: ID ${controlId}, user: ${currentUserId}`
      );
      await transaction.rollback();
      return res
        .status(403)
        .json(
          STATUS_CODE[403]("Insufficient permissions to delete this control")
        );
    }

    const deletedControl = await deleteControlByIdQuery(controlId, transaction);

    if (deletedControl) {
      await transaction.commit();
      logStructured(
        "successful",
        `control deleted: ID ${controlId}`,
        "deleteControlById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Delete",
        `Control deleted: ID ${controlId}, title: ${existingControl.title}`
      );
      return res.status(200).json(STATUS_CODE[200](controlModel.toJSON()));
    }

    logStructured(
      "error",
      `failed to delete control: ID ${controlId}`,
      "deleteControlById",
      "control.ctrl.ts"
    );
    await logEvent("Error", `Control deletion failed: ID ${controlId}`);
    await transaction.rollback();
    return res.status(400).json(STATUS_CODE[400]("Failed to delete control"));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "deleteControlById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during control deletion: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "deleteControlById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during control deletion: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error deleting control ID ${controlId}`,
      "deleteControlById",
      "control.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during control deletion for ID ${controlId}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in deleteControlById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function saveControls(
  req: RequestWithFile,
  res: Response
): Promise<any> {
  const transaction = await sequelize.transaction();
  try {
    const controlId = parseInt(req.params.id);
    const Control = req.body as ControlModel & {
      subControls: string;
      user_id: number;
      project_id: number;
      delete: string;
    };

    logStructured(
      "processing",
      `saving controls for ID ${controlId}`,
      "saveControls",
      "control.ctrl.ts"
    );
    logger.debug(`💾 Saving controls for ID ${controlId}`);

    // Get the existing control to validate permissions and current state
    const existingControl = await getControlByIdQuery(controlId);

    if (!existingControl) {
      logStructured(
        "error",
        `control not found: ID ${controlId}`,
        "saveControls",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Save failed — control not found: ID ${controlId}`
      );
      await transaction.rollback();
      return res.status(404).json(STATUS_CODE[404]("Control not found"));
    }

    // Create a ControlModel instance from the existing control
    const controlModel = ControlModel.fromJSON(existingControl);

    // Check if the control can be modified (demo controls, permissions, etc.)
    const currentUserId = Control.user_id;
    const isAdmin = (req as any).user?.roleName === "admin";

    if (!controlModel.canBeModifiedBy(currentUserId, isAdmin)) {
      logStructured(
        "error",
        `permission denied for control ID ${controlId}`,
        "saveControls",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Permission denied for control save: ID ${controlId}, user: ${currentUserId}`
      );
      await transaction.rollback();
      return res
        .status(403)
        .json(
          STATUS_CODE[403]("Insufficient permissions to modify this control")
        );
    }

    // Update the control using the model's updateControl method
    await controlModel.updateControl({
      title: Control.title,
      description: Control.description,
      order_no: Control.order_no,
      status: Control.status,
      approver: Control.approver,
      risk_review: Control.risk_review,
      owner: Control.owner,
      reviewer: Control.reviewer,
      due_date: Control.due_date,
      implementation_details: Control.implementation_details,
    });

    // Validate the updated control data
    await controlModel.validateControlData();

    // now we need to create the control for the control category, and use the control category id as the foreign key
    const control: any = await updateControlByIdQuery(
      controlId,
      controlModel,
      transaction
    );

    const filesToDelete = JSON.parse(Control.delete || "[]") as number[];
    for (let f of filesToDelete) {
      await deleteFileById(f, transaction);
    }

    // now we need to iterate over subcontrols inside the control, and create a subcontrol for each subcontrol
    const subControlResp = [];
    if (Control.subControls) {
      for (const subcontrol of JSON.parse(Control.subControls)) {
        const evidenceFiles = ((req.files as UploadedFile[]) || []).filter(
          (f) => f.fieldname === `evidence_files_${parseInt(subcontrol.id)}`
        );
        const feedbackFiles = ((req.files as UploadedFile[]) || []).filter(
          (f) => f.fieldname === `feedback_files_${parseInt(subcontrol.id)}`
        );

        let evidenceUploadedFiles: FileType[] = [];
        for (let f of evidenceFiles) {
          const evidenceUploadedFile = await uploadFile(
            f,
            Control.user_id,
            Control.project_id,
            "Compliance tracker group",
            transaction
          );
          evidenceUploadedFiles.push({
            id: evidenceUploadedFile.id!.toString(),
            fileName: evidenceUploadedFile.filename,
            project_id: evidenceUploadedFile.project_id,
            uploaded_by: evidenceUploadedFile.uploaded_by,
            uploaded_time: evidenceUploadedFile.uploaded_time,
            type: evidenceUploadedFile.type,
            source: evidenceUploadedFile.source,
          });
        }

        let feedbackUploadedFiles: FileType[] = [];
        for (let f of feedbackFiles) {
          const feedbackUploadedFile = await uploadFile(
            f,
            Control.user_id,
            Control.project_id,
            "Compliance tracker group",
            transaction
          );
          feedbackUploadedFiles.push({
            id: feedbackUploadedFile.id!.toString(),
            fileName: feedbackUploadedFile.filename,
            project_id: feedbackUploadedFile.project_id,
            uploaded_by: feedbackUploadedFile.uploaded_by,
            uploaded_time: feedbackUploadedFile.uploaded_time,
            type: feedbackUploadedFile.type,
            source: feedbackUploadedFile.source,
          });
        }

        const subcontrolToSave: any = await updateSubcontrolByIdQuery(
          subcontrol.id!,
          {
            title: subcontrol.title,
            description: subcontrol.description,
            order_no: subcontrol.order_no,
            status: subcontrol.status as
              | "Waiting"
              | "In progress"
              | "Done"
              | undefined,
            approver: subcontrol.approver,
            risk_review: subcontrol.risk_review as
              | "Acceptable risk"
              | "Residual risk"
              | "Unacceptable risk"
              | undefined,
            owner: subcontrol.owner,
            reviewer: subcontrol.reviewer,
            due_date: subcontrol.due_date,
            implementation_details: subcontrol.implementation_details,
            evidence_description: subcontrol.evidence_description,
            feedback_description: subcontrol.feedback_description,
            control_id: subcontrol.control_id,
          },
          transaction,
          evidenceUploadedFiles,
          feedbackUploadedFiles,
          filesToDelete
        );
        subControlResp.push(subcontrolToSave);
      }
    }
    const response = {
      ...{ control, subControls: subControlResp },
    };
    // Update the project's last updated date
    await updateProjectUpdatedByIdQuery(controlId, "controls", transaction);

    await transaction.commit();

    logStructured(
      "successful",
      `controls saved for ID ${controlId}`,
      "saveControls",
      "control.ctrl.ts"
    );
    await logEvent(
      "Update",
      `Controls saved: ID ${controlId}, title: ${control.title}`
    );

    return res.status(200).json(STATUS_CODE[200]({ response }));
  } catch (error) {
    await transaction.rollback();

    if (error instanceof ValidationException) {
      logStructured(
        "error",
        `validation error: ${error.message}`,
        "saveControls",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Validation error during control save: ${error.message}`
      );
      return res.status(400).json(STATUS_CODE[400](error.message));
    }

    if (error instanceof BusinessLogicException) {
      logStructured(
        "error",
        `business logic error: ${error.message}`,
        "saveControls",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Business logic error during control save: ${error.message}`
      );
      return res.status(403).json(STATUS_CODE[403](error.message));
    }

    logStructured(
      "error",
      `unexpected error for control ID ${req.params.id}`,
      "saveControls",
      "control.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Unexpected error during control save for ID ${req.params.id}: ${
        (error as Error).message
      }`
    );
    logger.error("❌ Error in saveControls:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getComplianceById(
  req: Request,
  res: Response
): Promise<any> {
  const control_id = req.params.id;
  logStructured(
    "processing",
    `fetching compliance for control ID: ${control_id}`,
    "getComplianceById",
    "control.ctrl.ts"
  );
  logger.debug(`📋 Looking up compliance for control ID: ${control_id}`);

  try {
    const control = (await getControlByIdQuery(
      parseInt(control_id)
    )) as IControl;
    if (control && control.id) {
      const subControls = await getAllSubcontrolsByControlIdQuery(control.id);
      control.subControls = subControls;
      logStructured(
        "successful",
        `compliance found for control ID: ${control_id}`,
        "getComplianceById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Read",
        `Compliance retrieved for control ID: ${control_id}`
      );
      return res.status(200).json(STATUS_CODE[200](control));
    } else {
      logStructured(
        "error",
        `control not found: ID ${control_id}`,
        "getComplianceById",
        "control.ctrl.ts"
      );
      await logEvent(
        "Error",
        `Compliance lookup failed — control not found: ID ${control_id}`
      );
      return res.status(404).json(STATUS_CODE[404]("Control not found"));
    }
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch compliance for control ID: ${control_id}`,
      "getComplianceById",
      "control.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve compliance for control ID: ${control_id}`
    );
    logger.error("❌ Error in getComplianceById:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}

export async function getControlsByControlCategoryId(
  req: Request,
  res: Response
): Promise<any> {
  const controlCategoryId = parseInt(req.params.id);
  logStructured(
    "processing",
    `fetching controls for category ID: ${controlCategoryId}`,
    "getControlsByControlCategoryId",
    "control.ctrl.ts"
  );
  logger.debug(`📂 Looking up controls for category ID: ${controlCategoryId}`);

  try {
    const controls = (await getAllControlsByControlGroupQuery(
      controlCategoryId
    )) as IControl[];

    for (const control of controls) {
      if (control && control.id !== undefined) {
        const subControls = await getAllSubcontrolsByControlIdQuery(control.id);
        let numberOfSubcontrols = 0;
        let numberOfDoneSubcontrols = 0;

        for (const subControl of subControls) {
          numberOfSubcontrols++;
          if (subControl.status === "Done") {
            numberOfDoneSubcontrols++;
          }
        }

        control.numberOfSubcontrols = numberOfSubcontrols;
        control.numberOfDoneSubcontrols = numberOfDoneSubcontrols;
        control.subControls = subControls;
      }
    }

    logStructured(
      "successful",
      `retrieved ${controls.length} controls for category ID: ${controlCategoryId}`,
      "getControlsByControlCategoryId",
      "control.ctrl.ts"
    );
    await logEvent(
      "Read",
      `Retrieved ${controls.length} controls for category ID: ${controlCategoryId}`
    );
    return res.status(200).json(STATUS_CODE[200](controls));
  } catch (error) {
    logStructured(
      "error",
      `failed to fetch controls for category ID: ${controlCategoryId}`,
      "getControlsByControlCategoryId",
      "control.ctrl.ts"
    );
    await logEvent(
      "Error",
      `Failed to retrieve controls for category ID: ${controlCategoryId}`
    );
    logger.error("❌ Error in getControlsByControlCategoryId:", error);
    return res.status(500).json(STATUS_CODE[500]((error as Error).message));
  }
}
